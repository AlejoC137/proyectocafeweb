// =========================================================
// PANEL LATERAL DE PROPIEDADES ESTILO CANVA / ADOBE
// Control exhaustivo de tipografía, colores, dimensiones y capas
// =========================================================

import React from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
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
  Maximize2,
  Smile,
  Box
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
  onOpenMediaModal = () => {},
  onOpenEmojiModal = () => {}
}) {
  if (!selectedElement) {
    // Modo configuración general del lienzo
    return (
      <div className="w-80 shrink-0 bg-[#fcf8f2] border-l-4 border-black p-4 flex flex-col gap-5 overflow-y-auto h-full max-h-full text-black">
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
    <div className="w-80 shrink-0 bg-[#fcf8f2] border-l-4 border-black p-4 flex flex-col gap-4 overflow-y-auto h-full max-h-full text-black">
      
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

      {/* Botón Acceso Rápido a Emojis & Recursos */}
      <Button
        onClick={() => onOpenEmojiModal()}
        className="w-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 hover:from-amber-400 hover:to-yellow-400 text-black border-2 border-black font-black uppercase text-xs h-9 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
      >
        <Smile size={16} />
        <span>Panel Emojis & Recursos Gráficos</span>
      </Button>

      {/* Selector de Tipo de Texto: Suelto vs Caja Rectangular Justificada */}
      {selectedElement.type === "text" && (
        <div className="flex flex-col gap-1.5 p-2 bg-yellow-50 border-2 border-black rounded-lg">
          <label className="text-[10px] font-black uppercase text-zinc-800 flex items-center justify-between">
            <span>Tipo de Bloque de Texto</span>
            <span className="text-[9px] font-bold text-amber-800">
              {selectedElement.textType === "area" ? "⬛ Caja de Párrafo" : "📌 Texto Suelto"}
            </span>
          </label>

          <div className="grid grid-cols-2 gap-1 bg-zinc-200 p-1 rounded border border-black">
            <button
              type="button"
              onClick={() => {
                onUpdateElement({
                  ...selectedElement,
                  textType: "point",
                  style: {
                    ...(selectedElement.style || {}),
                    textAlign: selectedElement.style?.textAlign === "justify" ? "center" : (selectedElement.style?.textAlign || "center")
                  }
                });
              }}
              className={`py-1.5 px-2 text-[10px] font-black uppercase rounded flex items-center justify-center gap-1 transition-all ${
                selectedElement.textType !== "area"
                  ? "bg-black text-yellow-300 shadow"
                  : "bg-white/80 hover:bg-white text-zinc-700"
              }`}
            >
              <span>📌 Texto Suelto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateElement({
                  ...selectedElement,
                  textType: "area",
                  width: selectedElement.width || 720,
                  height: selectedElement.height || 180,
                  style: {
                    ...(selectedElement.style || {}),
                    textAlign: "justify",
                    lineHeight: selectedElement.style?.lineHeight || 1.3
                  }
                });
              }}
              className={`py-1.5 px-2 text-[10px] font-black uppercase rounded flex items-center justify-center gap-1 transition-all ${
                selectedElement.textType === "area"
                  ? "bg-black text-yellow-300 shadow"
                  : "bg-white/80 hover:bg-white text-zinc-700"
              }`}
            >
              <span>⬛ Caja Justificada</span>
            </button>
          </div>

          <p className="text-[9px] text-zinc-600 leading-tight">
            {selectedElement.textType === "area"
              ? "El texto se justifica y distribuye automáticamente dentro del rectángulo de ancho y alto fijado por los 8 nodos."
              : "Texto sin caja fija. Escala proporcionalmente arrastrando las esquinas del nodo en el lienzo."}
          </p>
        </div>
      )}

      {/* Contenido de Texto */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[11px] font-black uppercase text-zinc-700">
          <span>Texto</span>
          <span className="text-[9px] font-mono text-zinc-500">Doble clic en lienzo para editar</span>
        </div>
        <textarea
          value={selectedElement.text || ""}
          onChange={(e) => {
            const val = e.target.value;
            onUpdateElement({ ...selectedElement, text: val, html: undefined });
          }}
          rows={3}
          className="w-full p-2 border-2 border-black rounded font-sans text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Controles de Nodos: Ancho y Alto */}
      {(selectedElement.textType === "area" || selectedElement.type === "container") ? (
        <div className="flex flex-col gap-2 p-2 bg-white border-2 border-black rounded-lg">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-800 border-b pb-1">
            <span>Dimensiones por Nodos</span>
            <span className="text-[9px] font-mono text-zinc-500">8 Manetas activas</span>
          </div>

          {/* Ancho */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-700">
              <span>Ancho (Width):</span>
              <span className="font-mono text-zinc-600">{selectedElement.width || 720}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="160"
                max={canvasConfig.width || 1080}
                step="10"
                value={selectedElement.width || 720}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateElement({
                    ...selectedElement,
                    width: val,
                    style: { ...(selectedElement.style || {}), width: val }
                  });
                }}
                className="flex-1 accent-black cursor-pointer"
              />
              <Input
                type="number"
                min="100"
                max={canvasConfig.width || 1080}
                value={selectedElement.width || 720}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateElement({
                    ...selectedElement,
                    width: val,
                    style: { ...(selectedElement.style || {}), width: val }
                  });
                }}
                className="w-16 h-7 text-[11px] font-bold border border-black bg-white px-1"
              />
            </div>
          </div>

          {/* Alto */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-700">
              <span>Alto (Height):</span>
              <span className="font-mono text-zinc-600">{selectedElement.height || 180}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="60"
                max={canvasConfig.height || 1920}
                step="10"
                value={selectedElement.height || 180}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateElement({
                    ...selectedElement,
                    height: val,
                    style: { ...(selectedElement.style || {}), height: val }
                  });
                }}
                className="flex-1 accent-black cursor-pointer"
              />
              <Input
                type="number"
                min="40"
                max={canvasConfig.height || 1920}
                value={selectedElement.height || 180}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateElement({
                    ...selectedElement,
                    height: val,
                    style: { ...(selectedElement.style || {}), height: val }
                  });
                }}
                className="w-16 h-7 text-[11px] font-bold border border-black bg-white px-1"
              />
            </div>
          </div>

          {/* Alineación vertical dentro del rectángulo */}
          <div className="flex flex-col gap-1 pt-1 border-t border-zinc-200">
            <label className="text-[10px] font-black uppercase text-zinc-700">
              Alineación Vertical en Caja
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleStyleChange("verticalAlign", "top")}
                className={`py-1 text-[10px] font-bold rounded border border-black ${
                  !style.verticalAlign || style.verticalAlign === "top" ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200"
                }`}
              >
                Arriba
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange("verticalAlign", "center")}
                className={`py-1 text-[10px] font-bold rounded border border-black ${
                  style.verticalAlign === "center" ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200"
                }`}
              >
                Centro
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange("verticalAlign", "bottom")}
                className={`py-1 text-[10px] font-bold rounded border border-black ${
                  style.verticalAlign === "bottom" ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200"
                }`}
              >
                Abajo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-zinc-100 border-2 border-dashed border-black rounded-lg text-[10px] text-zinc-700 leading-snug">
          📌 <strong>Texto Suelto:</strong> Sin ancho fijo. Arrastra las manetas de las esquinas en el lienzo para agrandar o reducir el tamaño de la tipografía proporcionalmente.
        </div>
      )}

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
          onClick={() => handleStyleChange("textAlign", "justify")}
          className={`flex-1 py-1 rounded flex justify-center ${
            style.textAlign === "justify" ? "bg-black text-white" : "hover:bg-zinc-100 text-black"
          }`}
          title="Justificar Texto (Bloque Rectangular)"
        >
          <AlignJustify size={14} />
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
