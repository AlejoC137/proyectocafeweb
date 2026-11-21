import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../components/ui/page-layout";
import {
  ArrowLeft,
  Cpu,
  Download,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Play,
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Code2,
  Wrench,
  Sparkles,
  Server,
  Globe,
  FileCode2,
  Loader2,
} from "lucide-react";

const PROD_ORIGIN = "https://proyectocafeweb.vercel.app";
const BAT_FILENAME = "instalar-proyectocafe-mcp.bat";
const BAT_PATH = `/downloads/${BAT_FILENAME}`;

function categorizeTool(name = "") {
  const n = name.toLowerCase();
  if (n.includes("menu")) return "Menú";
  if (n.includes("inventario") || n.includes("baja")) return "Inventario";
  if (n.includes("receta") || n.includes("procedimiento") || n.includes("produccion") || n.includes("planta")) return "Producción";
  if (n.includes("venta") || n.includes("compra") || n.includes("financ") || n.includes("bolsillo") || n.includes("precio")) return "Finanzas";
  if (n.includes("staff") || n.includes("nomina") || n.includes("propina") || n.includes("usuario")) return "Staff y Usuarios";
  if (n.includes("agenda") || n.includes("evento") || n.includes("flyer")) return "Agenda y Eventos";
  if (n.includes("comanda") || n.includes("nota")) return "Operación";
  if (n.includes("proveedor") || n.includes("aliado") || n.includes("rappi")) return "Proveedores / Rappi";
  if (n.includes("radio")) return "Radio";
  return "Sistema / Otros";
}

function isWriteTool(name = "") {
  return /(crear|actualizar|eliminar|registrar|ajustar|editar|agregar|controlar|inscribir|restaurar|enviar|borrar|delete|update|create)/i.test(
    name
  );
}

function buildSampleArgs(inputSchema) {
  if (!inputSchema || !inputSchema.properties) return "{}";
  const sample = {};
  const required = new Set(inputSchema.required || []);
  for (const [key, prop] of Object.entries(inputSchema.properties)) {
    if (!required.has(key) && Object.keys(inputSchema.properties).length > 5) continue;
    if (prop.default !== undefined) {
      sample[key] = prop.default;
    } else if (Array.isArray(prop.enum) && prop.enum.length > 0) {
      sample[key] = prop.enum[0];
    } else if (prop.type === "number" || prop.type === "integer") {
      sample[key] = 0;
    } else if (prop.type === "boolean") {
      sample[key] = false;
    } else if (prop.type === "array") {
      sample[key] = [];
    } else if (prop.type === "object") {
      sample[key] = {};
    } else {
      sample[key] = "";
    }
  }
  return JSON.stringify(sample, null, 2);
}

