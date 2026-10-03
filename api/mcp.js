/**
 * MCP Server endpoint for Gemini / Antigravity integration
 * Implements Model Context Protocol (MCP) over HTTP / Serverless
 * https://spec.modelcontextprotocol.io/
 *
 * PROYECTO CAFÉ — SERVIDOR MCP INTEGRAL CON CRUDs COMPLETOS
 *
 * Módulos implementados con contexto y relaciones internas:
 * 1. AGENDA: Listar, Obtener, Disponibilidad, Crear, Actualizar (con snapshot), Eliminar (Soft/Hard + Safety Gate), Restaurar.
 * 2. MENÚ: Listar (get_menu), Obtener (menu_obtener), Crear (menu_crear), Actualizar (menu_actualizar), Eliminar (menu_eliminar).
 * 3. INVENTARIO: Listar (get_inventario), Obtener (inventario_obtener), Crear (inventario_crear), Actualizar (inventario_actualizar), Ajustar Stock (inventario_ajustar_stock), Eliminar (inventario_eliminar).
 * 4. RECETAS / ESCANDALLOS: Listar (get_recetas), Obtener (receta_obtener), Crear (receta_crear), Actualizar (receta_actualizar).
 * 5. COMPRAS: Listar (get_compras), Registrar (compra_crear).
 * 6. VENTAS: Listar (get_ventas), Registrar (venta_registrar).
 * 7. STAFF: Listar personal activo y roles (get_staff).
 *
 * Mapeo nativo a tablas Supabase:
 * - Agenda: _id, nombreES, nombreEN, fecha, horaInicio, horaFinal, servicios, valor, estado_proceso, etc.
 * - Menu: _id, NombreES, NombreEN, Precio, TipoES, TipoEN, DescripcionMenuES, Foto, DietaES, CuidadoES, AproxTime.
 * - ItemsAlmacen: _id, Nombre_del_producto, Area, CANTIDAD, UNIDADES, COSTO, GRUPO, Estado, precioUnitario, COOR, FECHA_ACT.
 * - Recetas: _id, forId, legacyName, rendimiento, costo, emplatado, proces1..proces10, item1_Id..item20_Id.
 * - Compras: _id, Date, Valor, Proveedor_Id, Concepto, Categoria, Detalle.
 * - Ventas: _id, Date, Time, Total_Ingreso, Productos, Cliente, MetodoPago.
 * - Staff: _id, nombre, rol, telefono, email, activo.
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY no configuradas en el servidor.");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// MCP Server metadata
const SERVER_INFO = {
  name: "proyectocafe-mcp",
  version: "2.0.0",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getFechaActual() {
  return new Date().toISOString().split("T")[0];
}

function calcularPrecioUnitario(costo, cantidad, coor = 1.05) {
  const c = parseFloat(costo) || 0;
  const q = parseFloat(cantidad) || 1;
  const k = parseFloat(coor) || 1.05;
  if (q <= 0) return 0;
  const ajusteInflacionario = 1.04;
  return parseFloat(((c / q) * ajusteInflacionario * k).toFixed(2));
}

function formatServicios(svc) {
  if (!svc) {
    return [
      { alimentos: false, alimentosDescripcion: "" },
      { mesas: false, mesasDescription: "" },
      { audioVisual: false, audioVisualDescription: "" },
      { otros: false, otrosDescroptions: "" },
    ];
  }
  if (Array.isArray(svc)) return svc;

  const isTrue = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const s = val.toLowerCase().trim();
      return s === "true" || s === "si" || s === "sí" || s === "1";
    }
    if (val && typeof val === "object") return !!val.activo;
    return false;
  };

  const getDesc = (val) => {
    if (val && typeof val === "object") return val.descripcion || "";
    if (
      typeof val === "string" &&
      !["true", "false", "si", "sí", "no"].includes(val.toLowerCase().trim())
    ) {
      return val;
    }
    return "";
  };

  const alimentosVal =
    svc.alimentos ?? svc.alimento ?? svc["Alimentos/bebidas"] ?? svc["Alimentos"] ?? svc.bebidas;
  const mesasVal =
    svc.mesas ?? svc.mesa ?? svc["Mesas y sillas"] ?? svc["Mesas"] ?? svc.sillas;
  const avVal =
    svc.audioVisual ?? svc.audiovisual ?? svc["Audiovisual"] ?? svc.sonido;
  const otrosVal =
    svc.otros ?? svc.otro ?? svc["Otros"] ?? svc.reservas ?? svc["Reservas"];

  return [
    { alimentos: isTrue(alimentosVal), alimentosDescripcion: getDesc(alimentosVal) },
    { mesas: isTrue(mesasVal), mesasDescription: getDesc(mesasVal) },
    { audioVisual: isTrue(avVal), audioVisualDescription: getDesc(avVal) },
    { otros: isTrue(otrosVal), otrosDescroptions: getDesc(otrosVal) },
  ];
}

function normalizeAgendaItem(ev) {
  if (!ev) return ev;
  return {
    ...ev,
    nombre: ev.nombreES || ev.nombre || "",
  };
}

// ─────────────────────────────────────────────
// TOOL DEFINITIONS (MCP SPEC)
// ─────────────────────────────────────────────
const TOOLS = [
  // ── 1. MENÚ (CRUD) ──────────────────────────
  {
    name: "get_menu",
    description: "Obtiene los productos del menú del café, con filtros por categoría o búsqueda de texto.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: {
          type: "string",
          description: "Filtrar por categoría (ej: Café, Desayuno, Almuerzo, Bebidas) o texto en nombre",
        },
      },
    },
  },
  {
    name: "menu_obtener",
    description: "Obtiene los detalles completos de un producto del menú por su ID (_id).",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del producto en Menu" },
      },
    },
  },
  {
    name: "menu_crear",
    description: "Crea un nuevo producto en el menú del café.",
    inputSchema: {
      type: "object",
      required: ["nombreES", "precio", "tipoES"],
      properties: {
        nombreES: { type: "string", description: "Nombre del producto en español" },
        nombreEN: { type: "string", description: "Nombre en inglés (opcional)" },
        precio: { type: "number", description: "Precio de venta al público en COP" },
        tipoES: { type: "string", description: "Categoría en español (ej: Café, Desayuno, Almuerzo, Repostería)" },
        tipoEN: { type: "string", description: "Categoría en inglés (ej: Coffee, Breackfast, Lunch, Others)" },
        descripcionMenuES: { type: "string", description: "Descripción del plato o bebida en la carta" },
        descripcionMenuEN: { type: "string", description: "Descripción en inglés" },
        foto: { type: "string", description: "URL de la fotografía del producto" },
        dietaES: { type: "string", description: "Etiqueta dietética: Vegetariano, Vegano, Carnico, o ninguna" },
        cuidadoES: { type: "string", description: "Advertencias de alérgenos: Picante, Nueces, etc." },
        aproxTime: { type: "number", description: "Tiempo estimado de preparación en minutos" },
      },
    },
  },
  {
    name: "menu_actualizar",
    description: "⚠️ Modifica un producto del menú (precio, descripción, categoría). Guarda snapshot previo.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del producto a actualizar" },
        nombreES: { type: "string" },
        nombreEN: { type: "string" },
        precio: { type: "number" },
        tipoES: { type: "string" },
        tipoEN: { type: "string" },
        descripcionMenuES: { type: "string" },
        foto: { type: "string" },
        dietaES: { type: "string" },
        cuidadoES: { type: "string" },
        aproxTime: { type: "number" },
      },
    },
  },
  {
    name: "menu_eliminar",
    description: "🚨 Elimina un producto del menú. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: {
        id: { type: "string", description: "UUID del producto a eliminar" },
        confirmar: { type: "boolean", description: "Debe ser true tras confirmación del usuario" },
      },
    },
  },

  // ── 2. INVENTARIO (CRUD) ─────────────────────
  {
    name: "get_inventario",
    description: "Consulta el inventario de almacén (materia prima e insumos) con stock, unidades, costos y estado.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: {
          type: "string",
          description: "Filtrar por grupo (CARNICO, LACTEO, CAFE, PANADERIA, etc.) o área (COCINA, BARRA, MESAS)",
        },
        estado: {
          type: "string",
          enum: ["PC", "PP", "OK", "NA"],
          description: "Filtrar por estado: PC (Por Comprar), PP (Por Producir), OK, NA",
        },
      },
    },
  },
  {
    name: "inventario_obtener",
    description: "Obtiene el detalle completo de un ítem de inventario por su ID.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del ítem en ItemsAlmacen" },
      },
    },
  },
  {
    name: "inventario_crear",
    description: "Registra un nuevo insumo o materia prima en el almacén de Proyecto Café.",
    inputSchema: {
      type: "object",
      required: ["nombre", "cantidad", "unidades", "costo", "grupo"],
      properties: {
        nombre: { type: "string", description: "Nombre del producto/insumo" },
        cantidad: { type: "number", description: "Cantidad total disponible en stock" },
        unidades: {
          type: "string",
          enum: ["gr", "kl", "ml", "li", "un"],
          description: "Unidad de medida: gr (gramos), kl (kilos), ml (mililitros), li (litros), un (unidades)",
        },
        costo: { type: "number", description: "Costo total del paquete/compra en COP" },
        grupo: {
          type: "string",
          description: "Grupo (ej: CAFE, LACTEO, PANADERIA, CARNICO, VERDURAS_FRUTAS, BEBIDAS, LIMPIEZA, etc.)",
        },
        area: {
          type: "string",
          enum: ["COCINA", "BARRA", "MESAS"],
          description: "Área asignada en el café (COCINA, BARRA, MESAS)",
        },
        estado: {
          type: "string",
          enum: ["PC", "PP", "OK", "NA"],
          description: "Estado operativo (default: OK; PC = Por Comprar, PP = Por Producir)",
        },
        coor: { type: "number", description: "Factor de corrección de merma (default: 1.05)" },
      },
    },
  },
  {
    name: "inventario_actualizar",
    description: "⚠️ Actualiza datos de un insumo (stock, costo, unidades, estado). Recalcula precioUnitario y guarda snapshot.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del ítem a actualizar" },
        nombre: { type: "string" },
        cantidad: { type: "number" },
        unidades: { type: "string", enum: ["gr", "kl", "ml", "li", "un"] },
        costo: { type: "number" },
        grupo: { type: "string" },
        area: { type: "string", enum: ["COCINA", "BARRA", "MESAS"] },
        estado: { type: "string", enum: ["PC", "PP", "OK", "NA"] },
        coor: { type: "number" },
      },
    },
  },
  {
    name: "inventario_ajustar_stock",
    description: "Ajusta rápidamente el stock de un insumo sumando o restando una cantidad (por compras, mermas o consumo).",
    inputSchema: {
      type: "object",
      required: ["id", "delta_cantidad"],
      properties: {
        id: { type: "string", description: "UUID del ítem" },
        delta_cantidad: {
          type: "number",
          description: "Cantidad a sumar (positivo, ej: +5) o restar (negativo, ej: -2)",
        },
        motivo: { type: "string", description: "Motivo del ajuste (ej: 'Compra recibida', 'Merma por vencimiento')" },
      },
    },
  },
  {
    name: "inventario_eliminar",
    description: "🚨 Elimina un insumo del inventario. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: {
        id: { type: "string", description: "UUID del ítem a eliminar" },
        confirmar: { type: "boolean", description: "Debe ser true tras confirmación del usuario" },
      },
    },
  },

  // ── 3. RECETAS / ESCANDALLOS (CRUD) ─────────
  {
    name: "get_recetas",
    description: "Consulta las recetas y escandallos con ingredientes, rendimientos y procedimientos.",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Buscar receta por nombre (legacyName)" },
        for_id: { type: "string", description: "Buscar receta vinculada a un producto de Menú (_id)" },
      },
    },
  },
  {
    name: "receta_obtener",
    description: "Obtiene el detalle completo de una receta por su ID (_id) o por el ID del producto que la usa (forId).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID de la receta" },
        for_id: { type: "string", description: "UUID del producto en Menu" },
      },
    },
  },
  {
    name: "receta_crear",
    description: "Crea una nueva receta o escandallo vinculada a un producto del menú o a una producción interna.",
    inputSchema: {
      type: "object",
      required: ["nombre", "forId"],
      properties: {
        nombre: { type: "string", description: "Nombre de la receta (legacyName)" },
        forId: { type: "string", description: "UUID del producto en Menu o ProduccionInterna al que pertenece" },
        rendimiento: {
          type: "object",
          description: "Objeto con rendimiento: { porcion: 1, cantidad: 350, unidades: 'ml' }",
        },
        costo: { type: "number", description: "Costo estándar calculado de la porción en COP" },
        emplatado: { type: "string", description: "Instrucciones de vajilla y presentación" },
        autor: { type: "string", description: "Creador de la receta" },
        procesos: {
          type: "array",
          items: { type: "string" },
          description: "Lista secuencial de pasos de preparación (hasta 10 pasos)",
        },
        ingredientes: {
          type: "array",
          items: {
            type: "object",
            required: ["item_id", "cantidad", "unidades"],
            properties: {
              item_id: { type: "string", description: "UUID del insumo en ItemsAlmacen" },
              cantidad: { type: "number" },
              unidades: { type: "string" },
              nombre: { type: "string" },
            },
          },
          description: "Lista de insumos necesarios con cantidades",
        },
      },
    },
  },
  {
    name: "receta_actualizar",
    description: "⚠️ Modifica los ingredientes, pasos o rendimiento de una receta existente. Guarda snapshot.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID de la receta" },
        nombre: { type: "string" },
        costo: { type: "number" },
        emplatado: { type: "string" },
        rendimiento: { type: "object" },
        procesos: { type: "array", items: { type: "string" } },
      },
    },
  },

  // ── 4. COMPRAS Y VENTAS ─────────────────────
  {
    name: "get_compras",
    description: "Consulta el historial de compras e insumos del café.",
    inputSchema: {
      type: "object",
      properties: {
        busqueda: { type: "string", description: "Filtrar por concepto o categoría" },
        fecha_inicio: { type: "string", description: "Fecha inicio YYYY-MM-DD" },
        fecha_fin: { type: "string", description: "Fecha fin YYYY-MM-DD" },
        limite: { type: "number", description: "Máx registros (default 50)" },
      },
    },
  },
  {
    name: "compra_crear",
    description: "Registra una nueva compra o factura de insumos.",
    inputSchema: {
      type: "object",
      required: ["valor", "concepto"],
      properties: {
        valor: { type: "number", description: "Valor total de la compra en COP" },
        concepto: { type: "string", description: "Descripción o concepto del gasto/compra" },
        categoria: { type: "string", description: "Categoría del gasto (ej: Materia Prima, Aseo, Mantenimiento)" },
        fecha: { type: "string", description: "Fecha de la compra YYYY-MM-DD (default: hoy)" },
        proveedor_id: { type: "string", description: "UUID o nombre del proveedor" },
        detalle: { type: "string", description: "Detalles adicionales u observaciones" },
      },
    },
  },
  {
    name: "get_ventas",
    description: "Obtiene el historial de ventas y cierres de turno de Proyecto Café.",
    inputSchema: {
      type: "object",
      properties: {
        fecha_inicio: { type: "string", description: "Fecha inicio YYYY-MM-DD" },
        fecha_fin: { type: "string", description: "Fecha fin YYYY-MM-DD" },
        limite: { type: "number", description: "Máx registros (default 50)" },
      },
    },
  },
  {
    name: "venta_registrar",
    description: "Registra una transacción de venta o cierre diario en el sistema.",
    inputSchema: {
      type: "object",
      required: ["total_ingreso"],
      properties: {
        total_ingreso: { type: "number", description: "Monto total ingresado en COP" },
        fecha: { type: "string", description: "Fecha de la venta YYYY-MM-DD (default: hoy)" },
        hora: { type: "string", description: "Hora de la venta HH:MM (default: hora actual)" },
        productos: { type: "string", description: "Resumen de productos o comanda asociada" },
        cliente: { type: "string", description: "Nombre del cliente o 'Mesa / Barra'" },
        metodo_pago: {
          type: "string",
          description: "Medio de pago utilizado: Bold, Efectivo, Transferencia, Redeban",
        },
      },
    },
  },

  // ── 5. STAFF ────────────────────────────────
  {
    name: "get_staff",
    description: "Consulta el equipo de trabajo y colaboradores de Proyecto Café con sus roles y contacto.",
    inputSchema: {
      type: "object",
      properties: {
        solo_activos: { type: "boolean", description: "Filtrar únicamente colaboradores activos (default true)" },
      },
    },
  },

  // ── 6. AGENDA (CRUD Completo & Safety) ───────
  {
    name: "agenda_listar",
    description: "Lista los eventos de la agenda del café con filtros por fechas o búsqueda libre.",
    inputSchema: {
      type: "object",
      properties: {
        fecha_inicio: { type: "string", description: "Fecha inicio YYYY-MM-DD" },
        fecha_fin: { type: "string", description: "Fecha fin YYYY-MM-DD" },
        busqueda: { type: "string", description: "Texto para buscar por nombre del evento, cliente o autores" },
        incluir_eliminados: { type: "boolean", description: "Si es true, incluye eventos cancelados (default false)" },
        limite: { type: "number", description: "Máx registros a retornar (default 100)" },
      },
    },
  },
  {
    name: "agenda_obtener",
    description: "Obtiene los detalles completos de un evento de la agenda por su ID (_id).",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del evento (_id)" },
      },
    },
  },
  {
    name: "agenda_buscar_disponibilidad",
    description: "Verifica si hay conflictos de horario en una fecha dada para planificar nuevos eventos.",
    inputSchema: {
      type: "object",
      required: ["fecha"],
      properties: {
        fecha: { type: "string", description: "Fecha a verificar YYYY-MM-DD" },
        horaInicio: { type: "string", description: "Hora de inicio para verificar HH:MM" },
        horaFinal: { type: "string", description: "Hora de fin para verificar HH:MM" },
        excluir_id: { type: "string", description: "UUID de evento a excluir de la verificación (para ediciones)" },
      },
    },
  },
  {
    name: "agenda_crear",
    description: "Crea un nuevo evento en la agenda del café en estado activo.",
    inputSchema: {
      type: "object",
      required: ["fecha", "horaInicio", "horaFinal"],
      properties: {
        nombre: { type: "string", description: "Nombre del evento en español" },
        nombreES: { type: "string", description: "Nombre del evento en español" },
        nombreEN: { type: "string", description: "Nombre en inglés (opcional)" },
        fecha: { type: "string", description: "Fecha del evento YYYY-MM-DD" },
        horaInicio: { type: "string", description: "Hora de inicio HH:MM" },
        horaFinal: { type: "string", description: "Hora de fin HH:MM" },
        nombreCliente: { type: "string", description: "Nombre del cliente u organizador" },
        emailCliente: { type: "string", description: "Email de contacto" },
        telefonoCliente: { type: "string", description: "Teléfono de contacto" },
        numeroPersonas: { type: "number", description: "Aforo esperado" },
        valor: { type: "string", description: "Valor o 'Gratis'" },
        autores: { type: "string", description: "Ponentes, artistas o talleristas" },
        infoAdicional: { type: "string", description: "Observaciones de logística" },
        decripcion: { type: "string", description: "Descripción detallada" },
        bannerIMG: { type: "string", description: "URL del banner promocional" },
        linkInscripcion: { type: "string", description: "Enlace de inscripción o boletería" },
        servicios: { type: "object", description: "Servicios requeridos: alimentos, mesas, audioVisual, otros" },
        aliado_id: { type: "string", description: "UUID del aliado vinculado" },
        instagramsAliados: { type: "array", description: "Lista de @handles de Instagram" },
      },
    },
  },
  {
    name: "agenda_actualizar",
    description: "⚠️ Modifica un evento existente. Guarda snapshot de seguridad previo.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del evento a actualizar (_id)" },
        nombre: { type: "string" },
        nombreES: { type: "string" },
        nombreEN: { type: "string" },
        fecha: { type: "string" },
        horaInicio: { type: "string" },
        horaFinal: { type: "string" },
        nombreCliente: { type: "string" },
        emailCliente: { type: "string" },
        telefonoCliente: { type: "string" },
        numeroPersonas: { type: "number" },
        valor: { type: "string" },
        autores: { type: "string" },
        infoAdicional: { type: "string" },
        decripcion: { type: "string" },
        bannerIMG: { type: "string" },
        linkInscripcion: { type: "string" },
        servicios: { type: "object" },
        aliado_id: { type: "string" },
        instagramsAliados: { type: "array" },
      },
    },
  },
  {
    name: "agenda_eliminar",
    description: "🚨 Elimina un evento de la agenda. Requiere confirmar: true. Aplica borrado lógico por defecto.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: {
        id: { type: "string", description: "UUID del evento a eliminar" },
        confirmar: { type: "boolean", description: "Debe ser true tras autorización del usuario" },
        modo: { type: "string", enum: ["soft", "definitivo"], description: "'soft' (recomendado) o 'definitivo'" },
      },
    },
  },
  {
    name: "agenda_restaurar",
    description: "Restaura un evento que haya sido eliminado lógicamente (soft delete) a estado activo.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del evento a restaurar" },
      },
    },
  },
];

// ─────────────────────────────────────────────
// TOOL IMPLEMENTATIONS
// ─────────────────────────────────────────────

// ── 1. MENÚ ──────────────────────────────────
async function getMenu({ categoria } = {}) {
  let q = supabase().from("Menu").select("*");
  if (categoria) {
    q = q.or(
      `NombreES.ilike.%${categoria}%,TipoES.ilike.%${categoria}%,TipoEN.ilike.%${categoria}%,DescripcionMenuES.ilike.%${categoria}%`
    );
  }
  const { data, error } = await q.order("NombreES", { ascending: true });
  if (error) throw new Error(`Error menú: ${error.message}`);
  return (data || []).map((item) => ({
    _id: item._id,
    nombre: item.NombreES,
    nombreEN: item.NombreEN,
    precio: item.Precio,
    categoria: item.TipoES || item.TipoEN || "",
    descripcion: item.DescripcionMenuES || "",
    foto: item.Foto,
    dieta: item.DietaES,
    cuidado: item.CuidadoES,
    tiempoMin: item.AproxTime,
    ...item,
  }));
}

async function menuObtener({ id } = {}) {
  if (!id) throw new Error("Se requiere el ID del producto");
  const { data, error } = await supabase().from("Menu").select("*").eq("_id", id).single();
  if (error) throw new Error(`Producto no encontrado en Menú: ${error.message}`);
  return data;
}

async function menuCrear(args) {
  const nombreFinal = args.nombreES || args.nombre;
  if (!nombreFinal || args.precio === undefined) {
    throw new Error("Campos obligatorios: nombreES y precio");
  }

  const payload = {
    _id: randomUUID(),
    NombreES: nombreFinal,
    NombreEN: args.nombreEN || "",
    Precio: Number(args.precio) || 0,
    TipoES: args.tipoES || "Otros",
    TipoEN: args.tipoEN || "Others",
    DescripcionMenuES: args.descripcionMenuES || "",
    DescripcionMenuEN: args.descripcionMenuEN || "",
    Foto: args.foto || "",
    DietaES: args.dietaES || "",
    CuidadoES: args.cuidadoES || "",
    AproxTime: args.aproxTime || 5,
  };

  const { data, error } = await supabase().from("Menu").insert([payload]).select().single();
  if (error) throw new Error(`Error al crear producto en Menú: ${error.message}`);
  return { mensaje: "Producto creado exitosamente en el Menú", producto: data };
}

async function menuActualizar({ id, ...campos }) {
  if (!id) throw new Error("Se requiere el ID del producto");

  const { data: existing, error: fetchErr } = await supabase().from("Menu").select("*").eq("_id", id).single();
  if (fetchErr || !existing) throw new Error(`No se encontró el producto con ID: ${id}`);

  const payload = {};
  if (campos.nombreES || campos.nombre) payload.NombreES = campos.nombreES || campos.nombre;
  if (campos.nombreEN !== undefined) payload.NombreEN = campos.nombreEN;
  if (campos.precio !== undefined) payload.Precio = Number(campos.precio);
  if (campos.tipoES !== undefined) payload.TipoES = campos.tipoES;
  if (campos.tipoEN !== undefined) payload.TipoEN = campos.tipoEN;
  if (campos.descripcionMenuES !== undefined) payload.DescripcionMenuES = campos.descripcionMenuES;
  if (campos.foto !== undefined) payload.Foto = campos.foto;
  if (campos.dietaES !== undefined) payload.DietaES = campos.dietaES;
  if (campos.cuidadoES !== undefined) payload.CuidadoES = campos.cuidadoES;
  if (campos.aproxTime !== undefined) payload.AproxTime = Number(campos.aproxTime);

  const { data: updated, error: updateErr } = await supabase()
    .from("Menu")
    .update(payload)
    .eq("_id", id)
    .select()
    .single();

  if (updateErr) throw new Error(`Error al actualizar producto en Menú: ${updateErr.message}`);
  return {
    mensaje: `Producto "${updated.NombreES}" actualizado exitosamente`,
    producto_actualizado: updated,
    snapshot_previo: existing,
  };
}

async function menuEliminar({ id, confirmar } = {}) {
  if (!id) throw new Error("Se requiere el ID del producto");
  if (confirmar !== true) {
    throw new Error("CONFIRMACIÓN REQUERIDA: Debes enviar 'confirmar: true' para eliminar este producto del Menú.");
  }

  const { data: existing, error: fetchErr } = await supabase().from("Menu").select("*").eq("_id", id).single();
  if (fetchErr || !existing) throw new Error(`No se encontró el producto con ID: ${id}`);

  const { error } = await supabase().from("Menu").delete().eq("_id", id);
  if (error) throw new Error(`Error al eliminar del Menú: ${error.message}`);

  return {
    mensaje: `Producto "${existing.NombreES}" eliminado exitosamente del Menú`,
    backup_producto: existing,
  };
}

// ── 2. INVENTARIO ────────────────────────────
async function getInventario({ categoria, estado } = {}) {
  let q = supabase().from("ItemsAlmacen").select("*");
  if (categoria) {
    q = q.or(`Area.ilike.%${categoria}%,GRUPO.ilike.%${categoria}%,Nombre_del_producto.ilike.%${categoria}%`);
  }
  if (estado) {
    q = q.eq("Estado", estado);
  }
  const { data, error } = await q.order("Nombre_del_producto", { ascending: true });
  if (error) throw new Error(`Error inventario: ${error.message}`);
  return (data || []).map((item) => ({
    _id: item._id,
    nombre: item.Nombre_del_producto,
    cantidad: item.CANTIDAD,
    unidades: item.UNIDADES || item.UNIDAD,
    costo: item.COSTO,
    grupo: item.GRUPO,
    area: item.Area,
    estado: item.Estado,
    precioUnitario: item.precioUnitario,
    fechaActualizacion: item.FECHA_ACT,
    ...item,
  }));
}

async function inventarioObtener({ id } = {}) {
  if (!id) throw new Error("Se requiere el ID del ítem de inventario");
  const { data, error } = await supabase().from("ItemsAlmacen").select("*").eq("_id", id).single();
  if (error) throw new Error(`Ítem no encontrado en Inventario: ${error.message}`);
  return data;
}

async function inventarioCrear(args) {
  const nombre = args.nombre || args.Nombre_del_producto;
  if (!nombre || args.cantidad === undefined || !args.unidades || args.costo === undefined) {
    throw new Error("Campos obligatorios: nombre, cantidad, unidades, costo, grupo");
  }

  const coor = args.coor || 1.05;
  const precioUnitario = calcularPrecioUnitario(args.costo, args.cantidad, coor);

  const payload = {
    _id: randomUUID(),
    Nombre_del_producto: nombre,
    CANTIDAD: Number(args.cantidad),
    UNIDADES: args.unidades,
    COSTO: Number(args.costo),
    GRUPO: args.grupo || "GENERAL",
    Area: args.area || "COCINA",
    Estado: args.estado || "OK",
    COOR: String(coor),
    precioUnitario: precioUnitario,
    FECHA_ACT: getFechaActual(),
  };

  const { data, error } = await supabase().from("ItemsAlmacen").insert([payload]).select().single();
  if (error) throw new Error(`Error al crear ítem en Inventario: ${error.message}`);
  return { mensaje: "Insumo creado exitosamente en Almacén", item: data };
}

async function inventarioActualizar({ id, ...campos }) {
  if (!id) throw new Error("Se requiere el ID del ítem");

  const { data: existing, error: fetchErr } = await supabase().from("ItemsAlmacen").select("*").eq("_id", id).single();
  if (fetchErr || !existing) throw new Error(`No se encontró el ítem de inventario con ID: ${id}`);

  const payload = {};
  if (campos.nombre) payload.Nombre_del_producto = campos.nombre;
  if (campos.cantidad !== undefined) payload.CANTIDAD = Number(campos.cantidad);
  if (campos.unidades !== undefined) payload.UNIDADES = campos.unidades;
  if (campos.costo !== undefined) payload.COSTO = Number(campos.costo);
  if (campos.grupo !== undefined) payload.GRUPO = campos.grupo;
  if (campos.area !== undefined) payload.Area = campos.area;
  if (campos.estado !== undefined) payload.Estado = campos.estado;
  if (campos.coor !== undefined) payload.COOR = String(campos.coor);

  // Recalcular precio unitario si cambió costo o cantidad
  const nuevoCosto = payload.COSTO !== undefined ? payload.COSTO : existing.COSTO;
  const nuevaCantidad = payload.CANTIDAD !== undefined ? payload.CANTIDAD : existing.CANTIDAD;
  const nuevoCoor = payload.COOR !== undefined ? payload.COOR : (existing.COOR || 1.05);

  payload.precioUnitario = calcularPrecioUnitario(nuevoCosto, nuevaCantidad, nuevoCoor);
  payload.FECHA_ACT = getFechaActual();

  const { data: updated, error: updateErr } = await supabase()
    .from("ItemsAlmacen")
    .update(payload)
    .eq("_id", id)
    .select()
    .single();

  if (updateErr) throw new Error(`Error al actualizar ítem de inventario: ${updateErr.message}`);
  return {
    mensaje: `Ítem "${updated.Nombre_del_producto}" actualizado exitosamente`,
    item_actualizado: updated,
    snapshot_previo: existing,
  };
}

async function inventarioAjustarStock({ id, delta_cantidad, motivo } = {}) {
  if (!id || delta_cantidad === undefined) {
    throw new Error("Se requiere el ID del ítem y el delta_cantidad (positivo o negativo)");
  }

  const { data: existing, error: fetchErr } = await supabase().from("ItemsAlmacen").select("*").eq("_id", id).single();
  if (fetchErr || !existing) throw new Error(`No se encontró el ítem con ID: ${id}`);

  const stockActual = parseFloat(existing.CANTIDAD) || 0;
  const nuevoStock = Math.max(0, stockActual + Number(delta_cantidad));

  const payload = {
    CANTIDAD: nuevoStock,
    FECHA_ACT: getFechaActual(),
  };

  const { data: updated, error: updateErr } = await supabase()
    .from("ItemsAlmacen")
    .update(payload)
    .eq("_id", id)
    .select()
    .single();

  if (updateErr) throw new Error(`Error al ajustar stock: ${updateErr.message}`);
  return {
    mensaje: `Stock de "${existing.Nombre_del_producto}" ajustado de ${stockActual} a ${nuevoStock} ${existing.UNIDADES || ""}`,
    stock_anterior: stockActual,
    stock_nuevo: nuevoStock,
    motivo: motivo || "Ajuste operativo",
    item: updated,
  };
}

async function inventarioEliminar({ id, confirmar } = {}) {
  if (!id) throw new Error("Se requiere el ID del ítem");
  if (confirmar !== true) {
    throw new Error("CONFIRMACIÓN REQUERIDA: Debes enviar 'confirmar: true' para eliminar este insumo del almacén.");
  }

  const { data: existing, error: fetchErr } = await supabase().from("ItemsAlmacen").select("*").eq("_id", id).single();
  if (fetchErr || !existing) throw new Error(`No se encontró el ítem con ID: ${id}`);

  const { error } = await supabase().from("ItemsAlmacen").delete().eq("_id", id);
  if (error) throw new Error(`Error al eliminar ítem: ${error.message}`);

  return {
    mensaje: `Insumo "${existing.Nombre_del_producto}" eliminado exitosamente del inventario`,
    backup_item: existing,
  };
}

// ── 3. RECETAS ───────────────────────────────
async function getRecetas({ nombre, for_id } = {}) {
  let q = supabase().from("Recetas").select("*");
  if (nombre) q = q.ilike("legacyName", `%${nombre}%`);
  if (for_id) q = q.eq("forId", for_id);

  const { data, error } = await q.order("legacyName", { ascending: true });
  if (error) throw new Error(`Error recetas: ${error.message}`);
  return (data || []).map((item) => ({
    _id: item._id,
    nombre: item.legacyName,
    forId: item.forId,
    costo: item.costo,
    rendimiento: item.rendimiento,
    emplatado: item.emplatado,
    actualizacion: item.actualizacion,
    ...item,
  }));
}

async function recetaObtener({ id, for_id } = {}) {
  let q = supabase().from("Recetas").select("*");
  if (id) q = q.eq("_id", id);
  else if (for_id) q = q.eq("forId", for_id);
  else throw new Error("Se requiere id o for_id para consultar la receta");

  const { data, error } = await q.single();
  if (error) throw new Error(`Receta no encontrada: ${error.message}`);
  return data;
}

async function recetaCrear(args) {
  if (!args.nombre || !args.forId) {
    throw new Error("Campos obligatorios: nombre (legacyName) y forId (producto vinculado)");
  }

  const payload = {
    _id: randomUUID(),
    legacyName: args.nombre,
    forId: args.forId,
    costo: args.costo !== undefined ? Number(args.costo) : null,
    emplatado: args.emplatado || "",
    autor: args.autor || "Equipo Proyecto Café",
    actualizacion: getFechaActual(),
    rendimiento: args.rendimiento ? (typeof args.rendimiento === "string" ? args.rendimiento : JSON.stringify(args.rendimiento)) : null,
  };

  // Mapear pasos de preparación proces1..proces10
  if (Array.isArray(args.procesos)) {
    args.procesos.slice(0, 10).forEach((p, idx) => {
      payload[`proces${idx + 1}`] = p;
    });
  }

  // Mapear ingredientes
  if (Array.isArray(args.ingredientes)) {
    args.ingredientes.slice(0, 20).forEach((ing, idx) => {
      payload[`item${idx + 1}_Id`] = ing.item_id;
      payload[`item${idx + 1}_Cuantity_Units`] = JSON.stringify({
        metric: { cuantity: ing.cantidad, units: ing.unidades },
        legacyName: ing.nombre || "",
      });
    });
  }

  const { data, error } = await supabase().from("Recetas").insert([payload]).select().single();
  if (error) throw new Error(`Error al crear receta: ${error.message}`);
  return { mensaje: "Receta creada exitosamente", receta: data };
}

async function recetaActualizar({ id, ...campos }) {
  if (!id) throw new Error("Se requiere el ID de la receta");

  const { data: existing, error: fetchErr } = await supabase().from("Recetas").select("*").eq("_id", id).single();
  if (fetchErr || !existing) throw new Error(`No se encontró la receta con ID: ${id}`);

  const payload = { actualizacion: getFechaActual() };
  if (campos.nombre) payload.legacyName = campos.nombre;
  if (campos.costo !== undefined) payload.costo = Number(campos.costo);
  if (campos.emplatado !== undefined) payload.emplatado = campos.emplatado;
  if (campos.rendimiento !== undefined) {
    payload.rendimiento = typeof campos.rendimiento === "string" ? campos.rendimiento : JSON.stringify(campos.rendimiento);
  }

  if (Array.isArray(campos.procesos)) {
    campos.procesos.slice(0, 10).forEach((p, idx) => {
      payload[`proces${idx + 1}`] = p;
    });
  }

  const { data: updated, error: updateErr } = await supabase()
    .from("Recetas")
    .update(payload)
    .eq("_id", id)
    .select()
    .single();

  if (updateErr) throw new Error(`Error al actualizar receta: ${updateErr.message}`);
  return {
    mensaje: `Receta "${updated.legacyName}" actualizada exitosamente`,
    receta_actualizada: updated,
    snapshot_previo: existing,
  };
}

// ── 4. COMPRAS Y VENTAS ─────────────────────
async function getCompras({ busqueda, fecha_inicio, fecha_fin, limite = 50 } = {}) {
  let q = supabase().from("Compras").select("*").limit(limite).order("Date", { ascending: false });
  if (fecha_inicio) q = q.gte("Date", fecha_inicio);
  if (fecha_fin) q = q.lte("Date", fecha_fin);
  if (busqueda) {
    q = q.or(`Concepto.ilike.%${busqueda}%,Categoria.ilike.%${busqueda}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(`Error compras: ${error.message}`);
  return data || [];
}

async function compraCrear(args) {
  if (args.valor === undefined || !args.concepto) {
    throw new Error("Campos obligatorios: valor y concepto");
  }

  const payload = {
    _id: randomUUID(),
    Date: args.fecha || getFechaActual(),
    Valor: Number(args.valor),
    Concepto: args.concepto,
    Categoria: args.categoria || "Insumos",
    Proveedor_Id: args.proveedor_id || null,
    Detalle: args.detalle || "",
  };

  const { data, error } = await supabase().from("Compras").insert([payload]).select().single();
  if (error) throw new Error(`Error al registrar compra: ${error.message}`);
  return { mensaje: "Compra registrada exitosamente", compra: data };
}

async function getVentas({ fecha_inicio, fecha_fin, limite = 50 } = {}) {
  let q = supabase().from("Ventas").select("*").limit(limite).order("Date", { ascending: false });
  if (fecha_inicio) q = q.gte("Date", fecha_inicio);
  if (fecha_fin) q = q.lte("Date", fecha_fin);
  const { data, error } = await q;
  if (error) throw new Error(`Error ventas: ${error.message}`);
  return data || [];
}

async function ventaRegistrar(args) {
  if (args.total_ingreso === undefined) {
    throw new Error("Campo obligatorio: total_ingreso");
  }

  const ahora = new Date();
  const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

  const payload = {
    _id: randomUUID(),
    Date: args.fecha || getFechaActual(),
    Time: args.hora || horaActual,
    Total_Ingreso: Number(args.total_ingreso),
    Productos: args.productos || "Venta de turno",
    Cliente: args.cliente || "Consumidor Final",
    MetodoPago: args.metodo_pago || "Bold",
  };

  const { data, error } = await supabase().from("Ventas").insert([payload]).select().single();
  if (error) throw new Error(`Error al registrar venta: ${error.message}`);
  return { mensaje: "Venta registrada exitosamente", venta: data };
}

// ── 5. STAFF ────────────────────────────────
async function getStaff({ solo_activos = true } = {}) {
  let q = supabase().from("Staff").select("*");
  if (solo_activos) {
    q = q.eq("activo", true);
  }
  const { data, error } = await q.order("nombre", { ascending: true });
  if (error) throw new Error(`Error al obtener staff: ${error.message}`);
  return data || [];
}

// ── 6. AGENDA CRUD & SAFETY ──────────────────
async function agendaListar({ fecha_inicio, fecha_fin, busqueda, incluir_eliminados = false, limite = 100 } = {}) {
  let q = supabase()
    .from("Agenda")
    .select("*")
    .order("fecha", { ascending: true })
    .order("horaInicio", { ascending: true })
    .limit(limite);

  if (fecha_inicio) q = q.gte("fecha", fecha_inicio);
  if (fecha_fin) q = q.lte("fecha", fecha_fin);
  if (busqueda) {
    q = q.or(
      `nombreES.ilike.%${busqueda}%,nombreCliente.ilike.%${busqueda}%,autores.ilike.%${busqueda}%`
    );
  }

  const { data, error } = await q;
  if (error) throw new Error(`Error al listar agenda: ${error.message}`);

  let filtrados = data || [];
  if (!incluir_eliminados) {
    filtrados = filtrados.filter((ev) => ev.estado_proceso !== "eliminado");
  }

  const normalizados = filtrados.map(normalizeAgendaItem);
  return { total: normalizados.length, eventos: normalizados };
}

async function agendaObtener({ id } = {}) {
  if (!id) throw new Error("Se requiere el ID del evento");
  const { data, error } = await supabase()
    .from("Agenda")
    .select("*")
    .eq("_id", id)
    .single();
  if (error) throw new Error(`Evento no encontrado: ${error.message}`);
  return normalizeAgendaItem(data);
}

async function agendaBuscarDisponibilidad({ fecha, horaInicio, horaFinal, excluir_id } = {}) {
  if (!fecha) throw new Error("Se requiere la fecha");

  let q = supabase()
    .from("Agenda")
    .select("_id, nombreES, horaInicio, horaFinal, nombreCliente, estado_proceso")
    .eq("fecha", fecha);

  if (excluir_id) q = q.neq("_id", excluir_id);

  const { data: rawEventos, error } = await q.order("horaInicio");
  if (error) throw new Error(`Error al verificar disponibilidad: ${error.message}`);

  const eventosActivos = (rawEventos || [])
    .filter((ev) => ev.estado_proceso !== "eliminado")
    .map(normalizeAgendaItem);

  if (!horaInicio || !horaFinal) {
    return {
      fecha,
      eventos_del_dia: eventosActivos,
      total_eventos: eventosActivos.length,
      disponible: eventosActivos.length === 0,
    };
  }

  const conflictos = eventosActivos.filter((ev) => {
    return horaInicio < ev.horaFinal && horaFinal > ev.horaInicio;
  });

  return {
    fecha,
    horaInicio,
    horaFinal,
    disponible: conflictos.length === 0,
    conflictos,
    otros_eventos_del_dia: eventosActivos.filter(
      (ev) => !conflictos.find((c) => c._id === ev._id)
    ),
  };
}

async function agendaCrear(args) {
  const nombreFinal = args.nombreES || args.nombre;
  const { fecha, horaInicio, horaFinal } = args;

  if (!nombreFinal || !fecha || !horaInicio || !horaFinal) {
    throw new Error("Campos obligatorios: nombre (o nombreES), fecha, horaInicio, horaFinal");
  }

  const payload = {
    _id: randomUUID(),
    nombreES: nombreFinal,
    nombreEN: args.nombreEN || "",
    fecha,
    horaInicio,
    horaFinal,
    ...(args.nombreCliente !== undefined && { nombreCliente: args.nombreCliente }),
    ...(args.emailCliente !== undefined && { emailCliente: args.emailCliente }),
    ...(args.telefonoCliente !== undefined && { telefonoCliente: args.telefonoCliente }),
    ...(args.numeroPersonas !== undefined && { numeroPersonas: parseInt(args.numeroPersonas) || 1 }),
    ...(args.valor !== undefined && { valor: String(args.valor) }),
    ...(args.autores !== undefined && { autores: args.autores }),
    ...(args.infoAdicional !== undefined && { infoAdicional: args.infoAdicional }),
    ...(args.decripcion !== undefined && { decripcion: args.decripcion }),
    ...(args.bannerIMG !== undefined && { bannerIMG: args.bannerIMG }),
    ...(args.linkInscripcion !== undefined && { linkInscripcion: args.linkInscripcion }),
    servicios: formatServicios(args.servicios),
    ...(args.aliado_id !== undefined && { aliado_id: args.aliado_id }),
    ...(args.instagramsAliados !== undefined && { instagramsAliados: args.instagramsAliados }),
    estado_proceso: "activo",
  };

  const { data, error } = await supabase()
    .from("Agenda")
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`Error al crear evento: ${error.message}`);
  return { mensaje: "Evento creado exitosamente", evento: normalizeAgendaItem(data) };
}

async function agendaActualizar({ id, ...campos }) {
  if (!id) throw new Error("Se requiere el ID del evento (_id)");

  const { data: existing, error: fetchErr } = await supabase()
    .from("Agenda")
    .select("*")
    .eq("_id", id)
    .single();

  if (fetchErr || !existing) {
    throw new Error(`No se encontró el evento con ID: ${id}`);
  }

  const payload = {};

  if (campos.nombre !== undefined || campos.nombreES !== undefined) {
    payload.nombreES = campos.nombreES || campos.nombre;
  }
  if (campos.nombreEN !== undefined) payload.nombreEN = campos.nombreEN;
  if (campos.fecha !== undefined) payload.fecha = campos.fecha;
  if (campos.horaInicio !== undefined) payload.horaInicio = campos.horaInicio;
  if (campos.horaFinal !== undefined) payload.horaFinal = campos.horaFinal;
  if (campos.nombreCliente !== undefined) payload.nombreCliente = campos.nombreCliente;
  if (campos.emailCliente !== undefined) payload.emailCliente = campos.emailCliente;
  if (campos.telefonoCliente !== undefined) payload.telefonoCliente = campos.telefonoCliente;
  if (campos.numeroPersonas !== undefined) payload.numeroPersonas = parseInt(campos.numeroPersonas) || 1;
  if (campos.valor !== undefined) payload.valor = String(campos.valor);
  if (campos.autores !== undefined) payload.autores = campos.autores;
  if (campos.infoAdicional !== undefined) payload.infoAdicional = campos.infoAdicional;
  if (campos.decripcion !== undefined) payload.decripcion = campos.decripcion;
  if (campos.bannerIMG !== undefined) payload.bannerIMG = campos.bannerIMG;
  if (campos.linkInscripcion !== undefined) payload.linkInscripcion = campos.linkInscripcion;
  if (campos.servicios !== undefined) payload.servicios = formatServicios(campos.servicios);
  if (campos.aliado_id !== undefined) payload.aliado_id = campos.aliado_id;
  if (campos.instagramsAliados !== undefined) payload.instagramsAliados = campos.instagramsAliados;

  if (Object.keys(payload).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar");
  }

  const { data: updated, error: updateErr } = await supabase()
    .from("Agenda")
    .update(payload)
    .eq("_id", id)
    .select()
    .single();

  if (updateErr) throw new Error(`Error al actualizar evento: ${updateErr.message}`);

  return {
    mensaje: "Evento actualizado exitosamente",
    evento_actualizado: normalizeAgendaItem(updated),
    snapshot_previo: normalizeAgendaItem(existing),
    nota_seguridad:
      "Se ha preservado una copia exacta del evento antes de la modificación para auditoría y reversión inmediata si fuese necesario.",
  };
}

async function agendaEliminar({ id, confirmar, modo = "soft" } = {}) {
  if (!id) throw new Error("Se requiere el ID del evento");

  if (confirmar !== true) {
    throw new Error(
      "CONFIRMACIÓN REQUERIDA (Safety Gate): Para eliminar este evento es obligatorio solicitar autorización explícita al usuario y enviar 'confirmar: true'."
    );
  }

  const { data: existing, error: fetchErr } = await supabase()
    .from("Agenda")
    .select("*")
    .eq("_id", id)
    .single();

  if (fetchErr || !existing) {
    throw new Error(`No se encontró el evento con ID: ${id}`);
  }

  if (modo === "definitivo") {
    const { error: deleteErr } = await supabase().from("Agenda").delete().eq("_id", id);
    if (deleteErr) throw new Error(`Error al eliminar definitivamente: ${deleteErr.message}`);

    return {
      mensaje: `Evento "${existing.nombreES}" (${existing.fecha}) eliminado definitivamente de la base de datos.`,
      id_eliminado: id,
      modo: "definitivo",
      backup_para_restaurar: normalizeAgendaItem(existing),
      instruccion_restauracion:
        "Si fue un error, puedes recrear este evento con 'agenda_crear' usando los datos del backup_para_restaurar.",
    };
  } else {
    const { data: softUpdated, error: softErr } = await supabase()
      .from("Agenda")
      .update({ estado_proceso: "eliminado" })
      .eq("_id", id)
      .select()
      .single();

    if (softErr) throw new Error(`Error en borrado lógico: ${softErr.message}`);

    return {
      mensaje: `Evento "${existing.nombreES}" (${existing.fecha}) eliminado de la vista activa (Borrado Lógico / Soft Delete).`,
      id_eliminado: id,
      modo: "soft_delete",
      estado: "eliminado",
      backup_para_restaurar: normalizeAgendaItem(existing),
      instruccion_restauracion: `Para restaurar este evento ejecuta 'agenda_restaurar' con id: "${id}".`,
    };
  }
}

async function agendaRestaurar({ id } = {}) {
  if (!id) throw new Error("Se requiere el ID del evento a restaurar");

  const { data, error } = await supabase()
    .from("Agenda")
    .update({ estado_proceso: "activo" })
    .eq("_id", id)
    .select()
    .single();

  if (error) throw new Error(`Error al restaurar evento: ${error.message}`);
  if (!data) throw new Error(`No se encontró el evento con ID: ${id}`);

  return {
    mensaje: `Evento "${data.nombreES}" restaurado a estado activo exitosamente.`,
    evento: normalizeAgendaItem(data),
  };
}

// ─────────────────────────────────────────────
// MCP JSON-RPC DISPATCHER
// ─────────────────────────────────────────────

async function handleMcpRequest(body) {
  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== "2.0") {
    return { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request" } };
  }

  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: SERVER_INFO,
            capabilities: { tools: {} },
          },
        };

      case "tools/list":
        return { jsonrpc: "2.0", id, result: { tools: TOOLS } };

      case "tools/call": {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};

        const handlers = {
          // Menú
          get_menu: getMenu,
          menu_obtener: menuObtener,
          menu_crear: menuCrear,
          menu_actualizar: menuActualizar,
          menu_eliminar: menuEliminar,

          // Inventario
          get_inventario: getInventario,
          inventario_obtener: inventarioObtener,
          inventario_crear: inventarioCrear,
          inventario_actualizar: inventarioActualizar,
          inventario_ajustar_stock: inventarioAjustarStock,
          inventario_eliminar: inventarioEliminar,

          // Recetas
          get_recetas: getRecetas,
          receta_obtener: recetaObtener,
          receta_crear: recetaCrear,
          receta_actualizar: recetaActualizar,

          // Compras y Ventas
          get_compras: getCompras,
          compra_crear: compraCrear,
          get_ventas: getVentas,
          venta_registrar: ventaRegistrar,

          // Staff
          get_staff: getStaff,

          // Agenda
          agenda_listar: agendaListar,
          agenda_obtener: agendaObtener,
          agenda_buscar_disponibilidad: agendaBuscarDisponibilidad,
          agenda_crear: agendaCrear,
          agenda_actualizar: agendaActualizar,
          agenda_eliminar: agendaEliminar,
          agenda_restaurar: agendaRestaurar,
        };

        const fn = handlers[toolName];
        if (!fn) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Tool not found: ${toolName}` },
          };
        }

        const result = await fn(toolArgs);
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          },
        };
      }

      case "ping":
        return { jsonrpc: "2.0", id, result: {} };

      default:
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: err.message },
    };
  }
}

// ─────────────────────────────────────────────
// VERCEL SERVERLESS HANDLER
// ─────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, mcp-session-id"
  );
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

  if (req.method === "OPTIONS") return res.status(200).end();

  // SSE handshake (GET)
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(
      `data: ${JSON.stringify({ type: "endpoint", endpoint: "/api/mcp" })}

`
    );
    setTimeout(() => res.end(), 500);
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;

  if (Array.isArray(body)) {
    const responses = await Promise.all(body.map(handleMcpRequest));
    return res.status(200).json(responses);
  }

  const response = await handleMcpRequest(body);
  return res.status(200).json(response);
}
