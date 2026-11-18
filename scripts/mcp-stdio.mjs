#!/usr/bin/env node
/**
 * Bridge stdio para el servidor MCP de Proyecto Café.
 * Permite que Claude Desktop, Claude Code y Antigravity ejecuten todas las herramientas
 * de api/mcp.js localmente vía stdio usando las variables de .env.
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// Cargar .env antes de importar api/mcp.js
loadEnvFile(path.join(ROOT_DIR, ".env"));

const { handleMcpRequest } = await import("../api/mcp.js");

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch (err) {
    process.stderr.write(`[proyectocafe-mcp] JSON inválido recibido: ${err.message}\n`);
    return;
  }

  // Las notificaciones JSON-RPC (sin id, ej: notifications/initialized) no llevan respuesta
  if (msg.id === undefined || msg.id === null) {
    return;
  }

  try {
    const response = await handleMcpRequest(msg);
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (err) {
    const errRes = {
      jsonrpc: "2.0",
      id: msg.id,
      error: { code: -32603, message: err.message || "Error interno en MCP stdio" },
    };
    process.stdout.write(JSON.stringify(errRes) + "\n");
  }
});

rl.on("close", () => {
  process.exit(0);
});
