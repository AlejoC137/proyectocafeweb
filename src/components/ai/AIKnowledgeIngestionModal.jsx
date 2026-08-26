import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Youtube,
  Mic,
  MicOff,
  Upload,
  Plus,
  Trash2,
  X,
  Sparkles,
  Link,
  BookOpen,
  CheckCircle,
  FileCode,
  Volume2
} from "lucide-react";
import {
  getAIKnowledge,
  saveAIKnowledgeItem,
  deleteAIKnowledgeItem
} from "@/utils/aiRulesKnowledgeManager";
import {
  extractTextFromFile,
  parseYouTubeURL,
  VoiceDictationHandler
} from "@/utils/mediaIngestionHelpers";

const TABS = [
  { id: "pdf", label: "PDF / Archivo", icon: FileText },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "voice", label: "Dictado Voz", icon: Mic },
  { id: "text", label: "Nota Libre", icon: BookOpen }
];

export default function AIKnowledgeIngestionModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("pdf");
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [parsedYoutube, setParsedYoutube] = useState(null);

  // Voice dictation state
  const [isRecording, setIsRecording] = useState(false);
  const [dictationHandler, setDictationHandler] = useState(null);
  const [interimText, setInterimText] = useState("");

  const loadKnowledge = async () => {
    setIsLoading(true);
    try {
      const data = await getAIKnowledge();
      setKnowledgeList(data || []);
    } catch (e) {
      console.error("Error al cargar conocimiento:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadKnowledge();
      setDictationHandler(new VoiceDictationHandler());
    }
    return () => {
      if (dictationHandler) dictationHandler.stop();
    };
  }, [isOpen]);

  // Manejador de archivo PDF / Texto
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTitle(file.name);
    setIsLoading(true);
    try {
      const extractedText = await extractTextFromFile(file);
      setContent(extractedText);
      setMessage(`Texto extraído exitosamente de ${file.name}`);
    } catch (err) {
      setMessage(`Error al leer archivo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador de URL de YouTube
  const handleYoutubeUrlChange = (url) => {
    setYoutubeUrl(url);
    const ytData = parseYouTubeURL(url);
    setParsedYoutube(ytData);
    if (ytData && !title) {
      setTitle(`Video de YouTube (${ytData.videoId})`);
    }
  };

  // Manejadores de Dictado por Voz
  const handleStartRecording = () => {
    if (!dictationHandler || !dictationHandler.isSupported) {
      alert("El reconocimiento de voz nativo no está disponible en este navegador. Utiliza Chrome o Edge.");
      return;
    }

    setIsRecording(true);
    setInterimText("");
    dictationHandler.start(
      (result) => {
        if (result.final) {
          setContent((prev) => (prev ? prev + " " + result.final : result.final));
        }
        setInterimText(result.interim);
      },
      (err) => {
        console.error("Error en dictado:", err);
        setIsRecording(false);
      }
    );
  };

  const handleStopRecording = () => {
    if (dictationHandler) {
      dictationHandler.stop();
    }
    setIsRecording(false);
    setInterimText("");
  };

  // Guardar documento ingerido
  const handleSaveKnowledge = async (e) => {
    e.preventDefault();
    if (!title.trim() || (!content.trim() && !parsedYoutube)) {
      setMessage("Proporciona un título y contenido válido.");
      return;
    }

    setIsLoading(true);
    try {
      let finalContent = content;
      let metadata = {};

      if (activeTab === "youtube" && parsedYoutube) {
        metadata = parsedYoutube;
        finalContent = `[RECURSO DE YOUTUBE]\nURL: ${parsedYoutube.canonicalUrl}\nID Video: ${parsedYoutube.videoId}\n\nNotas/Resumen:\n${content || "Sin notas adicionales."}`;
      }

      const itemToSave = {
        type: activeTab,
        title,
        content: finalContent,
        metadata
      };

      await saveAIKnowledgeItem(itemToSave);
      setMessage("Documento ingerido e incorporado al conocimiento de la IA correctamente.");
      setTitle("");
      setContent("");
      setYoutubeUrl("");
      setParsedYoutube(null);
      await loadKnowledge();
    } catch (err) {
      setMessage(`Error al guardar: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este conocimiento ingerido?")) {
      await deleteAIKnowledgeItem(id);
      setKnowledgeList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[700px] max-h-[92vh]"
      >
        {/* Encabezado */}
        <div className="bg-stone-900 text-white p-4 px-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-100 flex items-center gap-2">
                Ingesta Multimodal de Conocimiento para la IA
                <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                  PDF / YouTube / Voz
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Alimenta a la IA con documentos, videos de capacitación, audios dictados o manuales operativos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificaciones */}
        {message && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="font-bold">✕</button>
          </div>
        )}

        {/* Panel Principal Dividido (Formulario / Lista) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Columna Izquierda: Formulario de Ingesta */}
          <div className="md:col-span-7 border-r border-stone-200 dark:border-stone-800 p-5 overflow-y-auto flex flex-col gap-4">
            {/* Pestañas de Formato */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (isRecording) handleStopRecording();
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveKnowledge} className="flex-1 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título del Conocimiento / Documento
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Manual de Procedimientos de Barista"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Contenido según pestaña */}
              {activeTab === "pdf" && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Seleccionar Archivo (PDF, TXT, CSV, JSON, MD)
                  </label>
                  <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-4 text-center hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.txt,.csv,.json,.md"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                    <span className="text-xs text-stone-600 dark:text-stone-300 font-medium block">
                      Haz clic o arrastra un archivo aquí
                    </span>
                    <span className="text-[10px] text-stone-400">PDF, TXT, CSV, JSON o MD</span>
                  </div>
                </div>
              )}

              {activeTab === "youtube" && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Enlace de Video de YouTube
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full text-xs p-2.5 pl-8 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <Youtube className="w-4 h-4 text-red-500 absolute left-2.5 top-3" />
                  </div>

                  {parsedYoutube && (
                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center gap-3">
                      <img
                        src={parsedYoutube.thumbnailUrl}
                        alt="YouTube Thumbnail"
                        className="w-16 h-10 object-cover rounded-lg"
                      />
                      <div className="text-[11px] text-stone-600 dark:text-stone-300 truncate">
                        <span className="font-semibold block text-stone-900 dark:text-white">Video detectado</span>
                        <span className="truncate block font-mono text-[10px]">{parsedYoutube.videoId}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "voice" && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Dictado de Instrucciones por Voz
                  </label>
                  <div className="flex items-center justify-between p-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <Volume2 className="w-4 h-4 text-amber-500" />
                      <span>{isRecording ? "Grabando voz..." : "Haz clic para comenzar a hablar"}</span>
                    </div>

                    {isRecording ? (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 animate-pulse"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        Detener
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        Iniciar Dictado
                      </button>
                    )}
                  </div>
                  {interimText && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 italic px-1">
                      Transcripción en vivo: "{interimText}"
                    </p>
                  )}
                </div>
              )}

              {/* Área de Texto / Previsualización */}
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {activeTab === "youtube" ? "Notas / Puntos Clave del Video" : "Contenido Extraído / Transcrito"}
                </label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Aquí aparecerá el texto extraído o transcrito. Puedes editarlo libremente..."
                  className="w-full flex-1 text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ingestar e Incorporar a la IA
              </button>
            </form>
          </div>

          {/* Columna Derecha: Documentos Ingeridos */}
          <div className="md:col-span-5 p-5 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col overflow-hidden">
            <h3 className="font-bold text-xs text-stone-800 dark:text-stone-100 mb-3 flex items-center justify-between">
              <span>Base de Conocimiento Actual</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono px-2 py-0.5 rounded">
                {knowledgeList.length} ítems
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {knowledgeList.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs">
                  No hay conocimiento ingerido aún. Agrega PDFs, videos de YouTube o dictados.
                </div>
              ) : (
                knowledgeList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.type === "pdf" && <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        {item.type === "youtube" && <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        {item.type === "voice" && <Mic className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                        {item.type === "text" && <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        <h4 className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-tight">
                        {item.content}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      title="Eliminar este conocimiento"
                      className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
