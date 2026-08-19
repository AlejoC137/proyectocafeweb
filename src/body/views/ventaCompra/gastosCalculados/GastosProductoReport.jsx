import React, { useState } from 'react';
import { Package, TrendingUp, DollarSign, Percent, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../ModelComponents';

const GastosProductoReport = ({ productReports }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleOpenRecipeModal = (e, recipeId) => {
    e.stopPropagation();
    if (recipeId) {
      window.open(`/receta/${recipeId}`, '_blank');
    }
  };

  const handleOpenItemModal = (e, itemId) => {
    e.stopPropagation();
    if (itemId) {
      window.open(`/item/${itemId}`, '_blank');
    }
  };

  if (!productReports || productReports.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-400 font-sans">
        No hay informes de producto disponibles.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans space-y-4">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" size={20} />
            Informe Financiero y Costo de Materiales por Producto
          </h2>
          <p className="text-xs text-gray-500">
            Análisis de rentabilidad individual y margen bruto sobre materia prima por cada producto del menú.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4 font-bold">Producto</th>
              <th className="py-3 px-4 font-bold text-center">Cant. Vendida</th>
              <th className="py-3 px-4 font-bold text-right">Ventas Totales</th>
              <th className="py-3 px-4 font-bold text-right">Costo Receta Unit.</th>
              <th className="py-3 px-4 font-bold text-right">Costo Insumos Total</th>
              <th className="py-3 px-4 font-bold text-right">Utilidad Bruta</th>
              <th className="py-3 px-4 font-bold text-right">Margen %</th>
              <th className="py-3 px-4 font-bold text-center w-12">Modal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productReports.map((prod, index) => {
              const isExpanded = expandedIndex === index;
              const marginClass = prod.margenPorcentaje >= 65 ? 'text-emerald-600' : prod.margenPorcentaje >= 40 ? 'text-blue-600' : 'text-rose-600';

              return (
                <React.Fragment key={index}>
                  <tr
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800 flex items-center gap-2">
                      {prod.nombre}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">{prod.cantidadVendida}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">{formatCurrency(prod.totalIngreso)}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(prod.costoUnitarioReceta)}</td>
                    <td className="py-3 px-4 text-right font-bold text-orange-600">{formatCurrency(prod.costoTotalInsumos)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCurrency(prod.utilidadBruta)}</td>
                    <td className={`py-3 px-4 text-right font-bold ${marginClass}`}>
                      {prod.margenPorcentaje.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => handleOpenRecipeModal(e, prod.recetaId || prod.id)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center justify-center"
                        title={`Abrir Receta en Modal (/receta/${prod.recetaId || prod.id})`}
                      >
                        <Package size={16} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded ingredient breakdown */}
                  {isExpanded && prod.tree && prod.tree.children && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={9} className="p-4 pl-12">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                          <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">
                            Composición de Insumos y Sub-recetas para {prod.nombre}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="text-gray-400 border-b border-gray-100">
                                  <th className="pb-2 font-semibold">Componente / Insumo</th>
                                  <th className="pb-2 font-semibold text-center">Tipo</th>
                                  <th className="pb-2 font-semibold text-right">Cant. por Porción</th>
                                  <th className="pb-2 font-semibold text-right">Cant. Total ({prod.cantidadVendida} u)</th>
                                  <th className="pb-2 font-semibold text-right">Costo Unit.</th>
                                  <th className="pb-2 font-semibold text-right">Costo Subtotal</th>
                                  <th className="pb-2 font-semibold text-center w-12">Modal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {prod.tree.children.map((child, cIdx) => (
                                  <tr key={cIdx}>
                                    <td className="py-2 font-bold text-gray-800">{child.name}</td>
                                    <td className="py-2 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        child.type === 'internal' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                                      }`}>
                                        {child.type === 'internal' ? 'Sub-receta' : 'Materia Prima'}
                                      </span>
                                    </td>
                                    <td className="py-2 text-right text-gray-600">
                                      {child.quantityPerUnit.toLocaleString('es-CO', { maximumFractionDigits: 3 })} {child.unit}
                                    </td>
                                    <td className="py-2 text-right font-bold text-gray-700">
                                      {child.totalQuantity.toLocaleString('es-CO', { maximumFractionDigits: 3 })} {child.unit}
                                    </td>
                                    <td className="py-2 text-right text-gray-500">{formatCurrency(child.unitPrice)}</td>
                                    <td className="py-2 text-right font-bold text-orange-600">{formatCurrency(child.totalCost)}</td>
                                    <td className="py-2 text-center">
                                      <button
                                        onClick={(e) => child.type === 'internal' ? handleOpenRecipeModal(e, child.recipeId || child.id) : handleOpenItemModal(e, child.id)}
                                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors inline-flex items-center justify-center"
                                        title={child.type === 'internal' ? `Abrir Receta (/receta/${child.recipeId || child.id})` : `Abrir Ítem (/item/${child.id})`}
                                      >
                                        <Package size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GastosProductoReport;
