/**
 * MCP Server endpoint for Gemini integration
 * Implements Model Context Protocol (MCP) over HTTP
 * https://spec.modelcontextprotocol.io/
 *
 * CRUD completo de Agenda + lectura de Menú, Recetas, Ventas, Inventario, Compras
 * Adaptado a los nombres reales de las columnas en Supabase:
 * - Agenda: nombreES, nombreEN, fecha, horaInicio, horaFinal, servicios, etc.
 * - Menu: NombreES, NombreEN, Precio, TipoES, GRUPO, SUB_GRUPO, etc.
 * - ItemsAlmacen: Nombre_del_producto, Area, CANTIDAD, UNIDADES, GRUPO, etc.
 * - Recetas: legacyName, rendimiento, costo, etc.
 * - Ventas: Date, Time, Total_Ingreso, Productos, Cliente, etc.
 * - Compras: Date, Valor, Proveedor_Id, Concepto, Categoria, etc.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

function supabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// MCP Server metadata
const SERVER_INFO = {
  name: "proyectocafe-mcp",
  version: "1.2.0",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

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
// TOOL DEFINITIONS
// ─────────────────────────────────────────────
const TOOLS = [
  // ── READ-ONLY ──────────────────────────────
  {
    name: "get_menu",
    description: "Obtiene el menú del café con productos, precios y categorías.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: {
          type: "string",
          description: "Filtrar por categoría o nombre (ej: bebidas, comida, café)",
        },
      },
    },
  },
  {
    name: "get_recetas",
    description: "Obtiene las recetas del café con ingredientes y procedimientos.",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Buscar receta por nombre (opcional)" },
      },
    },
  },
  {
    name: "get_ventas",
    description: "Obtiene el historial de ventas con totales y detalles de comandas.",
    inputSchema: {
      type: "object",
      properties: {
        fecha_inicio: { type: "string", description: "Fecha inicio (opcional)" },
        fecha_fin: { type: "string", description: "Fecha fin (opcional)" },
        limite: { type: "number", description: "Máx registros (default 50)" },
      },
    },
  },
  {
    name: "get_inventario",
    description: "Consulta el inventario del almacén con cantidades, unidades y áreas.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: {
          type: "string",
          description: "Filtrar por área o grupo de inventario (opcional)",
        },
      },
    },
  },
  {
    name: "get_compras",
    description: "Historial de compras e insumos del café.",
    inputSchema: {
      type: "object",
      properties: {
        busqueda: {
          type: "string",
          description: "Filtrar por concepto o categoría (opcional)",
        },
        limite: { type: "number", description: "Máx registros (default 50)" },
      },
    },
  },

  // ── AGENDA — CRUD COMPLETO ─────────────────
  {
    name: "agenda_listar",
    description:
      "Lista los eventos de la agenda del café. Puede filtrarse por rango de fechas o búsqueda de texto libre.",
    inputSchema: {
      type: "object",
      properties: {
        fecha_inicio: { type: "string", description: "Fecha inicio YYYY-MM-DD (opcional)" },
        fecha_fin: { type: "string", description: "Fecha fin YYYY-MM-DD (opcional)" },
        busqueda: {
          type: "string",
          description: "Texto para buscar por nombre del evento, cliente o autores",
        },
        limite: { type: "number", description: "Máx registros a retornar (default 100)" },
      },
    },
  },
  {
    name: "agenda_obtener",
    description: "Obtiene los detalles completos de un evento de la agenda por su ID.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del evento (_id)" },
      },
    },
  },
  {
    name: "agenda_crear",
    description:
      "Crea un nuevo evento en la agenda del café. Requiere nombre (o nombreES), fecha, horaInicio y horaFinal.",
    inputSchema: {
      type: "object",
      required: ["fecha", "horaInicio", "horaFinal"],
      properties: {
        nombre: { type: "string", description: "Nombre del evento en español" },
        nombreES: { type: "string", description: "Nombre del evento en español (equivalente a nombre)" },
        nombreEN: { type: "string", description: "Nombre del evento en inglés (opcional)" },
        fecha: { type: "string", description: "Fecha del evento YYYY-MM-DD" },
        horaInicio: { type: "string", description: "Hora de inicio HH:MM:SS o HH:MM" },
        horaFinal: { type: "string", description: "Hora de finalización HH:MM:SS o HH:MM" },
        nombreCliente: { type: "string", description: "Nombre del cliente u organizador" },
        emailCliente: { type: "string", description: "Email del cliente" },
        telefonoCliente: { type: "string", description: "Teléfono del cliente" },
        numeroPersonas: { type: "number", description: "Número de asistentes esperados" },
        valor: { type: "string", description: "Valor / precio o 'Gratis'" },
        autores: { type: "string", description: "Artistas, ponentes o autores" },
        infoAdicional: { type: "string", description: "Información adicional u observaciones" },
        decripcion: { type: "string", description: "Descripción detallada del evento" },
        bannerIMG: { type: "string", description: "URL de la imagen del banner" },
        linkInscripcion: { type: "string", description: "URL de inscripción o boletería" },
        servicios: {
          type: "object",
          description:
            "Servicios requeridos: alimentos, mesas, audioVisual, otros (booleanos u objetos con descripción)",
        },
        aliado_id: { type: "string", description: "UUID del aliado vinculado (opcional)" },
        instagramsAliados: {
          type: "array",
          description: "Lista de @handles de Instagram de aliados",
        },
      },
    },
  },
  {
    name: "agenda_actualizar",
    description:
      "Actualiza un evento existente en la agenda. Solo se actualizan los campos enviados.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del evento a actualizar (_id)" },
        nombre: { type: "string", description: "Nombre del evento" },
        nombreES: { type: "string", description: "Nombre del evento en español" },
        nombreEN: { type: "string", description: "Nombre en inglés" },
        fecha: { type: "string", description: "YYYY-MM-DD" },
        horaInicio: { type: "string", description: "HH:MM:SS o HH:MM" },
        horaFinal: { type: "string", description: "HH:MM:SS o HH:MM" },
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
    description: "Elimina un evento de la agenda permanentemente.",
    inputSchema: {
      type: "object",
      required: ["id", "confirmar"],
      properties: {
        id: { type: "string", description: "UUID del evento a eliminar (_id)" },
        confirmar: {
          type: "boolean",
          description: "Debe ser true para confirmar la eliminación definitiva",
        },
      },
    },
  },
  {
    name: "agenda_buscar_disponibilidad",
    description:
      "Verifica si hay conflictos de horario en una fecha dada para planificar nuevos eventos.",
    inputSchema: {
      type: "object",
      required: ["fecha"],
      properties: {
        fecha: { type: "string", description: "Fecha a verificar YYYY-MM-DD" },
        horaInicio: { type: "string", description: "Hora de inicio para verificar HH:MM" },
        horaFinal: { type: "string", description: "Hora de fin para verificar HH:MM" },
        excluir_id: {
          type: "string",
          description: "UUID de evento a excluir de la verificación (para ediciones)",
        },
      },
    },
  },
];

// ─────────────────────────────────────────────
// TOOL IMPLEMENTATIONS
// ─────────────────────────────────────────────

async function getMenu({ categoria } = {}) {
  let q = supabase().from("Menu").select("*");
  if (categoria) {
    q = q.or(
      `NombreES.ilike.%${categoria}%,TipoES.ilike.%${categoria}%,GRUPO.ilike.%${categoria}%,SUB_GRUPO.ilike.%${categoria}%`
    );
  }
  const { data, error } = await q.order("NombreES", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Error menú: ${error.message}`);
  return (data || []).map((item) => ({
    nombre: item.NombreES,
    precio: item.Precio,
    categoria: item.TipoES || item.GRUPO || "",
    descripcion: item.DescripcionMenuES || "",
    ...item,
  }));
}

async function getRecetas({ nombre } = {}) {
  let q = supabase().from("Recetas").select("*");
  if (nombre) {
    q = q.ilike("legacyName", `%${nombre}%`);
  }
  const { data, error } = await q.order("legacyName", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Error recetas: ${error.message}`);
  return (data || []).map((item) => ({
    nombre: item.legacyName,
    ...item,
  }));
}

async function getVentas({ fecha_inicio, fecha_fin, limite = 50 } = {}) {
  let q = supabase().from("Ventas").select("*").limit(limite);
  if (fecha_inicio) q = q.gte("Date", fecha_inicio);
  if (fecha_fin) q = q.lte("Date", fecha_fin);
  const { data, error } = await q;
  if (error) throw new Error(`Error ventas: ${error.message}`);
  return data || [];
}

async function getInventario({ categoria } = {}) {
  let q = supabase().from("ItemsAlmacen").select("*");
  if (categoria) {
    q = q.or(`Area.ilike.%${categoria}%,GRUPO.ilike.%${categoria}%,Nombre_del_producto.ilike.%${categoria}%`);
  }
  const { data, error } = await q.order("Nombre_del_producto", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Error inventario: ${error.message}`);
  return (data || []).map((item) => ({
    nombre: item.Nombre_del_producto,
    categoria: item.Area || item.GRUPO || "",
    cantidad: item.CANTIDAD,
    unidades: item.UNIDADES,
    ...item,
  }));
}

async function getCompras({ busqueda, limite = 50 } = {}) {
  let q = supabase().from("Compras").select("*").limit(limite);
  if (busqueda) {
    q = q.or(`Concepto.ilike.%${busqueda}%,Categoria.ilike.%${busqueda}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(`Error compras: ${error.message}`);
  return data || [];
}

// ── AGENDA CRUD ───────────────────────────────

async function agendaListar({ fecha_inicio, fecha_fin, busqueda, limite = 100 } = {}) {
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
  const normalizados = (data || []).map(normalizeAgendaItem);
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

async function agendaCrear(args) {
  const nombreFinal = args.nombreES || args.nombre;
  const { fecha, horaInicio, horaFinal } = args;

  if (!nombreFinal || !fecha || !horaInicio || !horaFinal) {
    throw new Error("Campos obligatorios: nombre (o nombreES), fecha, horaInicio, horaFinal");
  }

  const payload = {
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
  if (!id) throw new Error("Se requiere el ID del evento");

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

  const { data, error } = await supabase()
    .from("Agenda")
    .update(payload)
    .eq("_id", id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar evento: ${error.message}`);
  if (!data) throw new Error(`No se encontró el evento con ID: ${id}`);
  return { mensaje: "Evento actualizado exitosamente", evento: normalizeAgendaItem(data) };
}

async function agendaEliminar({ id, confirmar } = {}) {
  if (!id) throw new Error("Se requiere el ID del evento");
  if (!confirmar) {
    throw new Error(
      "Para eliminar debes enviar confirmar: true. Esta acción es irreversible."
    );
  }

  const { data: existing, error: fetchErr } = await supabase()
    .from("Agenda")
    .select("nombreES, fecha")
    .eq("_id", id)
    .single();

  if (fetchErr || !existing) {
    throw new Error(`No se encontró el evento con ID: ${id}`);
  }

  const { error } = await supabase().from("Agenda").delete().eq("_id", id);
  if (error) throw new Error(`Error al eliminar evento: ${error.message}`);

  return {
    mensaje: `Evento "${existing.nombreES}" del ${existing.fecha} eliminado exitosamente`,
    id_eliminado: id,
  };
}

async function agendaBuscarDisponibilidad({ fecha, horaInicio, horaFinal, excluir_id } = {}) {
  if (!fecha) throw new Error("Se requiere la fecha");

  let q = supabase()
    .from("Agenda")
    .select("_id, nombreES, horaInicio, horaFinal, nombreCliente")
    .eq("fecha", fecha);

  if (excluir_id) q = q.neq("_id", excluir_id);

  const { data: rawEventos, error } = await q.order("horaInicio");
  if (error) throw new Error(`Error al verificar disponibilidad: ${error.message}`);

  const eventosDelDia = (rawEventos || []).map(normalizeAgendaItem);

  if (!horaInicio || !horaFinal) {
    return {
      fecha,
      eventos_del_dia: eventosDelDia,
      total_eventos: eventosDelDia.length,
      disponible: eventosDelDia.length === 0,
    };
  }

  // Verificar solapamiento de horario
  const conflictos = eventosDelDia.filter((ev) => {
    return horaInicio < ev.horaFinal && horaFinal > ev.horaInicio;
  });

  return {
    fecha,
    horaInicio,
    horaFinal,
    disponible: conflictos.length === 0,
    conflictos,
    otros_eventos_del_dia: eventosDelDia.filter(
      (ev) => !conflictos.find((c) => c._id === ev._id)
    ),
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
          get_menu: getMenu,
          get_recetas: getRecetas,
          get_ventas: getVentas,
          get_inventario: getInventario,
          get_compras: getCompras,
          agenda_listar: agendaListar,
          agenda_obtener: agendaObtener,
          agenda_crear: agendaCrear,
          agenda_actualizar: agendaActualizar,
          agenda_eliminar: agendaEliminar,
          agenda_buscar_disponibilidad: agendaBuscarDisponibilidad,
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
      `data: ${JSON.stringify({ type: "endpoint", endpoint: "/api/mcp" })}\n\n`
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
