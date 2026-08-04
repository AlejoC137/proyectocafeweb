import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const FuentesEditor = ({ fuentes = [], onSave, isEditable, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    setLinks(Array.isArray(fuentes) ? fuentes : []);
  }, [fuentes, isEditing]);

  const handleSave = () => { onSave(links); setIsEditing(false); };
  const handleAdd = () => setLinks([...links, ""]);
  const handleUpdate = (i, v) => { const l = [...links]; l[i] = v; setLinks(l); };
  const handleRemove = (i) => setLinks(links.filter((_, idx) => idx !== i));

  if (!isEditable) {
    return (
      <div className="space-y-1">
        {links.map((link, i) => (
          <div key={i} className="flex gap-2 text-xs items-center overflow-hidden">
            <span className="font-bold text-slate-400 min-w-[16px]">🔗</span>
            <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block w-full" title={link}>{link}</a>
          </div>
        ))}
        {links.length === 0 && <span className="text-slate-400 italic text-xs">Sin fuentes.</span>}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-2 border border-slate-200 p-2 rounded-lg bg-white mt-1">
        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Editando Fuentes</span><button onClick={() => setIsEditing(false)} className="text-red-500 text-xs">✕</button></div>
        {links.map((link, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input type="text" className="flex-1 p-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-400" value={link} onChange={(e) => handleUpdate(i, e.target.value)} placeholder="https://..." />
            <button onClick={() => handleRemove(i)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">🗑</button>
          </div>
        ))}
        <button onClick={handleAdd} className="w-full text-xs text-slate-500 border border-dashed border-slate-300 rounded py-1 hover:bg-slate-50">+ Agregar Link</button>
        <div className="flex justify-end"><Button size="sm" onClick={handleSave} disabled={disabled} className="bg-green-600 text-white hover:bg-green-700 h-7 text-xs">Guardar</Button></div>
      </div>
    );
  }

  return (
    <div className="group relative border border-transparent hover:border-slate-200 rounded-lg p-1 transition-all">
      <div className="space-y-1">
        {links.map((link, i) => (
          <div key={i} className="flex gap-2 text-xs items-center overflow-hidden">
            <span className="font-bold text-slate-400 min-w-[16px]">🔗</span>
            <span className="text-slate-700 truncate block w-full">{link}</span>
          </div>
        ))}
        {links.length === 0 && <span className="text-slate-400 italic text-xs">Sin fuentes.</span>}
      </div>
      <button onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 shadow-sm rounded p-0.5 text-[10px]">✏️</button>
    </div>
  );
};

export default FuentesEditor;
