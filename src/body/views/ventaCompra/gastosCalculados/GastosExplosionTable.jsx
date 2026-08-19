import React, { useState } from 'react';
import { ChefHat, ChevronDown, ChevronRight, Info, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency } from '../ModelComponents';

const GastosExplosionTable = ({ rawMaterialsList, totalGlobalMaterialCost }) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpand = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleOpenModal = (e, item) => {
    e.stopPropagation();
    if (item.id) {
      window.open(`/item/${item.id}`, '_blank');
    }
  };

  if (!rawMaterialsList || rawMaterialsList.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-700">Sin materias primas registradas</h3>
        <p className="text-sm text-gray-400">No se encontraron materias primas para la selección o filtros actuales.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans space-y-4">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ChefHat className="text-orange-500" size={20} />
            Explosión Consolidada de Materias Primas Primitivas
          </h2>
          <p className="text-xs text-gray-500">
            Acumula los insumos directos y los insumos contenidos dentro de todas las producciones internas (sub-recetas).
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Insumos Distintos</span>
          <p className="text-xl font-bold text-gray-800">{rawMaterialsList.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4 font-bold">Insumo / Materia Prima</th>
              <th className="py-3 px-4 font-bold text-center">Unidad</th>
              <th className="py-3 px-4 font-bold text-right">Cant. Total Requerida</th>
              <th className="py-3 px-4 font-bold text-right">Precio Unitario</th>
              <th className="py-3 px-4 font-bold text-right">Costo Total Estimado</th>
              <th className="py-3 px-4 font-bold text-right">% del Gasto</th>
              <th className="py-3 px-4 font-bold text-center w-12">Modal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rawMaterialsList.map((ingrediente, index) => {
              const isExpanded = !!expandedRows[index];
              const pctOfTotal = totalGlobalMaterialCost > 0 ? (ingrediente.totalCost / totalGlobalMaterialCost) * 100 : 0;
              const hasNoPrice = !ingrediente.unitPrice || ingrediente.unitPrice === 0;

              return (
                <React.Fragment key={index}>
                  <tr
                    onClick={() => toggleExpand(index)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 text-gray-400">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800 capitalize flex items-center gap-2">
                      {ingrediente.name}
                      {hasNoPrice && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold" title="Sin precio unitario registrado en inventario">
                          <AlertTriangle size={12} /> Sin precio
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                        {ingrediente.unit || 'Unidad'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-700">
                      {ingrediente.totalQuantity.toLocaleString('es-CO', { maximumFractionDigits: 3 })}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {formatCurrency(ingrediente.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-orange-600">
                      {formatCurrency(ingrediente.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold text-gray-500">{pctOfTotal.toFixed(1)}%</span>
                        <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, pctOfTotal)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => handleOpenModal(e, ingrediente)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center justify-center"
                        title={`Abrir ${ingrediente.name} en Modal de Ítem (/item/${ingrediente.id})`}
                      >
                        <Package size={16} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <tr className="bg-blue-50/20">
                      <td colSpan={8} className="p-4 pl-12 border-b border-gray-100">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-inner">
                          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Info size={14} className="text-blue-500" /> Usado en las siguientes preparaciones / ventas:
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="text-gray-400 border-b border-gray-100">
                                  <th className="pb-1">Producto / Ruta de Preparación</th>
                                  <th className="pb-1 text-right">Consumo Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {ingrediente.usedIn.map((usage, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="py-1.5 font-medium text-gray-700">{usage.productName}</td>
                                    <td className="py-1.5 text-right font-bold text-blue-700">
                                      {usage.qty.toLocaleString('es-CO', { maximumFractionDigits: 3 })} {usage.unit}
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

export default GastosExplosionTable;
