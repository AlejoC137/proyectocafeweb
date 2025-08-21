import React, { useMemo } from "react";

// --- Helper para formatear moneda ---
const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(number)}`;
};

// --- Componente para una tarjeta de estadística individual ---
const StatCard = ({ title, value, icon, colorClass, note }) => (
  <div className={`p-4 bg-white rounded-lg shadow-md flex items-start gap-4 border-l-4 ${colorClass}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {note && <p className="text-xs text-gray-500">{note}</p>}
    </div>
  </div>
);

const DiaResumentStats = ({
  ventasRecepies,
  allRecetasMenu,
  totalIngreso,
  totalTip,
  totalProductosVendidos,
  totalTarjeta,
  totalEfectivo,
  totalTransferencia,
  totalCompras
}) => {
  
  const totalCostoDirecto = useMemo(() => {
    if (!ventasRecepies || !allRecetasMenu) return 0;

    return ventasRecepies.reduce((acc, venta) => {
      if (!venta.recetaId) return acc;
      const recetaObj = allRecetasMenu.find(r => r._id === venta.recetaId);
      if (recetaObj && recetaObj.costo) {
        try {
          const costoData = JSON.parse(recetaObj.costo);
          return acc + (costoData.vCMP * venta.cantidad);
        } catch (e) {
          return acc;
        }
      }
      return acc;
    }, 0);
  }, [ventasRecepies, allRecetasMenu]);

  const statsData = useMemo(() => [
    {
      title: "Ingreso Total (Ventas)",
      value: formatCurrency(totalIngreso),
      icon: "💰",
      colorClass: "border-green-500",
    },
    {
      title: "Propinas",
      value: formatCurrency(totalTip),
      icon: "❤️",
      colorClass: "border-pink-500",
    },
    {
      title: "Productos Vendidos",
      value: totalProductosVendidos,
      icon: "☕️",
      colorClass: "border-purple-500",
    },
    {
      title: "Utilidad Bruta (Aprox.)",
      value: formatCurrency(totalIngreso - totalCostoDirecto),
      icon: "📊",
      colorClass: "border-blue-500",
      note: "Ingresos - Costo Directo de Productos"
    },
    {
      title: "Pagos con Tarjeta",
      value: formatCurrency(totalTarjeta),
      icon: "💳",
      colorClass: "border-yellow-500",
      note: `Neto (-3%): ${formatCurrency(totalTarjeta * 0.97)}`
    },
    {
      title: "Pagos en Efectivo",
      value: formatCurrency(totalEfectivo),
      icon: "💵",
      colorClass: "border-green-500",
    },
    {
      title: "Pagos por Transferencia",
      value: formatCurrency(totalTransferencia),
      icon: "📱",
      colorClass: "border-sky-500",
    },
    {
      title: "Total Compras (Gastos)",
      value: formatCurrency(totalCompras),
      icon: "🛒",
      colorClass: "border-red-500",
    },
  ], [totalIngreso, totalTip, totalProductosVendidos, totalCostoDirecto, totalTarjeta, totalEfectivo, totalTransferencia, totalCompras]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map(stat => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};

export default DiaResumentStats;