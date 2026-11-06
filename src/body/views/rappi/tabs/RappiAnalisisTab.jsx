import React, { useMemo, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  formatCOP,
  formatPct,
  colorMargen,
  parseVentaDate,
  parseJSONSafe,
} from "../utils/rappiPricing";
import { calcularCostoMenuItem } from "@/utils/costoMenu";
import { getVentasPorCanal } from "@/redux/actions-Rappi";
import { exportAnalisisExcel } from "../utils/exportMenuExcel";
import { RegistrarVentaRappiModal } from "../components/RegistrarVentaRappiModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  Plus,
  Calendar,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function RappiAnalisisTab({
  menu = [],
  recetasMenu = [],
  recetasProduccion = [],
  config,
}) {
  const dispatch = useDispatch();
  const [ventasRappi, setVentasRappi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes"); // "hoy" | "semana" | "mes" | "todo"
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [expandedVentaId, setExpandedVentaId] = useState(null);

  // Cargar ventas específicas de Rappi
  const loadVentas = async () => {
    setLoading(true);
    try {
      const data = await dispatch(getVentasPorCanal("RAPPI"));
      setVentasRappi(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas();
  }, [dispatch]);

  // Mapa de costos por producto del menú
  const mapaCostos = useMemo(() => {
    const mapa = {};
    menu.forEach((item) => {
      mapa[item._id] = calcularCostoMenuItem(item, recetasMenu, recetasProduccion);
      // también por nombre para ventas históricas
      if (item.NombreES) {
        mapa[item.NombreES.trim().toLowerCase()] = mapa[item._id];
      }
    });
    return mapa;
  }, [menu, recetasMenu, recetasProduccion]);

  // Filtrado de ventas por período
  const ventasFiltradas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return ventasRappi.filter((v) => {
      const fecha = parseVentaDate(v.Date);
      if (!fecha) return true;

      if (periodo === "hoy") {
        return fecha >= hoy;
      }
      if (periodo === "semana") {
        const semanaAtras = new Date(hoy);
        semanaAtras.setDate(semanaAtras.getDate() - 7);
        return fecha >= semanaAtras;
      }
      if (periodo === "mes") {
        return (
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getFullYear() === hoy.getFullYear()
        );
      }
      return true; // "todo"
    });
  }, [ventasRappi, periodo]);

  // Procesamiento y cálculo financiero detallado
  const { kpis, rentabilidadPorProducto, ventasProcesadas } = useMemo(() => {
    let totalBruto = 0;
    let totalComision = 0;
    let totalNeto = 0;
    let totalCostoProduccion = 0;

    const productosMap = {};

    const comisionPct = Number(config?.comision_pct || 25);
    const ivaComisionPct = Number(config?.iva_comision_pct || 19);

    const ventasProc = ventasFiltradas.map((v) => {
      const productos = parseJSONSafe(v.Productos, []);
      const canalInfo = parseJSONSafe(v.Canal_Info, {});
      const bruto = Number(v.Total_Ingreso || 0);

      // Comisión real o calculada por configuración
      const comisionVal =
        canalInfo?.comisionValor !== undefined
          ? Number(canalInfo.comisionValor)
          : Math.round(bruto * (comisionPct / 100) * (1 + ivaComisionPct / 100));

      const netoVal = bruto - comisionVal;

      let costoVenta = 0;

      const itemsConCosto = (Array.isArray(productos) ? productos : []).map((p) => {
        const qty = Number(p.quantity || 1);
        const unitPrice = Number(p.Precio || 0);
        const subtotal = unitPrice * qty;

        // Búsqueda de costo por ID o nombre
        const infoCosto =
          (p._id && mapaCostos[p._id]) ||
          (p.NombreES && mapaCostos[p.NombreES.trim().toLowerCase()]) ||
          { costo: 0, vCMP: 0, vCMO: 0, tieneReceta: false };

        const unitCost = infoCosto.costo || 0;
        const totalCostItem = unitCost * qty;
        costoVenta += totalCostItem;

        // Acumular por producto para la tabla de rentabilidad
        const prodKey = p.NombreES || "Sin nombre";
        if (!productosMap[prodKey]) {
          productosMap[prodKey] = {
            nombre: prodKey,
            unidades: 0,
            bruto: 0,
            costoUnit: unitCost,
            costoTotal: 0,
            tieneReceta: infoCosto.tieneReceta,
          };
        }
        productosMap[prodKey].unidades += qty;
        productosMap[prodKey].bruto += subtotal;
        productosMap[prodKey].costoTotal += totalCostItem;

        return {
          ...p,
          quantity: qty,
          unitPrice,
          subtotal,
          unitCost,
          totalCostItem,
          tieneReceta: infoCosto.tieneReceta,
        };
      });

      const gananciaVenta = netoVal - costoVenta;

      totalBruto += bruto;
      totalComision += comisionVal;
      totalNeto += netoVal;
      totalCostoProduccion += costoVenta;

      return {
        id: v._id,
        fecha: v.Date,
        hora: v.Time,
        pedido: canalInfo?.pedidoIdExterno || v.Cliente || "Rappi",
        total: bruto,
        comision: comisionVal,
        neto: netoVal,
        costo: costoVenta,
        ganancia: gananciaVenta,
        items: itemsConCosto,
        resumen: itemsConCosto.map((i) => `${i.quantity}x ${i.NombreES}`).join(", "),
      };
    });

    const gananciaTotal = totalNeto - totalCostoProduccion;
    const margenNetoGlobal = totalNeto > 0 ? (gananciaTotal / totalNeto) * 100 : 0;

    // Terminar de calcular comisiones y márgenes por producto
    const prodArray = Object.values(productosMap).map((p) => {
      const comision = p.bruto * (comisionPct / 100) * (1 + ivaComisionPct / 100);
      const neto = p.bruto - comision;
      const ganancia = neto - p.costoTotal;
      const margen = p.bruto > 0 ? (ganancia / p.bruto) * 100 : 0;
      return {
        ...p,
        comision,
        neto,
        ganancia,
        margen,
      };
    });

    return {
      kpis: {
        totalBruto,
        totalComision,
        totalNeto,
        totalCostoProduccion,
        gananciaTotal,
        margenNetoGlobal,
        pedidosCount: ventasFiltradas.length,
        ticketPromedio: ventasFiltradas.length > 0 ? totalBruto / ventasFiltradas.length : 0,
      },
      rentabilidadPorProducto: prodArray.sort((a, b) => b.ganancia - a.ganancia),
      ventasProcesadas: ventasProc,
    };
  }, [ventasFiltradas, mapaCostos, config]);

  const handleExportExcel = async () => {
    try {
      await exportAnalisisExcel({
        kpis: {
          "Ventas Brutas": kpis.totalBruto,
          "Comisión Rappi": kpis.totalComision,
          "Neto Recibido": kpis.totalNeto,
          "Costo de Producción (CMP+CMO)": kpis.totalCostoProduccion,
          "Ganancia Neta": kpis.gananciaTotal,
          "Margen Neto %": kpis.margenNetoGlobal,
          "Total Pedidos": kpis.pedidosCount,
          "Ticket Promedio": kpis.ticketPromedio,
        },
        productos: rentabilidadPorProducto,
        ventas: ventasProcesadas,
        periodoLabel: `rappi_${periodo}`,
      });
    } catch (err) {
      console.error(err);
      alert("Error al exportar reporte Excel.");
    }
  };

  return (
    <div className="space-y-3">
      {/* Barra de Controles y Período */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-bold text-slate-700 mr-1">Período:</span>
          {[
            { key: "hoy", label: "Hoy" },
            { key: "semana", label: "Últimos 7 días" },
            { key: "mes", label: "Este mes" },
            { key: "todo", label: "Todo el historial" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                periodo === p.key
                  ? "bg-orange-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            disabled={ventasFiltradas.length === 0}
            className="h-8 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Exportar Análisis
          </Button>

          <Button
            size="sm"
            onClick={() => setModalRegistroOpen(true)}
            className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Registrar Venta Rappi
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI Financieras (2.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Ventas Brutas</span>
          <span className="text-base sm:text-lg font-bold text-slate-900 block truncate">
            {formatCOP(kpis.totalBruto)}
          </span>
          <span className="text-[10px] text-slate-400">{kpis.pedidosCount} pedidos</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Comisión Rappi</span>
          <span className="text-base sm:text-lg font-bold text-orange-600 block truncate">
            {formatCOP(kpis.totalComision)}
          </span>
          <span className="text-[10px] text-slate-400">{config?.comision_pct || 25}% + IVA</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Neto Recibido</span>
          <span className="text-base sm:text-lg font-bold text-blue-700 block truncate">
            {formatCOP(kpis.totalNeto)}
          </span>
          <span className="text-[10px] text-slate-400">Bruto − Comisión</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Costo Producción</span>
          <span className="text-base sm:text-lg font-bold text-slate-700 block truncate">
            {formatCOP(kpis.totalCostoProduccion)}
          </span>
          <span className="text-[10px] text-slate-400">Recetas (CMP+CMO)</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Ganancia Neta</span>
          <span
            className={`text-base sm:text-lg font-extrabold block truncate ${
              kpis.gananciaTotal >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatCOP(kpis.gananciaTotal)}
          </span>
          <span className="text-[10px] text-slate-400">Utilidad real bolsillo</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Margen Neto %</span>
          <span
            className={`text-base sm:text-lg font-extrabold block truncate ${
              kpis.margenNetoGlobal >= 25 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {formatPct(kpis.margenNetoGlobal)}
          </span>
          <span className="text-[10px] text-slate-400">Sobre ingreso neto</span>
        </div>
      </div>

      {/* Tabla 1: Rentabilidad por Producto Vendido en Rappi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Rentabilidad por Producto Vendido en Rappi
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {rentabilidadPorProducto.length} producto(s) con ventas
          </span>
        </div>

        <div className="overflow-x-auto max-h-[36vh]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-2">Producto</th>
                <th className="p-2 text-center">Uds</th>
                <th className="p-2 text-right">Facturado Bruto</th>
                <th className="p-2 text-right">Comisión</th>
                <th className="p-2 text-right">Neto</th>
                <th className="p-2 text-right">Costo Unit.</th>
                <th className="p-2 text-right">Costo Total</th>
                <th className="p-2 text-right">Ganancia</th>
                <th className="p-2 text-center">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentabilidadPorProducto.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    No hay ventas de productos indexados a Rappi en este período.
                  </td>
                </tr>
              ) : (
                rentabilidadPorProducto.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{p.nombre}</span>
                        {!p.tieneReceta && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold" title="Sin receta asignada">
                            Sin receta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center font-bold text-slate-700">
                      {p.unidades}
                    </td>
                    <td className="p-2 text-right text-slate-700">
                      {formatCOP(p.bruto)}
                    </td>
                    <td className="p-2 text-right text-orange-600">
                      {formatCOP(p.comision)}
                    </td>
                    <td className="p-2 text-right text-blue-700 font-medium">
                      {formatCOP(p.neto)}
                    </td>
                    <td className="p-2 text-right text-slate-500">
                      {formatCOP(p.costoUnit)}
                    </td>
                    <td className="p-2 text-right text-slate-700">
                      {formatCOP(p.costoTotal)}
                    </td>
                    <td className="p-2 text-right font-bold">
                      <span className={p.ganancia >= 0 ? "text-emerald-700" : "text-red-600"}>
                        {formatCOP(p.ganancia)}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${colorMargen(p.margen, p.tieneReceta)}`}>
                        {p.tieneReceta ? formatPct(p.margen) : "N/D"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla 2: Historial Detallado de Ventas de Rappi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Historial de Pedidos y Ventas Rappi
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {ventasProcesadas.length} pedidos registrados
          </span>
        </div>

        <div className="overflow-x-auto max-h-[38vh]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-2 w-8"></th>
                <th className="p-2">Fecha / Hora</th>
                <th className="p-2">Pedido / Cliente</th>
                <th className="p-2">Productos</th>
                <th className="p-2 text-right">Total Bruto</th>
                <th className="p-2 text-right">Comisión</th>
                <th className="p-2 text-right">Neto</th>
                <th className="p-2 text-right">Costo Prod.</th>
                <th className="p-2 text-right">Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventasProcesadas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    No hay pedidos de Rappi registrados en este período. Puedes registrar uno con el botón superior.
                  </td>
                </tr>
              ) : (
                ventasProcesadas.map((v) => {
                  const isExpanded = expandedVentaId === v.id;
                  return (
                    <React.Fragment key={v.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedVentaId(isExpanded ? null : v.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="p-2 whitespace-nowrap text-slate-600">
                          <span className="font-medium text-slate-800 block">{v.fecha}</span>
                          <span className="text-[10px] text-slate-400">{v.hora}</span>
                        </td>
                        <td className="p-2 font-bold text-slate-800">{v.pedido}</td>
                        <td className="p-2 max-w-xs truncate text-slate-600" title={v.resumen}>
                          {v.resumen}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {formatCOP(v.total)}
                        </td>
                        <td className="p-2 text-right text-orange-600">
                          {formatCOP(v.comision)}
                        </td>
                        <td className="p-2 text-right text-blue-700 font-medium">
                          {formatCOP(v.neto)}
                        </td>
                        <td className="p-2 text-right text-slate-500">
                          {formatCOP(v.costo)}
                        </td>
                        <td className="p-2 text-right font-bold">
                          <span className={v.ganancia >= 0 ? "text-emerald-700" : "text-red-600"}>
                            {formatCOP(v.ganancia)}
                          </span>
                        </td>
                      </tr>

                      {/* Fila expandible con el detalle del pedido */}
                      {isExpanded && (
                        <tr className="bg-orange-50/40">
                          <td colSpan={9} className="p-3">
                            <div className="bg-white rounded-lg p-2.5 border border-orange-200 space-y-1.5 text-xs">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                Detalle de ítems y costo de producción unitario:
                              </span>
                              <div className="space-y-1">
                                {v.items.map((it, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800">
                                        {it.quantity}x {it.NombreES}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        ({formatCOP(it.unitPrice)} c/u)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px]">
                                      <span className="text-slate-500">
                                        Costo prod: <b>{formatCOP(it.totalCostItem)}</b>
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        Subtotal: {formatCOP(it.subtotal)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para registrar venta manual */}
      <RegistrarVentaRappiModal
        isOpen={modalRegistroOpen}
        onClose={() => setModalRegistroOpen(false)}
        menuItems={menu.filter((m) => m.RAPPI)}
        config={config}
        onSuccess={loadVentas}
      />
    </div>
  );
}

export default RappiAnalisisTab;
