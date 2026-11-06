import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toggleCanalProducto } from "@/redux/actions-Rappi";
import { CANALES } from "../utils/rappiPricing";
import { Loader2 } from "lucide-react";

export function CanalToggleCell({ item, onToggled }) {
  const dispatch = useDispatch();
  const [loadingField, setLoadingField] = useState(null);

  const handleToggle = async (campo) => {
    const nuevoValor = !item[campo];
    setLoadingField(campo);
    try {
      await dispatch(toggleCanalProducto(item._id, campo, nuevoValor));
      if (onToggled) onToggled(item._id, campo, nuevoValor);
    } catch (err) {
      console.error("Error al actualizar canal:", err);
    } finally {
      setLoadingField(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 justify-center">
      {CANALES.map((c) => {
        const activo = !!item[c.campo];
        const isLoading = loadingField === c.campo;
        return (
          <button
            key={c.campo}
            type="button"
            disabled={isLoading}
            onClick={() => handleToggle(c.campo)}
            title={`${c.label}: ${activo ? "Indexado (clic para quitar)" : "No indexado (clic para activar)"}`}
            className={`px-2 py-1 rounded text-[11px] font-bold border transition-all flex items-center gap-1 ${
              activo
                ? c.campo === "RAPPI"
                  ? "bg-orange-500 text-white border-orange-600 shadow-xs"
                  : c.campo === "PROYECTO_1"
                  ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                  : "bg-purple-600 text-white border-purple-700 shadow-xs"
                : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <span>{c.emoji}</span>
            )}
            <span className="hidden sm:inline">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CanalToggleCell;
