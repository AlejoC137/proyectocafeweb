import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useDeepSeek } from "@/hooks/useDeepSeek";
import { getPromptByType } from "@/utils/prompts";

export function Step1RecipeJsonInput({
  jsonInput,
  setJsonInput,
  jsonError,
  handleParse,
  handleCopyPrompt,
  promptCopied,
  allItems = [],
  allProduccion = [],
}) {
  const [recipeContext, setRecipeContext] = useState("");
  const [showManualPaste, setShowManualPaste] = useState(false);
  const { loading: aiLoading, error: aiError, query: queryDeepSeek } = useDeepSeek();

  const handleGenerateAI = async () => {
    if (!recipeContext.trim()) {
      alert("Ingresa la receta, ingredientes o transcripción para generar con IA.");
      return;
    }

    const basePrompt = getPromptByType("RECETAS");
    const systemPrompt = `${basePrompt}

## BASE DE DATOS DE INGREDIENTES DISPONIBLES
ItemsAlmacen: ${JSON.stringify(allItems.map(i => ({ _id: i._id, Nombre_del_producto: i.Nombre_del_producto })))}
ProduccionInterna: ${JSON.stringify(allProduccion.map(p => ({ _id: p._id, Nombre_del_producto: p.Nombre_del_producto })))}`;

    const userMessage = `Por favor analiza el siguiente texto/fuente de la receta y genera el objeto JSON de la receta estandarizada de acuerdo a las reglas e ingredientes provistos:

[CONTENIDO Y FUENTE DE LA RECETA]
${recipeContext}`;

    const res = await queryDeepSeek({ systemPrompt, userMessage, temperature: 0.2 });

    if (res) {
      const jsonStr = typeof res === "string" ? res : JSON.stringify(res, null, 2);
      setJsonInput(jsonStr);
      // Process auto parse
      setTimeout(() => {
        handleParse(jsonStr);
      }, 100);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* SECCIÓN PRINCIPAL: GENERACIÓN CON IA DIRECTA */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-600 text-white rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Generación Directa con IA (DeepSeek)</h3>
              <p className="text-xs text-amber-700">Pega el texto, ingredientes o enlace de la receta y la IA la estandarizará automáticamente.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyPrompt}
            className="text-xs text-amber-800 hover:bg-amber-100 flex items-center gap-1 h-7"
            title="Copiar prompt manual"
          >
            {promptCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{promptCopied ? "Prompt Copiado" : "Copiar Prompt"}</span>
          </Button>
        </div>

        <Textarea
          className="bg-white border-amber-200 text-sm min-h-[110px] focus:ring-amber-500"
          placeholder="Escribe o pega la receta aquí (ej: 'Ingredientes: 200g Harina, 100g Mantequilla... Pasos: Mezclar y hornear 20min a 180C...')"
          value={recipeContext}
          onChange={(e) => setRecipeContext(e.target.value)}
        />

        {aiError && <p className="text-xs font-semibold text-red-600">{aiError}</p>}

        <Button
          onClick={handleGenerateAI}
          disabled={aiLoading || !recipeContext.trim()}
          className="bg-amber-700 hover:bg-amber-800 text-white font-bold flex items-center justify-center gap-2 py-2.5 rounded-lg shadow"
        >
          {aiLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generando y Mapeando Receta con IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generar y Mapear Receta con IA Directa</span>
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
              placeholder='{ "name": "Nombre Receta", "ingredients": [...] }'
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

export default Step1RecipeJsonInput;
