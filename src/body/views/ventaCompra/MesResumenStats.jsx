import React, { useMemo } from "react";
import { useSelector } from "react-redux";

const MesResumenStats = ({
  ventasRecepies,
  totalIngreso,
  totalTip,
  totalProductosVendidos,
  totalTarjeta,
  totalEfectivo,
  totalTransferencia,
  totalCompras
}) => {
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);

  // 1. MEJORA: Se elimina useEffect y useState. El cálculo se hace con useMemo.
  // Es más eficiente y el código es más limpio y predecible.
  const totalCostoDirecto = useMemo(() => {
    // Para optimizar, creamos un mapa de recetas para una búsqueda más rápida.
    const recetasMap = new Map(allRecetasMenu.map(receta => [receta._id, receta]));

    // Se calcula el costo total reduciendo directamente el array de ventas.
    return ventasRecepies.reduce((acc, element) => {
      const recetaObj = recetasMap.get(element.recetaId);

      if (recetaObj?.costo) {
        try {
          const data = JSON.parse(recetaObj.costo);
          // Se suma el costo del producto (costo unitario * cantidad) al acumulador.
          return acc + (data.vCMP * element.cantidad);
        } catch (error) {
          console.error("Error al parsear costo de receta:", error);
          return acc;
        }
      }
      return acc;
    }, 0); // El valor inicial del acumulador es 0.

  }, [ventasRecepies, allRecetasMenu]);

  // 2. MEJORA: Se unifica el formato de número a 'es-CO' (Colombia) por consistencia.
  const formatNumber = (number) => {
    // Se añade un fallback por si el número es inválido.
    if (isNaN(number)) return "0";
    return number.toLocaleString('es-CO');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6 flex justify-between">
      <div>
        {/* 3. MEJORA: Se corrige el texto para reflejar que es un resumen del mes. */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Resumen del Mes
        </h2>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Ingreso del Mes (Pagado): </span>
          <span className="text-green-600 font-bold">{formatNumber(totalIngreso)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Tip del Mes (Pagado): </span>
          <span className="text-blue-600 font-bold">{formatNumber(totalTip)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Productos Vendidos: </span>
          <span className="text-purple-600 font-bold">{totalProductosVendidos}</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Pagado con Tarjeta: </span>
          <span className="text-yellow-600 font-bold">{formatNumber(totalTarjeta * 0.97)}$</span>
          <span className="text-yellow-600 font-bold"> {'(-3% RDB)'}</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Pagado en Efectivo: </span>
          <span className="text-yellow-600 font-bold">{formatNumber(totalEfectivo)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Pagado por Transferencia: </span>
          <span className="text-yellow-600 font-bold">{formatNumber(totalTransferencia)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Costo directo: </span>
          <span className="text-red-600 font-bold">{formatNumber(totalCostoDirecto)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Ipo Consumo (8%): </span>
          <span className="text-red-600 font-bold">{formatNumber(totalIngreso * 0.08)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Compras del Mes: </span>
          <span className="text-red-600 font-bold">{formatNumber(totalCompras)}$</span>
        </p>
      </div>
    </div>
  );
};

export default MesResumenStats;