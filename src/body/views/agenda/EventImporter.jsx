import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { 
  FileJson, 
  Copy, 
  Check, 
  X, 
  Upload, 
  Info,
  Sparkles
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

const PROMPT_MAESTRO = `Actúa como un Asistente de Gestión de Eventos. Tu tarea es generar un objeto JSON para un nuevo evento basado en la información proporcionada.

Estructura obligatoria del JSON:
{
  "nombreES": "Nombre en español",
  "nombreEN": "Nombre en inglés o alternativo",
  "fecha": "YYYY-MM-DD",
  "horaInicio": "HH:mm",
  "horaFinal": "HH:mm",
  "bannerIMG": "URL de la imagen",
  "linkInscripcion": "URL de inscripción",
  "infoAdicional": "Descripción detallada",
  "valor": "Precio o 'Gratis'",
  "autores": "Organizadores",
  "servicios": "{\\"alimentos\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"},\\"mesas\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"},\\"audioVisual\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"}}",
  "preguntas_personalizadas": []
}`;

export function EventImporter() {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_MAESTRO);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) return;

    setLoading(true);
    try {
      const eventData = JSON.parse(jsonInput);
      
      // Validaciones básicas
      if (!eventData.nombreES && !eventData.nombreEN) {
        throw new Error("El JSON debe tener al menos un nombre.");
      }

      const newId = uuidv4();
      const finalEvent = {
        _id: newId,
        ...eventData,
        // Asegurar que servicios sea string si viene como objeto
        servicios: typeof eventData.servicios === "object" ? JSON.stringify(eventData.servicios) : eventData.servicios,
        // Valores por defecto para campos faltantes
        fecha: eventData.fecha || new Date().toISOString().split('T')[0],
        horaInicio: eventData.horaInicio || "08:00",
        horaFinal: eventData.horaFinal || "10:00"
      };

      const { error } = await supabase
        .from(AGENDA)
        .insert([finalEvent]);

      if (error) throw error;

      alert("🎉 Evento importado exitosamente");
      dispatch(getAllFromTable(AGENDA));
      setJsonInput("");
      setIsOpen(false);
    } catch (err) {
      console.error("Error al importar:", err);
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
        >
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-2 border-indigo-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Importador de Eventos AI
            </DialogTitle>
            <DialogDescription>
              Copia el prompt maestro para la IA, genera el JSON y pégalo aquí abajo para crear el evento instantáneamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">Prompt Maestro</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyPrompt}
                className="gap-2 bg-white border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado" : "Copiar Prompt"}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <FileJson className="w-4 h-4" /> Pegar JSON aquí
              </label>
              <Textarea 
                placeholder='{ "nombreES": "Cata de Café Especial", ... }'
                className="min-h-[250px] font-mono text-xs bg-slate-50 border-indigo-100 focus:ring-indigo-500"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={loading || !jsonInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importar Evento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
