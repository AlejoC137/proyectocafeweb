/**
 * MCP Server endpoint for Gemini integration
 * Implements Model Context Protocol (MCP) over HTTP
 * https://spec.modelcontextprotocol.io/
 *
 * CRUD completo de Agenda + lectura de Menú, Recetas, Ventas, Inventario, Compras
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
  version: "1.1.0",
};

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
        categoria: { type: "string", description: "Filtrar por categoría (opcional)" },
      },
    },
  },
  {
    name: "get_recetas",
    description: "Obtiene las recetas del café con ingredientes y procedimientos.",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Buscar por nombre (opcional)" },
      },
    },
  },
  {
    name: "get_ventas",
    description: "Obtiene el historial de ventas con totales y detalles de comandas.",
    inputSchema: {
      type: "object",
      properties: {
        fecha_inicio: { type: "string", description: "YYYY-MM-DD (opcional)" },
        fecha_fin: { type: "string", description: "YYYY-MM-DD (opcional)" },
        limite: { type: "number", description: "Máx registros (default 50)" },
      },
    },
  },
  {
    name: "get_inventario",
    description: "Consulta el inventario del almacén con cantidades y unidades.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: { type: "string", description: "Filtrar por categoría (opcional)" },
      },
    },
  },
  {
    name: "get_compras",
    description: "Historial de compras a proveedores.",
    inputSchema: {
      type: "object",
      properties: {
        proveedor: { type: "string", description: "Filtrar por proveedor (opcional)" },
        limite: { type: "number", description: "Máx registros (default 50)" },
      },
    },
  },

  // ── AGENDA — CRUD COMPLETO ─────────────────
  {
    name: "agenda_listar",
    description:
      "Lista los eventos de la agenda del café. Puede filtrarse por rango de fechas o búsqueda de nombre/cliente.",
    inputSchema: {
      type: "object",
      properties: {
        fecha_inicio: { type: "string", description: "Fecha inicio YYYY-MM-DD (opcional)" },
        fecha_fin: { type: "string", description: "Fecha fin YYYY-MM-DD (opcional)" },
        busqueda: {
          type: "string",
          description: "Texto libre para buscar por nombre de evento o cliente (opcional)",
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
      "Crea un nuevo evento en la agenda del café. Requiere nombre, fecha, horaInicio y horaFinal.",
    inputSchema: {
      type: "object",
      required: ["nombre", "fecha", "horaInicio", "horaFinal"],
      properties: {
        nombre: { type: "string", description: "Nombre del evento" },
        fecha: { type: "string", description: "Fecha del evento YYYY-MM-DD" },
        horaInicio: { type: "string", description: "Hora de inicio HH:MM:SS o HH:MM" },
        horaFinal: { type: "string", description: "Hora de finalización HH:MM:SS o HH:MM" },
        nombreCliente: { type: "string", description: "Nombre del cliente / organizador" },
        emailCliente: { type: "string", description: "Email del cliente" },
        telefonoCliente: { type: "string", description: "Teléfono del cliente" },
        numeroPersonas: { type: "number", description: "Número de personas esperadas" },
        valor: { type: "string", description: "Valor / precio del evento (ej: '$200,000')" },
        autores: { type: "string", description: "Artistas o autores del evento" },
        infoAdicional: { type: "string", description: "Información adicional u observaciones" },
        bannerIMG: { type: "string", description: "URL de la imagen banner del evento" },
        linkInscripcion: { type: "string", description: "URL de inscripción o Eventbrite" },
        servicios: {
          type: "object",
          description:
            "Servicios requeridos. Objeto con llaves: alimentos, mesas, audioVisual, otros. Cada uno tiene { activo: boolean, descripcion: string }",
        },
        aliado_id: { type: "string", description: "UUID del aliado vinculado (opcional)" },
        instagramsAliados: {
          type: "array",
          description: "Lista de Instagram handles de aliados (opcional)",
        },
      },
    },
  },
  {
    name: "agenda_actualizar",
    description:
      "Actualiza un evento existente en la agenda. Solo se actualizan los campos que se envíen.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del evento a actualizar (_id)" },
        nombre: { type: "string" },
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
      required: ["id"],
      properties: {
        id: { type: "string", description: "UUID del evento a eliminar (_id)" },
        confirmar: {
          type: "boolean",
          description: "Debe ser true para confirmar la eliminación",
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
  let q = supabase().from("Menu").select("*").order("nombre");
  if (categoria) q = q.ilike("categoria", `%${categoria}%`);
  const { data, error } = await q;
  if (error) throw new Error(`Error menú: ${error.message}`);
  return data;
}

async function getRecetas({ nombre } = {}) {
  let q = supabase().from("Recetas").select("*").order("nombre");
  if (nombre) q = q.ilike("nombre", `%${nombre}%`);
  const { data, error } = await q;
  if (error) throw new Error(`Error recetas: ${error.message}`);
  return data;
}

async function getVentas({ fecha_inicio, fecha_fin, limite = 50 } = {}) {
  let q = supabase()
    .from("Ventas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (fecha_inicio) q = q.gte("created_at", fecha_inicio);
  if (fecha_fin) q = q.lte("created_at", `${fecha_fin}T23:59:59`);
  const { data, error } = await q;
  if (error) throw new Error(`Error ventas: ${error.message}`);
  return data;
}

async function getInventario({ categoria } = {}) {
  let q = supabase().from("ItemsAlmacen").select("*").order("nombre");
  if (categoria) q = q.ilike("categoria", `%${categoria}%`);
  const { data, error } = await q;
  if (error) throw new Error(`Error inventario: ${error.message}`);
  return data;
}

async function getCompras({ proveedor, limite = 50 } = {}) {
  let q = supabase()
    .from("Compras")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (proveedor) q = q.ilike("proveedor", `%${proveedor}%`);
  const { data, error } = await q;
  if (error) throw new Error(`Error compras: ${error.message}`);
  return data;
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
    q = q.or(`nombre.ilike.%${busqueda}%,nombreCliente.ilike.%${busqueda}%,autores.ilike.%${busqueda}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(`Error al listar agenda: ${error.message}`);
  return { total: data.length, eventos: data };
}

async function agendaObtener({ id } = {}) {
  if (!id) throw new Error("Se requiere el ID del evento");
  const { data, error } = await supabase()
    .from("Agenda")
    .select("*")
    .eq("_id", id)
    .single();
  if (error) throw new Error(`Evento no encontrado: ${error.message}`);
  return data;
}

async function agendaCrear(args) {
  const {
    nombre, fecha, horaInicio, horaFinal,
    nombreCliente, emailCliente, telefonoCliente,
    numeroPersonas, valor, autores, infoAdicional,
    bannerIMG, linkInscripcion, servicios,
    aliado_id, instagramsAliados,
  } = args;

  if (!nombre || !fecha || !horaInicio || !horaFinal) {
    throw new Error("Campos obligatorios: nombre, fecha, horaInicio, horaFinal");
  }

  const payload = {
    nombre, fecha, horaInicio, horaFinal,
    ...(nombreCliente !== undefined && { nombreCliente }),
    ...(emailCliente !== undefined && { emailCliente }),
    ...(telefonoCliente !== undefined && { telefonoCliente }),
    ...(numeroPersonas !== undefined && { numeroPersonas }),
    ...(valor !== undefined && { valor }),
    ...(autores !== undefined && { autores }),
    ...(infoAdicional !== undefined && { infoAdicional }),
    ...(bannerIMG !== undefined && { bannerIMG }),
    ...(linkInscripcion !== undefined && { linkInscripcion }),
    ...(servicios !== undefined && { servicios }),
    ...(aliado_id !== undefined && { aliado_id }),
    ...(instagramsAliados !== undefined && { instagramsAliados }),
  };

  const { data, error } = await supabase()
    .from("Agenda")
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`Error al crear evento: ${error.message}`);
  return { mensaje: "Evento creado exitosamente", evento: data };
}

async function agendaActualizar({ id, ...campos }) {
  if (!id) throw new Error("Se requiere el ID del evento");

  // Eliminar campos undefined y el id del payload
  const payload = Object.fromEntries(
    Object.entries(campos).filter(([, v]) => v !== undefined)
  );

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
  return { mensaje: "Evento actualizado exitosamente", evento: data };
}

async function agendaEliminar({ id, confirmar } = {}) {
  if (!id) throw new Error("Se requiere el ID del evento");
  if (!confirmar) {
    throw new Error(
      "Para eliminar debes enviar confirmar: true. Esta acción es irreversible."
    );
  }

  // Verificar que existe antes de eliminar
  const { data: existing, error: fetchErr } = await supabase()
    .from("Agenda")
    .select("nombre, fecha")
    .eq("_id", id)
    .single();

  if (fetchErr || !existing) {
    throw new Error(`No se encontró el evento con ID: ${id}`);
  }

  const { error } = await supabase().from("Agenda").delete().eq("_id", id);
  if (error) throw new Error(`Error al eliminar evento: ${error.message}`);

  return {
    mensaje: `Evento "${existing.nombre}" del ${existing.fecha} eliminado exitosamente`,
    id_eliminado: id,
  };
}

async function agendaBuscarDisponibilidad({ fecha, horaInicio, horaFinal, excluir_id } = {}) {
  if (!fecha) throw new Error("Se requiere la fecha");

  let q = supabase()
    .from("Agenda")
    .select("_id, nombre, horaInicio, horaFinal, nombreCliente")
    .eq("fecha", fecha);

  if (excluir_id) q = q.neq("_id", excluir_id);

  const { data: eventosDelDia, error } = await q.order("horaInicio");
  if (error) throw new Error(`Error al verificar disponibilidad: ${error.message}`);

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
