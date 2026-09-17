// =========================================================
// PANEL DE EMOJIS Y RECURSOS GRÁFICOS PARA FLYER STUDIO
// Emojis organizados, sellos de evento, divisores y recursos
// =========================================================

import React, { useState } from "react";
import { X, Sparkles, Smile, Tag, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMOJI_CATEGORIES = [
  {
    id: "music",
    name: "Música & Sonido",
    icon: "🎵",
    emojis: ["🎵", "🎶", "🎸", "🎷", "🎺", "🎹", "🎤", "🎧", "🥁", "🎻", "📻", "🎼", "🔊", "🎙️", "🪕", "🕺", "💃"]
  },
  {
    id: "cafe",
    name: "Café & Gastronomía",
    icon: "☕",
    emojis: ["☕", "🫖", "🍵", "🥐", "🥖", "🍰", "🎂", "🍩", "🍪", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥪", "🧀", "🥞", "🧇"]
  },
  {
    id: "agenda",
    name: "Fechas & Horarios",
    icon: "📅",
    emojis: ["📅", "🗓️", "⏰", "⏳", "🕒", "📌", "📍", "🎟️", "🎫", "🏷️", "🚩", "📆", "📝", "📢", "🔔"]
  },
  {
    id: "highlights",
    name: "Destacados & Brillos",
    icon: "✨",
    emojis: ["✨", "⭐", "🌟", "💫", "🔥", "💥", "⚡", "👑", "💎", "🏆", "🎯", "🥇", "💯", "🪄", "🔮", "☀️", "🌙"]
  },
  {
    id: "party",
    name: "Social & Celebración",
    icon: "🎉",
    emojis: ["🎉", "🎊", "🥳", "🎈", "🎭", "🎪", "🎨", "🎬", "📸", "🍿", "💌", "🍻", "🥂", "✨", "🎁"]
  },
  {
    id: "culture",
    name: "Libros & Cultura",
    icon: "📚",
    emojis: ["📚", "📖", "🖋️", "🖌️", "🎨", "🧠", "💡", "🕊️", "🌿", "🌻", "🪴", "☕", "♟️", "🧩", "📜"]
  },
  {
    id: "symbols",
    name: "Símbolos & Flechas",
    icon: "✦",
    emojis: ["✦", "✧", "★", "☆", "◈", "❖", "•", "▪", "▸", "→", "↓", "✓", "✔", "❤️", "💛", "🖤"]
  }
];

const QUICK_STAMPS = [
  { text: "MÚSICA EN VIVO", bg: "#c59b27", color: "#1c140e" },
  { text: "ENTRADA LIBRE", bg: "#22c55e", color: "#000000" },
  { text: "CUPO LIMITADO", bg: "#ef4444", color: "#ffffff" },
  { text: "PREVENTA EXCLUSIVA", bg: "#eab308", color: "#000000" },
  { text: "CAFÉ DE ORIGEN", bg: "#854d0e", color: "#fef08a" },
  { text: "PROYECTO CAFÉ CENTRAL", bg: "#000000", color: "#fef08a" },
  { text: "2x1 EN CÓCTELES", bg: "#ec4899", color: "#ffffff" },
  { text: "TALLER ABIERTO", bg: "#3b82f6", color: "#ffffff" },
  { text: "RESERVA TU MESA", bg: "#14b8a6", color: "#ffffff" },
  { text: "HOY", bg: "#f97316", color: "#000000" }
];

const TYPOGRAPHIC_DIVIDERS = [
  "— · ✦ · —",
  "• • • ❖ • • •",
  "══════ ◈ ══════",
  "✦  ✦  ✦",
  "─ ─ ─ ❖ ─ ─ ─",
  "• • •",
  "──────────────",
  "☕ ─ · ─ ☕",
  "★ ★ ★ ★ ★"
];

export default function FlyerResourcesModal({
  isOpen,
  onClose,
  onInsertEmoji = () => {},
  onAddStickerElement = () => {},
  onAddStampElement = () => {},
  onAddDividerElement = () => {}
}) {
  const [activeTab, setActiveTab] = useState("emojis"); // "emojis" | "stamps" | "dividers"
  const [selectedCategory, setSelectedCategory] = useState("music");
  const [copiedNotification, setCopiedNotification] = useState("");

  if (!isOpen) return null;

  const showNotification = (msg) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(""), 2200);
  };

  const handleEmojiClick = (emoji) => {
    onInsertEmoji(emoji);
    showNotification(`Emoji ${emoji} insertado`);
  };

  const handleAddEmojiSticker = (emoji) => {
    onAddStickerElement(emoji);
    showNotification(`Sticker ${emoji} agregado al lienzo`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#fcf8f2] border-4 border-black rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1c140e] text-[#fcf8f2] px-5 py-3.5 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={20} />
            <h2 className="font-black uppercase tracking-wider text-sm sm:text-base">
              Recursos Gráficos, Emojis & Sellos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-red-400 hover:bg-red-500 border-2 border-black rounded flex items-center justify-center text-black font-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b-2 border-black bg-zinc-100 px-4 gap-2 pt-2">
          <button
            onClick={() => setActiveTab("emojis")}
            className={`px-4 py-2 font-black uppercase text-xs border-t-2 border-x-2 border-black rounded-t-md transition-all flex items-center gap-1.5 ${
              activeTab === "emojis" ? "bg-white translate-y-[2px]" : "bg-zinc-200/80 hover:bg-zinc-200"
            }`}
          >
            <Smile size={14} />
            <span>Emojis de Evento</span>
          </button>

          <button
            onClick={() => setActiveTab("stamps")}
            className={`px-4 py-2 font-black uppercase text-xs border-t-2 border-x-2 border-black rounded-t-md transition-all flex items-center gap-1.5 ${
              activeTab === "stamps" ? "bg-white translate-y-[2px]" : "bg-zinc-200/80 hover:bg-zinc-200"
            }`}
          >
            <Tag size={14} />
            <span>Sellos & Pastillas</span>
          </button>

          <button
            onClick={() => setActiveTab("dividers")}
            className={`px-4 py-2 font-black uppercase text-xs border-t-2 border-x-2 border-black rounded-t-md transition-all flex items-center gap-1.5 ${
              activeTab === "dividers" ? "bg-white translate-y-[2px]" : "bg-zinc-200/80 hover:bg-zinc-200"
            }`}
          >
            <Minus size={14} />
            <span>Separadores Tipográficos</span>
          </button>
        </div>

        {/* Notificación Flotante */}
        {copiedNotification && (
          <div className="bg-green-400 border-b-2 border-black px-4 py-1.5 text-xs font-black text-black flex items-center gap-2 justify-center">
            <Check size={14} />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto bg-[#faf7f2]">
          
          {/* TAB 1: EMOJIS */}
          {activeTab === "emojis" && (
            <div className="flex flex-col gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase rounded border-2 border-black transition-all flex items-center gap-1 ${
                      selectedCategory === cat.id
                        ? "bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="bg-white border-2 border-black rounded-lg p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-9 gap-2">
                  {EMOJI_CATEGORIES.find((c) => c.id === selectedCategory)?.emojis.map((emoji, idx) => (
                    <div key={idx} className="flex flex-col items-center group relative">
                      <button
                        onClick={() => handleEmojiClick(emoji)}
                        className="w-12 h-12 flex items-center justify-center text-2xl hover:scale-125 transition-transform hover:bg-yellow-100 rounded-lg cursor-pointer border border-transparent hover:border-black"
                        title="Haz clic para insertar en el texto"
                      >
                        {emoji}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddEmojiSticker(emoji);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute -bottom-2 bg-black text-yellow-300 text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 hover:scale-105"
                        title="Agregar como Sticker grande en lienzo"
                      >
                        + Sticker
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-300 p-2.5 rounded-lg text-xs font-bold text-amber-900 flex items-center gap-2">
                <span>💡</span>
                <span>
                  Haz clic en un emoji para insertarlo en el texto activo, o usa el botón <strong>+ Sticker</strong> para añadirlo como elemento gigante al flyer.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: SELLOS & BADGES */}
          {activeTab === "stamps" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold text-zinc-600">
                Selecciona una pastilla o sello para insertarlo como elemento prediseñado en tu flyer:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_STAMPS.map((stamp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onAddStampElement(stamp);
                      showNotification(`Sello "${stamp.text}" agregado al lienzo`);
                      onClose();
                    }}
                    className="p-3 border-2 border-black rounded-lg flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all bg-white"
                  >
                    <span
                      style={{
                        backgroundColor: stamp.bg,
                        color: stamp.color,
                        borderRadius: "16px",
                        padding: "4px 14px",
                        fontSize: "12px",
                        fontWeight: "900",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        border: "1.5px solid black"
                      }}
                    >
                      {stamp.text}
                    </span>
                    <span className="text-xs font-black text-zinc-500 hover:text-black">
                      + Insertar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SEPARADORES TIPOGRÁFICOS */}
          {activeTab === "dividers" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold text-zinc-600">
                Líneas y adornos para estructurar la jerarquía visual entre títulos, fechas y aliados:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {TYPOGRAPHIC_DIVIDERS.map((divider, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onAddDividerElement(divider);
                      showNotification(`Separador agregado al lienzo`);
                      onClose();
                    }}
                    className="p-3.5 border-2 border-black rounded-lg flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-50 transition-all bg-white"
                  >
                    <span className="font-mono text-base font-black tracking-widest text-zinc-800">
                      {divider}
                    </span>
                    <span className="text-xs font-black uppercase text-zinc-600 bg-zinc-100 px-2 py-1 rounded border border-black">
                      + Añadir
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-zinc-100 border-t-2 border-black px-5 py-3 flex items-center justify-end">
          <Button
            onClick={onClose}
            className="bg-black text-white hover:bg-zinc-800 font-black text-xs uppercase px-4 h-8"
          >
            Cerrar
          </Button>
        </div>

      </div>
    </div>
  );
}
