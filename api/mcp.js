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
 * 7. STAFF Y TURNOS: Listar personal (get_staff), Consultar turnos y asistencia (staff_turnos_obtener),
 *    Añadir turno (staff_turno_agregar), Editar turnos registrados (staff_turno_editar),
 *    Eliminar turno (staff_turno_eliminar), Editar plantilla de horario semanal (staff_horario_semanal_editar).
 *
 * Mapeo nativo a tablas Supabase:
 * - Agenda: _id, nombreES, nombreEN, fecha, horaInicio, horaFinal, servicios, valor, estado_proceso, etc.
 * - Menu: _id, NombreES, NombreEN, Precio, TipoES, TipoEN, DescripcionMenuES, Foto, DietaES, CuidadoES, AproxTime.
 * - ItemsAlmacen: _id, Nombre_del_producto, Area, CANTIDAD, UNIDADES, COSTO, GRUPO, Estado, precioUnitario, COOR, FECHA_ACT.
 * - Recetas: _id, forId, legacyName, rendimiento, costo, emplatado, proces1..proces10, item1_Id..item20_Id.
 * - Compras: _id, Date, Valor, Proveedor_Id, Concepto, Categoria, Detalle.
 * - Ventas: _id, Date, Time, Total_Ingreso, Productos, Cliente, MetodoPago.
 * - Staff: _id, Nombre, Apellido, CC, Cargo, Rate, Celular, Show, Contratacion, Turnos (JSON), TurnosSet (JSON), Propinas (JSON).
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

