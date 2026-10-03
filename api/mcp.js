/**
 * MCP Server endpoint for Gemini integration
 * Implements Model Context Protocol (MCP) over HTTP with SSE
 * https://spec.modelcontextprotocol.io/
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// MCP Server metadata
const SERVER_INFO = {
  name: "proyectocafe-mcp",
  version: "1.0.0",
};

// Available tools exposed to Gemini
const TOOLS = [
  {
    name: "get_menu",
    description:
      "Obtiene el menú del café con todos los productos, precios y categorías disponibles.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: {
          type: "string",
          description:
            "Filtrar por categoría específica (opcional). Ej: 'bebidas', 'comida', 'postres'",
        },
      },
    },
  },
  {
    name: "get_recetas",
    description:
      "Obtiene las recetas del café con ingredientes y procedimientos.",
    inputSchema: {
      type: "object",
      properties: {
        nombre: {
          type: "string",
          description: "Buscar receta por nombre (opcional)",
        },
      },
    },
  },
  {
    name: "get_ventas",
    description:
      "Obtiene el historial de ventas del café con totales y detalles de comandas.",
    inputSchema: {
      type: "object",
      properties: {
        fecha_inicio: {
          type: "string",
          description: "Fecha de inicio en formato YYYY-MM-DD (opcional)",
        },
        fecha_fin: {
          type: "string",
          description: "Fecha de fin en formato YYYY-MM-DD (opcional)",
        },
        limite: {
          type: "number",
          description:
            "Número máximo de registros a retornar (por defecto 50)",
        },
      },
    },
  },
  {
    name: "get_inventario",
    description:
      "Consulta el inventario actual del almacén del café, incluyendo cantidades y unidades.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: {
          type: "string",
          description: "Filtrar por categoría de inventario (opcional)",
        },
      },
    },
  },
  {
    name: "get_agenda",
    description:
      "Consulta la agenda de eventos del café, incluyendo eventos próximos, artistas y reservaciones.",
    inputSchema: {
      type: "object",
      properties: {
        fecha_inicio: {
          type: "string",
          description: "Fecha de inicio en formato YYYY-MM-DD (opcional)",
        },
        fecha_fin: {
          type: "string",
          description: "Fecha de fin en formato YYYY-MM-DD (opcional)",
        },
      },
    },
  },
  {
    name: "get_compras",
    description:
      "Consulta el historial de compras a proveedores del café.",
    inputSchema: {
      type: "object",
      properties: {
        proveedor: {
          type: "string",
          description: "Filtrar por nombre de proveedor (opcional)",
        },
        limite: {
          type: "number",
          description: "Número máximo de registros (por defecto 50)",
        },
      },
    },
  },
];

// ---- Tool implementations ----

async function getMenu({ categoria } = {}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let query = supabase.from("Menu").select("*").order("nombre");
  if (categoria) {
    query = query.ilike("categoria", `%${categoria}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Error al consultar menú: ${error.message}`);
  return data;
}

async function getRecetas({ nombre } = {}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let query = supabase.from("Recetas").select("*").order("nombre");
  if (nombre) {
    query = query.ilike("nombre", `%${nombre}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Error al consultar recetas: ${error.message}`);
  return data;
}

async function getVentas({ fecha_inicio, fecha_fin, limite = 50 } = {}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let query = supabase
    .from("Ventas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (fecha_inicio) {
    query = query.gte("created_at", fecha_inicio);
  }
  if (fecha_fin) {
    query = query.lte("created_at", fecha_fin + "T23:59:59");
  }
  const { data, error } = await query;
  if (error) throw new Error(`Error al consultar ventas: ${error.message}`);
  return data;
}

async function getInventario({ categoria } = {}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let query = supabase.from("ItemsAlmacen").select("*").order("nombre");
  if (categoria) {
    query = query.ilike("categoria", `%${categoria}%`);
  }
  const { data, error } = await query;
  if (error)
    throw new Error(`Error al consultar inventario: ${error.message}`);
  return data;
}

async function getAgenda({ fecha_inicio, fecha_fin } = {}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let query = supabase
    .from("Agenda")
    .select("*")
    .order("fecha", { ascending: true });
  if (fecha_inicio) {
    query = query.gte("fecha", fecha_inicio);
  }
  if (fecha_fin) {
    query = query.lte("fecha", fecha_fin);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Error al consultar agenda: ${error.message}`);
  return data;
}

async function getCompras({ proveedor, limite = 50 } = {}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let query = supabase
    .from("Compras")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (proveedor) {
    query = query.ilike("proveedor", `%${proveedor}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Error al consultar compras: ${error.message}`);
  return data;
}

// ---- MCP JSON-RPC handler ----

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
            capabilities: {
              tools: {},
            },
          },
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id,
          result: { tools: TOOLS },
        };

      case "tools/call": {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};

        let result;
        switch (toolName) {
          case "get_menu":
            result = await getMenu(toolArgs);
            break;
          case "get_recetas":
            result = await getRecetas(toolArgs);
            break;
          case "get_ventas":
            result = await getVentas(toolArgs);
            break;
          case "get_inventario":
            result = await getInventario(toolArgs);
            break;
          case "get_agenda":
            result = await getAgenda(toolArgs);
            break;
          case "get_compras":
            result = await getCompras(toolArgs);
            break;
          default:
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32601, message: `Tool not found: ${toolName}` },
            };
        }

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
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

// ---- Vercel serverless handler ----

export default async function handler(req, res) {
  // CORS headers required for Gemini to reach this endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // SSE endpoint for server-sent events (GET)
  if (req.method === "GET") {
    // Simple health check / SSE handshake
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ type: "endpoint", endpoint: "/api/mcp" })}\n\n`);
    // Keep connection open briefly then close (Vercel has 60s limit on streaming)
    setTimeout(() => res.end(), 500);
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;

  // Handle batch requests (array of JSON-RPC calls)
  if (Array.isArray(body)) {
    const responses = await Promise.all(body.map(handleMcpRequest));
    return res.status(200).json(responses);
  }

  const response = await handleMcpRequest(body);
  return res.status(200).json(response);
}
