import React from "react";
import EditableText from "@/components/ui/EditableText";
import FuentesEditor from "./FuentesEditor";

export function RecetaProcesosNotas({
  receta,
  permanentEditMode,
  updateProcessOrNote,
  updateField,
  isUpdating,
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Procesos */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">Procesos</h3>
        <div className="space-y-2">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((i) =>
            (receta[`proces${i}`] || permanentEditMode) && (
              <div key={`process-${i}`} className="flex items-start gap-2 group">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold flex items-center justify-center mt-0.5">{i}</span>
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

      {/* Notas */}
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

      {/* Fuentes */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3 mt-4">Fuentes</h3>
        <div className="pl-2">
          <FuentesEditor 
            fuentes={receta.fuentes || []} 
            onSave={(v) => updateField({ fuentes: v })} 
            isEditable={permanentEditMode} 
            disabled={isUpdating} 
          />
        </div>
      </div>
    </div>
  );
}

export default RecetaProcesosNotas;
