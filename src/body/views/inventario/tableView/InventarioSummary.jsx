// src/components/inventario/tableView/InventarioSummary.jsx
import React from 'react';

export const InventarioSummary = ({ sortedProducts, uniqueCategories }) => {
  const totalValue = sortedProducts.reduce((sum, p) => {
    const cost = parseFloat(p.COSTO || p.Precio || 0);
    const quantity = parseFloat(p.CANTIDAD || 1);
    return sum + (cost * quantity);
  }, 0).toFixed(2);

  const activeProducts = sortedProducts.filter(p => ["PC", "PP", "Activo", "OK"].includes(p.Estado)).length;

  return (
    <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="font-semibold text-gray-700">Total productos:</span>
          <span className="ml-2 text-gray-900">{sortedProducts.length}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Grupos únicos:</span>
          <span className="ml-2 text-gray-900">{uniqueCategories.length}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Valor total:</span>
          <span className="ml-2 text-green-600 font-bold">${totalValue}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Productos activos:</span>
          <span className="ml-2 text-green-600 font-bold">{activeProducts}</span>
        </div>
      </div>
    </div>
  );
};