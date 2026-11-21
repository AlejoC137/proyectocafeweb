import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const outDir = path.join(rootDir, 'public', 'downloads');
const outPath = path.join(outDir, 'instalar-proyectocafe-mcp.bat');

function toWrappedBase64(bufOrStr) {
  const buf = Buffer.isBuffer(bufOrStr) ? bufOrStr : Buffer.from(bufOrStr, 'utf8');
  const b64 = buf.toString('base64');
  const lines = [];
  for (let i = 0; i < b64.length; i += 76) {
    lines.push(b64.slice(i, i + 76));
  }
  return lines.join('\r\n');
}

const minimalPkg = JSON.stringify(
  {
    name: 'proyectocafe-mcp',
    version: '3.0.0',
    private: true,
    type: 'module',
    dependencies: {
      '@supabase/supabase-js': '^2.49.4',
    },
  },
  null,
  2
);

const installerScript = `
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { spawn, spawnSync } from 'node:child_process';

const batPath = process.argv[2];
const isAuto = process.argv.includes('--auto');

function extractBlock(batContent, name) {
  const start = ':: ===BEGIN_' + name + '===';
  const end = ':: ===END_' + name + '===';
  const i = batContent.indexOf(start);
  const j = batContent.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error('Bloque no encontrado en el .bat: ' + name);
  return Buffer.from(batContent.slice(i + start.length, j).replace(/\\s+/g, ''), 'base64');
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function registerMcpConfig(cfgPath, serverKey, serverPath, label) {
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  let obj = {};
  if (fs.existsSync(cfgPath)) {
    const raw = fs.readFileSync(cfgPath, 'utf8').replace(/^\\uFEFF/, '').trim();
    if (raw) {
      try {
        obj = JSON.parse(raw);
      } catch {
        fs.copyFileSync(cfgPath, cfgPath + '.bak');
        obj = {};
      }
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) obj = {};
  if (!obj.mcpServers || typeof obj.mcpServers !== 'object' || Array.isArray(obj.mcpServers)) {
    obj.mcpServers = {};
  }
  const normalizedPath = serverPath.replace(/\\\\/g, '/');
  obj.mcpServers[serverKey] = {
    command: 'node',
    args: [normalizedPath],
  };
  fs.writeFileSync(cfgPath, JSON.stringify(obj, null, 2) + '\\n', 'utf8');
  console.log('[OK] ' + label + ' configurado en: ' + cfgPath);
}

function testMcpServer(serverPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Timeout esperando respuesta del servidor MCP. ' + stderr));
    }, 10000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
      const lines = stdout.split(/\\r?\\n/).filter(Boolean);
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          if (msg.id === 2 && msg.result && Array.isArray(msg.result.tools)) {
            clearTimeout(timer);
            child.kill();
            resolve(msg.result.tools.length);
            return;
          }
        } catch {}
      }
    });

    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
    child.on('error', (err) => { clearTimeout(timer); reject(err); });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code && code !== 0) reject(new Error('El servidor salio con codigo ' + code + ': ' + stderr));
    });

    const initReq = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'installer-test', version: '1.0' } },
    });
    const listReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    child.stdin.write(initReq + '\\n' + listReq + '\\n');
  });
}

async function main() {
  console.log('====================================================================');
  console.log('   PROYECTO CAFE - INSTALADOR AUTOMATICO DE SERVIDOR MCP');
  console.log('   Compatible con: Antigravity, Claude Desktop y Claude Code');
  console.log('====================================================================\\n');
  console.log('[OK] Node.js detectado: ' + process.version);

  let choice = '1';
  if (!isAuto) {
    console.log('\\nSelecciona en que asistentes de IA deseas instalar el MCP de Proyecto Cafe:');
    console.log('  [1] Todas (Antigravity + Claude Desktop + Claude Code) [Recomendado]');
    console.log('  [2] Solo Antigravity');
    console.log('  [3] Solo Claude Desktop');
    console.log('  [4] Solo Claude Code (CLI)');
    console.log('  [5] Solo instalar archivos locales sin modificar configuraciones\\n');
    const ans = await ask('Elige una opcion (1-5) [Enter = 1]: ');
    if (ans) choice = ans;
  } else {
    console.log('[AUTO] Modo automatico activado -> Instalando en Antigravity + Claude...');
  }

  const home = os.homedir();
  const installDir = path.join(home, '.proyectocafe-mcp');
  const apiDir = path.join(installDir, 'api');
  const scriptsDir = path.join(installDir, 'scripts');
  const serverPath = path.join(scriptsDir, 'mcp-stdio.mjs');

  console.log('\\n[1/4] Extrayendo archivos en "' + installDir + '"...');
  const batContent = fs.readFileSync(batPath, 'utf8');
  fs.mkdirSync(apiDir, { recursive: true });
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(path.join(installDir, 'package.json'), extractBlock(batContent, 'PACKAGE_JSON'));
  fs.writeFileSync(path.join(installDir, '.env'), extractBlock(batContent, 'DOT_ENV'));
  fs.writeFileSync(path.join(apiDir, 'mcp.js'), extractBlock(batContent, 'API_MCP_JS'));
  fs.writeFileSync(path.join(apiDir, '_mcpExtendedTools.js'), extractBlock(batContent, 'API_EXT_JS'));
  fs.writeFileSync(serverPath, extractBlock(batContent, 'MCP_STDIO_MJS'));
  console.log('[OK] Archivos extraidos correctamente.');

  console.log('\\n[2/4] Instalando dependencia (@supabase/supabase-js)...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const npmRes = spawnSync(npmCmd, ['install', '--omit=dev', '--no-audit', '--no-fund'], {
    cwd: installDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (npmRes.status !== 0) {
    throw new Error('npm install fallo con codigo ' + npmRes.status);
  }

  console.log('\\n[3/4] Probando arranque real del servidor MCP (handshake JSON-RPC)...');
  const toolsCount = await testMcpServer(serverPath);
  console.log('[OK] Servidor MCP verificado: responde correctamente con ' + toolsCount + ' herramientas.');

  console.log('\\n[4/4] Registrando "proyectocafe" sin afectar tus otros MCPs...');
  if (choice === '1' || choice === '2') {
    const agyCfg = path.join(home, '.gemini', 'config', 'mcp_config.json');
    registerMcpConfig(agyCfg, 'proyectocafe', serverPath, 'Antigravity (MCP)');
  }
  if (choice === '1' || choice === '3') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const claudeDesktopCfg = path.join(appData, 'Claude', 'claude_desktop_config.json');
    registerMcpConfig(claudeDesktopCfg, 'proyectocafe', serverPath, 'Claude Desktop');
  }
  if (choice === '1' || choice === '4') {
    const claudeCodeCfg = path.join(home, '.claude.json');
    registerMcpConfig(claudeCodeCfg, 'proyectocafe', serverPath, 'Claude Code (CLI)');
  }
  if (choice === '5') {
    console.log('[OK] Servidor instalado en ' + serverPath + ' (sin modificar clientes IA).');
  }

  console.log('\\n====================================================================');
  console.log('  INSTALACION COMPLETADA CON EXITO');
  console.log('====================================================================');
  console.log('  Servidor MCP: ' + serverPath);
  console.log('  Nombre MCP:   proyectocafe (' + toolsCount + ' herramientas)');
  console.log('');
  console.log('  SIGUIENTE PASO:');
  console.log('  1. Reinicia Antigravity y/o Claude Desktop.');
  console.log('  2. Abre Additional Options (...) -> MCP Servers y veras "proyectocafe".');
  console.log('====================================================================\\n');
}

main().catch((err) => {
  console.error('\\n[ERROR] ' + (err && err.message ? err.message : String(err)));
  process.exit(1);
});
`;

