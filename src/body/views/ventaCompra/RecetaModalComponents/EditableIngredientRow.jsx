import React from "react";
import { X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

const EditableIngredientRow = ({ item, index, source, onNameChange, onSelect, onQuantityChange, onRemove, onSync, onMove, isFirst, isLast, onNavigate }) => {
  const subtotal = (Number(item.originalQuantity) || 0) * (Number(item.precioUnitario) || 0);
  return (
    <div className="mb-2 p-2 border border-slate-200 rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={() => onMove(index, -1, source)} disabled={isFirst}
            className="px-1 py-0.5 hover:bg-slate-100 rounded disabled:opacity-30 text-[10px] font-bold text-slate-500 leading-none">▲</button>
          <button onClick={() => onMove(index, 1, source)} disabled={isLast}
            className="px-1 py-0.5 hover:bg-slate-100 rounded disabled:opacity-30 text-[10px] font-bold text-slate-500 leading-none">▼</button>
        </div>
        <input type="text" placeholder="Buscar ingrediente..." value={item.nombre || ""}
          onChange={(e) => onNameChange(index, e.target.value, source)}
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-400 min-w-0" />
        {item.item_Id && onNavigate && (
          <button onClick={() => onNavigate(item.item_Id)} title={source === "Produccion" ? "Ver Receta" : "Ver ítem"}
            className="flex-shrink-0 w-7 h-7 bg-blue-50 hover:bg-blue-100 rounded text-sm flex items-center justify-center transition-colors">
            {source === "Produccion" ? "📕" : "📦"}
          </button>
        )}
        <button onClick={() => onRemove(index, source)}
          className="flex-shrink-0 w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs font-bold flex items-center justify-center transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>

      {item.matches && item.matches.length > 0 && (
        <ul className="border border-slate-200 rounded bg-white max-h-36 overflow-y-auto mt-1 shadow-lg z-10">
          {item.matches.map((match) => (
            <li key={match._id} onClick={() => onSelect(index, match, source)}
              className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer text-xs border-b border-slate-50 last:border-0">
              {match.Nombre_del_producto}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-4 gap-1.5 mt-2">
        <Input type="number" placeholder="Cant." value={item.originalQuantity || ""}
          onChange={(e) => onQuantityChange(index, e.target.value, source)}
          className="h-7 text-xs px-2" />
        <Input type="text" placeholder="Und." value={item.unidades || ""} readOnly
          className="h-7 text-xs px-2 bg-slate-50 text-slate-500" />
        <Input type="text" placeholder="P.Unit" value={Number(item.precioUnitario || 0).toFixed(2)} readOnly
          className="h-7 text-xs px-2 bg-slate-50 text-slate-500 text-right" />
        <div className="flex items-center gap-1">
          <Input type="text" placeholder="Sub." value={subtotal.toFixed(2)} readOnly
            className="h-7 text-xs px-2 bg-slate-50 font-semibold text-right flex-1" />
          <button onClick={() => onSync(index, source)} title="Sincronizar precio/unidades"
            className="flex-shrink-0 p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditableIngredientRow;
