// =========================================================
// PANEL LATERAL DE PROPIEDADES ESTILO CANVA / ADOBE
// Control exhaustivo de tipografía, colores, dimensiones y capas
// =========================================================

import React from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Move,
  Type,
  Palette,
  Maximize2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AVAILABLE_FONTS = [
  { name: "Space Grotesk (Moderno/Urbano)", value: "'Space Grotesk', sans-serif" },
  { name: "Playfair Display (Elegante/Editorial)", value: "'Playfair Display', serif" },
  { name: "Montserrat (Limpio/Geométrico)", value: "'Montserrat', sans-serif" },
  { name: "Lilita One (Retro/Impacto)", value: "'Lilita One', cursive" },
  { name: "System Sans", value: "system-ui, sans-serif" },
  { name: "Georgia (Clásico)", value: "Georgia, serif" }
];

export default function FlyerPropertiesPanel({
  selectedElement,
  onUpdateElement = () => {},
  onDeleteElement = () => {},
  onDuplicateElement = () => {},
  onBringForward = () => {},
  onSendBackward = () => {},
  canvasConfig = {},
  onUpdateCanvasConfig = () => {},
  onOpenMediaModal = () => {}
}) {
  if (!selectedElement) {
    // Modo configuración general del lienzo
    return (
      <div className="w-80 bg-[#fcf8f2] border-l-4 border-black p-4 flex flex-col gap-5 overflow-y-auto h-full text-black">
        <div className="flex items-center gap-2 border-b-2 border-black pb-2">
          <Palette size={18} />
          <h3 className="font-black uppercase italic text-sm tracking-wide">
            Ajustes del Lienzo
          </h3>
        </div>

        {/* Color de fondo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase text-zinc-700">
            Color de Fondo Principal
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={canvasConfig.backgroundColor || "#1c140e"}
              onChange={(e) => onUpdateCanvasConfig({ backgroundColor: e.target.value })}
              className="w-10 h-10 border-2 border-black rounded cursor-pointer p-0.5 bg-white"
            />
            <Input
              value={canvasConfig.backgroundColor || "#1c140e"}
              onChange={(e) => onUpdateCanvasConfig({ backgroundColor: e.target.value })}
              className="font-mono text-xs border-2 border-black h-9 bg-white uppercase font-bold"
            />
          </div>
        </div>

        {/* Imagen de fondo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase text-zinc-700">
            Imagen de Fondo
          </label>
          <Button
            onClick={() => onOpenMediaModal("background")}
            className="w-full bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black uppercase text-xs h-9 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
          >
            {canvasConfig.backgroundImageUrl ? "🖼️ Cambiar Imagen" : "➕ Seleccionar Foto de Fondo"}
          </Button>

          {canvasConfig.backgroundImageUrl && (
            <div className="flex flex-col gap-2 p-2 bg-white border-2 border-black rounded mt-1">
              <div className="aspect-video w-full rounded overflow-hidden relative border border-zinc-300">
                <img
                  src={canvasConfig.backgroundImageUrl}
                  alt="Fondo"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Slider de Oscurecimiento (Overlay) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>Oscurecimiento (Contraste):</span>
                  <span>
                    {Math.round(
                      parseFloat(
                        canvasConfig.backgroundOverlay?.match(/rgba\(0,0,0,([\d.]+)\)/)?.[1] || "0.4"
                      ) * 100
                    )}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={parseFloat(
                    canvasConfig.backgroundOverlay?.match(/rgba\(0,0,0,([\d.]+)\)/)?.[1] || "0.4"
                  )}
                  onChange={(e) =>
                    onUpdateCanvasConfig({
                      backgroundOverlay: `rgba(0,0,0,${e.target.value})`
                    })
                  }
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <Button
                onClick={() => onUpdateCanvasConfig({ backgroundImageUrl: "" })}
                className="w-full bg-red-400 hover:bg-red-500 text-black border-2 border-black font-black uppercase text-[10px] h-7"
              >
                Quitar Foto de Fondo
              </Button>
            </div>
          )}
        </div>

        <div className="p-3 bg-yellow-100/60 border-2 border-dashed border-black rounded-lg text-xs font-bold text-zinc-700 leading-relaxed">
          👉 <strong>Tip Canva:</strong> Haz clic sobre cualquier elemento del volante para cambiar su texto, tamaño, tipografía y posición.
        </div>
      </div>
    );
  }

  // Modo edición de elemento seleccionado
  const style = selectedElement.style || {};

  const handleStyleChange = (key, value) => {
    onUpdateElement({
      ...selectedElement,
      style: {
        ...style,
        [key]: value
      }
    });
  };

  return (
    <div className="w-80 bg-[#fcf8f2] border-l-4 border-black p-4 flex flex-col gap-4 overflow-y-auto h-full text-black">
      
      {/* Element Header & Actions */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-1.5">
          <Type size={16} />
          <span className="font-black uppercase italic text-xs tracking-wider">
            {selectedElement.type === "badge"
              ? "Insignia / Pill"
              : selectedElement.type === "container"
              ? "Caja de Contenido"
              : "Elemento de Texto"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateElement(selectedElement)}
            className="p-1 hover:bg-zinc-200 border border-black rounded"
            title="Duplicar"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onBringForward(selectedElement)}
            className="p-1 hover:bg-zinc-200 border border-black rounded"
            title="Traer al frente"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={() => onSendBackward(selectedElement)}
            className="p-1 hover:bg-zinc-200 border border-black rounded"
            title="Enviar atrás"
          >
            <ArrowDown size={13} />
          </button>
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1 bg-red-400 hover:bg-red-500 border border-black rounded text-black font-black"
            title="Eliminar elemento"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Contenido de Texto */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-black uppercase text-zinc-700">
          Texto
        </label>
        <textarea
          value={selectedElement.text || ""}
          onChange={(e) => onUpdateElement({ ...selectedElement, text: e.target.value })}
          rows={3}
          className="w-full p-2 border-2 border-black rounded font-sans text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Selector de Fuente */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-black uppercase text-zinc-700">
          Tipografía
        </label>
        <select
          value={style.fontFamily || "'Space Grotesk', sans-serif"}
          onChange={(e) => handleStyleChange("fontFamily", e.target.value)}
          className="w-full h-8 px-2 border-2 border-black rounded font-bold text-xs bg-white cursor-pointer"
        >
          {AVAILABLE_FONTS.map((f, i) => (
            <option key={i} value={f.value}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tamaño y Peso */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-zinc-700">
            Tamaño (px)
          </label>
          <Input
            type="number"
            min="10"
            max="180"
            value={style.fontSize || 24}
            onChange={(e) => handleStyleChange("fontSize", Number(e.target.value))}
            className="h-8 border-2 border-black font-bold text-xs bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-zinc-700">
            Grosor
          </label>
          <select
            value={style.fontWeight || "bold"}
            onChange={(e) => handleStyleChange("fontWeight", e.target.value)}
            className="h-8 px-2 border-2 border-black rounded font-bold text-xs bg-white cursor-pointer"
          >
            <option value="normal">Normal (400)</option>
            <option value="600">Semibold (600)</option>
            <option value="bold">Bold (700)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>
      </div>

      {/* Alineación y Transformación */}
      <div className="flex items-center justify-between gap-1 border-2 border-black p-1 bg-white rounded">
        <button
          onClick={() => handleStyleChange("textAlign", "left")}
          className={`flex-1 py-1 rounded flex justify-center ${
            style.textAlign === "left" ? "bg-black text-white" : "hover:bg-zinc-100 text-black"
          }`}
          title="Alinear Izquierda"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => handleStyleChange("textAlign", "center")}
          className={`flex-1 py-1 rounded flex justify-center ${
            style.textAlign === "center" ? "bg-black text-white" : "hover:bg-zinc-100 text-black"
          }`}
          title="Alinear Centro"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => handleStyleChange("textAlign", "right")}
          className={`flex-1 py-1 rounded flex justify-center ${
            style.textAlign === "right" ? "bg-black text-white" : "hover:bg-zinc-100 text-black"
          }`}
          title="Alinear Derecha"
        >
          <AlignRight size={14} />
        </button>
        <button
          onClick={() =>
            handleStyleChange(
              "textTransform",
              style.textTransform === "uppercase" ? "none" : "uppercase"
            )
          }
          className={`flex-1 py-1 font-black text-xs rounded text-center ${
            style.textTransform === "uppercase" ? "bg-black text-white" : "hover:bg-zinc-100 text-black"
          }`}
          title="Mayúsculas"
        >
          MAY
        </button>
      </div>

      {/* Color de Texto y Color de Fondo */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-zinc-700">
            Color Texto
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={style.color || "#ffffff"}
              onChange={(e) => handleStyleChange("color", e.target.value)}
              className="w-7 h-7 border-2 border-black rounded cursor-pointer p-0.5 bg-white shrink-0"
            />
            <Input
              value={style.color || "#ffffff"}
              onChange={(e) => handleStyleChange("color", e.target.value)}
              className="h-7 border border-black font-mono text-[10px] bg-white px-1 font-bold"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-zinc-700">
            Color Fondo
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={
                style.backgroundColor && style.backgroundColor !== "transparent"
                  ? style.backgroundColor
                  : "#c59b27"
              }
              onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
              className="w-7 h-7 border-2 border-black rounded cursor-pointer p-0.5 bg-white shrink-0"
            />
            <button
              onClick={() => handleStyleChange("backgroundColor", "transparent")}
              className="text-[9px] font-black border border-black rounded px-1.5 py-1 bg-zinc-100 hover:bg-zinc-200"
              title="Quitar fondo"
            >
              Transp.
            </button>
          </div>
        </div>
      </div>

      {/* Espaciado de Letras (Letter Spacing) & Padding */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-zinc-700">
            Tracking (px)
          </label>
          <Input
            type="number"
            min="-2"
            max="15"
            value={style.letterSpacing || 0}
            onChange={(e) => handleStyleChange("letterSpacing", Number(e.target.value))}
            className="h-8 border-2 border-black font-bold text-xs bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-zinc-700">
            Bordes Curvos
          </label>
          <Input
            type="number"
            min="0"
            max="50"
            value={style.borderRadius || 0}
            onChange={(e) => handleStyleChange("borderRadius", Number(e.target.value))}
            className="h-8 border-2 border-black font-bold text-xs bg-white"
          />
        </div>
      </div>

      {/* Centrado automático en lienzo */}
      <div className="pt-2 border-t-2 border-black/20 flex flex-col gap-1.5">
        <label className="text-[11px] font-black uppercase text-zinc-700">
          Alineación Rápida
        </label>
        <Button
          onClick={() => {
            const nominalWidth = canvasConfig.width || 1080;
            onUpdateElement({
              ...selectedElement,
              x: Math.round(nominalWidth / 2)
            });
          }}
          className="w-full bg-zinc-200 hover:bg-zinc-300 text-black border-2 border-black font-black uppercase text-[10px] h-8 flex items-center justify-center gap-1.5"
        >
          <AlignCenter size={12} />
          <span>Centrar en el Lienzo Horizontalmente</span>
        </Button>
      </div>

    </div>
  );
}
