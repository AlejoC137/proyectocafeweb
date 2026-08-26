import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, X, MessageSquareText } from "lucide-react";
import AIAssistantChat from "./AIAssistantChat";

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const location = useLocation();

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (hasUnread) setHasUnread(false);
  };

  return (
    <>
      {/* Panel de Chat */}
      <AIAssistantChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentPath={location.pathname}
      />

      {/* Botón Flotante en la Esquina Inferior Derecha */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 select-none">
        {/* Tooltip / Teaser flotante la primera vez */}
        <AnimatePresence>
          {!isOpen && hasUnread && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              onClick={handleToggle}
              className="hidden sm:flex items-center gap-2 bg-stone-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-amber-500/40 cursor-pointer hover:bg-stone-800 transition-all group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>¿Necesitas ayuda con el café? <strong>Pregúntame</strong></span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón Principal */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleToggle}
          aria-label="Abrir asistente de IA"
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-800 via-amber-700 to-amber-600 text-white shadow-2xl border-2 border-amber-300/40 focus:outline-none focus:ring-4 focus:ring-amber-500/30 group"
        >
          {/* Anillo de pulso sutil */}
          <span className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping pointer-events-none opacity-40" />

          {/* Indicador de notificación */}
          {hasUnread && !isOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-stone-900 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </span>
          )}

          {isOpen ? (
            <X className="w-6 h-6 text-stone-100 transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 text-amber-100 transition-transform duration-200 group-hover:scale-110" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
          )}
        </motion.button>
      </div>
    </>
  );
}
