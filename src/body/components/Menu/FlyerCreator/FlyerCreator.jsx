// =========================================================
// CREADOR DE FLYERS DEDICADO PARA PROYECTO CAFÉ (FLYER STUDIO)
// Inspirado en Canva y Adobe Express - Diseñado para MenuPrint
// =========================================================

import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Sparkles,
  Download,
  Share2,
  Image as ImageIcon,
  Type,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  FileCode,
  Check,
  Undo2,
  Redo2,
  Layers,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FlyerCanvas from "./FlyerCanvas";
import FlyerPropertiesPanel from "./FlyerPropertiesPanel";
import FlyerPromptWizardModal from "./FlyerPromptWizardModal";
import FlyerMediaModal from "./FlyerMediaModal";
import FlyerCopyModal from "./FlyerCopyModal";
import FlyerLibraryModal from "./FlyerLibraryModal";
import { FLYER_FORMATS, generateSmartCopiesFromData } from "./flyerAiPromptEngine";
import { STARTER_TEMPLATES } from "./FlyerTemplates";
import { Folder } from "lucide-react";

export default function FlyerCreator({ initialFormat = "9:16" }) {
  // Estado general del lienzo
  const defaultTemplate = STARTER_TEMPLATES["story_vintage_music"];
  
  const [canvasConfig, setCanvasConfig] = useState(defaultTemplate.canvas);
  const [elements, setElements] = useState(defaultTemplate.elements);
  const [copies, setCopies] = useState(defaultTemplate.copies);

  const [selectedElementId, setSelectedElementId] = useState(null);
  const [scale, setScale] = useState(0.42);
  const [isExporting, setIsExporting] = useState(false);

  // Historial de cambios (Undo / Redo)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Modales
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState("background"); // "background" | "element"
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeFlyerId, setActiveFlyerId] = useState(null);

  const printAreaRef = useRef(null);

  // Auto-ajustar zoom según el tamaño de la ventana y el formato del flyer
  useEffect(() => {
    const handleResize = () => {
      const availH = window.innerHeight - 150; // descontando barra superior y margen
      const targetH = canvasConfig.height || 1920;
      const fitRatio = Number((availH / targetH).toFixed(2));
      setScale(Math.max(0.2, Math.min(0.85, fitRatio)));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasConfig.height]);

  const handleZoomDelta = (delta) => {
    setScale((s) => Math.max(0.15, Math.min(1.5, Number((s + delta).toFixed(2)))));
  };

  // Guardar estado en historial para Undo/Redo
  const pushHistory = (newElements, newConfig) => {
    const nextState = { elements: newElements, canvas: newConfig };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(nextState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setElements(prev.elements);
      setCanvasConfig(prev.canvas);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setElements(next.elements);
      setCanvasConfig(next.canvas);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Cambio de formato
  const handleChangeFormat = (newFormatId) => {
    const preset = FLYER_FORMATS[newFormatId];
    if (!preset) return;

    const oldWidth = canvasConfig.width || 1080;
    const oldHeight = canvasConfig.height || 1920;
    const newWidth = preset.width;
    const newHeight = preset.height;

    // Reescalar proporcionalmente las posiciones de los elementos
    const remappedElements = elements.map((el) => {
      const relX = el.x / oldWidth;
      const relY = el.y / oldHeight;
      return {
        ...el,
        x: Math.round(relX * newWidth),
        y: Math.round(relY * newHeight)
      };
    });

    const newConfig = {
      ...canvasConfig,
      format: newFormatId,
      width: newWidth,
      height: newHeight
    };

    setCanvasConfig(newConfig);
    setElements(remappedElements);
    pushHistory(remappedElements, newConfig);
  };

  // Manejo de elementos
  const handleUpdateElement = (updated) => {
    const nextElements = elements.map((el) => (el.id === updated.id ? updated : el));
    setElements(nextElements);
    pushHistory(nextElements, canvasConfig);
  };

  const handleDeleteElement = (id) => {
    const nextElements = elements.filter((el) => el.id !== id);
    setElements(nextElements);
    setSelectedElementId(null);
    pushHistory(nextElements, canvasConfig);
  };

  const handleDuplicateElement = (el) => {
    const newEl = {
      ...el,
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      x: Math.min((canvasConfig.width || 1080) - 50, el.x + 40),
      y: Math.min((canvasConfig.height || 1920) - 50, el.y + 40),
      zIndex: (el.zIndex || 10) + 1
    };
    const nextElements = [...elements, newEl];
    setElements(nextElements);
    setSelectedElementId(newEl.id);
    pushHistory(nextElements, canvasConfig);
  };

  const handleBringForward = (el) => {
    const maxZ = Math.max(...elements.map((e) => e.zIndex || 10), 10);
    handleUpdateElement({ ...el, zIndex: maxZ + 1 });
  };

  const handleSendBackward = (el) => {
    const minZ = Math.min(...elements.map((e) => e.zIndex || 10), 10);
    handleUpdateElement({ ...el, zIndex: Math.max(1, minZ - 1) });
  };

  // Añadir nuevo elemento rápido
  const handleAddText = (type = "text") => {
    const w = canvasConfig.width || 1080;
    const h = canvasConfig.height || 1920;

    const newElem = {
      id: `text_${Date.now()}`,
      type: "text",
      text: "NUEVO TEXTO EDITABLE",
      x: Math.round(w / 2),
      y: Math.round(h / 2),
      zIndex: elements.length + 10,
      style: {
        fontSize: 48,
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: "900",
        color: "#ffffff",
        textAlign: "center"
      }
    };

    const nextElements = [...elements, newElem];
    setElements(nextElements);
    setSelectedElementId(newElem.id);
    pushHistory(nextElements, canvasConfig);
  };

  const handleAddBadge = () => {
    const w = canvasConfig.width || 1080;
    const h = canvasConfig.height || 1920;

    const newBadge = {
      id: `badge_${Date.now()}`,
      type: "badge",
      text: "NUEVA INSIGNIA · DESTACADO",
      x: Math.round(w / 2),
      y: Math.round(h * 0.45),
      zIndex: elements.length + 10,
      style: {
        backgroundColor: "#c59b27",
        color: "#1c140e",
        fontSize: 22,
        fontWeight: "800",
        borderRadius: 24,
        paddingX: 30,
        paddingY: 10,
        letterSpacing: 2
      }
    };

    const nextElements = [...elements, newBadge];
    setElements(nextElements);
    setSelectedElementId(newBadge.id);
    pushHistory(nextElements, canvasConfig);
  };

  // Carga de flyer desde Wizard IA
  const handleApplyFlyerFromWizard = ({ canvas, elements: newElements, copies: newCopies }) => {
    setCanvasConfig(canvas);
    setElements(newElements);
    if (newCopies) setCopies(newCopies);
    setSelectedElementId(null);
    pushHistory(newElements, canvas);
  };

  // Descarga de Imagen PNG HD
  const handleDownloadPng = async () => {
    const el = printAreaRef.current;
    if (!el) return;

    setIsExporting(true);
    try {
      // Deseleccionar elemento activo para que no salga el borde de selección
      setSelectedElementId(null);
      await new Promise((r) => setTimeout(r, 100));

      const originalTransform = el.style.transform;
      el.style.transform = "none";

      const canvas = await html2canvas(el, {
        scale: 2, // 2x para nitidez HD estilo Retina
        useCORS: true,
        allowTaint: true,
        backgroundColor: canvasConfig.backgroundColor || "#1c140e"
      });

      el.style.transform = originalTransform;

      const link = document.createElement("a");
      link.download = `flyer_proyectocafe_${canvasConfig.format || "9-16"}_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error al exportar PNG:", err);
      alert("Error al generar la imagen PNG: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar PDF de impresión
  const handleDownloadPdf = async () => {
    const el = printAreaRef.current;
    if (!el) return;

    setIsExporting(true);
    try {
      setSelectedElementId(null);
      await new Promise((r) => setTimeout(r, 100));

      const originalTransform = el.style.transform;
      el.style.transform = "none";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      el.style.transform = originalTransform;

      const isLandscape = (canvasConfig.width || 1080) > (canvasConfig.height || 1920);
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "px",
        format: [canvasConfig.width || 1080, canvasConfig.height || 1920]
      });

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        canvasConfig.width || 1080,
        canvasConfig.height || 1920
      );

      pdf.save(`flyer_proyectocafe_${Date.now()}.pdf`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      alert("Error al generar el PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar proyecto JSON
  const handleExportJson = () => {
    const project = {
      canvas: canvasConfig,
      elements,
      copies
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flyer_proyecto_${Date.now()}.json`;
    a.click();
  };

  // Cargar proyecto JSON
  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.canvas && parsed.elements) {
          setCanvasConfig(parsed.canvas);
          setElements(parsed.elements);
          if (parsed.copies) setCopies(parsed.copies);
          alert("Flyer importado exitosamente.");
        } else {
          alert("El archivo no tiene la estructura de un flyer de Proyecto Café.");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const mainTitleText = elements.find((el) => el.id?.includes("title") || el.type === "text")?.text || "Evento Café";

  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col bg-[#e8e5df] text-black font-sans select-none">
      
      {/* Barra Superior de Herramientas Estilo Canva Studio */}
      <div className="h-14 bg-[#fcf8f2] border-b-4 border-black px-4 flex items-center justify-between gap-3 shadow-md z-40 sticky top-0">
        
        {/* Izquierda: Selector de Formato & Título */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-black text-yellow-300 font-black uppercase text-xs px-2.5 py-1.5 rounded border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
            <Sparkles size={14} />
            <span className="hidden sm:inline">FLYER STUDIO</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-zinc-700 hidden md:inline">
              Formato:
            </span>
            <select
              value={canvasConfig.format || "9:16"}
              onChange={(e) => handleChangeFormat(e.target.value)}
              className="h-8 px-2 border-2 border-black rounded font-black text-xs bg-white cursor-pointer hover:bg-zinc-50"
            >
              {Object.values(FLYER_FORMATS).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.icon} {f.name} ({f.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Centro: Herramientas de Creación Rápida */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Button
            onClick={() => setIsWizardOpen(true)}
            className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black uppercase text-xs h-8 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
            title="Abrir Asistente IA para generar flyer"
          >
            <Sparkles size={13} />
            <span className="hidden lg:inline">Asistente IA / Importar</span>
            <span className="lg:hidden">IA</span>
          </Button>

          <Button
            onClick={() => setIsLibraryOpen(true)}
            className="bg-amber-300 hover:bg-amber-400 text-black border-2 border-black font-black uppercase text-xs h-8 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
            title="Abrir Biblioteca de Flyers guardados en Supabase"
          >
            <Folder size={13} />
            <span className="hidden lg:inline">Mis Flyers</span>
            <span className="lg:hidden">Posters</span>
          </Button>

          <Button
            onClick={() => setIsCopyModalOpen(true)}
            className="bg-pink-300 hover:bg-pink-400 text-black border-2 border-black font-black uppercase text-xs h-8 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
            title="Ver y copiar textos promocionales para Instagram y WhatsApp"
          >
            <Share2 size={13} />
            <span className="hidden lg:inline">Copys Redes & WhatsApp</span>
            <span className="lg:hidden">Copys</span>
          </Button>

          <Button
            onClick={() => {
              setMediaTarget("background");
              setIsMediaModalOpen(true);
            }}
            className="bg-white hover:bg-zinc-100 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 flex items-center gap-1"
          >
            <ImageIcon size={13} />
            <span className="hidden xl:inline">Fondo / Fotos</span>
          </Button>

          <Button
            onClick={() => handleAddText()}
            className="bg-white hover:bg-zinc-100 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 flex items-center gap-1"
          >
            <Type size={13} />
            <span className="hidden xl:inline">+ Texto</span>
          </Button>

          <Button
            onClick={() => handleAddBadge()}
            className="bg-white hover:bg-zinc-100 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 flex items-center gap-1"
          >
            <Plus size={13} />
            <span className="hidden xl:inline">+ Insignia</span>
          </Button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 border-2 border-black rounded bg-white p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1 hover:bg-zinc-100 disabled:opacity-30 rounded"
              title="Deshacer"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 hover:bg-zinc-100 disabled:opacity-30 rounded"
              title="Rehacer"
            >
              <Redo2 size={13} />
            </button>
          </div>
        </div>

        {/* Derecha: Zoom & Exportación */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center gap-1 border-2 border-black rounded bg-white px-1.5 h-8">
            <button
              onClick={() => handleZoomDelta(-0.05)}
              className="p-0.5 hover:bg-zinc-100 rounded font-black text-xs"
              title="Alejar"
            >
              -
            </button>
            <span className="text-[10px] font-mono font-black w-8 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => handleZoomDelta(0.05)}
              className="p-0.5 hover:bg-zinc-100 rounded font-black text-xs"
              title="Acercar"
            >
              +
            </button>
          </div>

          {/* Botón Guardar en Supabase */}
          <Button
            onClick={() => setIsLibraryOpen(true)}
            className="bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1"
            title="Guardar este Flyer en Supabase"
          >
            <Folder size={13} />
            <span className="hidden sm:inline">Guardar</span>
          </Button>

          {/* Botones de Descarga */}
          <Button
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="bg-green-400 hover:bg-green-500 text-black border-2 border-black font-black uppercase text-xs h-8 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
            title="Descargar Imagen PNG en Alta Resolución (HD)"
          >
            <Download size={13} />
            <span className="hidden sm:inline">PNG HD</span>
          </Button>

          <Button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="bg-blue-400 hover:bg-blue-500 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1"
            title="Descargar PDF de Impresión"
          >
            <FileText size={13} />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          {/* JSON Export/Import */}
          <button
            onClick={handleExportJson}
            className="p-1.5 hover:bg-zinc-200 border-2 border-black rounded bg-white"
            title="Exportar Proyecto JSON"
          >
            <FileCode size={14} />
          </button>

          <label className="p-1.5 hover:bg-zinc-200 border-2 border-black rounded bg-white cursor-pointer" title="Cargar Proyecto JSON">
            <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
            <Layers size={14} />
          </label>
        </div>

      </div>

      {/* Área Principal de Trabajo: Lienzo (Centro) + Panel de Propiedades (Derecha) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Lienzo Interactivo con Drag and Drop y Zoom Scroll */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 overflow-hidden">
          <FlyerCanvas
            canvasConfig={canvasConfig}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            printRef={printAreaRef}
            scale={scale}
            onZoom={handleZoomDelta}
          />
        </div>

        {/* Panel Lateral de Propiedades */}
        <FlyerPropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          canvasConfig={canvasConfig}
          onUpdateCanvasConfig={(patch) => {
            const next = { ...canvasConfig, ...patch };
            setCanvasConfig(next);
            pushHistory(elements, next);
          }}
          onOpenMediaModal={(target) => {
            setMediaTarget(target);
            setIsMediaModalOpen(true);
          }}
        />
      </div>

      {/* MODAL 1: Asistente IA y Generador de Prompts */}
      <FlyerPromptWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        currentFormat={canvasConfig.format || "9:16"}
        onApplyFlyer={handleApplyFlyerFromWizard}
      />

      {/* MODAL 2: Gestor de Medios e Imágenes */}
      <FlyerMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        targetType={mediaTarget}
        onSelectImage={(url) => {
          if (mediaTarget === "background") {
            const next = { ...canvasConfig, backgroundImageUrl: url };
            setCanvasConfig(next);
            pushHistory(elements, next);
          }
        }}
      />

      {/* MODAL 3: Kit de Comunicación & Copys Multicanal */}
      <FlyerCopyModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        copies={copies}
        onUpdateCopies={setCopies}
        flyerTitle={mainTitleText}
      />

      {/* MODAL 4: Biblioteca de Flyers en Supabase */}
      <FlyerLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onLoadFlyer={({ canvas, elements: newElems, copies: newCopies }) => {
          setCanvasConfig(canvas);
          setElements(newElems);
          if (newCopies) setCopies(newCopies);
          setSelectedElementId(null);
          pushHistory(newElems, canvas);
        }}
        currentFlyerData={{
          canvas: canvasConfig,
          elements,
          copies
        }}
        activeFlyerId={activeFlyerId}
        setActiveFlyerId={setActiveFlyerId}
      />

    </div>
  );
}
