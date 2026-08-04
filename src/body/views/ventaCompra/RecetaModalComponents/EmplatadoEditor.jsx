import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const EmplatadoEditor = ({ value, onSave, isEditable, placeholder, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [steps, setSteps] = useState([]);
  const [isJson, setIsJson] = useState(false);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) { setSteps(parsed.sort((a, b) => a.orden - b.orden)); setIsJson(true); }
      else throw new Error();
    } catch { setIsJson(false); setRawText(value || ""); }
  }, [value]);

  const handleSaveSteps = () => { onSave(JSON.stringify(steps)); setIsEditing(false); };
  const handleSaveRaw = () => { onSave(rawText); setIsEditing(false); };
  const handleAddStep = () => setSteps([...steps, { orden: steps.length, proceso: "" }]);
  const handleUpdateStep = (i, v) => { const s = [...steps]; s[i].proceso = v; setSteps(s); };
  const handleRemoveStep = (i) => setSteps(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, orden: idx })));
  const handleConvertToSteps = () => { if (window.confirm("¿Convertir texto a lista de pasos?")) { setSteps([{ orden: 0, proceso: rawText }]); setIsJson(true); } };

  if (!isEditable) {
    return isJson
      ? <div className="space-y-1">{steps.map((s, i) => <div key={i} className="flex gap-2 text-xs"><span className="font-bold text-slate-400 min-w-[16px]">{i + 1}.</span><span className="text-slate-700">{s.proceso}</span></div>)}{steps.length === 0 && <span className="text-slate-400 italic text-xs">Sin pasos.</span>}</div>
      : <div className="text-xs whitespace-pre-wrap text-slate-700">{rawText || <span className="text-slate-400 italic">{placeholder}</span>}</div>;
  }

  if (isEditing) {
    return isJson
      ? <div className="space-y-2 border border-slate-200 p-2 rounded-lg bg-white">
          <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Editando Pasos</span><button onClick={() => setIsEditing(false)} className="text-red-500 text-xs">✕</button></div>
          {steps.map((step, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-[10px] font-bold text-slate-400 mt-2 w-4 text-center">{i + 1}</span>
              <textarea className="flex-1 p-1.5 border border-slate-200 rounded text-xs min-h-[36px] resize-y focus:outline-none focus:border-blue-400" value={step.proceso} onChange={(e) => handleUpdateStep(i, e.target.value)} />
              <button onClick={() => handleRemoveStep(i)} className="text-red-400 hover:text-red-600 p-1">🗑</button>
            </div>
          ))}
          <button onClick={handleAddStep} className="w-full text-xs text-slate-500 border border-dashed border-slate-300 rounded py-1 hover:bg-slate-50">+ Agregar Paso</button>
          <div className="flex justify-end"><Button size="sm" onClick={handleSaveSteps} disabled={disabled} className="bg-green-600 text-white hover:bg-green-700 h-7 text-xs">Guardar</Button></div>
        </div>
      : <div className="space-y-2">
          <textarea className="w-full p-2 border border-slate-200 rounded text-xs min-h-[60px] focus:outline-none focus:border-blue-400" value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder={placeholder} />
          <div className="flex justify-between items-center">
            <button onClick={handleConvertToSteps} className="text-xs text-blue-600 hover:underline">Convertir a lista</button>
            <div className="flex gap-1.5"><Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs">Cancelar</Button><Button size="sm" onClick={handleSaveRaw} disabled={disabled} className="bg-green-600 text-white h-7 text-xs">Guardar</Button></div>
          </div>
        </div>;
  }

  return (
    <div className="group relative border border-transparent hover:border-slate-200 rounded-lg p-1 transition-all">
      {isJson
        ? <div className="space-y-1">{steps.map((s, i) => <div key={i} className="flex gap-2 text-xs"><span className="font-bold text-slate-400 min-w-[16px]">{i + 1}.</span><span className="text-slate-700">{s.proceso}</span></div>)}{steps.length === 0 && <span className="text-slate-400 italic text-xs">Sin pasos.</span>}</div>
        : <div className="text-xs whitespace-pre-wrap text-slate-700">{rawText || <span className="text-slate-400 italic">{placeholder}</span>}</div>}
      <button onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 shadow-sm rounded p-0.5 text-[10px]">✏️</button>
    </div>
  );
};

export default EmplatadoEditor;
