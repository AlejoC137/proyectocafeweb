import React, { useState } from "react";
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, AlertCircle, Loader2 } from "lucide-react";
import { useDeepSeek } from "@/hooks/useDeepSeek";

export function ImportadorHeladoModal({ isOpen, onClose, onImportRecipe }) {
  const [copied, setCopied] = useState(false);
  const [flavorPrompt, setFlavorPrompt] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showManualPaste, setShowManualPaste] = useState(false);

  const { loading: aiLoading, error: aiError, query: queryDeepSeek } = useDeepSeek();

  if (!isOpen) return null;

  const SYSTEM_PROMPT = `Actúa como un Maestro Heladero e Ingeniero de Alimentos experto en la técnica de balanceo Dubovik (Dubovik Formulator).
Diseña una formulación balanceada para un lote total de 1,000 gramos de helado.

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
- yogurt_griego (Grasa: 8.0%, Sólidos: 18.0%, POD: 1.0, PAC: 2.0)
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

  const processAndImportParsedJson = (parsed) => {
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
    setFlavorPrompt("");
    onClose();
  };

  const handleGenerateAI = async () => {
    setErrorMsg("");
    if (!flavorPrompt.trim()) {
      setErrorMsg("Escribe el helado que deseas formular (ej: 'Gelato de Maracuyá').");
      return;
    }

    const userMessage = `Requerimiento de formulación de helado: ${flavorPrompt.trim()}`;

    const res = await queryDeepSeek({
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      temperature: 0.2
    });

    if (res) {
      try {
        processAndImportParsedJson(res);
      } catch (err) {
        setErrorMsg(`Error procesando respuesta de IA: ${err.message}`);
      }
    }
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
      processAndImportParsedJson(parsed);
    } catch (err) {
      console.error("Error importando receta JSON:", err);
      setErrorMsg(`Error de formato JSON: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn font-SpaceGrotesk">
      <div className="bg-white border-2 border-black p-4 md:p-6 w-full max-w-2xl shadow-solid space-y-4 my-auto rounded-none">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-300 border-2 border-black text-black shadow-solid">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-gray-900 leading-tight">
                Formulador & Balanceador de Helados IA (Dubovik)
              </h3>
              <p className="text-xs text-gray-600">
                Formula helados perfectos de 1,000g ajustados a parámetros técnicos.
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

        {/* SECCIÓN PRINCIPAL: GENERACIÓN CON IA DIRECTA */}
        <div className="bg-yellow-50 border-2 border-black p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-black flex items-center gap-1.5 uppercase">
              <Sparkles className="h-4 w-4 text-yellow-700" />
              Generación Directa con IA (DeepSeek)
            </h4>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="text-[11px] font-bold text-gray-700 hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              {copied ? "Prompt Copiado" : "Copiar Prompt Manual"}
            </button>
          </div>

          <input
            type="text"
            value={flavorPrompt}
            onChange={(e) => setFlavorPrompt(e.target.value)}
            placeholder="Ej: Gelato cremoso de pistacho con trozos de chocolate blanco"
            className="w-full p-2.5 border-2 border-black text-xs bg-white focus:outline-none focus:ring-2 focus:ring-black font-medium"
          />

          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={aiLoading || !flavorPrompt.trim()}
            className="w-full py-2.5 bg-yellow-300 hover:bg-yellow-400 disabled:opacity-50 text-black font-black text-xs border-2 border-black shadow-solid transition-all flex items-center justify-center gap-2 active:translate-y-0.5"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Formulando Helado Dubovik con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Formular Helado con IA Directa (1,000g)</span>
              </>
            )}
          </button>
        </div>

        {(errorMsg || aiError) && (
          <div className="p-2.5 bg-red-100 border-2 border-black text-red-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
            <span>{errorMsg || aiError}</span>
          </div>
        )}

        {/* PASO SECUNDARIO: PEGAR JSON MANUALMENTE */}
        <div className="border-2 border-black bg-gray-50">
          <button
            type="button"
            onClick={() => setShowManualPaste(!showManualPaste)}
            className="w-full p-2 flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <span>Opciones avanzadas: Pegar código JSON de helado manualmente</span>
            {showManualPaste ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showManualPaste && (
            <form onSubmit={handleProcessImport} className="p-3 border-t-2 border-black space-y-3 bg-white">
              <textarea
                rows={5}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`{\n  "nombre": "Helado de Avellana",\n  "tipo": "GELATO",\n  "items": [{ "ingId": "leche_entera", "cantidad": 550 }]\n}`}
                className="w-full p-2.5 border-2 border-black font-mono text-xs focus:outline-none bg-gray-50 text-gray-900"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!jsonInput.trim()}
                  className="px-4 py-1.5 bg-gray-800 text-white font-bold text-xs border-2 border-black shadow-solid hover:bg-black"
                >
                  Importar JSON Manual
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ACCIONES DEL MODAL */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold text-xs border-2 border-black shadow-solid transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

export default ImportadorHeladoModal;
