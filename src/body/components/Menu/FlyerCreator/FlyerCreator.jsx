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
import FlyerResourcesModal from "./FlyerResourcesModal";
import { FLYER_FORMATS, generateSmartCopiesFromData } from "./flyerAiPromptEngine";
import { STARTER_TEMPLATES } from "./FlyerTemplates";
import { Folder, Smile } from "lucide-react";

export default function FlyerCreator({ initialFormat = "9:16" }) {
  // Estado general del lienzo
  const defaultTemplate = STARTER_TEMPLATES["story_vintage_music"];
  
  const [canvasConfig, setCanvasConfig] = useState(defaultTemplate.canvas);
  const [elements, setElements] = useState(defaultTemplate.elements);
  const [copies, setCopies] = useState(defaultTemplate.copies);

  const [selectedElementId, setSelectedElementId] = useState(null);
  const [scale, setScale] = useState(0.42);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);

  // Bloquear scroll de la página completa mientras el editor esté activo
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Historial de cambios (Undo / Redo)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Modales
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState("background"); // "background" | "element"
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false);
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

  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    const availH = window.innerHeight - 150;
    const targetH = canvasConfig.height || 1920;
    const fitRatio = Number((availH / targetH).toFixed(2));
    setScale(Math.max(0.2, Math.min(0.85, fitRatio)));
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

    setPan({ x: 0, y: 0 });

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

  // Añadir Texto Suelto (Single-line / Point Text)
  const handleAddPointText = (initialText = "TEXTO SUELTO") => {
    const w = canvasConfig.width || 1080;
    const h = canvasConfig.height || 1920;

    const newElem = {
      id: `text_point_${Date.now()}`,
      type: "text",
      textType: "point",
      text: initialText,
      x: Math.round(w / 2),
      y: Math.round(h * 0.45),
      zIndex: elements.length + 10,
      style: {
        fontSize: 46,
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

  // Añadir Caja de Párrafo / Rectángulo (Multiline / Area Text Justificado)
  const handleAddAreaText = () => {
    const w = canvasConfig.width || 1080;
    const h = canvasConfig.height || 1920;

    const newElem = {
      id: `text_area_${Date.now()}`,
      type: "text",
      textType: "area",
      width: 720,
      height: 180,
      text: "Este es un bloque de texto en rectángulo. Puedes editarlo haciendo doble clic, ajustar su ancho y alto con los 8 nodos, y el texto se justificará uniformemente dentro de los márgenes de su caja.",
      x: Math.round(w / 2),
      y: Math.round(h * 0.55),
      zIndex: elements.length + 10,
      style: {
        fontSize: 26,
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        color: "#ffffff",
        textAlign: "justify",
        lineHeight: 1.35
      }
    };

    const nextElements = [...elements, newElem];
    setElements(nextElements);
    setSelectedElementId(newElem.id);
    pushHistory(nextElements, canvasConfig);
  };

  // Inserciones desde el Modal de Recursos Gráficos & Emojis
  const handleInsertEmoji = (emoji) => {
    if (selectedElementId) {
      const el = elements.find((e) => e.id === selectedElementId);
      if (el && (el.type === "text" || el.type === "badge")) {
        handleUpdateElement({
          ...el,
          text: (el.text || "") + " " + emoji
        });
        return;
      }
    }
    handleAddPointText(emoji);
  };

  const handleAddStickerElement = (emoji) => {
    const w = canvasConfig.width || 1080;
    const h = canvasConfig.height || 1920;
    const newSticker = {
      id: `sticker_${Date.now()}`,
      type: "text",
      textType: "point",
      text: emoji,
      x: Math.round(w / 2),
      y: Math.round(h * 0.4),
      zIndex: elements.length + 10,
      style: {
        fontSize: 100,
        textAlign: "center"
      }
    };
    const nextElements = [...elements, newSticker];
    setElements(nextElements);
    setSelectedElementId(newSticker.id);
    pushHistory(nextElements, canvasConfig);
  };

  const handleAddStampElement = (stamp) => {
    const w = canvasConfig.width || 1080;
    const h = canvasConfig.height || 1920;
    const newBadge = {
      id: `stamp_${Date.now()}`,
      type: "badge",
      text: stamp.text,
      x: Math.round(w / 2),
      y: Math.round(h * 0.4),
      zIndex: elements.length + 10,
      style: {
        backgroundColor: stamp.bg || "#c59b27",
        color: stamp.color || "#1c140e",
        fontSize: 24,
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

  const handleAddDividerElement = (dividerText) => {
    const w = canvasConfig.width || 1080;
    const h = canvasConfig.height || 1920;
    const newDivider = {
      id: `divider_${Date.now()}`,
      type: "text",
      textType: "point",
      text: dividerText,
      x: Math.round(w / 2),
      y: Math.round(h * 0.5),
      zIndex: elements.length + 10,
      style: {
        fontSize: 28,
        color: "#c59b27",
        textAlign: "center",
        letterSpacing: 4
      }
    };
    const nextElements = [...elements, newDivider];
    setElements(nextElements);
    setSelectedElementId(newDivider.id);
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
    <div className="w-full h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] flex flex-col bg-[#e8e5df] text-black font-sans select-none overflow-hidden">
      
      {/* Barra Superior de Herramientas Estilo Canva Studio */}
      <div className="h-14 bg-[#fcf8f2] border-b-4 border-black px-3 flex items-center justify-between gap-2 shadow-md z-40 shrink-0">
        
        {/* Izquierda: Selector de Formato & Título */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-black text-yellow-300 font-black uppercase text-xs px-2 py-1.5 rounded border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
            <Sparkles size={14} />
            <span className="hidden sm:inline">FLYER STUDIO</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase text-zinc-700 hidden lg:inline">
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

        {/* Centro: Herramientas de Creación Rápida (Sin barra de scroll visible) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Button
            onClick={() => setIsWizardOpen(true)}
            className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
            title="Abrir Asistente IA para generar flyer"
          >
            <Sparkles size={13} />
            <span className="hidden md:inline">Asistente IA</span>
            <span className="md:hidden">IA</span>
          </Button>

          <Button
            onClick={() => setIsLibraryOpen(true)}
            className="bg-amber-300 hover:bg-amber-400 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
            title="Abrir Biblioteca de Flyers guardados en Supabase"
          >
            <Folder size={13} />
            <span className="hidden md:inline">Mis Flyers</span>
            <span className="md:hidden">Posters</span>
          </Button>

          <Button
            onClick={() => setIsCopyModalOpen(true)}
            className="bg-pink-300 hover:bg-pink-400 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
            title="Ver y copiar textos promocionales para Instagram y WhatsApp"
          >
            <Share2 size={13} />
            <span className="hidden lg:inline">Copys Redes</span>
            <span className="lg:hidden">Copys</span>
          </Button>

          <Button
            onClick={() => setIsResourcesModalOpen(true)}
            className="bg-lime-300 hover:bg-lime-400 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
            title="Abrir Panel de Emojis, Sellos y Recursos Gráficos"
          >
            <Smile size={13} />
            <span className="hidden md:inline">Recursos & Emojis</span>
            <span className="md:hidden">Emojis</span>
          </Button>

          <Button
            onClick={() => {
              setMediaTarget("background");
              setIsMediaModalOpen(true);
            }}
            className="bg-white hover:bg-zinc-100 text-black border-2 border-black font-black uppercase text-xs h-8 px-2 flex items-center gap-1 shrink-0"
            title="Cambiar fondo del lienzo"
          >
            <ImageIcon size={13} />
            <span className="hidden xl:inline">Fondo</span>
          </Button>

          <Button
            onClick={() => handleAddPointText()}
            className="bg-white hover:bg-zinc-100 text-black border-2 border-black font-black uppercase text-xs h-8 px-2 flex items-center gap-1 shrink-0"
            title="Añadir Texto Suelto (Single Line / Escala por esquinas)"
          >
            <Type size={13} />
            <span className="hidden xl:inline">+ Texto Suelto</span>
            <span className="xl:hidden">+ Suelto</span>
          </Button>

          <Button
            onClick={() => handleAddAreaText()}
            className="bg-white hover:bg-zinc-100 text-black border-2 border-black font-black uppercase text-xs h-8 px-2 flex items-center gap-1 shrink-0"
            title="Añadir Caja de Párrafo (Multiline / Justificado en Rectángulo)"
          >
            <Type size={13} />
            <span className="hidden xl:inline">+ Caja Justificada</span>
            <span className="xl:hidden">+ Caja</span>
          </Button>

          <Button
            onClick={() => handleAddBadge()}
            className="bg-white hover:bg-zinc-100 text-black border-2 border-black font-black uppercase text-xs h-8 px-2 flex items-center gap-1 shrink-0"
            title="Añadir Insignia / Pill"
          >
            <Plus size={13} />
            <span className="hidden xl:inline">+ Insignia</span>
          </Button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 border-2 border-black rounded bg-white p-0.5 shrink-0">
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
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom & Pan controls */}
          <div className="hidden sm:flex items-center gap-1 border-2 border-black rounded bg-white px-1.5 h-8">
            <button
              onClick={() => handleZoomDelta(-0.05)}
              className="px-1.5 hover:bg-zinc-100 rounded font-black text-xs"
              title="Alejar"
            >
              -
            </button>
            <span className="text-[10px] font-mono font-black w-7 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => handleZoomDelta(0.05)}
              className="px-1.5 hover:bg-zinc-100 rounded font-black text-xs"
              title="Acercar"
            >
              +
            </button>
            <button
              onClick={handleResetView}
              className="ml-1 px-1.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 border border-black rounded text-[10px] font-bold text-black cursor-pointer"
              title="Centrar y reajustar lienzo (o doble clic en el fondo)"
            >
              Centrar
            </button>
          </div>

          {/* Botón Guardar en Supabase */}
          <Button
            onClick={() => setIsLibraryOpen(true)}
            className="bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
            title="Guardar este Flyer en Supabase"
          >
            <Folder size={13} />
            <span className="hidden md:inline">Guardar</span>
          </Button>

          {/* Botones de Descarga */}
          <Button
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="bg-green-400 hover:bg-green-500 text-black border-2 border-black font-black uppercase text-xs h-8 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
            title="Descargar Imagen PNG en Alta Resolución (HD)"
          >
            <Download size={13} />
            <span className="hidden md:inline">PNG HD</span>
          </Button>

          <Button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="bg-blue-400 hover:bg-blue-500 text-black border-2 border-black font-black uppercase text-xs h-8 px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
            title="Descargar PDF de Impresión"
          >
            <FileText size={13} />
            <span className="hidden md:inline">PDF</span>
          </Button>

          {/* JSON Export/Import */}
          <button
            onClick={handleExportJson}
            className="p-1.5 hover:bg-zinc-200 border-2 border-black rounded bg-white shrink-0"
            title="Exportar Proyecto JSON"
          >
            <FileCode size={13} />
          </button>

          <label className="p-1.5 hover:bg-zinc-200 border-2 border-black rounded bg-white cursor-pointer shrink-0" title="Cargar Proyecto JSON">
            <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
            <Layers size={13} />
          </label>
        </div>

      </div>

      {/* Área Principal de Trabajo: Lienzo (Centro) + Panel de Propiedades (Derecha) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Lienzo Interactivo con Drag and Drop, Pan y Zoom Scroll */}
        <div className="flex-1 flex flex-col items-center justify-center p-0 overflow-hidden relative min-h-0 min-w-0">
          <FlyerCanvas
            canvasConfig={canvasConfig}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            printRef={printAreaRef}
            scale={scale}
            onZoom={handleZoomDelta}
            pan={pan}
            onPanChange={setPan}
            onOpenEmojiModal={() => setIsResourcesModalOpen(true)}
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
          onOpenEmojiModal={() => setIsResourcesModalOpen(true)}
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

      {/* MODAL 5: Panel de Emojis, Stickers, Sellos y Recursos Gráficos */}
      <FlyerResourcesModal
        isOpen={isResourcesModalOpen}
        onClose={() => setIsResourcesModalOpen(false)}
        onInsertEmoji={handleInsertEmoji}
        onAddStickerElement={handleAddStickerElement}
        onAddStampElement={handleAddStampElement}
        onAddDividerElement={handleAddDividerElement}
      />

    </div>
  );
}
