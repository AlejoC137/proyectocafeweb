/**
 * Instalador automático del servidor MCP de Proyecto Café para:
 * - Antigravity (%USERPROFILE%\.gemini\antigravity\mcp.json)
 * - Claude Desktop (%APPDATA%\Claude\claude_desktop_config.json)
 * - Claude Code (%USERPROFILE%\.claude.json, si existe)
 */

import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const STDIO_SCRIPT = path.join(ROOT_DIR, "scripts", "mcp-stdio.mjs");
const SERVER_KEY = "proyectocafe";

function upsertMcpConfig(filePath, serverEntry) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let config = {};
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").trim();
    if (raw) {
      config = JSON.parse(raw);
    }
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  config.mcpServers[SERVER_KEY] = serverEntry;
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n", "utf8");
}

async function smokeTestStdio() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [STDIO_SCRIPT], {
      cwd: ROOT_DIR,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Timeout esperando respuesta del servidor MCP stdio."));
    }, 10000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      const lines = stdout.split(/\r?\n/).filter(Boolean);
      if (lines.length >= 2) {
        clearTimeout(timer);
        child.kill();
        try {
          const initRes = JSON.parse(lines[0]);
          const listRes = JSON.parse(lines[1]);
          resolve({
            serverInfo: initRes?.result?.serverInfo,
            toolCount: listRes?.result?.tools?.length || 0,
          });
        } catch (err) {
          reject(err);
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("exit", (code) => {
      if (code && code !== 0 && !stdout.includes("tools")) {
        clearTimeout(timer);
        reject(new Error(`Proceso MCP terminó con código ${code}: ${stderr}`));
      }
    });

    const reqInit = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
    const reqList = JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    child.stdin.write(reqInit + "\n" + reqList + "\n");
  });
}

async function main() {
  console.log("====================================================");
  console.log("  INSTALADOR MCP - PROYECTO CAFE (Claude & Antigravity)");
  console.log("====================================================\n");

  if (!fs.existsSync(STDIO_SCRIPT)) {
    throw new Error(`No se encontró el script stdio: ${STDIO_SCRIPT}`);
  }

  const home = os.homedir();
  const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");

  // 1. Antigravity
  const antigravityPath = path.join(home, ".gemini", "antigravity", "mcp.json");
  upsertMcpConfig(antigravityPath, {
    type: "stdio",
    command: "node",
    args: [STDIO_SCRIPT],
    timeout: 90000,
  });
  console.log(`[OK] Antigravity configurado: ${antigravityPath}`);

  // 2. Claude Desktop
  const claudeDesktopPath = path.join(appData, "Claude", "claude_desktop_config.json");
  upsertMcpConfig(claudeDesktopPath, {
    command: "node",
    args: [STDIO_SCRIPT],
  });
  console.log(`[OK] Claude Desktop configurado: ${claudeDesktopPath}`);

  // 3. Claude Code (~/.claude.json) si existe
  const claudeCodePath = path.join(home, ".claude.json");
  if (fs.existsSync(claudeCodePath)) {
    upsertMcpConfig(claudeCodePath, {
      type: "stdio",
      command: "node",
      args: [STDIO_SCRIPT],
    });
    console.log(`[OK] Claude Code configurado: ${claudeCodePath}`);
  }

  // 4. Smoke test
  console.log("\nVerificando servidor MCP (initialize + tools/list)...");
  const result = await smokeTestStdio();
  console.log(
    `[OK] Servidor activo: ${result.serverInfo?.name} v${result.serverInfo?.version} (${result.toolCount} herramientas disponibles)\n`
  );
  console.log("Reinicia Claude Desktop y/o Antigravity para cargar las herramientas.");
}

main().catch((err) => {
  console.error("\n[ERROR]", err.message);
  process.exit(1);
});
