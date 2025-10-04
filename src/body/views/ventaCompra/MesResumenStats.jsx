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
  totalCompras,
  cantidadDeDias // Esta prop ahora espera el array completo de ventas del mes
}) => {
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);

  // --- CÁLCULO AGREGADO DENTRO DEL COMPONENTE ---
  // Se asegura de que la prop sea un array antes de procesarla.
  const ventas = Array.isArray(cantidadDeDias) ? cantidadDeDias : [];
  
  // 1. Extrae las fechas únicas del array de ventas.
  const fechasUnicas = new Set(ventas.map(venta => venta.Date));
  
  // 2. Cuenta cuántos días únicos hay.
  const numeroDeDias = fechasUnicas.size;
  // --- FIN DEL CÁLCULO ---

  const totalCostoDirecto = useMemo(() => {
    const recetasMap = new Map(allRecetasMenu.map(receta => [receta._id, receta]));

    return ventasRecepies.reduce((acc, element) => {
      const recetaObj = recetasMap.get(element.recetaId);

      if (recetaObj?.costo) {
        try {
          const data = JSON.parse(recetaObj.costo);
          return acc + (data.vCMP * element.cantidad);
        } catch (error) {
          console.error("Error al parsear costo de receta:", error);
          return acc;
        }
      }
      return acc;
    }, 0);

  }, [ventasRecepies, allRecetasMenu]);

  // 3. Calcula el promedio usando el número de días que acabamos de obtener.
  const promedioDiario = numeroDeDias > 0 ? totalIngreso / numeroDeDias : 0;

  const formatNumber = (number) => {
    if (isNaN(number)) return "0";
    return number.toLocaleString('es-CO');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6 flex justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Resumen del Mes
        </h2>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Ingreso del Mes (Pagado): </span>
          <span className="text-green-600 font-bold">{formatNumber(totalIngreso)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Promedio de Ingreso por Día: </span>
          <span className="text-green-500 font-bold">{formatNumber(promedioDiario)}$</span>
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