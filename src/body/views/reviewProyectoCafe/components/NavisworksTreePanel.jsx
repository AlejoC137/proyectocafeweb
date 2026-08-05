import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleLayer, setAllLayers } from '../../../../redux/slices/modelSlice';

/**
 * Panel Árbol de Selección & Capas Dinámico Estilo Autodesk Navisworks (Selection Tree)
 */
const NavisworksTreePanel = () => {
  const dispatch = useDispatch();
  const modelState = useSelector((state) => state.model || {});
  const { bimData, layers = {} } = modelState;

  // Construir elementos de capas dinámicamente desde el modelo cargado
  const getDynamicLayerItems = () => {
    if (!bimData) return [];

    if (Array.isArray(bimData.layers) && bimData.layers.length > 0) {
      return bimData.layers.map((l) => {
        const key = l.id || (l.name ? l.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default');
        return {
          key,
          label: l.name || key,
          code: l.type ? l.type.toUpperCase() : 'BIM-CAT',
          count: l.element_ids ? l.element_ids.length : 0,
          color: l.color_hex || '#3b82f6'
        };
      });
    }

    const nodesList = bimData.nodes || bimData.elements || [];
    const catMap = {};

    nodesList.forEach((n) => {
      const catName = n.category || n.layer || 'Sin Categoría';
      const key = catName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!catMap[key]) {
        catMap[key] = {
          key,
          label: catName,
          code: 'REVIT',
          count: 0,
          color: n.color_hex || '#3b82f6'
        };
      }
      catMap[key].count++;
    });

    return Object.values(catMap);
  };

  const layerItems = getDynamicLayerItems();
  const totalLayers = layerItems.length;
  const visibleCount = layerItems.filter((item) => layers[item.key] !== false).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col gap-4">
      {/* Cabecera del Árbol Navisworks */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 tracking-wide uppercase">
            🌲 Selection Tree (Navisworks)
          </h3>
          <p className="text-[11px] text-slate-400 font-light">
            Control de visibilidad de capas y categorías BIM
          </p>
        </div>
        <span className="text-xs bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-slate-300 font-mono">
          {visibleCount}/{totalLayers} Activas
        </span>
      </div>

      {/* Botones de Acción Global (Mostrar/Ocultar Todo) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={totalLayers === 0}
          onClick={() => dispatch(setAllLayers(true))}
          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          👁️ Mostrar Todo
        </button>
        <button
          type="button"
          disabled={totalLayers === 0}
          onClick={() => dispatch(setAllLayers(false))}
          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-400 rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          🙈 Ocultar Todo
        </button>
      </div>

      {/* Lista de Capas Dinámicas */}
      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
        {totalLayers === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 border border-slate-800/80 rounded-xl">
            No hay capas disponibles. Carga un archivo JSON BIM para activar el árbol de selección.
          </div>
        ) : (
          layerItems.map((item) => {
            const isVisible = layers[item.key] !== false;
            return (
              <div
                key={item.key}
                onClick={() => dispatch(toggleLayer(item.key))}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isVisible
                    ? 'bg-slate-950/80 border-slate-700 hover:border-amber-500/50'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {item.count} Nodos
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NavisworksTreePanel;
