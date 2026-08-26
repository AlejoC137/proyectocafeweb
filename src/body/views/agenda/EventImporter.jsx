import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { 
  FileJson, 
  Copy, 
  Check, 
  Upload, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import supabase from "@/config/supabaseClient";
import { AGENDA } from "@/redux/actions-types";
import { getAllFromTable } from "@/redux/actions";
import { useDeepSeek } from "@/hooks/useDeepSeek";

const PROMPT_MAESTRO = `Actúa como un Asistente de Gestión de Eventos. Tu tarea es generar un objeto JSON para un nuevo evento basado en la información proporcionada.

Estructura obligatoria del JSON:
{
  "nombreES": "Nombre en español",
  "nombreEN": "Nombre en inglés o alternativo",
  "fecha": "YYYY-MM-DD",
  "horaInicio": "HH:mm",
  "horaFinal": "HH:mm",
  "bannerIMG": "URL de la imagen o vacio",
  "linkInscripcion": "URL de inscripción o vacio",
  "infoAdicional": "Descripción detallada",
  "valor": "Precio o 'Gratis'",
  "autores": "Organizadores",
  "servicios": "{\\"alimentos\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"},\\"mesas\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"},\\"audioVisual\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"}}",
  "preguntas_personalizadas": []
}`;

export function EventImporter() {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [eventContext, setEventContext] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);

  const { loading: aiLoading, error: aiError, query: queryDeepSeek } = useDeepSeek();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_MAESTRO);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processAndInsertEvent = async (eventData) => {
    if (!eventData.nombreES && !eventData.nombreEN) {
      throw new Error("El JSON debe tener al menos un nombre de evento.");
    }

    const newId = uuidv4();
    const finalEvent = {
      _id: newId,
      ...eventData,
      servicios: typeof eventData.servicios === "object" ? JSON.stringify(eventData.servicios) : (eventData.servicios || ""),
      fecha: eventData.fecha || new Date().toISOString().split('T')[0],
      horaInicio: eventData.horaInicio || "08:00",
      horaFinal: eventData.horaFinal || "10:00"
    };

    const { error } = await supabase
      .from(AGENDA)
      .insert([finalEvent]);

    if (error) throw error;

    alert("🎉 Evento creado e importado exitosamente a la agenda");
    dispatch(getAllFromTable(AGENDA));
    setEventContext("");
    setJsonInput("");
    setIsOpen(false);
  };

  const handleGenerateAI = async () => {
    if (!eventContext.trim()) {
      alert("Ingresa la descripción o información del evento.");
      return;
    }

    setLoading(true);
    try {
      const res = await queryDeepSeek({
        systemPrompt: PROMPT_MAESTRO,
        userMessage: `Genera el JSON para el siguiente evento:\n\n${eventContext}`,
        temperature: 0.2
      });

      if (res) {
        await processAndInsertEvent(res);
      }
    } catch (err) {
      console.error("Error generando evento con IA:", err);
      alert("Error al generar evento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportManual = async () => {
    if (!jsonInput.trim()) return;

    setLoading(true);
    try {
      const parsed = JSON.parse(jsonInput);
      await processAndInsertEvent(parsed);
    } catch (err) {
      console.error("Error al importar manual:", err);
      alert("Error al procesar el JSON: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:scale-110 transition-all duration-300 group p-0"
          title="Importador de Eventos IA"
        >
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-2 border-indigo-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Importador & Creador de Eventos IA Directo
            </DialogTitle>
            <DialogDescription>
              Ingresa el texto del flyer, invitación o descripción del evento y la IA creará el registro completo en la agenda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* PRINCIPAL: GENERACIÓN DIRECTA CON IA */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Generación Directa con IA (DeepSeek)
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyPrompt}
                  className="h-7 text-xs text-indigo-700 hover:bg-indigo-100 gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copiado" : "Copiar Prompt Manual"}</span>
                </Button>
              </div>

              <Textarea 
                placeholder="Ej: 'Cata de Café Especial de Origen el Viernes 29 de Agosto a las 17:00 en la terraza. Entrada $35,000 por persona. Organiza Marta Lucus...'"
                className="min-h-[110px] text-xs bg-white border-indigo-200 focus:ring-indigo-500 font-sans"
                value={eventContext}
                onChange={(e) => setEventContext(e.target.value)}
              />

              {aiError && <p className="text-xs font-semibold text-red-600">{aiError}</p>}

              <Button
                onClick={handleGenerateAI}
                disabled={loading || aiLoading || !eventContext.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 py-2.5 shadow-md"
              >
                {(loading || aiLoading) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando e Importando Evento con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar e Importar Evento con IA Directa</span>
                  </>
                )}
              </Button>
            </div>

            {/* SECUNDARIO: PEGAR JSON MANUALMENTE */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowManualPaste(!showManualPaste)}
                className="w-full bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <span>Opciones avanzadas: Pegar código JSON manualmente</span>
                {showManualPaste ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showManualPaste && (
                <div className="p-3 flex flex-col gap-3">
                  <Textarea 
                    placeholder='{ "nombreES": "Cata de Café Especial", ... }'
                    className="min-h-[160px] font-mono text-xs bg-slate-50 border-indigo-100"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleImportManual} 
                      disabled={loading || !jsonInput.trim()}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Importar JSON Manual
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={loading}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EventImporter;
