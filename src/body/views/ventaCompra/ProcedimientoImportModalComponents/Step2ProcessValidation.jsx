import React from "react";
import { Textarea } from "@/components/ui/textarea";

export function Step2ProcessValidation({
  parsedData,
  handleProcessChange,
}) {
  return (
    <div className="lg:col-span-1 flex flex-col">
      <h3 className="font-bold text-lg border-b pb-2 mb-4">2. Validar Procesos ({Object.keys(parsedData?.processSteps || {}).length})</h3>
      <div className="space-y-3 pr-2 overflow-y-auto max-h-[500px]">
        {parsedData?.processSteps && Object.keys(parsedData.processSteps).length > 0 ? (
          Object.entries(parsedData.processSteps).sort((a, b) => {
            const numA = parseInt(a[0].replace('proces', ''));
            const numB = parseInt(b[0].replace('proces', ''));
            return numA - numB;
          }).map(([key, value]) => (
            <div key={key} className="p-3 rounded-md border bg-slate-50 border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">{key}</span>
              <Textarea
                value={value}
                onChange={(e) => handleProcessChange(key, e.target.value)}
                className="text-sm text-slate-800 font-sans min-h-[80px] bg-white border-slate-300 focus:border-blue-500"
              />
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-400 italic border rounded-md border-dashed">
            No se detectaron pasos de proceso en el JSON.
          </div>
        )}
      </div>
    </div>
  );
}

export default Step2ProcessValidation;
