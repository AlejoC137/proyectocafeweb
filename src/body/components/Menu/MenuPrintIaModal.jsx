import React, { useState, useEffect } from "react";
import { Sparkles, Copy, Check, FileCode, ArrowRight, AlertCircle, CheckCircle2, Download, RefreshCw, X, LayoutGrid } from "lucide-react";
import supabase from "../../../config/supabaseClient";
import { normalizePageSize } from "./MenuPrintHorizontal";

export default function MenuPrintIaModal({
  isOpen,
  onClose,
  menuId = 2,
  menuType = "horizontal",
  currentConfig = null,
  onLayoutImported = () => {}
}) {
  const [activeTab, setActiveTab] = useState("prompt"); // "prompt" | "input" | "export"
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [userCustomInstruction, setUserCustomInstruction] = useState("");
  const [targetPageCount, setTargetPageCount] = useState(2);
  
  const [jsonInput, setJsonInput] = useState("");
  const [verificationResult, setVerificationResult] = useState(null); // { valid: bool, message: string, summary: obj, parsed: obj }
  const [isSaving, setIsSaving] = useState(false);
  const [imagesList, setImagesList] = useState([]);

  useEffect(() => {
    if (isOpen && menuId) {
      fetchImages();
      setVerificationResult(null);
    }
  }, [isOpen, menuId]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase.from('menu_print_config').select('images').eq('id', menuId);
      if (!error && data && data[0]?.images) {
        setImagesList(data[0].images || []);
      }
    } catch (e) {
      console.error("Error fetching menu images for prompt:", e);
    }
  };

  if (!isOpen) return null;

  const defaultCategories = ["CAFE", "BEBIDAS", "ALIMENTOS", "PANADERIA", "REPOSTERIA", "HELADOS", "TARDEO", "ADICIONES", "ENLATADOS"];
  const defaultSpecialBlocks = ["QR", "INFO", "HEADER"];
  const galleryImageIds = imagesList.map(img => img.id || `IMG_${img.nameES || 'FOTO'}`);

  const buildPrompt = () => {
    const isHoriz = menuType === "horizontal";
    
    return `Actúa como un Experto Diseñador Editorial y Diagramador de Menús de Cafetería.
Genera la estructura de diagramación en JSON para el Menú ${isHoriz ? "Horizontal (Paisaje)" : "Vertical (Retrato)"} de Proyecto Café (ID de Menú: ${menuId}).

BLOQUES Y ELEMENTOS DISPONIBLES EN NUESTRO SISTEMA:
1. Categorías de Productos:
   ${defaultCategories.join(", ")}

2. Bloques Especiales:
   ${defaultSpecialBlocks.join(", ")}

3. Imágenes de Galería Disponibles:
   ${galleryImageIds.length > 0 ? galleryImageIds.join(", ") : "(Sin fotos adicionales)"}

${userCustomInstruction.trim() ? `REQUERIMIENTOS ADICIONALES DEL USUARIO:
- ${userCustomInstruction.trim()}` : ""}
- Número total sugerido de páginas: ${targetPageCount}

REGLAS DE FORMATO Y ESTRUCTURA JSON REQUERIDA (DEVUELVE ÚNICAMENTE ESTE FORMATO):

${isHoriz ? `{
  "pageSize": "LETTER_LANDSCAPE",
  "qrScale": 1,
  "showIcons": true,
  "showItemDescriptions": true,
  "colors": {
    "primary": "#332211",
    "background": "#FFF8F0",
    "text": "#1A1A1A",
    "accent": "#C49A45",
    "categoryBg": "#F0E4D4",
    "categoryBorder": "#000000"
  },
  "pages": [
    {
      "id": "PAGE_1",
      "columns": [
        {
          "id": "COL_1",
          "flex": 1,
          "blocks": ["CAFE", "BEBIDAS"]
        },
        {
          "id": "COL_2",
          "flex": 1,
          "blocks": ["ALIMENTOS", "QR"]
        }
      ]
    },
    {
      "id": "PAGE_2",
      "columns": [
        {
          "id": "COL_1",
          "flex": 1,
          "blocks": ["PANADERIA", "REPOSTERIA"]
        },
        {
          "id": "COL_2",
          "flex": 1,
          "blocks": ["TARDEO", "INFO"]
        }
      ]
    }
  ]
}` : `{
  "pageSizeUnit": "cm",
  "pageWidth": 27.94,
  "pageHeight": 43.18,
  "photosWidth": 210,
  "qrScale": 1,
  "showIcons": true,
  "showItemDescriptions": true,
  "colors": {
    "primary": "#332211",
    "background": "#FFF8F0",
    "text": "#1A1A1A",
    "accent": "#C49A45"
  },
  "pages": [
    {
      "id": "PAGE_1",
      "left": ["CAFE", "BEBIDAS", "QR"],
      "center": ["ALIMENTOS", "EXTRAS", "INFO"],
      "right": []
    }
  ]
}`}

CRÍTICO:
- Devuelve únicamente el objeto JSON sin explicaciones adicionales fuera del código.
- Asegúrate de incluir todos los bloques principales de menú deseados sin duplicar innecesariamente.`;
  };

  const generatedPrompt = buildPrompt();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleVerifyJson = () => {
    setVerificationResult(null);
    if (!jsonInput.trim()) {
      setVerificationResult({
        valid: false,
        message: "Por favor pega el JSON generado por Gemini u otra IA en el cuadro de texto."
      });
      return;
    }

    try {
      let text = jsonInput.trim();
      // Extraer bloque de código markdown si existe ```json ... ```
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) || text.match(/\{[\s\S]*\}/);
      if (match) {
        text = match[1] || match[0];
      }

      const parsed = JSON.parse(text);

      // Validación de propiedades requeridas
      const pages = parsed.pages;
      if (!pages || !Array.isArray(pages) || pages.length === 0) {
        throw new Error("El JSON debe incluir la propiedad 'pages' como una lista no vacía.");
      }

      let totalBlocks = 0;
      let totalColumns = 0;
      const detectedBlocks = new Set();

      if (menuType === "horizontal") {
        pages.forEach((pg, pIdx) => {
          if (!pg.columns || !Array.isArray(pg.columns)) {
            throw new Error(`La página ${pIdx + 1} (${pg.id || 'PAGE'}) debe tener un arreglo 'columns'.`);
          }
          totalColumns += pg.columns.length;
          pg.columns.forEach((col, cIdx) => {
            if (!col.blocks || !Array.isArray(col.blocks)) {
              throw new Error(`La columna ${cIdx + 1} de la página ${pIdx + 1} debe tener un arreglo 'blocks'.`);
            }
            col.blocks.forEach(b => {
              totalBlocks++;
              detectedBlocks.add(b);
            });
          });
        });
      } else {
        // Vertical layout
        pages.forEach((pg, pIdx) => {
          const left = pg.left || [];
          const center = pg.center || [];
          const right = pg.right || [];
          const cols = pg.columns || [];
          
          const combined = [...left, ...center, ...right];
          cols.forEach(c => combined.push(...(c.blocks || [])));
          
          combined.forEach(b => {
            totalBlocks++;
            detectedBlocks.add(b);
          });
        });
      }

      setVerificationResult({
        valid: true,
        message: "¡JSON Estructurado Correctamente!",
        summary: {
          pagesCount: pages.length,
          columnsCount: totalColumns,
          blocksCount: totalBlocks,
          uniqueBlocks: Array.from(detectedBlocks),
          hasColors: !!parsed.colors
        },
        parsedClean: parsed
      });

    } catch (err) {
      setVerificationResult({
        valid: false,
        message: `Error de verificación: ${err.message}`
      });
    }
  };

  const handleApplyImport = async () => {
    if (!verificationResult || !verificationResult.valid || !verificationResult.parsedClean) return;

    setIsSaving(true);
    try {
      const parsedLayout = { ...verificationResult.parsedClean };

      if (parsedLayout.pageSize) {
        parsedLayout.pageSize = normalizePageSize(parsedLayout.pageSize);
      }

      // Obtenemos la configuración existente del menú en Supabase
      const { data: existingRow, error: fetchErr } = await supabase
        .from('menu_print_config')
        .select('*')
        .eq('id', menuId);

      if (fetchErr) throw fetchErr;

      let currentDescriptions = {};
      if (existingRow && existingRow.length > 0) {
        currentDescriptions = existingRow[0].group_descriptions || {};
      }

      // Fusionar el nuevo __layout generado por IA manteniendo descripciones personalizadas existentes
      const newLayoutObj = {
        ...(currentDescriptions.__layout || {}),
        ...parsedLayout
      };

      const updatedDescriptions = {
        ...currentDescriptions,
        __layout: newLayoutObj
      };

      const updateData = {
        group_descriptions: updatedDescriptions
      };

      if (parsedLayout.showIcons !== undefined) {
        updateData.show_icons = parsedLayout.showIcons;
      }

      const { error: updateErr } = await supabase
        .from('menu_print_config')
        .update(updateData)
        .eq('id', menuId);

      if (updateErr) throw updateErr;

      // Notificar al componente padre para actualizar la interfaz inmediatamente
      onLayoutImported(updatedDescriptions);
      
      setIsSaving(false);
      onClose();
      alert("¡Layout de menú importado y guardado exitosamente!");
    } catch (err) {
      console.error("Error al importar layout:", err);
      setIsSaving(false);
      alert(`Error al guardar en base de datos: ${err.message}`);
    }
  };

  const handleExportCurrentConfig = () => {
    if (!currentConfig) return;
    const layout = currentConfig.__layout || currentConfig;
    const exportStr = JSON.stringify(layout, null, 2);
    navigator.clipboard.writeText(exportStr);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto font-SpaceGrotesk">
      <div className="bg-[#FCFBF9] border-4 border-black p-5 md:p-6 w-full max-w-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] my-auto space-y-4 rounded-lg">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-300 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded">
              <Sparkles className="h-6 w-6 text-black" />
            </div>
            <div>
              <h2 className="font-black text-lg md:text-xl text-black uppercase italic tracking-tight flex items-center gap-2">
                Asistente de Diagramación por IA (Gemini)
              </h2>
              <p className="text-xs font-bold text-gray-600">
                Menú ID: <span className="bg-amber-200 px-1.5 py-0.5 border border-black rounded">{menuId}</span> | Tipo: <span className="uppercase font-black">{menuType}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-100 text-black border-2 border-black font-black rounded transition-colors"
            title="Cerrar Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TABS NAVEGACIÓN */}
        <div className="flex gap-2 border-b-2 border-black pb-2">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`px-4 py-2 text-xs font-black uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 ${
              activeTab === "prompt"
                ? "bg-yellow-300 text-black"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
          >
            <FileCode className="h-4 w-4" /> 1. Prompt para Gemini
          </button>
          <button
            onClick={() => setActiveTab("input")}
            className={`px-4 py-2 text-xs font-black uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 ${
              activeTab === "input"
                ? "bg-yellow-300 text-black"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> 2. Verificar e Importar JSON
          </button>
          <button
            onClick={() => {
              setActiveTab("export");
              handleExportCurrentConfig();
            }}
            className={`px-4 py-2 text-xs font-black uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 ${
              activeTab === "export"
                ? "bg-yellow-300 text-black"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
          >
            <Download className="h-4 w-4" /> Exportar Actual
          </button>
        </div>

        {/* TAB 1: GENERADOR DE PROMPT */}
        {activeTab === "prompt" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-amber-50 border-2 border-black p-3.5 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <h3 className="font-extrabold text-xs text-amber-950 flex items-center gap-2 uppercase tracking-wide">
                <span>🎨 Personalizar Reglas del Prompt:</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">
                    Número Deseado de Páginas:
                  </label>
                  <select
                    value={targetPageCount}
                    onChange={(e) => setTargetPageCount(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-white border-2 border-black p-1.5 rounded outline-none focus:ring-0"
                  >
                    <option value={1}>1 Página</option>
                    <option value={2}>2 Páginas</option>
                    <option value={3}>3 Páginas</option>
                    <option value={4}>4 Páginas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">
                    Instrucción / Estilo Adicional (Opcional):
                  </label>
                  <input
                    type="text"
                    value={userCustomInstruction}
                    onChange={(e) => setUserCustomInstruction(e.target.value)}
                    placeholder="ej. Estilo cálido vintage, destacar el Café en la 1ra página"
                    className="w-full text-xs font-bold bg-white border-2 border-black p-1.5 rounded outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase text-gray-900 flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-black" />
                  Prompt Generado para Gemini:
                </label>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={`px-3 py-1.5 text-xs font-black border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 ${
                    copiedPrompt
                      ? "bg-green-400 text-black"
                      : "bg-yellow-300 hover:bg-yellow-400 text-black active:translate-y-0.5"
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> ¡Prompt Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copiar Prompt para Gemini
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={generatedPrompt}
                className="w-full p-3 border-2 border-black font-mono text-xs bg-zinc-900 text-yellow-300 rounded focus:outline-none select-all"
              />
            </div>

            <div className="flex justify-end pt-2 border-t-2 border-black">
              <button
                onClick={() => setActiveTab("input")}
                className="px-4 py-2 bg-black text-white hover:bg-gray-800 font-black text-xs uppercase border-2 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center gap-2"
              >
                Siguiente: Pegar y Verificar JSON <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INPUT Y VERIFICADOR DE JSON */}
        {activeTab === "input" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-black uppercase text-gray-900 mb-1 flex items-center gap-1.5">
                <ArrowRight className="h-4 w-4 text-black" />
                Pega la respuesta JSON devuelta por Gemini u otra IA:
              </label>
              <textarea
                rows={8}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setVerificationResult(null);
                }}
                placeholder={`Pega el código JSON aquí. Ejemplo:\n{\n  "pages": [\n    {\n      "id": "PAGE_1",\n      "columns": [\n        { "id": "COL_1", "flex": 1, "blocks": ["CAFE", "BEBIDAS"] },\n        { "id": "COL_2", "flex": 1, "blocks": ["ALIMENTOS", "QR"] }\n      ]\n    }\n  ]\n}`}
                className="w-full p-3 border-2 border-black font-mono text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-black rounded"
              />
            </div>

            {/* BOTÓN VERIFICAR */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleVerifyJson}
                className="px-5 py-2.5 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black uppercase text-xs rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Verificar JSON
              </button>
            </div>

            {/* RESULTADO DE VERIFICACIÓN */}
            {verificationResult && (
              <div
                className={`p-4 border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2 ${
                  verificationResult.valid ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  {verificationResult.valid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-700 stroke-[3]" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 stroke-[3]" />
                  )}
                  <h4 className={`font-black text-xs uppercase ${verificationResult.valid ? "text-green-900" : "text-red-900"}`}>
                    {verificationResult.message}
                  </h4>
                </div>

                {verificationResult.valid && verificationResult.summary && (
                  <div className="bg-white/80 border border-black p-2.5 rounded text-xs space-y-1 font-bold text-gray-800">
                    <p>📄 **Páginas encontradas:** {verificationResult.summary.pagesCount}</p>
                    {menuType === "horizontal" && <p>📐 **Columnas totales:** {verificationResult.summary.columnsCount}</p>}
                    <p>📦 **Bloques distribuidos:** {verificationResult.summary.blocksCount}</p>
                    <p>🏷️ **Bloques detectados:** {verificationResult.summary.uniqueBlocks.join(", ")}</p>
                    <p>🎨 **Esquema de colores:** {verificationResult.summary.hasColors ? "Personalizado incluido" : "Predeterminado"}</p>
                  </div>
                )}
              </div>
            )}

            {/* BOTÓN APLICAR / IMPORTAR */}
            <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white text-black hover:bg-gray-100 font-bold text-xs uppercase border-2 border-black rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                disabled={!verificationResult?.valid || isSaving}
                className={`px-6 py-2.5 font-black text-xs uppercase border-2 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 ${
                  verificationResult?.valid && !isSaving
                    ? "bg-green-400 hover:bg-green-500 text-black active:translate-y-0.5"
                    : "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed shadow-none"
                }`}
              >
                {isSaving ? "Guardando e Importando..." : "🚀 Importar Layout al Menú"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: EXPORTAR LAYOUT ACTUAL */}
        {activeTab === "export" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-amber-50 border-2 border-black p-3 rounded text-xs space-y-1">
              <p className="font-bold text-amber-950">
                A continuación se muestra la estructura JSON del layout actual de este menú. Puedes copiarlo para respaldarlo o enviarlo a Gemini como contexto.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-gray-800">Estructura JSON Actual:</span>
              <button
                onClick={handleExportCurrentConfig}
                className="px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-black font-black text-xs border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
              >
                {copiedExport ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedExport ? "¡JSON Copiado!" : "Copiar JSON Actual"}
              </button>
            </div>

            <textarea
              readOnly
              rows={10}
              value={currentConfig ? JSON.stringify(currentConfig.__layout || currentConfig, null, 2) : "// Sin datos de configuración activa"}
              className="w-full p-3 border-2 border-black font-mono text-xs bg-zinc-900 text-green-400 rounded"
            />
          </div>
        )}

      </div>
    </div>
  );
}
