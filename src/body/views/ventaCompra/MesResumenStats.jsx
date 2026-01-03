import React, { useMemo } from "react";
import { useSelector } from "react-redux";


const StatCard = ({ title, value, colorClass, subValue }) => (
  <div className="bg-gray-50 p-3 rounded border border-gray-100">
    <p className="text-xs text-gray-500 font-bold uppercase mb-1">{title}</p>
    <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
  </div>
);

const MesResumenStats = ({
  ventasRecepies,
  totalIngreso,
  totalTip,
  totalProductosVendidos,
  totalTarjeta,
  totalEfectivo,
  totalTransferencia,
  totalCompras,
  cantidadDeDias
}) => {
  const ventas = Array.isArray(cantidadDeDias) ? cantidadDeDias : [];
  const fechasUnicas = new Set(ventas.map(venta => venta.Date));
  const numeroDeDias = fechasUnicas.size;

  const totalCostoDirecto = useMemo(() => {
    return ventasRecepies.reduce((acc, element) => acc + (element.totalCosto || 0), 0);
  }, [ventasRecepies]);

  const promedioDiario = numeroDeDias > 0 ? totalIngreso / numeroDeDias : 0;

  const formatNumber = (number) => {
    if (isNaN(number)) return "0";
    return number.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Resumen del Mes</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Ingresos */}
        <StatCard title="Ingreso Total" value={formatNumber(totalIngreso)} colorClass="text-green-600" subValue="Pagado" />
        <StatCard title="Promedio Diario" value={formatNumber(promedioDiario)} colorClass="text-green-500" />

        {/* Medios de Pago */}
        <StatCard title="Tarjeta" value={formatNumber(totalTarjeta * 0.97)} colorClass="text-yellow-600" subValue="-3% Retención incluido" />
        <StatCard title="Efectivo" value={formatNumber(totalEfectivo)} colorClass="text-yellow-600" />
        <StatCard title="Transferencia" value={formatNumber(totalTransferencia)} colorClass="text-yellow-600" />

        {/* Costos */}
        <StatCard title="Costo Directo" value={formatNumber(totalCostoDirecto)} colorClass="text-red-600" />
        <StatCard title="Compras Reales" value={formatNumber(totalCompras)} colorClass="text-red-600" />
        <StatCard title="Impoconsumo (8%)" value={formatNumber(totalIngreso * 0.08)} colorClass="text-red-500" />

        {/* Otros */}
        <StatCard title="Propinas" value={formatNumber(totalTip)} colorClass="text-blue-600" />
      </div>
    </div>
  );
};

export default MesResumenStats;