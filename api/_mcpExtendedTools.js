/**
 * Herramientas MCP extendidas para control completo de Proyecto Café (App.jsx + 40 tablas Supabase).
 * Importado por api/mcp.js (usado tanto por Vercel HTTP como por scripts/mcp-stdio.mjs).
 */

import { randomUUID } from "crypto";

// ─────────────────────────────────────────────
// SHARED HELPERS (CRUD & SAFETY GATES)
// ─────────────────────────────────────────────

const ALLOWED_TABLES = new Set([
  "Agenda", "Aliados", "attendees", "Bajas", "CapturasProveedor", "Comanda",
  "Compras", "event_reservations", "flyers", "gastos_helados_sociedad",
  "Images_eventos", "ItemsAlmacen", "Menu", "menu_print_config", "Model",
  "models3d", "models3d-assets", "music_covers", "Notas", "planta_layout",
  "playlist_radio", "playlist_youtube", "PreciosHistoricosProducto",
  "Procedimientos", "ProduccionInterna", "Propinas", "Proveedores",
  "Proyect_Info", "Radio", "radio_current_play", "radio_mp3", "Recetas",
  "RecetasProcedimientos", "RecetasProduccion",
  "Staff", "user_customizations", "USER_PREFERENCES", "UserMessages",
  "Vease", "Ventas", "view_preferences",
]);

function requireConfirm(confirmar, accion) {
  if (confirmar !== true) {
    throw new Error(
      `⚠️ Confirmación requerida para ${accion}. Solicita autorización explícita al usuario y envía confirmar: true.`
    );
  }
}

function getBogotaDateISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function safeJsonParse(val, fallback = []) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

async function listTable(sb, table, { limit = 100, orderBy, ascending = false, filters = [] } = {}) {
  let q = sb().from(table).select("*");
  for (const f of filters) {
    if (f.op === "eq") q = q.eq(f.col, f.val);
    else if (f.op === "ilike") q = q.ilike(f.col, `%${f.val}%`);
    else if (f.op === "gte") q = q.gte(f.col, f.val);
    else if (f.op === "lte") q = q.lte(f.col, f.val);
    else if (f.op === "or") q = q.or(f.val);
  }
  if (orderBy) q = q.order(orderBy, { ascending });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(`Error consultando ${table}: ${error.message}`);
  return data || [];
}

async function insertRow(sb, table, payload, idField = "_id") {
  const row = { ...payload };
  if (idField && !row[idField]) row[idField] = randomUUID();
  const { data, error } = await sb().from(table).insert([row]).select().single();
  if (error) throw new Error(`Error creando registro en ${table}: ${error.message}`);
  return data;
}

async function updateRow(sb, table, idField, idVal, fields) {
  if (!idVal) throw new Error(`Se requiere '${idField}' para actualizar en ${table}.`);
  const clean = { ...fields };
  delete clean[idField];
  if (Object.keys(clean).length === 0) {
    throw new Error("Debes proporcionar al menos un campo para actualizar.");
  }
  const { data, error } = await sb()
    .from(table)
    .update(clean)
    .eq(idField, idVal)
    .select()
    .single();
  if (error) throw new Error(`Error actualizando ${table}: ${error.message}`);
  return data;
}

async function deleteRow(sb, table, idField, idVal, confirmar, label) {
  requireConfirm(confirmar, `eliminar ${label} (${idVal}) de ${table}`);
  if (!idVal) throw new Error(`Se requiere '${idField}' para eliminar en ${table}.`);
  const { error } = await sb().from(table).delete().eq(idField, idVal);
  if (error) throw new Error(`Error eliminando en ${table}: ${error.message}`);
  return { eliminado: true, tabla: table, id: idVal };
}

// ─────────────────────────────────────────────
// EXTENDED TOOL DEFINITIONS
// ─────────────────────────────────────────────

