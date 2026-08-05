import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPartColor } from '../../../../redux/slices/modelSlice';

/**
 * Inspector de Propiedades BIM Dinámico (Estilo Navisworks)
 */
const NavisworksPropertiesPanel = () => {
  const dispatch = useDispatch();
  const { selectedElementInfo, activePart, colors } = useSelector(
    (state) => state.model || {}
  );

  const currentColor = activePart && colors?.[activePart] ? colors[activePart] : '#3b82f6';

  const handleColorChange = (e) => {
    if (activePart) {
      dispatch(setPartColor({ part: activePart, color: e.target.value }));
    }
  };

  const paramsList = selectedElementInfo?.quick_params
    ? Object.entries(selectedElementInfo.quick_params)
    : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col gap-4">
      {/* Cabecera del Inspector Navisworks */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 tracking-wide uppercase">
            📊 Properties Inspector
          </h3>
          <p className="text-[11px] text-slate-400 font-light">
            Metadatos técnicos y parámetros del objeto
          </p>
        </div>
        {selectedElementInfo && (
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
            ID: {selectedElementInfo.id}
          </span>
        )}
      </div>

      {!selectedElementInfo ? (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center gap-2">
          <span className="text-2xl">🔍</span>
          <span className="text-xs font-semibold text-slate-300">Ningún elemento seleccionado</span>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Haz clic sobre cualquier objeto o superficie en la vista 3D para examinar sus parámetros de Revit.
          </p>
        </div>
      ) : (
        <>
          {/* Tarjeta de Elemento Seleccionado */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono uppercase">Categoría</span>
              <span className="text-xs font-bold text-amber-400">{selectedElementInfo.category}</span>
            </div>

            <div className="text-sm font-black text-white">{selectedElementInfo.name}</div>
            
            {selectedElementInfo.level && (
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Nivel Revit:</span>
                <span className="font-semibold text-slate-200">{selectedElementInfo.level}</span>
              </div>
            )}

            {selectedElementInfo.price && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Costo Estimado:</span>
                <span className="text-sm font-black text-emerald-400 font-mono">{selectedElementInfo.price}</span>
              </div>
            )}
          </div>

          {/* Tabla de Parámetros Técnicos (QuickParams / Revit Parameters) */}
          {paramsList.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ⚙️ Parámetros de Revit ({paramsList.length})
              </span>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                {paramsList.map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-0">
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[120px]">{key}</span>
                    <span className="text-slate-200 font-semibold text-[11px] truncate max-w-[130px] text-right">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor de Color Dinámico */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Color de Acabado Capa</div>
              <div className="text-[10px] text-slate-400">Modifica el material del objeto en 3D</div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={currentColor}
                onChange={handleColorChange}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-amber-400 font-bold uppercase">{currentColor}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NavisworksPropertiesPanel;
