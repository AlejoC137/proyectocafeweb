import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";

export function Step1JsonInput({
  jsonInput,
  setJsonInput,
  jsonError,
  handleParse,
  handleCopyPrompt,
  promptCopied,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-blue-800 font-medium">
            Pega el objeto JSON de tu procedimiento aquí. El sistema procesará los insumos, producción interna y los pasos automáticamente.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyPrompt}
            className="flex items-center gap-1 text-xs h-7 px-2 border-blue-300 hover:bg-blue-100 hover:border-blue-400 ml-3 flex-shrink-0"
            title="Copia instrucciones para IA que generan JSON de procedimientos"
          >
            {promptCopied ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copiar Prompt</span>
              </>
            )}
          </Button>
        </div>
      </div>
      <Textarea
        className="flex-1 font-mono text-sm min-h-[300px]"
        placeholder='{ "legacyName": "Procedimiento ABC", "ingredients": [...] }'
        value={jsonInput}
        onChange={e => setJsonInput(e.target.value)}
      />
      {jsonError && <p className="text-red-500 font-bold">{jsonError}</p>}
      <div className="flex justify-end">
        <Button onClick={handleParse} disabled={!jsonInput.trim()}>Analizar JSON &rarr;</Button>
      </div>
    </div>
  );
}

export default Step1JsonInput;
