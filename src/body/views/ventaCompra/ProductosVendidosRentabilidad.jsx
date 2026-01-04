import React, { useState } from 'react';
import Predict from './Predict';
import RecetaModal from './RecetaModal';
import { LineChart } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const ProductosVendidosRentabilidad = ({
  productos,
  ventas,
  targetMonth,
  targetYear,
  onOpenGastos
}) => {


  console.log(productos);
  const [showFinancials, setShowFinancials] = useState(true);
  const [showPredict, setShowPredict] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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
        <button
          onClick={() => setShowFinancials(!showFinancials)}
          className={`px-3 py-1 rounded text-xs font-bold transition-colors border ${showFinancials ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
        >
          {showFinancials ? 'Ocultar Rentabilidad' : 'Ver Rentabilidad'}
        </button>
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
                  <td className="py-1.5 px-2 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handlePredictClick(producto)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                      title="Análisis de Tendencias"
                    >
                      <LineChart size={16} />
                    </button>
                    {producto.recetaId && producto.recetaId !== "N/A" && (
                      <Button asChild
                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6">
                        <a
                          href={`/receta/${producto.recetaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8  focus:outline-none focus-visible:ring-0"
                        >
                          📕
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
    </div>
  );
};

export default ProductosVendidosRentabilidad;