export default function McpControlPanel() {
  const navigate = useNavigate();

  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : PROD_ORIGIN;
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const [endpointMode, setEndpointMode] = useState(
    isLocalhost ? "prod" : "current"
  );
  const activeOrigin = endpointMode === "prod" ? PROD_ORIGIN : currentOrigin;
  const mcpEndpoint = `${activeOrigin}/api/mcp`;
  const wellKnownUrl = `${activeOrigin}/.well-known/oauth-authorization-server`;
  const batDownloadUrl = `${currentOrigin}${BAT_PATH}`;
  const batPublicUrl = `${PROD_ORIGIN}${BAT_PATH}`;

  // Connection & tools state
  const [status, setStatus] = useState("checking"); // checking | online | offline
  const [statusError, setStatusError] = useState("");
  const [latencyMs, setLatencyMs] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [protocolVersion, setProtocolVersion] = useState("");
  const [tools, setTools] = useState([]);

  // UI state
  const [copiedKey, setCopiedKey] = useState(null);
  const [configTab, setConfigTab] = useState("http"); // http | stdio | curl
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedTool, setSelectedTool] = useState(null);

  // Live tool tester state
  const [argsText, setArgsText] = useState("{}");
  const [runningTool, setRunningTool] = useState(false);
  const [toolResult, setToolResult] = useState(null);
  const [toolError, setToolError] = useState("");
  const [toolLatency, setToolLatency] = useState(null);

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const checkMcpHealth = useCallback(async () => {
    setStatus("checking");
    setStatusError("");
    const t0 = performance.now();
    try {
      const res = await fetch(mcpEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: { name: "proyectocafe-staff-portal", version: "1.0.0" },
            },
          },
          {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list",
            params: {},
          },
        ]),
      });

      const elapsed = Math.round(performance.now() - t0);
      setLatencyMs(elapsed);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const responses = Array.isArray(data) ? data : [data];
      const initRes = responses.find((r) => r.id === 1);
      const listRes = responses.find((r) => r.id === 2);

      if (initRes?.error) throw new Error(initRes.error.message);
      if (listRes?.error) throw new Error(listRes.error.message);

      setServerInfo(initRes?.result?.serverInfo || { name: "proyectocafe-mcp", version: "3.0.0" });
      setProtocolVersion(initRes?.result?.protocolVersion || "2024-11-05");
      const loadedTools = listRes?.result?.tools || [];
      setTools(loadedTools);
      setStatus("online");
    } catch (err) {
      setStatus("offline");
      setStatusError(err?.message || "No se pudo conectar al servidor MCP.");
      setLatencyMs(null);
    }
  }, [mcpEndpoint]);

  useEffect(() => {
    checkMcpHealth();
  }, [checkMcpHealth]);

  const categories = useMemo(() => {
    const counts = {};
    tools.forEach((t) => {
      const cat = categorizeTool(t.name);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return [
      { name: "Todas", count: tools.length },
      ...Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
    ];
  }, [tools]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tools.filter((t) => {
      const matchCat =
        selectedCategory === "Todas" || categorizeTool(t.name) === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    });
  }, [tools, searchQuery, selectedCategory]);

  const handleSelectTool = (tool) => {
    setSelectedTool(tool);
    setArgsText(buildSampleArgs(tool.inputSchema));
    setToolResult(null);
    setToolError("");
    setToolLatency(null);
  };

  const handleRunTool = async () => {
    if (!selectedTool) return;
    setRunningTool(true);
    setToolResult(null);
    setToolError("");
    setToolLatency(null);

    let parsedArgs = {};
    try {
      parsedArgs = argsText.trim() ? JSON.parse(argsText) : {};
    } catch (err) {
      setToolError(`JSON inválido en argumentos: ${err.message}`);
      setRunningTool(false);
      return;
    }

    const t0 = performance.now();
    try {
      const res = await fetch(mcpEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: {
            name: selectedTool.name,
            arguments: parsedArgs,
          },
        }),
      });

      const elapsed = Math.round(performance.now() - t0);
      setToolLatency(elapsed);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        setToolError(data.error.message || JSON.stringify(data.error));
      } else {
        const textContent = data.result?.content?.[0]?.text;
        if (textContent) {
          try {
            setToolResult(JSON.stringify(JSON.parse(textContent), null, 2));
          } catch {
            setToolResult(textContent);
          }
        } else {
          setToolResult(JSON.stringify(data.result, null, 2));
        }
      }
    } catch (err) {
      setToolError(err?.message || "Error ejecutando la herramienta.");
    } finally {
      setRunningTool(false);
    }
  };

  const configSnippets = useMemo(() => {
    const httpJson = JSON.stringify(
      {
        mcpServers: {
          proyectocafe: {
            url: `${PROD_ORIGIN}/api/mcp`,
          },
        },
      },
      null,
      2
    );

    const stdioJson = JSON.stringify(
      {
        mcpServers: {
          proyectocafe: {
            command: "node",
            args: ["C:/Users/TU_USUARIO/.proyectocafe-mcp/scripts/mcp-stdio.mjs"],
          },
        },
      },
      null,
      2
    );

    const curlCmd = `curl -X POST ${mcpEndpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`;

    return { http: httpJson, stdio: stdioJson, curl: curlCmd };
  }, [mcpEndpoint]);

  return (
    <PageLayout>
      <div className="bg-surface-main text-on-surface min-h-screen font-body-md pb-16">
        {/* Header */}
        <header className="bg-surface-main w-full z-10 flex flex-wrap justify-between items-center gap-3 px-4 md:px-margin-desktop py-3 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-full text-primary-stitch hover:bg-surface-container transition-colors active:scale-95"
              title="Volver al Portal Operativo"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary-stitch/10 text-primary-stitch flex items-center justify-center">
                <Cpu size={22} />
              </div>
              <div>
                <h1 className="text-headline-sm md:text-headline-md font-bold text-primary-stitch leading-tight">
                  Centro de Control MCP
                </h1>
                <p className="text-xs text-on-surface-variant">
                  Instalador Windows, endpoints, configuración y consola de herramientas IA
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isLocalhost && (
              <div className="flex items-center bg-surface-card border border-outline-variant rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setEndpointMode("prod")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    endpointMode === "prod"
                      ? "bg-primary-stitch text-white"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Producción
                </button>
                <button
                  onClick={() => setEndpointMode("current")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    endpointMode === "current"
                      ? "bg-primary-stitch text-white"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Local
                </button>
              </div>
            )}

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                status === "online"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                  : status === "offline"
                  ? "bg-red-500/10 text-red-700 border-red-500/30"
                  : "bg-amber-500/10 text-amber-700 border-amber-500/30"
              }`}
            >
              {status === "online" && <CheckCircle2 size={14} />}
              {status === "offline" && <XCircle size={14} />}
              {status === "checking" && <Loader2 size={14} className="animate-spin" />}
              <span>
                {status === "online"
                  ? `Online · ${tools.length} tools${latencyMs != null ? ` · ${latencyMs}ms` : ""}`
                  : status === "offline"
                  ? "Sin conexión"
                  : "Verificando..."}
              </span>
            </div>

            <button
              onClick={checkMcpHealth}
              disabled={status === "checking"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-outline-variant hover:border-primary-stitch text-xs font-semibold text-on-surface transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={status === "checking" ? "animate-spin" : ""} />
              Probar conexión
            </button>
          </div>
        </header>

        <main className="py-6 px-4 md:px-margin-desktop max-w-[1600px] mx-auto space-y-6">
          {/* Status Error Banner */}
          {status === "offline" && statusError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-800 rounded-xl p-4 flex items-start gap-3 text-sm">
              <XCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">No se pudo conectar con {mcpEndpoint}</p>
                <p className="text-xs opacity-90 mt-0.5">{statusError}</p>
              </div>
            </div>
          )}

          {/* Top Grid: Installer + Endpoints/Config */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Instalador .bat Card */}
            <section className="lg:col-span-6 bg-surface-card rounded-2xl border border-outline-variant shadow-sm p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-headline-sm text-lg font-bold text-primary-stitch flex items-center gap-2">
                    <Download size={20} />
                    Instalador Automático Windows (.bat)
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-stitch/10 text-primary-stitch">
                    v{serverInfo?.version || "3.0.0"} · Portable
                  </span>
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Descarga el archivo autocontenido para instalar y registrar el servidor{" "}
                  <code className="px-1.5 py-0.5 rounded bg-surface-main border border-outline-variant text-xs font-mono">
                    proyectocafe
                  </code>{" "}
                  automáticamente en <strong>Antigravity</strong>,{" "}
                  <strong>Claude Desktop</strong> y <strong>Claude Code</strong> sin afectar
                  tus otros MCPs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-surface-main rounded-xl p-3 border border-outline-variant/60">
                    <p className="font-bold text-on-surface mb-1">¿Qué instala?</p>
                    <ul className="space-y-1 text-on-surface-variant list-disc list-inside">
                      <li>Servidor local en <code className="font-mono">~/.proyectocafe-mcp</code></li>
                      <li>Dependencia <code className="font-mono">@supabase/supabase-js</code></li>
                      <li>Verificación real JSON-RPC al terminar</li>
                    </ul>
                  </div>
                  <div className="bg-surface-main rounded-xl p-3 border border-outline-variant/60">
                    <p className="font-bold text-on-surface mb-1">Requisitos y uso</p>
                    <ul className="space-y-1 text-on-surface-variant list-disc list-inside">
                      <li>Windows con <strong>Node.js LTS</strong> instalado</li>
                      <li>Doble clic para menú interactivo (1-5)</li>
                      <li>Usa <code className="font-mono">--auto</code> para instalar en todo</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-outline-variant/60">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={batDownloadUrl}
                    download={BAT_FILENAME}
                    className="flex-1 min-w-[210px] py-2.5 px-4 rounded-xl bg-primary-stitch text-white font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download size={18} />
                    Descargar {BAT_FILENAME}
                  </a>

                  <button
                    onClick={() => copyToClipboard(batPublicUrl, "bat-url")}
                    className="py-2.5 px-3.5 rounded-xl bg-surface-main border border-outline-variant hover:border-primary-stitch text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
                    title="Copiar enlace público de descarga"
                  >
                    {copiedKey === "bat-url" ? (
                      <>
                        <Check size={15} className="text-emerald-600" />
                        ¡Enlace copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        Copiar enlace
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant bg-surface-main px-3 py-1.5 rounded-lg border border-outline-variant/50">
                  <span className="truncate font-mono">{batPublicUrl}</span>
                  <a
                    href={batPublicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-primary-stitch hover:underline flex items-center gap-1 shrink-0"
                  >
                    Abrir <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </section>

            {/* Endpoints & Manual Config Card */}
            <section className="lg:col-span-6 bg-surface-card rounded-2xl border border-outline-variant shadow-sm p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-headline-sm text-lg font-bold text-secondary-stitch flex items-center gap-2">
                    <Server size={20} />
                    Endpoints y Configuración Manual
                  </h2>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    MCP {protocolVersion || "2024-11-05"}
                  </span>
                </div>

                {/* Endpoint URLs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 bg-surface-main px-3 py-2 rounded-xl border border-outline-variant/60">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                        Endpoint HTTP (JSON-RPC / SSE)
                      </span>
                      <code className="text-xs font-mono text-on-surface truncate block">
                        {mcpEndpoint}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(mcpEndpoint, "mcp-endpoint")}
                      className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-stitch shrink-0 transition-colors"
                      title="Copiar endpoint"
                    >
                      {copiedKey === "mcp-endpoint" ? (
                        <Check size={16} className="text-emerald-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-surface-main px-3 py-2 rounded-xl border border-outline-variant/60">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                        OAuth / Discovery (.well-known)
                      </span>
                      <code className="text-xs font-mono text-on-surface truncate block">
                        {wellKnownUrl}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(wellKnownUrl, "well-known")}
                      className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-stitch shrink-0 transition-colors"
                      title="Copiar URL discovery"
                    >
                      {copiedKey === "well-known" ? (
                        <Check size={16} className="text-emerald-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Config Snippets Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1 bg-surface-main p-1 rounded-lg border border-outline-variant/60 text-xs">
                      <button
                        onClick={() => setConfigTab("http")}
                        className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                          configTab === "http"
                            ? "bg-primary-stitch text-white"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <Globe size={13} /> HTTP Remoto
                      </button>
                      <button
                        onClick={() => setConfigTab("stdio")}
                        className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                          configTab === "stdio"
                            ? "bg-primary-stitch text-white"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <FileCode2 size={13} /> Local (stdio)
                      </button>
                      <button
                        onClick={() => setConfigTab("curl")}
                        className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                          configTab === "curl"
                            ? "bg-primary-stitch text-white"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <Terminal size={13} /> cURL
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        copyToClipboard(configSnippets[configTab], `snippet-${configTab}`)
                      }
                      className="px-2.5 py-1 rounded-lg bg-surface-main border border-outline-variant hover:border-primary-stitch text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === `snippet-${configTab}` ? (
                        <>
                          <Check size={13} className="text-emerald-600" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copiar
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="bg-zinc-950 text-emerald-300 text-[11px] font-mono p-3 rounded-xl overflow-x-auto max-h-40 leading-relaxed">
                    {configSnippets[configTab]}
                  </pre>
                </div>
              </div>
            </section>
          </div>

          {/* Tools Explorer & Live Tester */}
          <section className="bg-surface-card rounded-2xl border border-outline-variant shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-headline-sm text-lg font-bold text-primary-stitch flex items-center gap-2">
                  <Wrench size={20} />
                  Explorador y Probador de Herramientas MCP ({tools.length})
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Consulta en vivo las herramientas registradas en <code className="font-mono">/api/mcp</code> y pruébalas directamente.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar herramienta (ej: menu, staff, agenda)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-main border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-stitch"
                />
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    selectedCategory === cat.name
                      ? "bg-primary-stitch text-white border-primary-stitch"
                      : "bg-surface-main text-on-surface-variant border-outline-variant hover:border-primary-stitch"
                  }`}
                >
                  {cat.name} <span className="opacity-75">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Split View: Tool List + Live Tester */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
              {/* Tool List */}
              <div className="lg:col-span-5 space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredTools.map((tool) => {
                  const isSelected = selectedTool?.name === tool.name;
                  const writeOp = isWriteTool(tool.name);
                  return (
                    <button
                      key={tool.name}
                      onClick={() => handleSelectTool(tool)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-primary-stitch/10 border-primary-stitch shadow-sm"
                          : "bg-surface-main border-outline-variant/60 hover:border-primary-stitch/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-primary-stitch truncate">
                          {tool.name}
                        </code>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-card border border-outline-variant text-on-surface-variant">
                            {categorizeTool(tool.name)}
                          </span>
                          {writeOp && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 font-bold"
                              title="Herramienta de escritura o modificación"
                            >
                              WRITE
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
                        {tool.description || "Sin descripción"}
                      </p>
                    </button>
                  );
                })}

                {filteredTools.length === 0 && (
                  <div className="text-center py-10 text-xs text-on-surface-variant bg-surface-main rounded-xl border border-outline-variant/60">
                    {status === "checking"
                      ? "Cargando herramientas del servidor MCP..."
                      : "No se encontraron herramientas con ese filtro."}
                  </div>
                )}
              </div>

              {/* Live Tool Tester */}
              <div className="lg:col-span-7 bg-surface-main rounded-xl border border-outline-variant p-4 flex flex-col gap-3 min-h-[420px]">
                {selectedTool ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-outline-variant/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Code2 size={18} className="text-primary-stitch" />
                          <h3 className="font-mono font-bold text-sm text-on-surface">
                            {selectedTool.name}
                          </h3>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {selectedTool.description}
                        </p>
                      </div>

                      <button
                        onClick={handleRunTool}
                        disabled={runningTool}
                        className="px-4 py-2 rounded-xl bg-primary-stitch text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                      >
                        {runningTool ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        Ejecutar
                      </button>
                    </div>

                    {isWriteTool(selectedTool.name) && (
                      <div className="flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-900 px-3 py-2 rounded-lg">
                        <ShieldAlert size={16} className="shrink-0 text-amber-700" />
                        <span>
                          <strong>Atención:</strong> esta herramienta modifica o elimina datos reales en Supabase.
                        </span>
                      </div>
                    )}

                    {/* Schema properties hint */}
                    {selectedTool.inputSchema?.properties &&
                      Object.keys(selectedTool.inputSchema.properties).length > 0 && (
                        <div className="text-[11px] bg-surface-card border border-outline-variant/60 rounded-lg p-2.5 max-h-28 overflow-y-auto">
                          <p className="font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                            Parámetros aceptados
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(selectedTool.inputSchema.properties).map(
                              ([k, prop]) => {
                                const isReq = (
                                  selectedTool.inputSchema.required || []
                                ).includes(k);
                                return (
                                  <span
                                    key={k}
                                    title={prop.description || ""}
                                    className="px-2 py-0.5 rounded bg-surface-main border border-outline-variant font-mono"
                                  >
                                    {k}
                                    {isReq ? (
                                      <span className="text-red-600 font-bold">*</span>
                                    ) : null}
                                    <span className="text-on-surface-variant ml-1">
                                      ({prop.type || "any"})
                                    </span>
                                  </span>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                    {/* Arguments Editor */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-on-surface-variant block">
                        Argumentos (JSON)
                      </label>
                      <textarea
                        value={argsText}
                        onChange={(e) => setArgsText(e.target.value)}
                        rows={5}
                        spellCheck={false}
                        className="w-full font-mono text-xs bg-zinc-950 text-sky-200 p-3 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary-stitch resize-y"
                      />
                    </div>

                    {/* Response Viewer */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-on-surface-variant">
                          Respuesta {toolLatency != null ? `(${toolLatency}ms)` : ""}
                        </span>
                        {toolResult && (
                          <button
                            onClick={() => copyToClipboard(toolResult, "tool-result")}
                            className="text-[11px] text-primary-stitch hover:underline flex items-center gap-1"
                          >
                            {copiedKey === "tool-result" ? (
                              <>
                                <Check size={12} /> Copiado
                              </>
                            ) : (
                              <>
                                <Copy size={12} /> Copiar JSON
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {toolError ? (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-800 text-xs font-mono p-3 rounded-xl whitespace-pre-wrap">
                          {toolError}
                        </div>
                      ) : toolResult ? (
                        <pre className="bg-zinc-950 text-emerald-300 text-[11px] font-mono p-3 rounded-xl overflow-auto max-h-64 whitespace-pre-wrap">
                          {toolResult}
                        </pre>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-on-surface-variant border border-dashed border-outline-variant rounded-xl p-6">
                          Presiona <strong className="mx-1">Ejecutar</strong> para probar{" "}
                          <code className="ml-1 font-mono">{selectedTool.name}</code> en vivo.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-on-surface-variant gap-2">
                    <Sparkles size={32} className="text-primary-stitch/60" />
                    <p className="text-sm font-semibold text-on-surface">
                      Selecciona una herramienta de la lista
                    </p>
                    <p className="text-xs max-w-md">
                      Podrás ver su esquema de parámetros, editar los argumentos JSON y ejecutarla
                      directamente contra el servidor MCP de Proyecto Café.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </PageLayout>
  );
}
