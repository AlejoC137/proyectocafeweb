// =========================================================
// MODAL DE KIT DE COMUNICACIÓN Y COPYS MULTICANAL
// Genera y permite copiar copys para Instagram y WhatsApp en 1 clic
// =========================================================

import React, { useState } from "react";
import { Copy, Check, Instagram, MessageCircle, Share2, Sparkles, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FlyerCopyModal({
  isOpen,
  onClose,
  copies = {},
  onUpdateCopies = () => {},
  flyerTitle = ""
}) {
  const [activeTab, setActiveTab] = useState("instagram_post"); // "instagram_post" | "instagram_story" | "whatsapp_message" | "whatsapp_status"
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const currentCopy = copies[activeTab] || "";

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTextChange = (e) => {
    onUpdateCopies({
      ...copies,
      [activeTab]: e.target.value
    });
  };

  const tabsConfig = [
    {
      id: "instagram_post",
      label: "Post Instagram",
      icon: <Instagram size={16} className="text-pink-600" />,
      tag: "Feed / Caption",
      description: "Copy completo con gancho, desarrollo, llamado a la acción y hashtags."
    },
    {
      id: "instagram_story",
      label: "Historia Instagram",
      icon: <Smartphone size={16} className="text-purple-600" />,
      tag: "Stories / Reels",
      description: "Frases de impacto directo listas para pegar en stickers de texto."
    },
    {
      id: "whatsapp_message",
      label: "Mensaje WhatsApp",
      icon: <MessageCircle size={16} className="text-emerald-600" />,
      tag: "Grupos / Difusión",
      description: "Formato con negritas (*texto*), viñetas, emojis y enlace de registro."
    },
    {
      id: "whatsapp_status",
      label: "Estado WhatsApp",
      icon: <Share2 size={16} className="text-green-500" />,
      tag: "Estados / Status",
      description: "Llamado a la acción ultra-corto de 1 a 2 líneas para status móvil."
    }
  ];

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-[#fcf8f2] border-4 border-black rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-yellow-300 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-yellow-300 rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase italic tracking-wide text-black">
                Kit de Comunicación & Copys
              </h2>
              <p className="text-xs font-bold text-black/80 truncate max-w-md">
                Textos listos para publicar: {flyerTitle || "Evento Proyecto Café"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-red-400 hover:bg-red-500 border-2 border-black rounded-md flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-100 border-b-2 border-black">
          {tabsConfig.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`p-2.5 rounded-lg border-2 border-black flex flex-col items-start gap-1 transition-all ${
                  isActive
                    ? "bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-zinc-200/80 hover:bg-zinc-200 opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-1.5 w-full justify-between">
                  <span className="flex items-center gap-1 font-black text-xs uppercase text-black">
                    {t.icon}
                    <span className="truncate">{t.label}</span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-300">
                  {t.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Info & Actions */}
        <div className="p-4 flex-1 flex flex-col overflow-hidden bg-[#faf7f2]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-700 italic">
              {tabsConfig.find((t) => t.id === activeTab)?.description}
            </span>
            <span className="text-xs font-mono font-bold text-zinc-500">
              {currentCopy.length} caracteres
            </span>
          </div>

          {/* Textarea for preview & live editing */}
          <textarea
            value={currentCopy}
            onChange={handleTextChange}
            placeholder={`El texto para ${activeTab} se generará automáticamente o puedes escribirlo aquí...`}
            rows={10}
            className="w-full flex-1 p-4 bg-white border-2 border-black rounded-lg font-sans text-sm leading-relaxed text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none shadow-inner"
          />

          {/* Action Toolbar */}
          <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t-2 border-black/20">
            <div className="text-[11px] font-bold text-zinc-500 hidden sm:block">
              💡 Puedes editar el texto directamente antes de copiarlo.
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                onClick={() => handleCopy(activeTab, currentCopy)}
                disabled={!currentCopy.trim()}
                className={`h-10 px-5 font-black uppercase text-xs border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-2 transition-all ${
                  copiedKey === activeTab
                    ? "bg-green-400 text-black hover:bg-green-400"
                    : "bg-yellow-300 hover:bg-yellow-400 text-black"
                }`}
              >
                {copiedKey === activeTab ? (
                  <>
                    <Check size={16} />
                    <span>¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copiar Este Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
