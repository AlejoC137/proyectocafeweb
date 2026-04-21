import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { crearItem, getAllFromTable } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Copy, Check, Import, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EVENT_PROMPT = `Actúa como un Asistente de Gestión de Eventos. Tu tarea es generar un objeto JSON para un nuevo evento basado en la información proporcionada.

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
  "servicios": "{\\"alimentos\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"},\\"mesas\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"},\\"audioVisual\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"},\\"otros\\":{\\"activo\\":false,\\"descripcion\\":\\"\\"}}"
}

Reglas Críticas de Formato:
1. Servicios como String Puro: El campo servicios debe ser un string que contenga el JSON de servicios. Usa comillas dobles escapadas \\" para las propiedades internas.
2. Evitar Saltos de Línea Internos: No incluyas saltos de línea (\\n) ni caracteres especiales complejos dentro del string de servicios para evitar errores de SyntaxError: Bad escaped character.
3. Puntualidad: Si no hay hora de finalización, asume 3 horas después del inicio.
4. Salida Limpia: Solo devuelve el JSON puro, sin bloques de código ( \` \` \` ), sin texto adicional, ni explicaciones. La respuesta debe comenzar con { y terminar con }.`;

export function EventImporter() {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(EVENT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async () => {
    setError("");
    setLoading(true);
    try {
      const data = JSON.parse(jsonInput);
      
      // Validaciones mínimas
      if (!data.nombreES || !data.fecha || !data.horaInicio) {
        throw new Error("El JSON debe contener al menos nombreES, fecha y horaInicio.");
      }

      await dispatch(crearItem(data, AGENDA));
      dispatch(getAllFromTable(AGENDA));
      setJsonInput("");
      setIsOpen(false);
      alert("Evento importado exitosamente");
    } catch (err) {
      console.error("Error al importar:", err);
      setError("Error: JSON inválido o faltan campos obligatorios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 md:w-96 shadow-2xl"
          >
            <Card className="border-2 border-purple-500 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles size={20} />
                    Importador AI
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 bg-white">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    1. Copia el prompt para tu IA (ChatGPT/Claude/Gemini)
                  </p>
                  <Button
                    onClick={handleCopyPrompt}
                    className="w-full gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border-dashed border-2 border-slate-300"
                    variant="outline"
                  >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    {copied ? "¡Copiado!" : "Copiar Prompt Maestro"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    2. Pega el JSON generado aquí
                  </p>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{"nombreES": "Evento...", ...}'
                    className="w-full h-32 p-2 text-xs font-mono border rounded-md focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  />
                </div>

                {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

                <Button
                  onClick={handleImport}
                  disabled={!jsonInput || loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold"
                >
                  <Import size={18} className="mr-2" />
                  {loading ? "Importando..." : "Importar Evento"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-shadow border-2 border-white"
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </motion.button>
    </div>
  );
}
