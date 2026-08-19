import React, { useState } from 'react';
import Predict from './Predict';
import RecetaModal from './RecetaModal';
import ItemMenuModal from '../../components/Menu/ItemMenuModal';
import { LineChart, DollarSign, TrendingUp, Utensils, ChefHat } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';

const ProductosVendidosRentabilidad = ({
  productos,
  ventas,
  targetMonth,
  targetYear,
  onOpenGastos
}) => {
  const navigate = useNavigate();
  const [showFinancials, setShowFinancials] = useState(true);
  const [showPredict, setShowPredict] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMenuModalItem, setSelectedMenuModalItem] = useState(null);

  const handlePredictClick = (item) => {
    setSelectedItem(item);
    setShowPredict(true);
  };

  const handleCloseModal = () => {
    setShowPredict(false);
    setSelectedItem(null);
  };

  const totalProductos = productos.reduce((acc, p) => acc + (p.cantidad || 0), 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border h-[420px] flex flex-col w-full">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-800">Productos Vendidos</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">
            {totalProductos}
          </span>
          {onOpenGastos && (
            <button
              onClick={onOpenGastos}
              className="ml-2 w-7 h-7 flex items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              title="Ver Explosión de Materiales"
            >
              📦
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
            <button
            onClick={() => navigate('/productosFinanciero')}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-all bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 shadow-sm"
            title="Ir a Auditoría de Precios"
            >
            <DollarSign size={14} />
            Actualizar Precios
            </button>
            <button
            onClick={() => setShowFinancials(!showFinancials)}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors border ${showFinancials ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
            {showFinancials ? 'Ocultar Rentabilidad' : 'Ver Rentabilidad'}
            </button>
        </div>
      </div>

      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="min-w-full border-collapse relative">
          <thead className="sticky top-0 bg-white z-20 shadow-sm ring-1 ring-black/5">
            <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
              <th className="py-2 px-2 border-b text-center w-20">Acciones</th>
              <th className="py-2 px-2 border-b text-left">Producto</th>
              <th className="py-2 px-2 border-b text-center">Cant.</th>
              {showFinancials && <th className="py-2 px-2 border-b text-right">Costo Unit.</th>}
              {showFinancials && <th className="py-2 px-2 border-b text-right">Ingresos Tot.</th>}
              {showFinancials && <th className="py-2 px-2 border-b text-right">Costo Tot.</th>}
              {showFinancials && <th className="py-2 px-2 border-b text-right">Ganancia</th>}
              {showFinancials && <th className="py-2 px-2 border-b text-right">%</th>}
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-gray-50">
            {showFinancials && (
              <tr className="sticky top-[31px] z-10 bg-blue-50 font-bold border-b-2 border-red-200 shadow-sm">
                <td className="py-2 px-2"></td>
                <td className="py-2 px-2 text-blue-800">TOTALES</td>
                <td className="py-2 px-2 text-center text-blue-800">
                  {totalProductos}
                </td>
                <td className="py-2 px-2 text-right text-gray-400">-</td>
                <td className="py-2 px-2 text-right text-green-700">
                  {productos.reduce((acc, p) => acc + (p.totalIngreso || 0), 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </td>
                <td className="py-2 px-2 text-right text-red-600">
                  {productos.reduce((acc, p) => acc + (p.totalCosto || 0), 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </td>
                <td className="py-2 px-2 text-right text-blue-700">
                  {productos.reduce((acc, p) => acc + (p.totalUtilidad || 0), 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </td>
                <td className="py-2 px-2 text-right text-blue-700">
                  {(() => {
                    const totalIngreso = productos.reduce((acc, p) => acc + (p.totalIngreso || 0), 0);
                    const totalUtilidad = productos.reduce((acc, p) => acc + (p.totalUtilidad || 0), 0);
                    return totalIngreso > 0 ? ((totalUtilidad / totalIngreso) * 100).toFixed(1) + '%' : '0%';
                  })()}
                </td>
              </tr>
            )}
            {productos.map((producto, index) => {
              const margin = producto.totalIngreso > 0 ? ((producto.totalUtilidad / producto.totalIngreso) * 100) : 0;
              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-1.5 px-2 text-center flex justify-center gap-1.5 items-center">
                    <button
                      onClick={() => setSelectedMenuModalItem({ NombreES: producto.nombre, Nombre: producto.nombre, Receta: producto.recetaId, Precio: producto.totalIngreso && producto.cantidad ? producto.totalIngreso / producto.cantidad : 0 })}
                      className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-1 rounded transition-colors"
                      title="Ver Modal Platillo del Menú (Ventas & Receta)"
                    >
                      <Utensils size={15} />
                    </button>
                    <button
                      onClick={() => handlePredictClick(producto)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                      title="Análisis de Tendencias"
                    >
                      <LineChart size={15} />
                    </button>
                    {producto.recetaId && producto.recetaId !== "N/A" && (
                      <Button asChild
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 text-xs h-6">
                        <a
                          href={`/receta/${producto.recetaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 focus:outline-none focus-visible:ring-0"
                          title="Ver Receta Ficha Técnica"
                        >
                          <ChefHat size={13} />
                        </a>
                      </Button>
                    )}
                  </td>
                  <td className="py-1.5 px-2 font-medium text-gray-700 truncate max-w-[150px]" title={producto.nombre}>{producto.nombre}</td>
                  <td className="py-1.5 px-2 text-center font-bold text-gray-600">{producto.cantidad}</td>

                  {showFinancials && (
                    <>
                      <td className="py-1.5 px-2 text-gray-500 text-right">{producto.recetaValor?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                      <td className="py-1.5 px-2 text-green-600 font-medium text-right">{producto.totalIngreso?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                      <td className="py-1.5 px-2 text-red-500 text-right">{producto.totalCosto?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                      <td className={`py-1.5 px-2 text-right font-bold ${(producto.totalUtilidad || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>{producto.totalUtilidad?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                      <td className={`py-1.5 px-2 text-right font-bold ${margin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{margin.toFixed(1)}%</td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showPredict && selectedItem && (
        <Predict
          item={selectedItem}
          onClose={handleCloseModal}
          selectedMonth={targetMonth}
          selectedYear={targetYear}
          ventas={ventas}
        />
      )}

      {selectedMenuModalItem && (
        <ItemMenuModal
          item={selectedMenuModalItem}
          onClose={() => setSelectedMenuModalItem(null)}
        />
      )}
    </div>
  );
};

export default ProductosVendidosRentabilidad;
