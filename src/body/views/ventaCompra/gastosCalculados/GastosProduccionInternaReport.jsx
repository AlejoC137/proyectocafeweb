import React from 'react';
import { Factory, Info, CheckCircle2, Package } from 'lucide-react';
import { formatCurrency } from '../ModelComponents';

const GastosProduccionInternaReport = ({ internalProductionsList }) => {
  const handleOpenRecipeModal = (recipeId, id) => {
    const targetId = recipeId || id;
    if (targetId) {
      window.open(`/receta/${targetId}`, '_blank');
    }
  };

  if (!internalProductionsList || internalProductionsList.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-400 font-sans">
        <Factory className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <h3 className="text-lg font-bold text-gray-700">Sin Producciones Internas requeridas</h3>
        <p className="text-xs text-gray-500">Ninguno de los productos seleccionados requiere sub-recetas de producción interna.</p>
      </div>
    );
  }

  const totalCostAllProductions = internalProductionsList.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans space-y-4">
      <div className="p-4 bg-purple-50 border-b border-purple-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
            <Factory className="text-purple-600" size={20} />
            Plan de Producción Interna (Sub-recetas Cocina y Bar)
          </h2>
          <p className="text-xs text-purple-700">
            Listado de preparaciones previas y sub-recetas requeridas para cumplir con las ventas/producción del período.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Costo Estimado Producción</span>
          <p className="text-xl font-bold text-purple-900">{formatCurrency(totalCostAllProductions)}</p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {internalProductionsList.map((prod, idx) => (
          <div key={idx} className="border border-purple-100 bg-purple-50/20 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between border-b border-purple-100 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-purple-600" />
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    {prod.name}
                    <button
                      onClick={() => handleOpenRecipeModal(prod.recipeId, prod.id)}
                      className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded transition-colors inline-flex items-center justify-center"
                      title={`Abrir Sub-receta en Modal (/receta/${prod.recipeId || prod.id})`}
                    >
                      <Package size={16} />
                    </button>
                  </h3>
                  <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-medium">
                    Sub-receta / Producción Interna
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Volumen a Elaborar</span>
                <p className="text-lg font-bold text-purple-900">
                  {prod.totalQuantityNeeded.toLocaleString('es-CO', { maximumFractionDigits: 2 })} <span className="text-xs text-gray-500">{prod.unit}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Costo unitario de producción:</span>
              <span className="font-bold text-gray-800">{formatCurrency(prod.unitPrice)} / {prod.unit || 'unidad'}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-purple-100 pt-2">
              <span className="text-gray-600 font-bold">Costo total insumos sub-receta:</span>
              <span className="font-bold text-purple-800 text-sm">{formatCurrency(prod.totalCost)}</span>
            </div>

            {/* Breakdown of products using this internal production */}
            <div className="mt-2 text-xs">
              <span className="font-bold text-gray-500 uppercase text-[10px] block mb-1">Requerido por:</span>
              <div className="flex flex-wrap gap-1">
                {prod.usedIn.map((usage, uIdx) => (
                  <span key={uIdx} className="bg-white border border-purple-100 text-purple-800 px-2 py-1 rounded text-[11px] font-medium">
                    {usage.productName}: {usage.qty.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {usage.unit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GastosProduccionInternaReport;