export const EXTENDED_TOOLS = [
  // ── COMANDAS ────────────────────────────────
  {
    name: "comandas_listar",
    description: "Lista las comandas/órdenes de cocina y barra (tabla Comanda) con filtros opcionales.",
    inputSchema: {
      type: "object",
      properties: {
        estado: { type: "string", description: "Filtrar por estado (ej: Pendiente, En preparación, Listo, Entregado)" },
        mesa: { type: "string", description: "Filtrar por mesa o cliente" },
        limit: { type: "number", description: "Máximo de resultados (default 100)" },
      },
    },
  },
  {
    name: "comanda_crear",
    description: "Crea una nueva comanda u orden de cocina/mesa en la tabla Comanda.",
    inputSchema: {
      type: "object",
      required: ["mesa", "productos"],
      properties: {
        mesa: { type: "string", description: "Número de mesa o nombre del cliente/pedido" },
        productos: { type: "array", description: "Lista de productos [{ NombreES, quantity, Precio, notas }]" },
        estado: { type: "string", description: "Estado inicial (default: Pendiente)" },
        notas: { type: "string", description: "Notas o instrucciones especiales" },
        total: { type: "number", description: "Valor total estimado" },
        tipo: { type: "string", description: "Tipo de comanda (Mesa, Llevar, Domicilio, Producción)" },
      },
    },
  },
  {
    name: "comanda_actualizar",
    description: "Actualiza una comanda existente (estado, mesa, productos, notas, total).",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID (_id) de la comanda" },
        estado: { type: "string" },
        mesa: { type: "string" },
        productos: { type: "array" },
        notas: { type: "string" },
        total: { type: "number" },
      },
    },
  },
  {
    name: "comanda_eliminar",
    description: "🚨 Elimina una comanda por su _id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: {
        id: { type: "string" },
        confirmar: { type: "boolean" },
      },
    },
  },

  // ── NOTAS Y ACTIVIDADES ─────────────────────
  {
    name: "notas_listar",
    description: "Lista notas, pendientes y tareas operativas de la tabla Notas.",
    inputSchema: {
      type: "object",
      properties: {
        busqueda: { type: "string", description: "Texto a buscar en título, contenido o tipo" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "nota_crear",
    description: "Crea una nueva nota o tarea operativa en la tabla Notas.",
    inputSchema: {
      type: "object",
      required: ["titulo"],
      properties: {
        titulo: { type: "string" },
        contenido: { type: "string" },
        tipo: { type: "string", description: "Categoría o etiqueta de la nota" },
        estado: { type: "string", description: "Estado (ej: pendiente, completada)" },
        fecha: { type: "string", description: "Fecha asociada YYYY-MM-DD" },
        extra: { type: "object", description: "Campos adicionales JSON de la tabla Notas" },
      },
    },
  },
  {
    name: "nota_actualizar",
    description: "Actualiza una nota/tarea existente en Notas por su _id.",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: {
        id: { type: "string" },
        campos: { type: "object", description: "Objeto con los campos a actualizar" },
      },
    },
  },
  {
    name: "nota_eliminar",
    description: "🚨 Elimina una nota por su _id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: {
        id: { type: "string" },
        confirmar: { type: "boolean" },
      },
    },
  },

  // ── PRODUCCIÓN, PROCEDIMIENTOS Y PLANTA ─────
  {
    name: "procedimientos_listar",
    description: "Lista los procedimientos operativos y fichas técnicas de producción (tabla Procedimientos).",
    inputSchema: {
      type: "object",
      properties: { busqueda: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "procedimiento_crear",
    description: "Crea un nuevo procedimiento operativo en la tabla Procedimientos.",
    inputSchema: {
      type: "object",
      required: ["campos"],
      properties: {
        campos: { type: "object", description: "Datos del procedimiento (nombre, pasos, area, tiempo, etc.)" },
      },
    },
  },
  {
    name: "procedimiento_actualizar",
    description: "Actualiza un procedimiento existente en Procedimientos por su _id.",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: {
        id: { type: "string" },
        campos: { type: "object" },
      },
    },
  },
  {
    name: "produccion_interna_listar",
    description: "Lista lotes y registros de producción interna (tabla ProduccionInterna).",
    inputSchema: {
      type: "object",
      properties: { busqueda: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "produccion_interna_registrar",
    description: "Registra un nuevo lote de producción interna en ProduccionInterna.",
    inputSchema: {
      type: "object",
      required: ["campos"],
      properties: {
        campos: { type: "object", description: "Campos del registro de producción interna" },
      },
    },
  },
  {
    name: "produccion_interna_actualizar",
    description: "Actualiza un registro existente de ProduccionInterna por su _id (ej: enlazar Receta, actualizar costo, cantidad o estado).",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: {
        id: { type: "string", description: "UUID del registro en ProduccionInterna" },
        campos: { type: "object", description: "Campos a actualizar en ProduccionInterna" },
      },
    },
  },
  {
    name: "recetas_produccion_listar",
    description: "Lista y busca recetas de producción interna en la tabla RecetasProduccion.",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Buscar receta por nombre (legacyName)" },
        for_id: { type: "string", description: "Filtrar por UUID del producto en ProduccionInterna (forId)" },
        limit: { type: "number", description: "Máximo de resultados (default 100)" },
      },
    },
  },
  {
    name: "receta_produccion_obtener",
    description: "Obtiene el detalle completo de una receta de producción interna (RecetasProduccion) por _id o por for_id (UUID de ProduccionInterna).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID de la receta en RecetasProduccion" },
        for_id: { type: "string", description: "UUID del producto en ProduccionInterna" },
      },
    },
  },
  {
    name: "receta_produccion_crear",
    description: "Crea una receta de producción interna en RecetasProduccion, soporta insumos de ItemsAlmacen (hasta 30), subrecetas de ProduccionInterna (hasta 20), pasos (hasta 20) y notas (hasta 10), y la enlaza automáticamente en ProduccionInterna.Receta.",
    inputSchema: {
      type: "object",
      required: ["nombre", "forId"],
      properties: {
        nombre: { type: "string", description: "Nombre de la receta (legacyName)" },
        forId: { type: "string", description: "UUID del producto en ProduccionInterna al que pertenece" },
        rendimiento: {
          type: "object",
          description: "Objeto de rendimiento: { porcion: 1, cantidad: 1000, unidades: 'gr' }",
        },
        UNIDADES: { type: "string", description: "Unidad principal de rendimiento (ej: 'gr', 'ml', 'un')" },
        costo: { type: "number", description: "Costo total del lote en COP" },
        precioUnitario: { type: "number", description: "Costo por unidad de rendimiento" },
        ProcessTime: { type: "string", description: "Tiempo estimado de preparación" },
        emplatado: { type: "string", description: "Instrucciones de empaque, almacenamiento o presentación" },
        autor: { type: "string", description: "Autor de la receta" },
        revisor: { type: "string", description: "Revisor de la receta" },
        procesos: {
          type: "array",
          items: { type: "string" },
          description: "Lista secuencial de pasos de preparación (hasta 20 pasos)",
        },
        notas: {
          type: "array",
          items: { type: "string" },
          description: "Notas técnicas, tips o observaciones (hasta 10 notas)",
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
          description: "Insumos de ItemsAlmacen (hasta 30)",
        },
        productos_internos: {
          type: "array",
          items: {
            type: "object",
            required: ["item_id", "cantidad", "unidades"],
            properties: {
              item_id: { type: "string", description: "UUID del producto en ProduccionInterna" },
              cantidad: { type: "number" },
              unidades: { type: "string" },
              nombre: { type: "string" },
            },
          },
          description: "Subrecetas / insumos de ProduccionInterna (hasta 20)",
        },
      },
    },
  },
  {
    name: "receta_produccion_actualizar",
    description: "⚠️ Actualiza una receta existente en RecetasProduccion (ingredientes, productos internos, procesos, notas, rendimiento o costos). Guarda snapshot.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID de la receta en RecetasProduccion" },
        nombre: { type: "string" },
        rendimiento: { type: "object" },
        UNIDADES: { type: "string" },
        costo: { type: "number" },
        precioUnitario: { type: "number" },
        ProcessTime: { type: "string" },
        emplatado: { type: "string" },
        autor: { type: "string" },
        revisor: { type: "string" },
        procesos: { type: "array", items: { type: "string" } },
        notas: { type: "array", items: { type: "string" } },
        ingredientes: {
          type: "array",
          items: {
            type: "object",
            required: ["item_id", "cantidad", "unidades"],
            properties: {
              item_id: { type: "string" },
              cantidad: { type: "number" },
              unidades: { type: "string" },
              nombre: { type: "string" },
            },
          },
        },
        productos_internos: {
          type: "array",
          items: {
            type: "object",
            required: ["item_id", "cantidad", "unidades"],
            properties: {
              item_id: { type: "string" },
              cantidad: { type: "number" },
              unidades: { type: "string" },
              nombre: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "receta_produccion_eliminar",
    description: "⚠️ Elimina una receta de producción interna (RecetasProduccion). Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: {
        id: { type: "string", description: "UUID de la receta en RecetasProduccion" },
        confirmar: { type: "boolean" },
      },
    },
  },
  {
    name: "planta_layout_obtener",
    description: "Obtiene las dimensiones y distribución actual de la Planta de Producción (planta_layout).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "planta_layout_actualizar",
    description: "Actualiza las dimensiones o el layout JSON de la Planta de Producción (planta_layout).",
    inputSchema: {
      type: "object",
      required: ["campos"],
      properties: {
        campos: { type: "object", description: "Campos a actualizar (ancho_m, largo_m, area_m2, equipos, etc.)" },
      },
    },
  },

  // ── PROVEEDORES, COTIZACIONES Y PRECIOS ─────
  {
    name: "proveedores_listar",
    description: "Lista todos los proveedores registrados (tabla Proveedores).",
    inputSchema: {
      type: "object",
      properties: { busqueda: { type: "string" } },
    },
  },
  {
    name: "proveedor_crear",
    description: "Crea un nuevo proveedor en la tabla Proveedores.",
    inputSchema: {
      type: "object",
      required: ["nombre"],
      properties: {
        nombre: { type: "string", description: "Nombre o razón social del proveedor" },
        contacto: { type: "string" },
        telefono: { type: "string" },
        email: { type: "string" },
        categoria: { type: "string" },
        nit: { type: "string" },
        extra: { type: "object", description: "Campos adicionales de la tabla Proveedores" },
      },
    },
  },
  {
    name: "proveedor_actualizar",
    description: "Actualiza datos de un proveedor en Proveedores por su _id.",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: {
        id: { type: "string" },
        campos: { type: "object" },
      },
    },
  },
  {
    name: "proveedor_eliminar",
    description: "🚨 Elimina un proveedor por su _id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: { id: { type: "string" }, confirmar: { type: "boolean" } },
    },
  },
  {
    name: "precios_historicos_consultar",
    description: "Consulta el historial de precios de productos e insumos (tabla PreciosHistoricosProducto).",
    inputSchema: {
      type: "object",
      properties: { busqueda: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "capturas_proveedor_listar",
    description: "Lista cotizaciones y capturas de precios de proveedores (tabla CapturasProveedor).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
  },

  // ── FINANZAS, VENTAS/COMPRAS CRUD, BOLSILLOS & MODEL ──
  {
    name: "venta_actualizar",
    description: "Actualiza una venta existente en Ventas por su _id (pago, método, total, productos).",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: { id: { type: "string" }, campos: { type: "object" } },
    },
  },
  {
    name: "venta_eliminar",
    description: "🚨 Elimina una venta por su _id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: { id: { type: "string" }, confirmar: { type: "boolean" } },
    },
  },
  {
    name: "compra_actualizar",
    description: "Actualiza una compra existente en Compras por su _id.",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: { id: { type: "string" }, campos: { type: "object" } },
    },
  },
  {
    name: "compra_eliminar",
    description: "🚨 Elimina una compra por su _id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: { id: { type: "string" }, confirmar: { type: "boolean" } },
    },
  },
  {
    name: "resumen_financiero_periodo",
    description: "Calcula el resumen financiero (DiaResumen / MesResumen) entre fechaInicio y fechaFin: ingresos, compras/gastos, utilidad neta, ticket promedio, métodos de pago y top productos.",
    inputSchema: {
      type: "object",
      properties: {
        fechaInicio: { type: "string", description: "YYYY-MM-DD (default: hoy)" },
        fechaFin: { type: "string", description: "YYYY-MM-DD (default: fechaInicio)" },
      },
    },
  },
  {
    name: "bolsillos_financieros_consultar",
    description: "Calcula el estado consolidado de Bolsillos Financieros (ventas, compras, consumo staff, bajas y flujo neto).",
    inputSchema: {
      type: "object",
      properties: {
        fechaInicio: { type: "string", description: "YYYY-MM-DD opcional" },
        fechaFin: { type: "string", description: "YYYY-MM-DD opcional" },
      },
    },
  },
  {
    name: "modelo_financiero_consultar",
    description: "Consulta los registros del modelo financiero y proyecciones del proyecto (tabla Model).",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "modelo_financiero_actualizar",
    description: "Actualiza un registro existente del modelo financiero (tabla Model) por su _id o id.",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: {
        id: { type: "string" },
        idField: { type: "string", description: "Nombre de la columna ID (_id o id, default _id)" },
        campos: { type: "object" },
      },
    },
  },

  // ── RAPPI Y CANALES DIGITALES ───────────────
  {
    name: "rappi_config_obtener",
    description: "Obtiene la configuración del canal Rappi almacenada en USER_PREFERENCES.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "rappi_config_actualizar",
    description: "Actualiza la configuración del canal Rappi (comisión, sobrecosto, activo, etc.) en USER_PREFERENCES.",
    inputSchema: {
      type: "object",
      required: ["config"],
      properties: { config: { type: "object" } },
    },
  },
  {
    name: "rappi_pedidos_listar",
    description: "Lista las ventas/pedidos registrados por el canal Rappi.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
  },

  // ── STAFF COMPLETO: CRUD, NÓMINA, PROPINAS, CONSUMO, BAJAS ──
  {
    name: "staff_crear",
    description: "Crea un nuevo colaborador en la tabla Staff.",
    inputSchema: {
      type: "object",
      required: ["nombre", "apellido", "cc", "cargo"],
      properties: {
        nombre: { type: "string" },
        apellido: { type: "string" },
        cc: { type: "string", description: "Cédula del colaborador" },
        cargo: { type: "string" },
        rate: { type: "number", description: "Tarifa por hora en COP" },
        celular: { type: "string" },
        show: { type: "boolean", description: "Visible en listas activas (default true)" },
        contratacion: { type: "string", description: "Fecha o tipo de contratación" },
      },
    },
  },
  {
    name: "staff_actualizar",
    description: "Actualiza los datos de un colaborador en Staff (cargo, rate, celular, show, etc.).",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: {
        id: { type: "string", description: "UUID (_id) del colaborador" },
        campos: { type: "object" },
      },
    },
  },
  {
    name: "nomina_calcular",
    description: "Calcula la nómina (CalculoNomina) de todo el personal o un colaborador específico en un rango de fechas: horas trabajadas × Rate.",
    inputSchema: {
      type: "object",
      required: ["fechaInicio", "fechaFin"],
      properties: {
        fechaInicio: { type: "string", description: "YYYY-MM-DD" },
        fechaFin: { type: "string", description: "YYYY-MM-DD" },
        staffId: { type: "string", description: "UUID (_id) opcional para calcular solo un colaborador" },
      },
    },
  },
  {
    name: "propinas_listar",
    description: "Lista los registros de la tabla Propinas.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "propinas_registrar",
    description: "Registra una nueva entrada de propinas en la tabla Propinas.",
    inputSchema: {
      type: "object",
      required: ["campos"],
      properties: { campos: { type: "object" } },
    },
  },
  {
    name: "bajas_listar",
    description: "Lista los registros de Bajas de personal y Mermas de inventario (tabla Bajas).",
    inputSchema: {
      type: "object",
      properties: {
        tipo_baja: { type: "string", description: "Filtrar por tipo (Personal, Incapacidad, Inventario, etc.)" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "baja_registrar",
    description: "Registra una nueva baja de personal o merma de inventario en la tabla Bajas.",
    inputSchema: {
      type: "object",
      required: ["tipo_baja", "motivo"],
      properties: {
        tipo_baja: { type: "string" },
        motivo: { type: "string" },
        fecha_baja: { type: "string", description: "YYYY-MM-DD (default hoy)" },
        estado: { type: "string" },
        monto_liquidacion: { type: "number" },
        paz_y_salvo: { type: "boolean" },
        entrega_dotacion: { type: "boolean" },
        observaciones: { type: "string" },
        registrado_por: { type: "string" },
        extra: { type: "object", description: "Campos adicionales de la tabla Bajas" },
      },
    },
  },
  {
    name: "baja_actualizar",
    description: "Actualiza un registro de la tabla Bajas por su id.",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: { id: { type: "string" }, campos: { type: "object" } },
    },
  },
  {
    name: "baja_eliminar",
    description: "🚨 Elimina un registro de Bajas por su id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: { id: { type: "string" }, confirmar: { type: "boolean" } },
    },
  },

  // ── ALIADOS COMERCIALES ─────────────────────
  {
    name: "aliados_listar",
    description: "Lista todos los aliados comerciales registrados en la tabla Aliados.",
    inputSchema: { type: "object", properties: { busqueda: { type: "string" } } },
  },
  {
    name: "aliado_crear",
    description: "Crea un nuevo aliado comercial en la tabla Aliados.",
    inputSchema: {
      type: "object",
      required: ["campos"],
      properties: { campos: { type: "object", description: "Datos del aliado (nombre, instagram, contacto, etc.)" } },
    },
  },
  {
    name: "aliado_actualizar",
    description: "Actualiza un aliado comercial en Aliados por su id.",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: { id: { type: "string" }, campos: { type: "object" } },
    },
  },
  {
    name: "aliado_eliminar",
    description: "🚨 Elimina un aliado comercial por su id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: { id: { type: "string" }, confirmar: { type: "boolean" } },
    },
  },

  // ── EVENTOS: ASISTENTES Y RESERVAS ──────────
  {
    name: "evento_asistentes_listar",
    description: "Lista los asistentes inscritos a eventos (tabla attendees), filtrando opcionalmente por evento_id.",
    inputSchema: {
      type: "object",
      properties: { evento_id: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "evento_inscribir_asistente",
    description: "Inscribe un asistente a un evento en la tabla attendees.",
    inputSchema: {
      type: "object",
      required: ["evento_id", "nombre"],
      properties: {
        evento_id: { type: "string" },
        nombre: { type: "string" },
        email: { type: "string" },
        telefono: { type: "string" },
        extra: { type: "object" },
      },
    },
  },
  {
    name: "evento_reservas_listar",
    description: "Lista las reservas de eventos registradas (tabla event_reservations).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
  },

  // ── RADIO PROYECTO CAFÉ & CONTROL DE PANTALLA ──
  {
    name: "radio_estado_obtener",
    description: "Obtiene el estado en vivo de Radio Proyecto Café (tabla radio_current_play).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "radio_controlar",
    description: "Controla Radio Proyecto Café en vivo (station_name, canción actual, estado) o envía FORCE_RELOAD en station_name para recargar la página web en todos los navegadores abiertos.",
    inputSchema: {
      type: "object",
      required: ["campos"],
      properties: {
        campos: {
          type: "object",
          description: "Campos a actualizar en radio_current_play (id=1). Ej: { station_name: 'FORCE_RELOAD' }",
        },
      },
    },
  },
  {
    name: "radio_playlist_listar",
    description: "Lista las canciones de la radio (tabla playlist_radio o playlist_youtube).",
    inputSchema: {
      type: "object",
      properties: {
        fuente: { type: "string", enum: ["playlist_radio", "playlist_youtube"], description: "Default: playlist_radio" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "radio_playlist_agregar",
    description: "Agrega una canción/video a playlist_radio o playlist_youtube.",
    inputSchema: {
      type: "object",
      required: ["campos"],
      properties: {
        fuente: { type: "string", enum: ["playlist_radio", "playlist_youtube"], description: "Default: playlist_radio" },
        campos: { type: "object" },
      },
    },
  },
  {
    name: "radio_playlist_eliminar",
    description: "🚨 Elimina una canción de playlist_radio o playlist_youtube por su id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: {
        fuente: { type: "string", enum: ["playlist_radio", "playlist_youtube"] },
        id: { type: "string" },
        confirmar: { type: "boolean" },
      },
    },
  },

  // ── USUARIOS, MENSAJES, INFO, IMPRESIÓN Y FLYERS ──
  {
    name: "usuarios_listar",
    description: "Lista los usuarios y preferencias registradas en USER_PREFERENCES.",
    inputSchema: {
      type: "object",
      properties: { busqueda: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "usuario_mensaje_enviar",
    description: "Envía un mensaje o notificación a un usuario en la tabla UserMessages.",
    inputSchema: {
      type: "object",
      required: ["userId", "title", "content"],
      properties: {
        userId: { type: "string", description: "UUID (_id) del usuario en USER_PREFERENCES" },
        title: { type: "string" },
        content: { type: "string" },
        type: { type: "string", description: "Tipo de mensaje (info, alerta, bienvenida, promo)" },
      },
    },
  },
  {
    name: "proyecto_info_obtener",
    description: "Obtiene la información institucional de Proyecto Café (tabla Proyect_Info).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "proyecto_info_actualizar",
    description: "Actualiza un registro de la tabla Proyect_Info.",
    inputSchema: {
      type: "object",
      required: ["id", "campos"],
      properties: {
        id: { type: "string" },
        idField: { type: "string", description: "Default _id" },
        campos: { type: "object" },
      },
    },
  },
  {
    name: "menu_print_config_obtener",
    description: "Obtiene las configuraciones de impresión de cartas del menú (tabla menu_print_config).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "flyers_listar",
    description: "Lista los flyers diseñados en la tabla flyers.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },

  // ── RECETAS ELIMINAR + MAPA DE PÁGINA + CONSULTA UNIVERSAL ──
  {
    name: "receta_eliminar",
    description: "🚨 Elimina una receta/escandallo de la tabla Recetas por su _id. Requiere confirmar: true.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: { id: { type: "string" }, confirmar: { type: "boolean" } },
    },
  },
  {
    name: "paginas_y_rutas_listar",
    description: "Devuelve el mapa completo de todas las páginas, rutas URL y módulos de App.jsx en Proyecto Café.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tabla_supabase_consultar",
    description: "Consulta de solo lectura sobre cualquiera de las 40 tablas de Proyecto Café (con filtro opcional y límite).",
    inputSchema: {
      type: "object",
      required: ["tabla"],
      properties: {
        tabla: { type: "string", description: "Nombre exacto de la tabla (ej: Menu, Ventas, Comanda, Staff, etc.)" },
        columnaFiltro: { type: "string", description: "Columna opcional para filtrar con ilike" },
        valorFiltro: { type: "string", description: "Valor parcial para ilike" },
        ordenarPor: { type: "string", description: "Columna para ordenar" },
        ascendente: { type: "boolean", description: "Default false" },
        limit: { type: "number", description: "Máximo de filas (default 50, máx 500)" },
      },
    },
  },
];

// ─────────────────────────────────────────────
// EXTENDED HANDLERS FACTORY
// ─────────────────────────────────────────────

export function createExtendedHandlers(supabase) {
  return {
    // ── COMANDAS ──────────────────────────────
    comandas_listar: async ({ estado, mesa, limit = 100 } = {}) => {
      const filters = [];
      if (estado) filters.push({ op: "ilike", col: "Estado", val: estado });
      if (mesa) filters.push({ op: "ilike", col: "Mesa", val: mesa });
      return listTable(supabase, "Comanda", { limit, filters });
    },
    comanda_crear: async ({ mesa, productos, estado = "Pendiente", notas = "", total = 0, tipo = "Mesa" } = {}) => {
      if (!mesa) throw new Error("Se requiere 'mesa'.");
      return insertRow(supabase, "Comanda", {
        Mesa: mesa,
        Productos: typeof productos === "string" ? productos : JSON.stringify(productos || []),
        Estado: estado,
        Notas: notas,
        Total: total,
        Tipo: tipo,
        Date: new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }),
      });
    },
    comanda_actualizar: async ({ id, estado, mesa, productos, notas, total } = {}) => {
      const fields = {};
      if (estado !== undefined) fields.Estado = estado;
      if (mesa !== undefined) fields.Mesa = mesa;
      if (productos !== undefined) fields.Productos = typeof productos === "string" ? productos : JSON.stringify(productos);
      if (notas !== undefined) fields.Notas = notas;
      if (total !== undefined) fields.Total = total;
      return updateRow(supabase, "Comanda", "_id", id, fields);
    },
    comanda_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "Comanda", "_id", id, confirmar, "comanda"),

    // ── NOTAS ─────────────────────────────────
    notas_listar: async ({ busqueda, limit = 100 } = {}) => {
      const rows = await listTable(supabase, "Notas", { limit });
      if (!busqueda) return rows;
      const q = busqueda.toLowerCase();
      return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    },
    nota_crear: async ({ titulo, contenido = "", tipo = "general", estado = "pendiente", fecha, extra = {} } = {}) => {
      if (!titulo) throw new Error("Se requiere 'titulo'.");
      return insertRow(supabase, "Notas", {
        titulo,
        contenido,
        tipo,
        estado,
        fecha: fecha || getBogotaDateISO(),
        ...extra,
      });
    },
    nota_actualizar: async ({ id, campos } = {}) => updateRow(supabase, "Notas", "_id", id, campos),
    nota_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "Notas", "_id", id, confirmar, "nota"),

    // ── PRODUCCIÓN, PROCEDIMIENTOS Y PLANTA ───
    procedimientos_listar: async ({ busqueda, limit = 100 } = {}) => {
      const rows = await listTable(supabase, "Procedimientos", { limit });
      if (!busqueda) return rows;
      const q = busqueda.toLowerCase();
      return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    },
    procedimiento_crear: async ({ campos } = {}) => insertRow(supabase, "Procedimientos", campos),
    procedimiento_actualizar: async ({ id, campos } = {}) => updateRow(supabase, "Procedimientos", "_id", id, campos),
    produccion_interna_listar: async ({ busqueda, limit = 100 } = {}) => {
      const rows = await listTable(supabase, "ProduccionInterna", { limit });
      if (!busqueda) return rows;
      const q = busqueda.toLowerCase();
      return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    },
    produccion_interna_registrar: async ({ campos } = {}) => insertRow(supabase, "ProduccionInterna", campos),
    produccion_interna_actualizar: async ({ id, campos } = {}) =>
      updateRow(supabase, "ProduccionInterna", "_id", id, campos),

    recetas_produccion_listar: async ({ nombre, for_id, limit = 100 } = {}) => {
      const filters = [];
      if (nombre) filters.push({ op: "ilike", col: "legacyName", val: nombre });
      if (for_id) filters.push({ op: "eq", col: "forId", val: for_id });
      return listTable(supabase, "RecetasProduccion", {
        limit: Math.min(Number(limit) || 100, 500),
        orderBy: "legacyName",
        ascending: true,
        filters,
      });
    },

    receta_produccion_obtener: async ({ id, for_id } = {}) => {
      let q = supabase().from("RecetasProduccion").select("*");
      if (id) q = q.eq("_id", id);
      else if (for_id) q = q.eq("forId", for_id);
      else throw new Error("Se requiere id o for_id para consultar la receta de producción");
      const { data, error } = await q.single();
      if (error) throw new Error(`Receta de producción no encontrada: ${error.message}`);
      return data;
    },

    receta_produccion_crear: async (args = {}) => {
      if (!args.nombre || !args.forId) {
        throw new Error("Campos obligatorios: nombre (legacyName) y forId (UUID en ProduccionInterna)");
      }
      const payload = {
        _id: randomUUID(),
        legacyName: args.nombre,
        forId: args.forId,
        costo: args.costo !== undefined ? String(args.costo) : "0",
        precioUnitario: args.precioUnitario !== undefined ? String(args.precioUnitario) : null,
        UNIDADES: args.UNIDADES || (args.rendimiento && typeof args.rendimiento === "object" ? args.rendimiento.unidades || "" : ""),
        ProcessTime: args.ProcessTime !== undefined ? String(args.ProcessTime) : null,
        emplatado: args.emplatado || null,
        autor: args.autor || "Equipo Proyecto Café",
        revisor: args.revisor || "Pendiente",
        actualizacion: getBogotaDateISO(),
        rendimiento: args.rendimiento
          ? (typeof args.rendimiento === "string" ? args.rendimiento : JSON.stringify(args.rendimiento))
          : JSON.stringify({ porcion: "", cantidad: "", unidades: "" }),
      };

      if (Array.isArray(args.procesos)) {
        args.procesos.slice(0, 20).forEach((p, idx) => {
          payload[`proces${idx + 1}`] = p;
        });
      }
      if (Array.isArray(args.notas)) {
        args.notas.slice(0, 10).forEach((n, idx) => {
          payload[`nota${idx + 1}`] = n;
        });
      }
      if (Array.isArray(args.ingredientes)) {
        args.ingredientes.slice(0, 30).forEach((ing, idx) => {
          payload[`item${idx + 1}_Id`] = ing.item_id;
          payload[`item${idx + 1}_Cuantity_Units`] = JSON.stringify({
            metric: { cuantity: ing.cantidad, units: ing.unidades },
            ...(ing.nombre ? { legacyName: ing.nombre } : {}),
          });
        });
      }
      if (Array.isArray(args.productos_internos)) {
        args.productos_internos.slice(0, 20).forEach((pi, idx) => {
          payload[`producto_interno${idx + 1}_Id`] = pi.item_id;
          payload[`producto_interno${idx + 1}_Cuantity_Units`] = JSON.stringify({
            metric: { cuantity: pi.cantidad, units: pi.unidades },
            ...(pi.nombre ? { legacyName: pi.nombre } : {}),
          });
        });
      }

      const { data, error } = await supabase()
        .from("RecetasProduccion")
        .insert([payload])
        .select()
        .single();
      if (error) throw new Error(`Error al crear receta de producción: ${error.message}`);

      // Enlazar automáticamente en ProduccionInterna.Receta
      const { error: linkErr } = await supabase()
        .from("ProduccionInterna")
        .update({ Receta: data._id })
        .eq("_id", args.forId);

      return {
        mensaje: "Receta de producción creada exitosamente",
        vinculada_en_produccion_interna: !linkErr,
        ...(linkErr ? { advertencia_vinculo: linkErr.message } : {}),
        receta: data,
      };
    },

    receta_produccion_actualizar: async ({ id, ...campos } = {}) => {
      if (!id) throw new Error("Se requiere el ID de la receta en RecetasProduccion");
      const { data: existing, error: fetchErr } = await supabase()
        .from("RecetasProduccion")
        .select("*")
        .eq("_id", id)
        .single();
      if (fetchErr || !existing) throw new Error(`No se encontró la receta de producción con ID: ${id}`);

      const payload = { actualizacion: getBogotaDateISO() };
      if (campos.nombre !== undefined) payload.legacyName = campos.nombre;
      if (campos.costo !== undefined) payload.costo = String(campos.costo);
      if (campos.precioUnitario !== undefined) payload.precioUnitario = String(campos.precioUnitario);
      if (campos.UNIDADES !== undefined) payload.UNIDADES = campos.UNIDADES;
      if (campos.ProcessTime !== undefined) payload.ProcessTime = String(campos.ProcessTime);
      if (campos.emplatado !== undefined) payload.emplatado = campos.emplatado;
      if (campos.autor !== undefined) payload.autor = campos.autor;
      if (campos.revisor !== undefined) payload.revisor = campos.revisor;
      if (campos.rendimiento !== undefined) {
        payload.rendimiento = typeof campos.rendimiento === "string"
          ? campos.rendimiento
          : JSON.stringify(campos.rendimiento);
      }

      if (Array.isArray(campos.procesos)) {
        for (let i = 1; i <= 20; i++) payload[`proces${i}`] = null;
        campos.procesos.slice(0, 20).forEach((p, idx) => {
          payload[`proces${idx + 1}`] = p;
        });
      }
      if (Array.isArray(campos.notas)) {
        for (let i = 1; i <= 10; i++) payload[`nota${i}`] = null;
        campos.notas.slice(0, 10).forEach((n, idx) => {
          payload[`nota${idx + 1}`] = n;
        });
      }
      if (Array.isArray(campos.ingredientes)) {
        for (let i = 1; i <= 30; i++) {
          payload[`item${i}_Id`] = null;
          payload[`item${i}_Cuantity_Units`] = null;
        }
        campos.ingredientes.slice(0, 30).forEach((ing, idx) => {
          payload[`item${idx + 1}_Id`] = ing.item_id;
          payload[`item${idx + 1}_Cuantity_Units`] = JSON.stringify({
            metric: { cuantity: ing.cantidad, units: ing.unidades },
            ...(ing.nombre ? { legacyName: ing.nombre } : {}),
          });
        });
      }
      if (Array.isArray(campos.productos_internos)) {
        for (let i = 1; i <= 20; i++) {
          payload[`producto_interno${i}_Id`] = null;
          payload[`producto_interno${i}_Cuantity_Units`] = null;
        }
        campos.productos_internos.slice(0, 20).forEach((pi, idx) => {
          payload[`producto_interno${idx + 1}_Id`] = pi.item_id;
          payload[`producto_interno${idx + 1}_Cuantity_Units`] = JSON.stringify({
            metric: { cuantity: pi.cantidad, units: pi.unidades },
            ...(pi.nombre ? { legacyName: pi.nombre } : {}),
          });
        });
      }

      const { data: updated, error: updateErr } = await supabase()
        .from("RecetasProduccion")
        .update(payload)
        .eq("_id", id)
        .select()
        .single();
      if (updateErr) throw new Error(`Error al actualizar receta de producción: ${updateErr.message}`);
      return {
        mensaje: `Receta de producción "${updated.legacyName}" actualizada exitosamente`,
        receta_actualizada: updated,
        snapshot_previo: existing,
      };
    },

    receta_produccion_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "RecetasProduccion", "_id", id, confirmar, "receta de producción"),
    planta_layout_obtener: async () => {
      const { data, error } = await supabase()
        .from("planta_layout")
        .select("*")
        .eq("id", "planta_principal")
        .single();
      if (error) throw new Error(`Error leyendo planta_layout: ${error.message}`);
      return data;
    },
    planta_layout_actualizar: async ({ campos } = {}) =>
      updateRow(supabase, "planta_layout", "id", "planta_principal", campos),

    // ── PROVEEDORES, COTIZACIONES Y PRECIOS ───
    proveedores_listar: async ({ busqueda } = {}) => {
      const rows = await listTable(supabase, "Proveedores", { limit: 300 });
      if (!busqueda) return rows;
      const q = busqueda.toLowerCase();
      return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    },
    proveedor_crear: async ({ nombre, contacto = "", telefono = "", email = "", categoria = "", nit = "", extra = {} } = {}) => {
      if (!nombre) throw new Error("Se requiere 'nombre'.");
      return insertRow(supabase, "Proveedores", {
        Nombre_Proveedor: nombre,
        Contacto: contacto,
        Telefono: telefono,
        Email: email,
        Categoria: categoria,
        NIT: nit,
        ...extra,
      });
    },
    proveedor_actualizar: async ({ id, campos } = {}) => updateRow(supabase, "Proveedores", "_id", id, campos),
    proveedor_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "Proveedores", "_id", id, confirmar, "proveedor"),
    precios_historicos_consultar: async ({ busqueda, limit = 150 } = {}) => {
      const rows = await listTable(supabase, "PreciosHistoricosProducto", { limit });
      if (!busqueda) return rows;
      const q = busqueda.toLowerCase();
      return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    },
    capturas_proveedor_listar: async ({ limit = 100 } = {}) =>
      listTable(supabase, "CapturasProveedor", { limit }),

    // ── FINANZAS AVANZADAS ────────────────────
    venta_actualizar: async ({ id, campos } = {}) => updateRow(supabase, "Ventas", "_id", id, campos),
    venta_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "Ventas", "_id", id, confirmar, "venta"),
    compra_actualizar: async ({ id, campos } = {}) => updateRow(supabase, "Compras", "_id", id, campos),
    compra_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "Compras", "_id", id, confirmar, "compra"),

    resumen_financiero_periodo: async ({ fechaInicio, fechaFin } = {}) => {
      const inicio = fechaInicio || getBogotaDateISO();
      const fin = fechaFin || inicio;

      const [ventas, compras] = await Promise.all([
        listTable(supabase, "Ventas", { limit: 2000 }),
        listTable(supabase, "Compras", { limit: 2000 }),
      ]);

      const inRange = (d) => {
        if (!d) return false;
        const iso = String(d).split("T")[0];
        return iso >= inicio && iso <= fin;
      };

      const vFiltradas = ventas.filter((v) => inRange(v.Date));
      const cFiltradas = compras.filter((c) => inRange(c.Date));

      let totalIngresos = 0;
      const porMetodoPago = {};
      const topProductos = {};

      for (const v of vFiltradas) {
        const val = parseFloat(v.Total_Ingreso) || 0;
        totalIngresos += val;
        const metodo = v.MetodoPago || v.Medio || "No especificado";
        porMetodoPago[metodo] = (porMetodoPago[metodo] || 0) + val;

        const prods = safeJsonParse(v.Productos, []);
        if (Array.isArray(prods)) {
          for (const p of prods) {
            const name = p.NombreES || p.nombre || p.name || "Producto";
            const qty = parseFloat(p.quantity || p.cantidad || 1) || 1;
            topProductos[name] = (topProductos[name] || 0) + qty;
          }
        }
      }

      const totalCompras = cFiltradas.reduce((acc, c) => acc + (parseFloat(c.Valor) || 0), 0);
      const topOrdenado = Object.entries(topProductos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([producto, cantidad]) => ({ producto, cantidad }));

      return {
        periodo: { fechaInicio: inicio, fechaFin: fin },
        cantidadVentas: vFiltradas.length,
        totalIngresos,
        ticketPromedio: vFiltradas.length > 0 ? Math.round(totalIngresos / vFiltradas.length) : 0,
        cantidadCompras: cFiltradas.length,
        totalComprasYGastos: totalCompras,
        utilidadNeta: totalIngresos - totalCompras,
        porMetodoPago,
        topProductos: topOrdenado,
      };
    },

    bolsillos_financieros_consultar: async ({ fechaInicio, fechaFin } = {}) => {
      const [ventas, compras, bajas] = await Promise.all([
        listTable(supabase, "Ventas", { limit: 2000 }),
        listTable(supabase, "Compras", { limit: 2000 }),
        listTable(supabase, "Bajas", { limit: 500 }).catch(() => []),
      ]);

      const inRange = (d) => {
        if (!fechaInicio && !fechaFin) return true;
        if (!d) return false;
        const iso = String(d).split("T")[0];
        if (fechaInicio && iso < fechaInicio) return false;
        if (fechaFin && iso > fechaFin) return false;
        return true;
      };

      const vList = ventas.filter((v) => inRange(v.Date));
      const cList = compras.filter((c) => inRange(c.Date));
      const bList = bajas.filter((b) => inRange(b.fecha_baja));

      const totalVentas = vList.reduce((s, v) => s + (parseFloat(v.Total_Ingreso) || 0), 0);
      const totalCompras = cList.reduce((s, c) => s + (parseFloat(c.Valor) || 0), 0);
      const totalLiquidacionesBajas = bList.reduce((s, b) => s + (parseFloat(b.monto_liquidacion) || 0), 0);

      return {
        filtro: { fechaInicio: fechaInicio || "historico", fechaFin: fechaFin || "historico" },
        totalVentas,
        totalCompras,
        totalLiquidacionesBajas,
        flujoNeto: totalVentas - totalCompras - totalLiquidacionesBajas,
        conteos: { ventas: vList.length, compras: cList.length, bajas: bList.length },
      };
    },

    modelo_financiero_consultar: async ({ limit = 100 } = {}) =>
      listTable(supabase, "Model", { limit }),
    modelo_financiero_actualizar: async ({ id, idField = "_id", campos } = {}) =>
      updateRow(supabase, "Model", idField, id, campos),

    // ── RAPPI ─────────────────────────────────
    rappi_config_obtener: async () => {
      const { data, error } = await supabase()
        .from("USER_PREFERENCES")
        .select("*")
        .eq("user_id", "rappi_config")
        .single();
      if (error && error.code !== "PGRST116") throw new Error(`Error Rappi config: ${error.message}`);
      return data || { mensaje: "Sin configuración personalizada de Rappi aún." };
    },
    rappi_config_actualizar: async ({ config } = {}) => {
      const { data, error } = await supabase()
        .from("USER_PREFERENCES")
        .upsert({ user_id: "rappi_config", preferences: config, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw new Error(`Error actualizando Rappi config: ${error.message}`);
      return data;
    },
    rappi_pedidos_listar: async ({ limit = 100 } = {}) => {
      const ventas = await listTable(supabase, "Ventas", { limit: 500 });
      return ventas
        .filter((v) => JSON.stringify(v).toLowerCase().includes("rappi"))
        .slice(0, limit);
    },

    // ── STAFF COMPLETO, NÓMINA, PROPINAS, BAJAS ──
    staff_crear: async ({ nombre, apellido, cc, cargo, rate = 0, celular = "", show = true, contratacion = "" } = {}) => {
      if (!nombre || !apellido || !cc || !cargo) {
        throw new Error("Se requieren 'nombre', 'apellido', 'cc' y 'cargo'.");
      }
      return insertRow(supabase, "Staff", {
        Nombre: nombre,
        Apellido: apellido,
        CC: String(cc),
        Cargo: cargo,
        Rate: Number(rate) || 0,
        Celular: celular,
        Show: show,
        Contratacion: contratacion || getBogotaDateISO(),
        Turnos: "[]",
        TurnosSet: "{}",
        Propinas: "[]",
      });
    },
    staff_actualizar: async ({ id, campos } = {}) => updateRow(supabase, "Staff", "_id", id, campos),

    nomina_calcular: async ({ fechaInicio, fechaFin, staffId } = {}) => {
      if (!fechaInicio || !fechaFin) throw new Error("Se requieren 'fechaInicio' y 'fechaFin' (YYYY-MM-DD).");
      let staff = await listTable(supabase, "Staff", { limit: 200 });
      if (staffId) staff = staff.filter((s) => String(s._id) === String(staffId));

      const calcHours = (ini, fin) => {
        if (!ini || !fin || fin === "false" || fin === "PENDING") return 0;
        const [h1, m1] = String(ini).split(":").map(Number);
        const [h2, m2] = String(fin).split(":").map(Number);
        if ([h1, m1, h2, m2].some(isNaN)) return 0;
        const dur = h2 - h1 + (m2 - m1) / 60;
        return dur > 0 ? dur : 0;
      };

      const detalle = staff.map((emp) => {
        const turnos = safeJsonParse(emp.Turnos, []);
        const enRango = Array.isArray(turnos)
          ? turnos.filter((t) => {
              const f = String(t?.fecha || t?.turnoDate || t?.date || "").split("T")[0];
              return f >= fechaInicio && f <= fechaFin;
            })
          : [];
        const totalHoras = enRango.reduce(
          (sum, t) => sum + calcHours(t.horaInicio || t.horaEntrada, t.horaCierre || t.horaSalida || t.horaFin),
          0
        );
        const rate = parseFloat(emp.Rate) || 0;
        return {
          _id: emp._id,
          nombre: `${emp.Nombre || ""} ${emp.Apellido || ""}`.trim(),
          cc: emp.CC,
          cargo: emp.Cargo,
          rate,
          turnosEnRango: enRango.length,
          totalHoras: parseFloat(totalHoras.toFixed(2)),
          totalBruto: Math.round(totalHoras * rate),
        };
      });

      const granTotal = detalle.reduce((s, d) => s + d.totalBruto, 0);
      return { periodo: { fechaInicio, fechaFin }, granTotal, colaboradores: detalle };
    },

    propinas_listar: async ({ limit = 100 } = {}) => listTable(supabase, "Propinas", { limit }),
    propinas_registrar: async ({ campos } = {}) => insertRow(supabase, "Propinas", campos, null),

    bajas_listar: async ({ tipo_baja, limit = 100 } = {}) => {
      const filters = tipo_baja ? [{ op: "ilike", col: "tipo_baja", val: tipo_baja }] : [];
      return listTable(supabase, "Bajas", { limit, orderBy: "fecha_baja", ascending: false, filters });
    },
    baja_registrar: async ({
      tipo_baja,
      motivo,
      fecha_baja,
      estado = "Pendiente",
      monto_liquidacion = 0,
      paz_y_salvo = false,
      entrega_dotacion = false,
      observaciones = "",
      registrado_por = "MCP",
      extra = {},
    } = {}) => {
      if (!tipo_baja || !motivo) throw new Error("Se requieren 'tipo_baja' y 'motivo'.");
      return insertRow(
        supabase,
        "Bajas",
        {
          tipo_baja,
          motivo,
          fecha_baja: fecha_baja || getBogotaDateISO(),
          estado,
          monto_liquidacion: parseFloat(monto_liquidacion) || 0,
          paz_y_salvo,
          entrega_dotacion,
          observaciones,
          registrado_por,
          ...extra,
        },
        null
      );
    },
    baja_actualizar: async ({ id, campos } = {}) => updateRow(supabase, "Bajas", "id", id, campos),
    baja_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "Bajas", "id", id, confirmar, "baja"),

    // ── ALIADOS COMERCIALES ───────────────────
    aliados_listar: async ({ busqueda } = {}) => {
      const rows = await listTable(supabase, "Aliados", { limit: 200 });
      if (!busqueda) return rows;
      const q = busqueda.toLowerCase();
      return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    },
    aliado_crear: async ({ campos } = {}) => insertRow(supabase, "Aliados", campos, null),
    aliado_actualizar: async ({ id, campos } = {}) => updateRow(supabase, "Aliados", "id", id, campos),
    aliado_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "Aliados", "id", id, confirmar, "aliado"),

    // ── EVENTOS: ASISTENTES Y RESERVAS ────────
    evento_asistentes_listar: async ({ evento_id, limit = 200 } = {}) => {
      const filters = evento_id ? [{ op: "eq", col: "evento_id", val: evento_id }] : [];
      return listTable(supabase, "attendees", { limit, filters });
    },
    evento_inscribir_asistente: async ({ evento_id, nombre, email = "", telefono = "", extra = {} } = {}) => {
      if (!evento_id || !nombre) throw new Error("Se requieren 'evento_id' y 'nombre'.");
      return insertRow(supabase, "attendees", { evento_id, nombre, email, telefono, ...extra }, null);
    },
    evento_reservas_listar: async ({ limit = 100 } = {}) =>
      listTable(supabase, "event_reservations", { limit }),

    // ── RADIO PROYECTO CAFÉ & RELOAD REMOTO ───
    radio_estado_obtener: async () => {
      const { data, error } = await supabase().from("radio_current_play").select("*").eq("id", 1).single();
      if (error) throw new Error(`Error leyendo radio_current_play: ${error.message}`);
      return data;
    },
    radio_controlar: async ({ campos } = {}) => updateRow(supabase, "radio_current_play", "id", 1, campos),
    radio_playlist_listar: async ({ fuente = "playlist_radio", limit = 150 } = {}) => {
      const tabla = fuente === "playlist_youtube" ? "playlist_youtube" : "playlist_radio";
      return listTable(supabase, tabla, { limit });
    },
    radio_playlist_agregar: async ({ fuente = "playlist_radio", campos } = {}) => {
      const tabla = fuente === "playlist_youtube" ? "playlist_youtube" : "playlist_radio";
      return insertRow(supabase, tabla, campos, null);
    },
    radio_playlist_eliminar: async ({ fuente = "playlist_radio", id, confirmar } = {}) => {
      const tabla = fuente === "playlist_youtube" ? "playlist_youtube" : "playlist_radio";
      return deleteRow(supabase, tabla, "id", id, confirmar, `canción de ${tabla}`);
    },

    // ── USUARIOS, MENSAJES, INFO, IMPRESIÓN Y FLYERS ──
    usuarios_listar: async ({ busqueda, limit = 150 } = {}) => {
      const rows = await listTable(supabase, "USER_PREFERENCES", { limit });
      if (!busqueda) return rows;
      const q = busqueda.toLowerCase();
      return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    },
    usuario_mensaje_enviar: async ({ userId, title, content, type = "info" } = {}) => {
      if (!userId || !title || !content) throw new Error("Se requieren 'userId', 'title' y 'content'.");
      return insertRow(
        supabase,
        "UserMessages",
        { userId, title, content, type, created_at: new Date().toISOString() },
        null
      );
    },
    proyecto_info_obtener: async () => listTable(supabase, "Proyect_Info", { limit: 50 }),
    proyecto_info_actualizar: async ({ id, idField = "_id", campos } = {}) =>
      updateRow(supabase, "Proyect_Info", idField, id, campos),
    menu_print_config_obtener: async () => listTable(supabase, "menu_print_config", { limit: 50 }),
    flyers_listar: async ({ limit = 50 } = {}) => listTable(supabase, "flyers", { limit }),

    // ── RECETAS ELIMINAR + MAPA DE PÁGINA + CONSULTA UNIVERSAL ──
    receta_eliminar: async ({ id, confirmar } = {}) =>
      deleteRow(supabase, "Recetas", "_id", id, confirmar, "receta"),

    paginas_y_rutas_listar: async () => ({
      totalRutas: 55,
      modulos: {
        cafeMenuYClientes: ["/", "/MenuView", "/MenuLunch", "/LunchByOrder", "/AnalisisAlmuerzo", "/UserPortal", "/SobreNosotros", "/review_ProyectoCafe"],
        disenoEImpresion: ["/MenuPrint", "/MenuPrint/:menuId", "/MenuHead", "/FlyerCreator", "/RecruitmentPrint"],
        operacionesYComandas: ["/Comanda", "/ComandaCreator", "/comanda/:id", "/Actividades", "/BuscarPreciosInternet", "/Scraper"],
        inventarioYAlmacen: ["/Inventario/:tab?", "/GestionAlmacen/:tab?", "/Inventario/BarcodeManager", "/Manager/:tab?", "/Bajas", "/item/:id"],
        recetasYProduccion: ["/Recetas", "/receta/:id", "/Planta", "/CalendarioProduccion", "/CalculadorRecetaHelados", "/Predict/:MenuItem", "/ProcedimientoModal/:id"],
        ventasComprasYFinanzas: ["/VentaCompra", "/Compras", "/Gastos", "/DiaResumen/:date?", "/MesResumen", "/AccionesRapidas", "/bolsillos-financieros", "/gastos-calculados", "/productosFinanciero", "/Rappi/:tab?", "/Model", "/ModeloProyecto/:year?/:month?"],
        agendaYEventos: ["/Agenda/:year?/:month?", "/AgendaIdeas", "/EventosOffer", "/evento/:id/:tab?", "/inscripcion/:id"],
        proveedoresYCotizaciones: ["/Proveedores", "/PagosProveedores", "/Cotizaciones"],
        equipoYStaff: ["/StaffCreator", "/CalculoNomina", "/staff-manager", "/staff-details/:cc", "/staff-manager/:cc/editar-turnos", "/TipsManager", "/consumo", "/consumoAdmin", "/user-manager"],
        aliadosComerciales: ["/Aliados", "/AliadosExcel", "/RegistroAliado", "/PortalAliado"],
        radioProyectoCafe: ["/Radio", "/RadioManager"],
      },
    }),

    tabla_supabase_consultar: async ({ tabla, columnaFiltro, valorFiltro, ordenarPor, ascendente = false, limit = 50 } = {}) => {
      if (!ALLOWED_TABLES.has(tabla)) {
        throw new Error(`Tabla no permitida: "${tabla}". Tablas válidas: ${Array.from(ALLOWED_TABLES).join(", ")}`);
      }
      const filters = columnaFiltro && valorFiltro ? [{ op: "ilike", col: columnaFiltro, val: valorFiltro }] : [];
      return listTable(supabase, tabla, {
        limit: Math.min(Number(limit) || 50, 500),
        orderBy: ordenarPor,
        ascending: !!ascendente,
        filters,
      });
    },
  };
}
