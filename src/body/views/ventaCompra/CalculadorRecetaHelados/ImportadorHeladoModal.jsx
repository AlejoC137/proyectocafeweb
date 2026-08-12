import React, { useState } from "react";
import { Sparkles, Copy, Check, FileCode, ArrowRight, AlertCircle } from "lucide-react";

export function ImportadorHeladoModal({ isOpen, onClose, onImportRecipe }) {
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const SYSTEM_PROMPT = `Actúa como un Maestro Heladero e Ingeniero de Alimentos experto en la técnica de balanceo Dubovik (Dubovik Formulator).
Diseña una formulación balanceada para un lote total de 1,000 gramos de helado con el siguiente requerimiento: [ESCRIBE AQUÍ TU HELADO DESEADO, ej: Gelato de Avellana Cremoso].

CUMPLE ESTRICTAMENTE CON LOS RANGOS TÉCNICOS DUBOVIK:
- SOFT: Grasa 4.0%-10.0%, Sólidos 32.0%-39.0%, POD 14-18, PAC 15-22.
- GELATO: Grasa 6.0%-12.0%, Sólidos 36.0%-42.0%, POD 16-22, PAC 24-32.
- SORBETE: Grasa 0.0%-1.5%, Sólidos 26.0%-32.0%, POD 15-20, PAC 18-25.

INGREDIENTES BASE DISPONIBLES Y SUS PARÁMETROS:
- leche_entera (Grasa: 3.2%, Sólidos: 11.7%, POD: 0.5, PAC: 1.0)
- crema_35 (Grasa: 35.0%, Sólidos: 40.5%, POD: 0.3, PAC: 0.6)
- lpd (Grasa: 1.0%, Sólidos: 96.0%, POD: 5.2, PAC: 10.4)
- sacarosa (Grasa: 0.0%, Sólidos: 100.0%, POD: 100.0, PAC: 100.0)
- dextrosa (Grasa: 0.0%, Sólidos: 92.0%, POD: 70.0, PAC: 90.0)
- maltodextrina (Grasa: 0.0%, Sólidos: 95.0%, POD: 15.0, PAC: 20.0)
- glucosa_38 (Grasa: 0.0%, Sólidos: 80.0%, POD: 50.0, PAC: 90.0)
- glucosa_60 (Grasa: 0.0%, Sólidos: 80.0%, POD: 70.0, PAC: 130.0)
- chocolate_54 (Grasa: 35.0%, Sólidos: 98.0%, POD: 50.0, PAC: 25.0)
- cacao_polvo (Grasa: 21.0%, Sólidos: 95.0%, POD: 0.0, PAC: 0.0)
- neutro_5 (Grasa: 0.0%, Sólidos: 100.0%, POD: 0.0, PAC: 0.0)
- inulina (Grasa: 0.0%, Sólidos: 95.0%, POD: 10.0, PAC: 10.0)
- frambuesa (Grasa: 0.0%, Sólidos: 8.8%, POD: 7.8, PAC: 17.2)
- agua (Grasa: 0.0%, Sólidos: 0.0%, POD: 0.0, PAC: 0.0)

DEVUELVE ÚNICAMENTE UN OBJETO JSON CON EL SIGUIENTE FORMATO EXACTO (SIN TEXTO ADICIONAL NI MARKDOWN):
{
  "nombre": "Gelato de Avellana Cremoso",
  "tipo": "GELATO",
  "items": [
    { "ingId": "leche_entera", "cantidad": 550 },
    { "ingId": "crema_35", "cantidad": 180 },
    { "ingId": "lpd", "cantidad": 40 },
    { "ingId": "sacarosa", "cantidad": 90 },
    { "ingId": "dextrosa", "cantidad": 75 },
    { "ingId": "glucosa_60", "cantidad": 60 },
    { "ingId": "neutro_5", "cantidad": 5 }
  ]
}
REGLA CRÍTICA: La suma total de los valores de "cantidad" DEBE ser exactamente 1,000 gramos.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(SYSTEM_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleProcessImport = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!jsonInput.trim()) {
      setErrorMsg("Por favor pega la respuesta JSON de la IA.");
      return;
    }

    try {
      let rawText = jsonInput.trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rawText = jsonMatch[0];
      }

      const parsed = JSON.parse(rawText);

      if (!parsed.nombre || !parsed.tipo || !Array.isArray(parsed.items)) {
        throw new Error("El JSON debe contener 'nombre', 'tipo' (SOFT, GELATO o SORBETE) y 'items' (array).");
      }

      if (parsed.items.length === 0) {
        throw new Error("El array 'items' no puede estar vacío.");
      }

      const validItems = parsed.items.map((it) => ({
        ingId: String(it.ingId || "leche_entera"),
        cantidad: parseFloat(it.cantidad) || 0,
        inventarioItemId: ""
      }));

      const totalPeso = validItems.reduce((acc, curr) => acc + curr.cantidad, 0);

      onImportRecipe({
        nombre: parsed.nombre,
        tipo: parsed.tipo.toUpperCase(),
        items: validItems,
        totalPeso
      });

      setJsonInput("");
      onClose();
    } catch (err) {
      console.error("Error importando receta JSON:", err);
      setErrorMsg(`Error de formato JSON: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn font-SpaceGrotesk">
      <div className="bg-white border-2 border-black p-4 md:p-6 w-full max-w-2xl shadow-solid space-y-4 my-auto">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-300 border-2 border-black text-black shadow-solid">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-gray-900 leading-tight">
                Importador & Generador de Helados (IA Dubovik)
              </h3>
              <p className="text-xs text-gray-600">
                Genera cualquier tipo de helado mediante inteligencia artificial estructurada.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-black font-black text-lg"
          >
            ✕
          </button>
        </div>

        {/* PASO 1: COPIAR PROMPT */}
        <div className="bg-amber-50 border-2 border-black p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-amber-800" />
              Paso 1: Copia las Instrucciones Estructuradas (Prompt Dubovik)
            </h4>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className={`px-3 py-1 text-xs font-extrabold border-2 border-black shadow-solid transition-all flex items-center gap-1.5 ${
                copied
                  ? "bg-green-400 text-black"
                  : "bg-yellow-300 hover:bg-yellow-400 text-black active:translate-y-0.5"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> ¡Prompt Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copiar Prompt IA
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-amber-900 leading-snug">
            Pega este prompt en tu IA favorita (ChatGPT, Claude o Gemini), personaliza el sabor deseado y te devolverá el JSON perfecto ajustado a los rangos de % Grasa, % Sólidos, POD y PAC.
          </p>
        </div>

        {/* PASO 2: PEGAR JSON E IMPORTAR */}
        <form onSubmit={handleProcessImport} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5 text-sage-green stroke-[3]" />
              Paso 2: Pega el JSON o la Respuesta de la IA:
            </label>
            <textarea
              rows={7}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{\n  "nombre": "Helado de Pistacho Artesanal",\n  "tipo": "GELATO",\n  "items": [\n    { "ingId": "leche_entera", "cantidad": 550 },\n    { "ingId": "crema_35", "cantidad": 180 }\n  ]\n}`}
              className="w-full p-2.5 border-2 border-black font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sage-green bg-gray-50 text-gray-900"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-100 border-2 border-black text-red-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ACCIONES DEL MODAL */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold text-xs border-2 border-black shadow-solid transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sage-green hover:bg-emerald-700 text-white font-black text-xs border-2 border-black shadow-solid transition-all flex items-center gap-1.5 active:translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" /> Importar & Formular Receta
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ImportadorHeladoModal;
