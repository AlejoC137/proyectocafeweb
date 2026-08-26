import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useDeepSeek } from "@/hooks/useDeepSeek";
import { getPromptByType } from "@/utils/prompts";

export function Step1JsonInput({
  jsonInput,
  setJsonInput,
  jsonError,
  handleParse,
  handleCopyPrompt,
  promptCopied,
  allItems = [],
  allProduccion = [],
}) {
  const [procedureContext, setProcedureContext] = useState("");
  const [showManualPaste, setShowManualPaste] = useState(false);
  const { loading: aiLoading, error: aiError, query: queryDeepSeek } = useDeepSeek();

  const handleGenerateAI = async () => {
    if (!procedureContext.trim()) {
      alert("Ingresa la descripción o pasos del procedimiento para procesar con IA.");
      return;
    }

    const basePrompt = getPromptByType("PROCEDIMIENTOS");
    const systemPrompt = `${basePrompt}

## BASE DE DATOS DE INGREDIENTES Y SUB-PRODUCTOS DISPONIBLES
ItemsAlmacen: ${JSON.stringify(allItems.map(i => ({ _id: i._id, Nombre_del_producto: i.Nombre_del_producto })))}
ProduccionInterna: ${JSON.stringify(allProduccion.map(p => ({ _id: p._id, Nombre_del_producto: p.Nombre_del_producto })))}`;

    const userMessage = `Por favor analiza la siguiente descripción operativa y genera el objeto JSON estandarizado para el procedimiento:

[DESCRIPCIÓN Y PASOS DEL PROCEDIMIENTO]
${procedureContext}`;

    const res = await queryDeepSeek({ systemPrompt, userMessage, temperature: 0.2 });

    if (res) {
      const jsonStr = typeof res === "string" ? res : JSON.stringify(res, null, 2);
      setJsonInput(jsonStr);
      setTimeout(() => {
        handleParse(jsonStr);
      }, 100);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* SECCIÓN PRINCIPAL: GENERACIÓN CON IA DIRECTA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-sm">Generación Directa con IA (DeepSeek)</h3>
              <p className="text-xs text-blue-700">Ingresa la descripción del procedimiento o estándar operativo para estandarizarlo automáticamente.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyPrompt}
            className="text-xs text-blue-800 hover:bg-blue-100 flex items-center gap-1 h-7"
            title="Copiar prompt manual"
          >
            {promptCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{promptCopied ? "Prompt Copiado" : "Copiar Prompt"}</span>
          </Button>
        </div>

        <Textarea
          className="bg-white border-blue-200 text-sm min-h-[110px] focus:ring-blue-500"
          placeholder="Escribe el procedimiento (ej: 'Preparación de Jarabe de Vainilla: hervir 1L de agua con 1kg de azúcar por 10 min, agregar extracto de vainilla, enfriar y envasar...')"
          value={procedureContext}
          onChange={(e) => setProcedureContext(e.target.value)}
        />

        {aiError && <p className="text-xs font-semibold text-red-600">{aiError}</p>}

        <Button
          onClick={handleGenerateAI}
          disabled={aiLoading || !procedureContext.trim()}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center justify-center gap-2 py-2.5 rounded-lg shadow"
        >
          {aiLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Estandarizando Procedimiento con IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generar Procedimiento con IA Directa</span>
            </>
          )}
        </Button>
      </div>

      {/* SECCIÓN SECUNDARIA: PEGAR JSON MANUALMENTE */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowManualPaste(!showManualPaste)}
          className="w-full bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <span>Opciones avanzadas: Pegar código JSON manualmente</span>
          {showManualPaste ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showManualPaste && (
          <div className="p-4 flex flex-col gap-3 bg-white">
            <Textarea
              className="font-mono text-xs min-h-[180px] bg-slate-50"
              placeholder='{ "legacyName": "Procedimiento ABC", "ingredients": [...] }'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            {jsonError && <p className="text-red-500 text-xs font-bold">{jsonError}</p>}
            <div className="flex justify-end">
              <Button onClick={() => handleParse(jsonInput)} disabled={!jsonInput.trim()} size="sm">
                Analizar JSON Manual &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Step1JsonInput;
