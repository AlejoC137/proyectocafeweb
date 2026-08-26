import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Send,
  X,
  Trash2,
  Sparkles,
  MapPin,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Shield,
  BookOpen,
  Settings
} from "lucide-react";
import { getApplicationContext, getApplicationContextAsync } from "@/utils/aiContextGatherer";
import PinCodeModal from "@/components/ui/PinCodeModal";
import AIRulesManagerModal from "./AIRulesManagerModal";
import AIKnowledgeIngestionModal from "./AIKnowledgeIngestionModal";

export default function AIAssistantChat({ isOpen, onClose, currentPath }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Admin Security & Modals state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminTargetAction, setAdminTargetAction] = useState(null); // 'rules' | 'knowledge'
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { routeInfo, cleanPath } = getApplicationContext(currentPath);

  // Inicializar mensaje de bienvenida según la página actual
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `¡Hola! Soy tu **Asistente IA** en Proyecto Café Web. ☕🤖\n\nActualmente estás en **${routeInfo.name}**.\n${routeInfo.description}\n\n¿En qué puedo ayudarte hoy sobre esta sección o cualquier módulo del sistema?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [cleanPath]);

  // Auto-scroll al final del chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleOpenAdminSection = (action) => {
    setAdminTargetAction(action);
    if (isAdminAuthenticated) {
      if (action === "rules") setIsRulesModalOpen(true);
      if (action === "knowledge") setIsKnowledgeModalOpen(true);
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    setIsAdminAuthenticated(true);
    if (adminTargetAction === "rules") setIsRulesModalOpen(true);
    if (adminTargetAction === "knowledge") setIsKnowledgeModalOpen(true);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setError(null);
    setInputValue("");

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Obtener el contexto asíncrono con Reglas y Conocimiento ingerido
      const fullContext = await getApplicationContextAsync(currentPath);

      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: apiMessages,
          systemContext: fullContext.contextString,
          temperature: 0.7
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al comunicarse con el asistente de IA");
      }

      const botReply = {
        role: "assistant",
        content: data.reply || "No recibí respuesta.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setError(err.message || "No se pudo obtener respuesta del servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `Chat reiniciado. 📍 Te encuentras en **${routeInfo.name}**. ¿En qué puedo ayudarte?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setError(null);
  };

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderFormattedMessage = (text) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let formattedLine = line;
      const parts = formattedLine.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={idx} className={line.startsWith("- ") ? "pl-3 my-0.5 flex gap-1.5" : "my-0.5"}>
          {line.startsWith("- ") && <span className="text-amber-500 font-bold">•</span>}
          <span>
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="font-semibold text-amber-950 dark:text-amber-200">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </span>
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal de Autenticación de PIN */}
      <PinCodeModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Autorización Administrativa IA"
      />

      {/* Modal de Reglas CRUD */}
      <AIRulesManagerModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Modal de Ingesta Multimodal */}
      <AIKnowledgeIngestionModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
      />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`fixed z-50 flex flex-col bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
            isExpanded
              ? "bottom-4 right-4 left-4 top-20 md:left-auto md:w-[680px] md:h-[750px]"
              : "bottom-20 right-4 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[82vh]"
          }`}
        >
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white p-3.5 px-4 flex items-center justify-between shadow-md select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shadow-inner">
                <Bot className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-stone-900 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-stone-100">
                  <span>Asistente Café IA</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono font-medium border border-amber-500/20">
                    DeepSeek
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-stone-300 truncate max-w-[190px]">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{routeInfo.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-stone-300">
              <button
                onClick={() => handleOpenAdminSection("rules")}
                title="CRUD de Reglas de Admin"
                className="p-1.5 rounded-lg hover:bg-white/10 text-amber-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
              >
                <Shield className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={() => handleOpenAdminSection("knowledge")}
                title="Ingesta Multimodal (PDF, YouTube, Voz)"
                className="p-1.5 rounded-lg hover:bg-white/10 text-amber-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
              </button>

              <div className="h-4 w-px bg-stone-700 mx-0.5" />

              <button
                onClick={handleClearChat}
                title="Limpiar conversación"
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Reducir ventana" : "Expandir ventana"}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                title="Cerrar chat"
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Badge contextual de ubicación y controles admin */}
          <div className="bg-amber-50/90 dark:bg-stone-800/90 border-b border-amber-200/50 dark:border-stone-700/50 px-3.5 py-1.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate font-medium">
                Contexto activo: <span className="underline decoration-amber-400">{cleanPath}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => handleOpenAdminSection("rules")}
                className="hover:underline font-semibold text-amber-800 dark:text-amber-300"
              >
                🛡️ Reglas
              </button>
              <span>•</span>
              <button
                onClick={() => handleOpenAdminSection("knowledge")}
                className="hover:underline font-semibold text-amber-800 dark:text-amber-300"
              >
                📥 Ingesta
              </button>
            </div>
          </div>

          {/* Lista de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/50 dark:bg-stone-900/50">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isUser
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-stone-800 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`group relative max-w-[84%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-amber-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700/80 rounded-tl-none"
                      }`}
                    >
                      {renderFormattedMessage(msg.content)}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-stone-400">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopyText(msg.content, idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-stone-600 dark:hover:text-stone-200"
                          title="Copiar texto"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5 items-center text-stone-500 text-xs py-1"
              >
                <div className="w-7 h-7 rounded-full bg-stone-800 text-amber-300 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-300" />
                  <span className="text-stone-500 dark:text-stone-400 ml-1 font-medium">DeepSeek está pensando...</span>
                </div>
              </motion.div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-300 flex flex-col gap-1">
                <span className="font-semibold">⚠️ Ocurrió un error</span>
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="self-end text-[11px] font-medium underline text-red-600 hover:text-red-800 dark:hover:text-red-200 mt-1"
                >
                  Descartar
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas */}
          {routeInfo.suggestedPrompts && routeInfo.suggestedPrompts.length > 0 && messages.length <= 3 && (
            <div className="px-3.5 py-2 bg-white dark:bg-stone-800/90 border-t border-stone-200 dark:border-stone-700/60 overflow-x-auto flex gap-1.5 no-scrollbar">
              {routeInfo.suggestedPrompts.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] bg-amber-50 hover:bg-amber-100 dark:bg-stone-700/60 dark:hover:bg-stone-700 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-stone-600 rounded-full px-2.5 py-1 transition-colors font-medium"
                >
                  💡 {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Área de Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Pregunta sobre ${routeInfo.name}...`}
              disabled={isLoading}
              className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:hover:bg-amber-600 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
