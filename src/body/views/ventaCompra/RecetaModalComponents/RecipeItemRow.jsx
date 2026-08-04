import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RecipeItemRow = ({ item, isEditing, onCheck, onSave }) => {
  const [editValue, setEditValue] = useState(item.cantidad.toString());
  const [isInputActive, setIsInputActive] = useState(false);
  const handleSave = () => { onSave(item.originalIndex, editValue); setIsInputActive(false); };
  const handleEditClick = () => { setEditValue(item.cantidad.toFixed(2)); setIsInputActive(true); };
  const handleCancel = () => { setIsInputActive(false); setEditValue(item.cantidad.toString()); };

  return (
    <div className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors mb-1 ${item.isChecked ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100"}`}>
      <button onClick={() => onCheck(item.originalIndex)} type="button"
        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-md border-2 transition-all ${item.isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 hover:border-emerald-400"}`}>
        {item.isChecked && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
      </button>
      <span className={`flex-1 text-xs ${item.isChecked ? "line-through text-slate-400" : "text-slate-700"}`}>{item.nombre}</span>
      <span className="text-xs font-bold text-blue-600 tabular-nums">{item.cantidad.toFixed(2)}</span>
      <span className="text-[10px] text-slate-400 w-8">{item.unidades}</span>
      {isEditing && (
        <div className="flex items-center gap-1">
          {isInputActive
            ? <><Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-16 h-6 text-xs" /><Button size="sm" className="h-6 text-[10px] px-1.5" onClick={handleSave}>OK</Button><Button size="sm" variant="ghost" className="h-6 text-[10px] px-1" onClick={handleCancel}>✕</Button></>
            : <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleEditClick}>Editar</Button>}
        </div>
      )}
    </div>
  );
};

export default RecipeItemRow;
