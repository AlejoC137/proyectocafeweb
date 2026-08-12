import React from "react";
import EditableText from "@/components/ui/EditableText.jsx";

export function ProcedimientoProcesosNotas({
  receta,
  permanentEditMode,
  updateProcessOrNote,
  isUpdating,
}) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">Procesos</h3>
        <div className="space-y-2">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((i) =>
            (receta[`proces${i}`] || permanentEditMode) && (
              <div key={`process-${i}`} className="flex items-start gap-2 group">
                <span className="flex-shrink-0 w-5 h-5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold flex items-center justify-center mt-0.5">{i}</span>
                <div className="flex-1 text-xs text-slate-700">
                  <EditableText 
                    value={receta[`proces${i}`] || ""} 
                    onSave={(v) => updateProcessOrNote("process", i, v)}
                    isEditable={permanentEditMode} 
                    placeholder={`Proceso ${i}...`} 
                    multiline={true} 
                    disabled={isUpdating} 
                  />
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">Notas</h3>
        <div className="space-y-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((i) =>
            (receta[`nota${i}`] || permanentEditMode) && (
              <div key={`note-${i}`} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5"></span>
                <div className="flex-1 text-xs text-slate-700">
                  <EditableText 
                    value={receta[`nota${i}`] || ""} 
                    onSave={(v) => updateProcessOrNote("note", i, v)}
                    isEditable={permanentEditMode} 
                    placeholder={`Nota ${i}...`} 
                    multiline={true} 
                    disabled={isUpdating} 
                  />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default ProcedimientoProcesosNotas;