function parseTurnosStaff(rawTurnos) {
  if (!rawTurnos) return [];
  if (Array.isArray(rawTurnos)) return rawTurnos;
  if (typeof rawTurnos === "string" && rawTurnos.trim() !== "") {
    try {
      const parsed = JSON.parse(rawTurnos);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  return [];
}

function parseTurnosSetStaff(rawTurnosSet) {
  const defaultSchedule = {
    Lunes: { inicio: "08:00", fin: "16:00", descanso: false },
    Martes: { inicio: "08:00", fin: "16:00", descanso: false },
    Miercoles: { inicio: "08:00", fin: "16:00", descanso: false },
    Jueves: { inicio: "08:00", fin: "16:00", descanso: false },
    Viernes: { inicio: "08:00", fin: "16:00", descanso: false },
    Sabado: { inicio: "08:00", fin: "16:00", descanso: false },
    Domingo: { inicio: "08:00", fin: "16:00", descanso: true },
  };
  if (!rawTurnosSet) return defaultSchedule;
  if (typeof rawTurnosSet === "object" && !Array.isArray(rawTurnosSet)) {
    return Object.keys(rawTurnosSet).length > 0 ? rawTurnosSet : defaultSchedule;
  }
  if (typeof rawTurnosSet === "string" && rawTurnosSet.trim() !== "") {
    try {
      const parsed = JSON.parse(rawTurnosSet);
      return parsed && typeof parsed === "object" && Object.keys(parsed).length > 0
        ? parsed
        : defaultSchedule;
    } catch {
      return defaultSchedule;
    }
  }
  return defaultSchedule;
}

function calcularHorasTurno(horaInicio, horaCierre) {
  if (!horaInicio || !horaCierre || horaCierre === "false" || horaCierre === "PENDING") {
    return 0;
  }
  try {
    const [h1, m1] = String(horaInicio).split(":").map(Number);
    const [h2, m2] = String(horaCierre).split(":").map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
    const duration = (h2 - h1) + (m2 - m1) / 60;
    return duration > 0 ? parseFloat(duration.toFixed(2)) : 0;
  } catch {
    return 0;
  }
}

function normalizarObjetoTurno(t) {
  const rawFecha = t?.fecha || t?.turnoDate || t?.date || "";
  const fecha = String(rawFecha).split("T")[0];
  const horaInicio = t?.horaInicio || t?.horaEntrada || t?.hora || "";
  const horaCierre =
    t?.horaCierre !== undefined
      ? String(t.horaCierre)
      : t?.horaSalida !== undefined
      ? String(t.horaSalida)
      : t?.horaFin !== undefined
      ? String(t.horaFin)
      : "";
  return {
    fecha,
    horaInicio,
    horaCierre,
  };
}

async function buscarEmpleadoStaff({ id, cc, nombre } = {}) {
  if (!id && !cc && !nombre) {
    throw new Error("Debes proporcionar 'id' (_id UUID), 'cc' (cédula) o 'nombre' del colaborador.");
  }

  const { data: allStaff, error } = await supabase().from("Staff").select("*");
  if (error) throw new Error(`Error al consultar tabla Staff: ${error.message}`);
  const lista = allStaff || [];

  if (id) {
    const found = lista.find((e) => String(e._id) === String(id));
    if (!found) throw new Error(`No se encontró colaborador con ID (_id): ${id}`);
    return found;
  }

  if (cc !== undefined && cc !== null && String(cc).trim() !== "") {
    const ccStr = String(cc).trim();
    const found = lista.find((e) => String(e.CC) === ccStr);
    if (!found) throw new Error(`No se encontró colaborador con cédula (CC): ${cc}`);
    return found;
  }

  const q = String(nombre).toLowerCase().trim();
  const matches = lista.filter((e) => {
    const full = `${e.Nombre || ""} ${e.Apellido || ""}`.toLowerCase().trim();
    return (
      full.includes(q) ||
      String(e.Nombre || "").toLowerCase().includes(q) ||
      String(e.Apellido || "").toLowerCase().includes(q)
    );
  });

  if (matches.length === 0) {
    throw new Error(`No se encontró ningún colaborador que coincida con el nombre: "${nombre}"`);
  }
  if (matches.length > 1) {
    const exactFull = matches.find(
      (e) => `${e.Nombre || ""} ${e.Apellido || ""}`.toLowerCase().trim() === q
    );
    if (exactFull) return exactFull;

    const opciones = matches
      .map((e) => `- ${e.Nombre || ""} ${e.Apellido || ""} (CC: ${e.CC}, _id: ${e._id})`)
      .join("\n");
    throw new Error(
      `Se encontraron múltiples colaboradores para "${nombre}". Por favor especifica 'cc' o 'id':\n${opciones}`
    );
  }

  return matches[0];
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

  // ── 5. STAFF Y TURNOS ───────────────────────
  {
    name: "get_staff",
    description: "Consulta el equipo de trabajo y colaboradores de Proyecto Café con sus roles, tarifas, estado de turno y contacto.",
    inputSchema: {
      type: "object",
      properties: {
        solo_activos: { type: "boolean", description: "Filtrar únicamente colaboradores activos (default true)" },
        busqueda: { type: "string", description: "Filtrar por nombre, apellido, cargo o cédula (CC)" },
      },
    },
  },
  {
    name: "staff_turnos_obtener",
    description:
      "Obtiene el historial de turnos registrados (asistencia) y la plantilla de horario semanal de un colaborador (buscando por ID, cédula CC o nombre), con filtro por rango de fechas y cálculo de horas trabajadas.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID (_id) del colaborador en Staff" },
        cc: { type: ["string", "number"], description: "Número de cédula (CC) del colaborador" },
        nombre: { type: "string", description: "Nombre o apellido del colaborador" },
        fecha_inicio: { type: "string", description: "Filtrar turnos desde esta fecha YYYY-MM-DD (opcional)" },
        fecha_fin: { type: "string", description: "Filtrar turnos hasta esta fecha YYYY-MM-DD (opcional)" },
      },
    },
  },
  {
    name: "staff_turno_agregar",
    description:
      "Añade uno o varios turnos al registro de turnos trabajados (Turnos) de un colaborador del staff. También permite iniciar un turno abierto enviando horaCierre: 'false'.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID (_id) del colaborador" },
        cc: { type: ["string", "number"], description: "Cédula (CC) del colaborador" },
        nombre: { type: "string", description: "Nombre del colaborador" },
        fecha: { type: "string", description: "Fecha del turno YYYY-MM-DD (si se agrega un solo turno)" },
        horaInicio: { type: "string", description: "Hora de entrada HH:MM (ej: '08:00')" },
        horaCierre: {
          type: "string",
          description: "Hora de salida HH:MM (ej: '16:30') o 'false' si el turno queda abierto en curso",
        },
        turnos: {
          type: "array",
          description: "Lista de turnos a agregar en lote: [{ fecha: 'YYYY-MM-DD', horaInicio: 'HH:MM', horaCierre: 'HH:MM' }]",
          items: {
            type: "object",
            required: ["fecha", "horaInicio"],
            properties: {
              fecha: { type: "string" },
              horaInicio: { type: "string" },
              horaCierre: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "staff_turno_editar",
    description:
      "⚠️ Edita los turnos registrados de un colaborador del staff. Permite modificar un turno puntual (por su 'indice' obtenido en staff_turnos_obtener o buscando por 'fecha_busqueda') o reemplazar los turnos de un periodo/completos. Guarda snapshot previo.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID (_id) del colaborador" },
        cc: { type: ["string", "number"], description: "Cédula (CC) del colaborador" },
        nombre: { type: "string", description: "Nombre del colaborador" },
        indice: {
          type: "number",
          description: "Índice exacto del turno en el arreglo Turnos (devuelto como 'indice' por staff_turnos_obtener)",
        },
        fecha_busqueda: {
          type: "string",
          description: "Si no se envía 'indice', fecha YYYY-MM-DD del turno que se desea modificar",
        },
        horaInicio_busqueda: {
          type: "string",
          description: "Opcional: horaInicio HH:MM para desambiguar si el empleado tiene varios turnos en la misma fecha_busqueda",
        },
        fecha: { type: "string", description: "Nueva fecha YYYY-MM-DD para el turno editado" },
        horaInicio: { type: "string", description: "Nueva hora de entrada HH:MM para el turno editado" },
        horaCierre: { type: "string", description: "Nueva hora de salida HH:MM para el turno editado" },
        turnos_reemplazo: {
          type: "array",
          description:
            "Modo lote: lista de turnos [{ fecha, horaInicio, horaCierre }] para reemplazar los turnos de un rango de fechas o toda la lista",
          items: {
            type: "object",
            required: ["fecha", "horaInicio", "horaCierre"],
            properties: {
              fecha: { type: "string" },
              horaInicio: { type: "string" },
              horaCierre: { type: "string" },
            },
          },
        },
        rango_reemplazo: {
          type: "object",
          description:
            "Si se usa 'turnos_reemplazo', define { fecha_inicio: 'YYYY-MM-DD', fecha_fin: 'YYYY-MM-DD' } para reemplazar únicamente los turnos dentro de ese rango conservando el resto del historial",
          properties: {
            fecha_inicio: { type: "string" },
            fecha_fin: { type: "string" },
          },
        },
        reemplazar_todos: {
          type: "boolean",
          description: "Si es true junto con 'turnos_reemplazo', reemplaza la totalidad del arreglo Turnos del empleado",
        },
      },
    },
  },
  {
    name: "staff_turno_eliminar",
    description:
      "🚨 Elimina un turno registrado de un colaborador del staff (por 'indice' o por 'fecha'). Requiere confirmar: true y devuelve backup del turno eliminado.",
    inputSchema: {
      type: "object",
      required: ["confirmar"],
      properties: {
        id: { type: "string", description: "UUID (_id) del colaborador" },
        cc: { type: ["string", "number"], description: "Cédula (CC) del colaborador" },
        nombre: { type: "string", description: "Nombre del colaborador" },
        indice: {
          type: "number",
          description: "Índice exacto del turno a eliminar (devuelto por staff_turnos_obtener)",
        },
        fecha: {
          type: "string",
          description: "Fecha YYYY-MM-DD del turno a eliminar (si no se especifica indice)",
        },
        horaInicio: {
          type: "string",
          description: "Hora de inicio HH:MM opcional para identificar el turno si hay varios en la misma fecha",
        },
        confirmar: {
          type: "boolean",
          description: "Debe ser true tras confirmación explícita del usuario",
        },
      },
    },
  },
  {
    name: "staff_horario_semanal_editar",
    description:
      "⚠️ Edita la plantilla de horario base semanal (TurnosSet: Lunes a Domingo) de un colaborador del staff, permitiendo configurar horas de entrada/salida, días de descanso y turnos quincenales (biweekly).",
    inputSchema: {
      type: "object",
      required: ["horarios"],
      properties: {
        id: { type: "string", description: "UUID (_id) del colaborador" },
        cc: { type: ["string", "number"], description: "Cédula (CC) del colaborador" },
        nombre: { type: "string", description: "Nombre del colaborador" },
        horarios: {
          type: "object",
          description:
            "Objeto con los días de la semana a actualizar (Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo). Ejemplo: { Lunes: { inicio: '08:00', fin: '16:00', descanso: false }, Domingo: { descanso: true } }",
          properties: {
            Lunes: { type: "object" },
            Martes: { type: "object" },
            Miercoles: { type: "object" },
            Jueves: { type: "object" },
            Viernes: { type: "object" },
            Sabado: { type: "object" },
            Domingo: { type: "object" },
          },
        },
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

// ── 5. STAFF Y TURNOS ───────────────────────
async function getStaff({ solo_activos = true, busqueda } = {}) {
  const { data, error } = await supabase().from("Staff").select("*");
  if (error) throw new Error("Error al obtener staff: " + error.message);
  let filtrados = data || [];
  if (solo_activos) {
    filtrados = filtrados.filter(
      (s) =>
        s.show !== false &&
        s.Show !== false &&
        s.Show !== "false" &&
        s.Contratacion !== false &&
        s.Contratacion !== "false" &&
        s.activo !== false &&
        s.Estado !== "Inactivo"
    );
  }
  if (busqueda) {
    const q = String(busqueda).toLowerCase().trim();
    filtrados = filtrados.filter((s) => {
      const full = `${s.Nombre || ""} ${s.Apellido || ""} ${s.Cargo || ""} ${s.CC || ""}`.toLowerCase();
      return full.includes(q);
    });
  }
  return filtrados.map((s) => {
    const turnosParsed = parseTurnosStaff(s.Turnos);
    const ultimoTurno = turnosParsed.length > 0 ? normalizarObjetoTurno(turnosParsed[turnosParsed.length - 1]) : null;
    const turnoAbierto = ultimoTurno && ultimoTurno.horaCierre === "false" ? ultimoTurno : null;
    return {
      _id: s._id,
      nombre_completo: `${s.Nombre || ""} ${s.Apellido || ""}`.trim(),
      Nombre: s.Nombre,
      Apellido: s.Apellido,
      CC: s.CC,
      Cargo: s.Cargo,
      Rate: s.Rate,
      Celular: s.Celular,
      Contratacion: s.Contratacion,
      Show: s.Show,
      total_turnos_registrados: turnosParsed.length,
      turno_abierto: turnoAbierto,
      TurnosSet: parseTurnosSetStaff(s.TurnosSet),
      ...s,
    };
  });
}

async function staffTurnosObtener({ id, cc, nombre, fecha_inicio, fecha_fin } = {}) {
  const emp = await buscarEmpleadoStaff({ id, cc, nombre });
  const turnosRaw = parseTurnosStaff(emp.Turnos);

  // Mapear con su índice original en el arreglo Turnos (como en EditarTurnosView.jsx)
  const turnosConIndice = turnosRaw.map((t, idx) => {
    const norm = normalizarObjetoTurno(t);
    const horas = calcularHorasTurno(norm.horaInicio, norm.horaCierre);
    return {
      indice: idx,
      fecha: norm.fecha,
      horaInicio: norm.horaInicio,
      horaCierre: norm.horaCierre,
      horas,
      abierto: norm.horaCierre === "false",
    };
  });

  const turnosFiltrados = turnosConIndice.filter((t) => {
    if (fecha_inicio && t.fecha < fecha_inicio) return false;
    if (fecha_fin && t.fecha > fecha_fin) return false;
    return true;
  });

  const totalHoras = parseFloat(
    turnosFiltrados.reduce((acc, t) => acc + (t.horas || 0), 0).toFixed(2)
  );
  const rate = Number(emp.Rate) || 0;
  const pagoBase = Math.round(totalHoras * rate);
  const seguridadSocial = Math.round(pagoBase * 0.1);

  const horarioSemanal = parseTurnosSetStaff(emp.TurnosSet);
  const horasSemanalesPlantilla = parseFloat(
    Object.values(horarioSemanal)
      .reduce((acc, d) => {
        if (!d || typeof d !== "object" || d.descanso) return acc;
        return acc + calcularHorasTurno(d.inicio, d.fin);
      }, 0)
      .toFixed(2)
  );

  return {
    empleado: {
      _id: emp._id,
      nombre_completo: `${emp.Nombre || ""} ${emp.Apellido || ""}`.trim(),
      CC: emp.CC,
      Cargo: emp.Cargo,
      Rate: rate,
    },
    filtro: {
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
    },
    resumen_periodo: {
      total_turnos_en_rango: turnosFiltrados.length,
      total_turnos_historico: turnosRaw.length,
      total_horas_trabajadas: totalHoras,
      pago_base_estimado_cop: pagoBase,
      seguridad_social_10pct_cop: seguridadSocial,
      total_estimado_cop: pagoBase + seguridadSocial,
    },
    turnos: turnosFiltrados,
    horario_semanal_base: {
      horas_semanales_programadas: horasSemanalesPlantilla,
      TurnosSet: horarioSemanal,
    },
  };
}

async function staffTurnoAgregar({ id, cc, nombre, fecha, horaInicio, horaCierre, turnos } = {}) {
  const emp = await buscarEmpleadoStaff({ id, cc, nombre });
  const turnosActuales = parseTurnosStaff(emp.Turnos);

  let nuevosParaAgregar = [];
  if (Array.isArray(turnos) && turnos.length > 0) {
    nuevosParaAgregar = turnos.map((t) => {
      const norm = normalizarObjetoTurno(t);
      if (!norm.fecha || !norm.horaInicio) {
        throw new Error("Cada turno en 'turnos' debe incluir al menos 'fecha' (YYYY-MM-DD) y 'horaInicio' (HH:MM).");
      }
      return {
        fecha: norm.fecha,
        horaInicio: norm.horaInicio,
        horaCierre: norm.horaCierre || "false",
      };
    });
  } else {
    if (!fecha || !horaInicio) {
      throw new Error("Debes proporcionar 'fecha' (YYYY-MM-DD) y 'horaInicio' (HH:MM), o un arreglo 'turnos'.");
    }
    nuevosParaAgregar = [
      {
        fecha: String(fecha).split("T")[0],
        horaInicio: String(horaInicio),
        horaCierre: horaCierre !== undefined ? String(horaCierre) : "false",
      },
    ];
  }

  const listaActualizada = [...turnosActuales, ...nuevosParaAgregar];

  const { data: updated, error: updateErr } = await supabase()
    .from("Staff")
    .update({ Turnos: JSON.stringify(listaActualizada) })
    .eq("_id", emp._id)
    .select()
    .single();

  if (updateErr) throw new Error(`Error al guardar turnos en Supabase: ${updateErr.message}`);

  const detalleAgregados = nuevosParaAgregar.map((t, i) => ({
    indice: turnosActuales.length + i,
    ...t,
    horas: calcularHorasTurno(t.horaInicio, t.horaCierre),
  }));

  return {
    mensaje: `Se agregaron ${detalleAgregados.length} turno(s) a ${emp.Nombre || ""} ${emp.Apellido || ""} (CC: ${emp.CC}).`,
    empleado: {
      _id: emp._id,
      nombre_completo: `${emp.Nombre || ""} ${emp.Apellido || ""}`.trim(),
      CC: emp.CC,
    },
    turnos_agregados: detalleAgregados,
    total_turnos_actual: listaActualizada.length,
    snapshot_previo_count: turnosActuales.length,
    empleado_actualizado: updated,
  };
}

async function staffTurnoEditar({
  id,
  cc,
  nombre,
  indice,
  fecha_busqueda,
  horaInicio_busqueda,
  fecha,
  horaInicio,
  horaCierre,
  turnos_reemplazo,
  rango_reemplazo,
  reemplazar_todos = false,
} = {}) {
  const emp = await buscarEmpleadoStaff({ id, cc, nombre });
  const turnosActuales = parseTurnosStaff(emp.Turnos);
  const snapshotPrevio = JSON.parse(JSON.stringify(turnosActuales));

  // Modo Lote: reemplazar turnos de un rango de fechas o la totalidad de turnos
  if (Array.isArray(turnos_reemplazo)) {
    const normalizadosNuevos = turnos_reemplazo.map((t) => {
      const norm = normalizarObjetoTurno(t);
      if (!norm.fecha) {
        throw new Error("Todos los turnos en 'turnos_reemplazo' deben tener 'fecha' (YYYY-MM-DD).");
      }
      return {
        fecha: norm.fecha,
        horaInicio: norm.horaInicio,
        horaCierre: norm.horaCierre,
      };
    });

    let nuevaLista = [];
    if (rango_reemplazo && (rango_reemplazo.fecha_inicio || rango_reemplazo.fecha_fin)) {
      const fIni = rango_reemplazo.fecha_inicio || "0000-00-00";
      const fFin = rango_reemplazo.fecha_fin || "9999-12-31";
      const fueraDeRango = turnosActuales.filter((t) => {
        const f = normalizarObjetoTurno(t).fecha;
        return f < fIni || f > fFin;
      });
      nuevaLista = [...fueraDeRango, ...normalizadosNuevos];
    } else if (reemplazar_todos) {
      nuevaLista = normalizadosNuevos;
    } else {
      throw new Error(
        "Al usar 'turnos_reemplazo' debes indicar 'rango_reemplazo: { fecha_inicio, fecha_fin }' o 'reemplazar_todos: true' para evitar sobrescribir todo el historial accidentalmente."
      );
    }

    const { error: updateErr } = await supabase()
      .from("Staff")
      .update({ Turnos: JSON.stringify(nuevaLista) })
      .eq("_id", emp._id);

    if (updateErr) throw new Error(`Error al actualizar turnos por lote en Supabase: ${updateErr.message}`);

    return {
      mensaje: `Turnos de ${emp.Nombre || ""} ${emp.Apellido || ""} actualizados exitosamente (${normalizadosNuevos.length} turnos aplicados).`,
      empleado: {
        _id: emp._id,
        nombre_completo: `${emp.Nombre || ""} ${emp.Apellido || ""}`.trim(),
        CC: emp.CC,
      },
      modo: rango_reemplazo ? "reemplazo_por_rango" : "reemplazo_completo",
      rango_aplicado: rango_reemplazo || "todos",
      turnos_aplicados: normalizadosNuevos.map((t) => ({
        ...t,
        horas: calcularHorasTurno(t.horaInicio, t.horaCierre),
      })),
      total_turnos_anterior: snapshotPrevio.length,
      total_turnos_nuevo: nuevaLista.length,
      snapshot_previo: snapshotPrevio,
    };
  }

  // Modo Individual: editar un turno específico por 'indice' o por 'fecha_busqueda'
  let targetIdx = -1;

  if (indice !== undefined && indice !== null) {
    targetIdx = Number(indice);
    if (isNaN(targetIdx) || targetIdx < 0 || targetIdx >= turnosActuales.length) {
      throw new Error(
        `El índice ${indice} está fuera de rango. El colaborador tiene ${turnosActuales.length} turnos registrados (índices 0 a ${Math.max(0, turnosActuales.length - 1)}).`
      );
    }
  } else if (fecha_busqueda) {
    const fBusq = String(fecha_busqueda).split("T")[0];
    const coincidencias = turnosActuales
      .map((t, idx) => ({ idx, norm: normalizarObjetoTurno(t) }))
      .filter((item) => {
        if (item.norm.fecha !== fBusq) return false;
        if (horaInicio_busqueda && item.norm.horaInicio !== horaInicio_busqueda) return false;
        return true;
      });

    if (coincidencias.length === 0) {
      throw new Error(
        `No se encontró ningún turno en la fecha ${fBusq}${horaInicio_busqueda ? ` con horaInicio ${horaInicio_busqueda}` : ""} para ${emp.Nombre || ""} ${emp.Apellido || ""}.`
      );
    }
    if (coincidencias.length > 1) {
      const desc = coincidencias
        .map((c) => `indice ${c.idx}: ${c.norm.fecha} (${c.norm.horaInicio} - ${c.norm.horaCierre})`)
        .join("; ");
      throw new Error(
        `Hay ${coincidencias.length} turnos en la fecha ${fBusq} (${desc}). Especifica 'indice' o 'horaInicio_busqueda' para indicar cuál editar.`
      );
    }
    targetIdx = coincidencias[0].idx;
  } else {
    throw new Error(
      "Para editar un turno debes proporcionar 'indice' (recomendado, obtenido de staff_turnos_obtener) o 'fecha_busqueda' (YYYY-MM-DD)."
    );
  }

  const turnoAnterior = normalizarObjetoTurno(turnosActuales[targetIdx]);
  const turnoNuevo = {
    fecha: fecha !== undefined ? String(fecha).split("T")[0] : turnoAnterior.fecha,
    horaInicio: horaInicio !== undefined ? String(horaInicio) : turnoAnterior.horaInicio,
    horaCierre: horaCierre !== undefined ? String(horaCierre) : turnoAnterior.horaCierre,
  };

  const nuevaLista = [...turnosActuales];
  nuevaLista[targetIdx] = turnoNuevo;

  const { error: updateErr } = await supabase()
    .from("Staff")
    .update({ Turnos: JSON.stringify(nuevaLista) })
    .eq("_id", emp._id);

  if (updateErr) throw new Error(`Error al guardar el turno editado en Supabase: ${updateErr.message}`);

  return {
    mensaje: `Turno #${targetIdx} de ${emp.Nombre || ""} ${emp.Apellido || ""} actualizado exitosamente.`,
    empleado: {
      _id: emp._id,
      nombre_completo: `${emp.Nombre || ""} ${emp.Apellido || ""}`.trim(),
      CC: emp.CC,
    },
    indice_editado: targetIdx,
    turno_anterior: {
      ...turnoAnterior,
      horas: calcularHorasTurno(turnoAnterior.horaInicio, turnoAnterior.horaCierre),
    },
    turno_actualizado: {
      ...turnoNuevo,
      horas: calcularHorasTurno(turnoNuevo.horaInicio, turnoNuevo.horaCierre),
    },
    snapshot_previo: snapshotPrevio,
  };
}

async function staffTurnoEliminar({ id, cc, nombre, indice, fecha, horaInicio, confirmar } = {}) {
  if (confirmar !== true) {
    throw new Error(
      "CONFIRMACIÓN REQUERIDA (Safety Gate): Debes enviar 'confirmar: true' para eliminar un turno registrado del staff."
    );
  }

  const emp = await buscarEmpleadoStaff({ id, cc, nombre });
  const turnosActuales = parseTurnosStaff(emp.Turnos);
  const snapshotPrevio = JSON.parse(JSON.stringify(turnosActuales));

  let targetIdx = -1;
  if (indice !== undefined && indice !== null) {
    targetIdx = Number(indice);
    if (isNaN(targetIdx) || targetIdx < 0 || targetIdx >= turnosActuales.length) {
      throw new Error(
        `El índice ${indice} no es válido. El colaborador tiene ${turnosActuales.length} turnos registrados.`
      );
    }
  } else if (fecha) {
    const fBusq = String(fecha).split("T")[0];
    const coincidencias = turnosActuales
      .map((t, idx) => ({ idx, norm: normalizarObjetoTurno(t) }))
      .filter((item) => {
        if (item.norm.fecha !== fBusq) return false;
        if (horaInicio && item.norm.horaInicio !== horaInicio) return false;
        return true;
      });

    if (coincidencias.length === 0) {
      throw new Error(
        `No se encontró turno en la fecha ${fBusq}${horaInicio ? ` con horaInicio ${horaInicio}` : ""} para eliminar.`
      );
    }
    if (coincidencias.length > 1) {
      const desc = coincidencias
        .map((c) => `indice ${c.idx}: ${c.norm.fecha} (${c.norm.horaInicio} - ${c.norm.horaCierre})`)
        .join("; ");
      throw new Error(
        `Se encontraron múltiples turnos en la fecha ${fBusq} (${desc}). Especifica 'indice' o 'horaInicio' para eliminar el turno exacto.`
      );
    }
    targetIdx = coincidencias[0].idx;
  } else {
    throw new Error("Debes proporcionar 'indice' o 'fecha' para identificar el turno a eliminar.");
  }

  const turnoEliminado = normalizarObjetoTurno(turnosActuales[targetIdx]);
  const nuevaLista = [...turnosActuales];
  nuevaLista.splice(targetIdx, 1);

  const { error: updateErr } = await supabase()
    .from("Staff")
    .update({ Turnos: JSON.stringify(nuevaLista) })
    .eq("_id", emp._id);

  if (updateErr) throw new Error(`Error al eliminar turno en Supabase: ${updateErr.message}`);

  return {
    mensaje: `Turno del ${turnoEliminado.fecha} (${turnoEliminado.horaInicio} - ${turnoEliminado.horaCierre}) eliminado exitosamente de ${emp.Nombre || ""} ${emp.Apellido || ""}.`,
    empleado: {
      _id: emp._id,
      nombre_completo: `${emp.Nombre || ""} ${emp.Apellido || ""}`.trim(),
      CC: emp.CC,
    },
    indice_eliminado: targetIdx,
    turno_eliminado: {
      ...turnoEliminado,
      horas: calcularHorasTurno(turnoEliminado.horaInicio, turnoEliminado.horaCierre),
    },
    total_turnos_restantes: nuevaLista.length,
    snapshot_previo: snapshotPrevio,
  };
}

async function staffHorarioSemanalEditar({ id, cc, nombre, horarios } = {}) {
  if (!horarios || typeof horarios !== "object") {
    throw new Error("Se requiere el objeto 'horarios' con los días de la semana a configurar.");
  }

  const emp = await buscarEmpleadoStaff({ id, cc, nombre });
  const horarioActual = parseTurnosSetStaff(emp.TurnosSet);
  const snapshotPrevio = JSON.parse(JSON.stringify(horarioActual));

  const diasValidos = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miercoles",
    miércoles: "Miercoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sabado",
    sábado: "Sabado",
    domingo: "Domingo",
  };

  const nuevoHorario = { ...horarioActual };

  for (const [key, cfg] of Object.entries(horarios)) {
    const diaCanonico = diasValidos[key.toLowerCase().trim()];
    if (!diaCanonico) {
      throw new Error(
        `Día inválido "${key}". Usa: Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo.`
      );
    }
    const prevDia = nuevoHorario[diaCanonico] || { inicio: "08:00", fin: "16:00", descanso: false };
    const descanso = cfg.descanso !== undefined ? Boolean(cfg.descanso) : Boolean(prevDia.descanso);
    const inicio = cfg.inicio || cfg.horaInicio || prevDia.inicio || "08:00";
    const fin = cfg.fin || cfg.horaCierre || cfg.horaSalida || prevDia.fin || "16:00";

    nuevoHorario[diaCanonico] = {
      ...prevDia,
      inicio,
      fin,
      descanso,
      ...(cfg.biweekly !== undefined && { biweekly: Boolean(cfg.biweekly) }),
      ...(cfg.fechaInicio !== undefined && { fechaInicio: cfg.fechaInicio }),
    };
  }

  const { error: updateErr } = await supabase()
    .from("Staff")
    .update({ TurnosSet: JSON.stringify(nuevoHorario) })
    .eq("_id", emp._id);

  if (updateErr) throw new Error(`Error al actualizar plantilla de horario semanal en Supabase: ${updateErr.message}`);

  const horasSemanales = parseFloat(
    Object.values(nuevoHorario)
      .reduce((acc, d) => {
        if (!d || typeof d !== "object" || d.descanso) return acc;
        return acc + calcularHorasTurno(d.inicio, d.fin);
      }, 0)
      .toFixed(2)
  );

  return {
    mensaje: `Plantilla de horario semanal (TurnosSet) de ${emp.Nombre || ""} ${emp.Apellido || ""} actualizada exitosamente.`,
    empleado: {
      _id: emp._id,
      nombre_completo: `${emp.Nombre || ""} ${emp.Apellido || ""}`.trim(),
      CC: emp.CC,
    },
    horas_semanales_programadas: horasSemanales,
    horas_mensuales_aprox: parseFloat(((horasSemanales / 7) * 30).toFixed(1)),
    horario_semanal_actualizado: nuevoHorario,
    snapshot_previo: snapshotPrevio,
  };
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

          // Staff y Turnos
          get_staff: getStaff,
          staff_turnos_obtener: staffTurnosObtener,
          staff_turno_agregar: staffTurnoAgregar,
          staff_turno_editar: staffTurnoEditar,
          staff_turno_eliminar: staffTurnoEliminar,
          staff_horario_semanal_editar: staffHorarioSemanalEditar,

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