const envPath = path.join(rootDir, '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath) : Buffer.from('', 'utf8');

const batLines = [
  '@echo off',
  'setlocal',
  'chcp 65001 >nul',
  'title Instalador MCP - Proyecto Cafe (Antigravity y Claude)',
  'where node >nul 2>&1',
  'if errorlevel 1 (',
  '  echo [ERROR] No se encontro Node.js instalado en este equipo.',
  '  echo         Descarga Node.js LTS desde https://nodejs.org y vuelve a ejecutar este .bat.',
  '  pause',
  '  exit /b 1',
  ')',
  'set "BAT_FILE=%~f0"',
  'set "TMP_JS=%TEMP%\\proyectocafe-mcp-installer.mjs"',
  'node -e "const fs=require(\'fs\');const b=fs.readFileSync(process.env.BAT_FILE,\'utf8\');const s=\':: ===BEGIN_\'+\'INSTALL_MJS===\';const e=\':: ===END_\'+\'INSTALL_MJS===\';const i=b.indexOf(s);const j=b.indexOf(e,i);if(i<0||j<0){console.error(\'Bloque INSTALL_MJS no encontrado\');process.exit(1);}fs.writeFileSync(process.env.TMP_JS,Buffer.from(b.slice(i+s.length,j).replace(/\\s+/g,\'\'),\'base64\'));"',
  'if errorlevel 1 (',
  '  echo [ERROR] No se pudo extraer el script instalador.',
  '  pause',
  '  exit /b 1',
  ')',
  'node "%TMP_JS%" "%~f0" %*',
  'set "EXIT_CODE=%ERRORLEVEL%"',
  'del /q "%TMP_JS%" >nul 2>&1',
  'if not "%~1"=="--auto" pause',
  'exit /b %EXIT_CODE%',
  '',
  ':: ===BEGIN_INSTALL_MJS===',
  toWrappedBase64(installerScript),
  ':: ===END_INSTALL_MJS===',
  '',
  ':: ===BEGIN_PACKAGE_JSON===',
  toWrappedBase64(minimalPkg),
  ':: ===END_PACKAGE_JSON===',
  '',
  ':: ===BEGIN_DOT_ENV===',
  toWrappedBase64(envContent),
  ':: ===END_DOT_ENV===',
  '',
  ':: ===BEGIN_API_MCP_JS===',
  toWrappedBase64(fs.readFileSync(path.join(rootDir, 'api', 'mcp.js'))),
  ':: ===END_API_MCP_JS===',
  '',
  ':: ===BEGIN_API_EXT_JS===',
  toWrappedBase64(fs.readFileSync(path.join(rootDir, 'api', '_mcpExtendedTools.js'))),
  ':: ===END_API_EXT_JS===',
  '',
  ':: ===BEGIN_MCP_STDIO_MJS===',
  toWrappedBase64(fs.readFileSync(path.join(rootDir, 'scripts', 'mcp-stdio.mjs'))),
  ':: ===END_MCP_STDIO_MJS===',
  '',
];

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, batLines.join('\r\n'), 'utf8');
const stats = fs.statSync(outPath);
console.log(`[build-mcp-installer] Generado ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
