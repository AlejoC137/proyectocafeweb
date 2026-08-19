import React from 'react';
import { DollarSign, ShoppingBag, ChefHat, Factory, Percent, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../ModelComponents';

const GastosSummaryCards = ({
  filteredSalesCount,
  totalGlobalRevenue,
  totalGlobalMaterialCost,
  rawMaterialsCount,
  internalProductionsCount
}) => {
  const grossProfit = totalGlobalRevenue - totalGlobalMaterialCost;
  const marginPercent = totalGlobalRevenue > 0 ? (grossProfit / totalGlobalRevenue) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-sans">
      {/* 1. Productos Vendidos */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Productos / Ventas</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{filteredSalesCount}</p>
        </div>
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
          <ShoppingBag size={20} />
        </div>
      </div>

      {/* 2. Ingresos Totales */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ventas Totales</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(totalGlobalRevenue)}</p>
        </div>
        <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
          <DollarSign size={20} />
        </div>
      </div>

      {/* 3. Costo Total Insumos */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Costo Insumos</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(totalGlobalMaterialCost)}</p>
        </div>
        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
          <ChefHat size={20} />
        </div>
      </div>

      {/* 4. Margen Bruto */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Margen Bruto</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {marginPercent.toFixed(1)}%
          </p>
        </div>
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
          <Percent size={20} />
        </div>
      </div>

      {/* 5. Insumos Materia Prima */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Materias Primas</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">{rawMaterialsCount}</p>
        </div>
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <TrendingUp size={20} />
        </div>
      </div>

      {/* 6. Producciones Internas */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sub-recetas / Prod</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{internalProductionsCount}</p>
        </div>
        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
          <Factory size={20} />
        </div>
      </div>
    </div>
  );
};

export default GastosSummaryCards;
