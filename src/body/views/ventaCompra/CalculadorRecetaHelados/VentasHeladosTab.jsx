import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Layers, 
  Search, 
  DollarSign, 
  PieChart, 
  IceCream, 
  CheckCircle2, 
  BarChart3, 
  RefreshCw, 
  Info, 
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Filter,
  BookOpen,
  Receipt,
  ExternalLink,
  Calendar,
  Users,
  Coins,
  Percent,
  Printer,
  ShieldCheck,
  Award
} from "lucide-react";
import RecetaModal from "../RecetaModal";

export default function VentasHeladosTab({
  allMenu = [],
  allProduccion = [],
  allItems = [],
  allRecetasMenu = [],
  allRecetasProduccion = [],
  allVentas = [],
  allComanda = []
}) {
  const navigate = useNavigate();

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHeladosOnly, setFilterHeladosOnly] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("THIS_MONTH"); // 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS' | 'CUSTOM'
  
  // Custom Date Range Pickers (Desde - Hasta)
  const now = new Date();
  const defaultFirstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultFirstDay);
  const [endDate, setEndDate] = useState(defaultLastDay);

  // Sociedad / Repartición Config State
  const [pctProyectoCafe, setPctProyectoCafe] = useState(50);
  const [pctReserva, setPctReserva] = useState(0);
  const [modoPayback, setModoPayback] = useState(false); // Payback mode: 70% Inversionista / 30% Café
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedRecetaModal, setSelectedRecetaModal] = useState(null);

  // Quick Period Presets Selector Handler
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const currentDate = new Date();

    if (period === "TODAY") {
      const todayStr = currentDate.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (period === "THIS_WEEK") {
      const firstDay = new Date(currentDate);
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      firstDay.setDate(diff);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(currentDate.toISOString().split("T")[0]);
    } else if (period === "THIS_MONTH") {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(lastDay.toISOString().split("T")[0]);
    } else if (period === "LAST_MONTH") {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(lastDay.toISOString().split("T")[0]);
    } else if (period === "LAST_30_DAYS") {
      const past30 = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past30.toISOString().split("T")[0]);
      setEndDate(currentDate.toISOString().split("T")[0]);
    } else if (period === "ALL") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Filter sales by selected time period / exact dates
  const filteredVentas = useMemo(() => {
    if (!allVentas || !Array.isArray(allVentas)) return [];
    if (selectedPeriod === "ALL" && !startDate && !endDate) return allVentas;

    const currentDate = new Date();
    const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
    const todayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);

    return allVentas.filter((v) => {
      if (!v) return false;
      const rawDateStr = v.Date || v.Fecha || v.created_at;
      if (!rawDateStr) return true;

      const vDate = new Date(rawDateStr);
      if (isNaN(vDate.getTime())) return true;

      if (selectedPeriod === "TODAY") {
        return vDate >= todayStart && vDate <= todayEnd;
      }

      if (selectedPeriod === "THIS_WEEK") {
        const firstDayOfWeek = new Date(currentDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        return vDate >= firstDayOfWeek;
      }

      if (selectedPeriod === "THIS_MONTH") {
        return vDate.getMonth() === currentDate.getMonth() && vDate.getFullYear() === currentDate.getFullYear();
      }

      if (selectedPeriod === "LAST_MONTH") {
        const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
        const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
        return vDate.getMonth() === lastMonth && vDate.getFullYear() === lastMonthYear;
      }

      if (selectedPeriod === "LAST_30_DAYS") {
        const past30 = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        return vDate >= past30;
      }

      if (selectedPeriod === "CUSTOM" || startDate || endDate) {
        if (startDate) {
          const s = new Date(startDate + "T00:00:00");
          if (vDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate + "T23:59:59");
          if (vDate > e) return false;
        }
        return true;
      }

      return true;
    });
  }, [allVentas, selectedPeriod, startDate, endDate]);

  // Count of Days in selected period
  const diasPeriodo = useMemo(() => {
    if (startDate && endDate) {
      const s = new Date(startDate + "T00:00:00");
      const e = new Date(endDate + "T23:59:59");
      const diffMs = e.getTime() - s.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
    }
    return 30;
  }, [startDate, endDate]);

  // Aggregate Sales per Menu Item
  const salesMap = useMemo(() => {
    const map = {};

    filteredVentas.forEach((venta) => {
      if (!venta.Productos) return;
      try {
        const prods = typeof venta.Productos === "string" ? JSON.parse(venta.Productos) : venta.Productos;
        if (Array.isArray(prods)) {
          prods.forEach((p) => {
            const name = p.NombreES || p.nombre || p.name;
            if (!name) return;
            const qty = parseFloat(p.quantity || p.cantidad || 1);
            let price = parseFloat(p.price || p.valor || p.precio || 0);

            if (!map[name]) {
              map[name] = { qty: 0, revenue: 0, ordersCount: 0 };
            }
            map[name].qty += qty;
            map[name].revenue += price * qty;
            map[name].ordersCount += 1;
          });
        }
      } catch (e) {
        // Ignore parse error
      }
    });

    if (allComanda && Array.isArray(allComanda)) {
      allComanda.forEach((cmd) => {
        const name = cmd.NombreES || cmd.Nombre || cmd.nombre;
        if (!name) return;
        if (!map[name]) {
          map[name] = { qty: 0, revenue: 0, ordersCount: 0 };
        }
        map[name].ordersCount += 1;
      });
    }

    return map;
  }, [filteredVentas, allComanda]);

  // Helper: check if menu item is ice cream (strictly excludes Michelado)
  const isHeladoMenuItem = (item) => {
    if (!item) return false;
    const name = (item.NombreES || "").toLowerCase();
    const g = (item.GRUPO || "").toUpperCase();
    const sub = (item.SUB_GRUPO || "").toUpperCase();

    if (
      name.includes("michelad") ||
      sub.includes("MICHELAD") ||
      g.includes("MICHELAD") ||
      g.includes("ADICION") ||
      sub.includes("ADICION")
    ) {
      return false;
    }

    const isHeladoName = name.includes("helado");

    return (
      g.includes("HELADO") ||
      sub.includes("HELADO") ||
      sub === "SOFT" ||
      sub === "GELATO" ||
      sub === "SORBETE" ||
      sub === "TOPPING" ||
      isHeladoName ||
      name.includes("gelato") ||
      name.includes("soft") ||
      name.includes("sorbete") ||
      name.includes("copa") ||
      name.includes("barquill") ||
      name.includes("cono") ||
      name.includes("sundae") ||
      name.includes("paleta")
    );
  };

  // Build List of Helado Menu Items with Sales & Financial Metrics
  const menuHeladosList = useMemo(() => {
    return allMenu
      .filter((item) => {
        if (filterHeladosOnly && !isHeladoMenuItem(item)) return false;
        if (searchTerm.trim() !== "") {
          const term = searchTerm.toLowerCase();
          const nameMatch = (item.NombreES || "").toLowerCase().includes(term);
          const groupMatch = (item.GRUPO || "").toLowerCase().includes(term);
          return nameMatch || groupMatch;
        }
        return true;
      })
      .map((item) => {
        const name = item.NombreES || "Sin Nombre";
        const price = parseFloat(item.Precio || 0);
        const salesData = salesMap[name] || { qty: 0, revenue: 0, ordersCount: 0 };
        const totalRevenue = salesData.revenue > 0 ? salesData.revenue : salesData.qty * price;

        const receta =
          allRecetasMenu.find((r) => r._id === item.Receta || r.forId === item._id) ||
          allRecetasProduccion.find((r) => r._id === item.Receta || r.forId === item._id);

        let unitCost = 0;
        let recipeName = null;
        if (receta) {
          recipeName = receta.legacyName || receta.nombre || "Receta Vinculada";
          try {
            const costObj = typeof receta.costo === "string" ? JSON.parse(receta.costo) : receta.costo || {};
            unitCost = parseFloat(costObj.vCMP || costObj.COSTO_POR_PORCION || costObj.COSTO || 0);
          } catch (e) {
            unitCost = parseFloat(item.COSTO || 0);
          }
        } else if (item.COSTO) {
          unitCost = parseFloat(item.COSTO || 0);
        }

        const unitProfit = price - unitCost;
        const profitMargin = price > 0 ? (unitProfit / price) * 100 : 0;
        const totalProfit = unitProfit * salesData.qty;
        const totalCost = unitCost * salesData.qty;

        return {
          ...item,
          nombre: name,
          precio: price,
          unidadesVendidas: salesData.qty,
          ingresosTotales: totalRevenue,
          receta,
          recipeName,
          costoUnitario: unitCost,
          gananciaUnitaria: unitProfit,
          margenPct: profitMargin,
          gananciaTotal: totalProfit,
          costoTotal: totalCost
        };
      })
      .sort((a, b) => b.ingresosTotales - a.ingresosTotales);
  }, [allMenu, salesMap, filterHeladosOnly, searchTerm, allRecetasMenu, allRecetasProduccion]);

  // Identify Ice Cream Production Items
  const produccionHelados = useMemo(() => {
    return allProduccion.filter((p) => {
      const g = (p.GRUPO || "").toUpperCase();
      const sub = (p.SUB_GRUPO || "").toUpperCase();
      const name = (p.Nombre_del_producto || p.NombreES || p.nombre || "").toLowerCase();
      if (
        name.includes("michelad") || 
        g.includes("MICHELAD") ||
        g.includes("ADICION") ||
        sub.includes("ADICION")
      ) return false;

      return (
        g.includes("HELADO") ||
        name.includes("helado") ||
        name.includes("gelato") ||
        name.includes("soft") ||
        name.includes("sorbete") ||
        name.includes("base")
      );
    });
  }, [allProduccion]);

  // Track usage of Ice Cream Production items as ingredients in other recipes
  const consumoHeladoEnRecetas = useMemo(() => {
    const usageList = [];

    const combinedRecipes = [
      ...allRecetasMenu.map((r) => ({ ...r, origin: "Menu" })),
      ...allRecetasProduccion.map((r) => ({ ...r, origin: "Produccion" }))
    ];

    combinedRecipes.forEach((receta) => {
      const parentMenu = allMenu.find((m) => m._id === receta.forId || m.Receta === receta._id);
      const parentProd = allProduccion.find((p) => p._id === receta.forId || p.Receta === receta._id);
      const parentName = parentMenu?.NombreES || parentProd?.Nombre_del_producto || receta.legacyName || "Receta #" + receta._id;

      let details = [];
      if (receta.detalles) {
        details = typeof receta.detalles === "string" ? JSON.parse(receta.detalles) : receta.detalles;
      } else if (receta.ingredientes) {
        details = typeof receta.ingredientes === "string" ? JSON.parse(receta.ingredientes) : receta.ingredientes;
      } else if (receta.items) {
        details = receta.items;
      }

      if (!Array.isArray(details)) return;

      details.forEach((ing) => {
        const ingName = (ing.nombre || ing.ingNombre || "").toLowerCase();
        const ingId = ing.inventarioItemId || ing.ingId || ing.id;

        if (ingName.includes("michelad") || ingName.includes("adicion")) return;

        const isHeladoProd = produccionHelados.some(
          (ph) => ph._id === ingId || (ph.Nombre_del_producto && ph.Nombre_del_producto.toLowerCase() === ingName)
        ) || ingName.includes("helado") || ingName.includes("gelato") || ingName.includes("soft");

        if (isHeladoProd) {
          const qtyGrams = parseFloat(ing.cantidad || ing.grams || ing.peso || 0);
          const salesData = salesMap[parentName] || { qty: 0, revenue: 0 };
          const unidadesVendidas = salesData.qty;
          const consumoTotalKg = (qtyGrams * unidadesVendidas) / 1000;

          let costoKgHelado = parseFloat(ing.itemCostoKg || 0);
          if (costoKgHelado === 0) {
            const prodMatch = produccionHelados.find(ph => ph._id === ingId || (ph.Nombre_del_producto && ph.Nombre_del_producto.toLowerCase() === ingName));
            if (prodMatch) costoKgHelado = parseFloat(prodMatch.COSTO || prodMatch.precioUnitario || 0);
          }

          const costoTotalConsumido = consumoTotalKg * costoKgHelado;

          usageList.push({
            recetaId: receta._id,
            productoFinal: parentName,
            origen: receta.origin === "Menu" ? "🗺️ Menú" : "🥘 Producción",
            heladoIngrediente: ing.nombre || ing.ingNombre || "Base Helado",
            dosisPorcionGramos: qtyGrams,
            unidadesVendidas,
            consumoTotalKg,
            costoKgHelado,
            costoTotalConsumido
          });
        }
      });
    });

    return usageList.sort((a, b) => b.consumoTotalKg - a.consumoTotalKg);
  }, [allRecetasMenu, allRecetasProduccion, allMenu, allProduccion, produccionHelados, salesMap]);

  // Overall Performance Summary KPIs
  const summaryKPIs = useMemo(() => {
    const totalHeladosVendidosUnidades = menuHeladosList.reduce((acc, item) => acc + item.unidadesVendidas, 0);
    const totalIngresosDirectos = menuHeladosList.reduce((acc, item) => acc + item.ingresosTotales, 0);
    const totalGananciaDirecta = menuHeladosList.reduce((acc, item) => acc + item.gananciaTotal, 0);
    const totalKilosHeladoRecetasSecundarias = consumoHeladoEnRecetas.reduce((acc, item) => acc + item.consumoTotalKg, 0);
    const totalCostoHeladoConsumido = consumoHeladoEnRecetas.reduce((acc, item) => acc + item.costoTotalConsumido, 0);

    const marginAverage = totalIngresosDirectos > 0 ? (totalGananciaDirecta / totalIngresosDirectos) * 100 : 0;

    return {
      totalHeladosVendidosUnidades,
      totalIngresosDirectos,
      totalGananciaDirecta,
      totalKilosHeladoRecetasSecundarias,
      totalCostoHeladoConsumido,
      marginAverage
    };
  }, [menuHeladosList, consumoHeladoEnRecetas]);

  // Calculated Sociedad Equity / Dividend Percentages
  const pctInvCalculado = useMemo(() => {
    if (modoPayback) return 70;
    return 100 - pctProyectoCafe;
  }, [modoPayback, pctProyectoCafe]);

  const pctCafeCalculado = useMemo(() => {
    if (modoPayback) return 30;
    return pctProyectoCafe;
  }, [modoPayback, pctProyectoCafe]);

  // Dividend Repartición Summary for Selected Date Range
  const reparticionSociedad = useMemo(() => {
    const utilidadTotal = summaryKPIs.totalGananciaDirecta;
    const ingresosTotal = summaryKPIs.totalIngresosDirectos;
    const costoTotal = summaryKPIs.totalIngresosDirectos - summaryKPIs.totalGananciaDirecta;

    const montoReserva = utilidadTotal * (pctReserva / 100);
    const utilidadDistribuible = Math.max(0, utilidadTotal - montoReserva);

    const montoProyectoCafe = utilidadDistribuible * (pctCafeCalculado / 100);
    const montoInversionista = utilidadDistribuible * (pctInvCalculado / 100);

    const promedioDiarioDistribuible = utilidadDistribuible / (diasPeriodo || 1);
    const promedioDiarioCafe = montoProyectoCafe / (diasPeriodo || 1);
    const promedioDiarioInv = montoInversionista / (diasPeriodo || 1);

    return {
      utilidadTotal,
      ingresosTotal,
      costoTotal,
      montoReserva,
      utilidadDistribuible,
      montoProyectoCafe,
      montoInversionista,
      promedioDiarioDistribuible,
      promedioDiarioCafe,
      promedioDiarioInv,
      pctCafeCalculado,
      pctInvCalculado
    };
  }, [summaryKPIs, pctReserva, pctCafeCalculado, pctInvCalculado, diasPeriodo]);

  return (
    <div className="space-y-6 font-SpaceGrotesk">
      {/* HEADER BANNER & PERIOD FILTER */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-black p-4 shadow-solid flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-amber-950 flex items-center gap-2">
            <IceCream className="h-6 w-6 text-amber-600" />
            Control de Ventas & Consumo de Helados (Dubovik Analytics)
          </h2>
          <p className="text-xs text-amber-900 font-medium">
            Monitoreo de ventas directas, consumo en recetas y <strong>repartición de dividendos por período</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/Recetas')}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs border-2 border-black shadow-solid flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="h-4 w-4" /> 📕 Ir a Libro (Recetas)
          </button>
          <button
            onClick={() => navigate('/VentaCompra')}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-2 border-black shadow-solid flex items-center gap-1.5 transition-all"
          >
            <ShoppingCart className="h-4 w-4" /> 💵 Ir a Caja
          </button>
        </div>
      </div>

      {/* CONTROLES DE FECHAS CLARAS Y SELECCIÓN DE PERÍODO */}
      <div className="bg-white border-2 border-black p-4 shadow-solid space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            <h3 className="font-extrabold text-sm md:text-base text-gray-900 uppercase tracking-wide">
              🗓️ Rango de Fechas & Período de Ventas
            </h3>
          </div>
          <div className="text-xs font-mono font-bold bg-amber-100 px-3 py-1 border border-black text-amber-950">
            {startDate && endDate ? `Del ${startDate} al ${endDate} (${diasPeriodo} días)` : "Ventas Históricas Totales"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Presets Dropdown */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-gray-700 shrink-0">Período Rápido:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-amber-50 text-amber-950 font-bold border-2 border-black px-2.5 py-1.5 cursor-pointer focus:outline-none text-xs"
            >
              <option value="THIS_MONTH">📅 Este Mes</option>
              <option value="TODAY">☀️ Hoy</option>
              <option value="THIS_WEEK">📆 Esta Semana</option>
              <option value="LAST_MONTH">⏮️ Mes Anterior</option>
              <option value="LAST_30_DAYS">📊 Últimos 30 Días</option>
              <option value="CUSTOM">⚙️ Rango Personalizado</option>
              <option value="ALL">🌐 Todo el Histórico</option>
            </select>
          </div>

          {/* Date Pickers Desde - Hasta */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-gray-700">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedPeriod("CUSTOM");
              }}
              className="bg-white text-black font-mono font-bold border-2 border-black px-2 py-1 focus:bg-amber-50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-gray-700">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedPeriod("CUSTOM");
              }}
              className="bg-white text-black font-mono font-bold border-2 border-black px-2 py-1 focus:bg-amber-50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* TARJETA DE REPARTICIÓN DE GANANCIAS DE LA SOCIEDAD PARA EL PERÍODO SELECCIONADO */}
      <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 border-2 border-black p-4 md:p-5 shadow-solid space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div>
            <h3 className="font-black text-base md:text-lg text-amber-950 flex items-center gap-2">
              <Coins className="h-6 w-6 text-amber-700" />
              Calculadora & Repartición de Dividendos por Período Seleccionado
            </h3>
            <p className="text-xs text-amber-900">
              Distribución exacta de utilidades netas generadas por heladería durante los <strong>{diasPeriodo} días</strong> seleccionados.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setModoPayback(!modoPayback)}
              className={`px-3 py-1.5 border-2 border-black text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 ${
                modoPayback
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Award className="h-4 w-4" /> {modoPayback ? "Modo Payback Activo (70/30)" : "Modo Normal (Configured %)"}
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black font-extrabold text-xs shadow-solid flex items-center gap-1.5 transition-all"
            >
              <Printer className="h-4 w-4" /> Imprimir Ficha de Repartición
            </button>
          </div>
        </div>

        {/* PARÁMETROS DE REPARTICIÓN (SLIDERS & CONFIG) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 border-2 border-black text-xs font-bold">
          <div>
            <label className="block text-gray-700 mb-1">
              ☕ Participación Proyecto Café: <span className="text-amber-950 text-sm font-black">{reparticionSociedad.pctCafeCalculado}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              disabled={modoPayback}
              value={pctProyectoCafe}
              onChange={(e) => setPctProyectoCafe(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              🍦 Participación Socio Inversionista: <span className="text-sky-900 text-sm font-black">{reparticionSociedad.pctInvCalculado}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              disabled={true}
              value={reparticionSociedad.pctInvCalculado}
              className="w-full accent-sky-600 cursor-not-allowed opacity-75"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              🛠️ Reserva Mantenimiento/Fondo: <span className="text-amber-800 text-sm font-black">{pctReserva}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              value={pctReserva}
              onChange={(e) => setPctReserva(Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>
        </div>

        {/* TARJETAS DE REPARTICIÓN MONETARIA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MONTO PROYECTO CAFÉ */}
          <div className="bg-amber-50 border-2 border-black p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
              <span>☕ Repartición Proyecto Café</span>
              <span className="px-2 py-0.5 bg-amber-200 border border-black font-mono">{reparticionSociedad.pctCafeCalculado}%</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-amber-950 font-mono">
              ${reparticionSociedad.montoProyectoCafe.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-amber-800 font-bold">
              Promedio: ${reparticionSociedad.promedioDiarioCafe.toLocaleString("es-CO", { minimumFractionDigits: 0 })} / día
            </p>
          </div>

          {/* MONTO SOCIO INVERSIONISTA */}
          <div className="bg-sky-50 border-2 border-black p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs font-extrabold text-sky-900">
              <span>🍦 Repartición Socio Inversionista</span>
              <span className="px-2 py-0.5 bg-sky-200 border border-black font-mono">{reparticionSociedad.pctInvCalculado}%</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-sky-950 font-mono">
              ${reparticionSociedad.montoInversionista.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-sky-800 font-bold">
              Promedio: ${reparticionSociedad.promedioDiarioInv.toLocaleString("es-CO", { minimumFractionDigits: 0 })} / día
            </p>
          </div>

          {/* MONTO RESERVA */}
          <div className="bg-orange-50 border-2 border-black p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs font-extrabold text-orange-900">
              <span>🛠️ Fondo de Reserva</span>
              <span className="px-2 py-0.5 bg-orange-200 border border-black font-mono">{pctReserva}%</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-orange-950 font-mono">
              ${reparticionSociedad.montoReserva.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-orange-800 font-bold">Destinado a mantto / imprevistos</p>
          </div>

          {/* TOTAL DISTRIBUIBLE DEL PERÍODO */}
          <div className="bg-emerald-50 border-2 border-black p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900">
              <span>💰 Utilidad Distribuible Total</span>
              <span className="px-2 py-0.5 bg-emerald-200 border border-black font-mono">100%</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-emerald-950 font-mono">
              ${reparticionSociedad.utilidadDistribuible.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-emerald-800 font-bold">
              Promedio general: ${reparticionSociedad.promedioDiarioDistribuible.toLocaleString("es-CO", { minimumFractionDigits: 0 })} / día
            </p>
          </div>
        </div>
      </div>

      {/* TOP SUMMARY KPIS DE VENTAS DIRECTAS Y CONSUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border-2 border-black p-4 shadow-solid flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos Helados Directos</p>
            <p className="text-xl md:text-2xl font-black text-amber-950 mt-1">
              ${summaryKPIs.totalIngresosDirectos.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              Utilidad Est.: ${summaryKPIs.totalGananciaDirecta.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3 bg-amber-400 border-2 border-black text-black shadow-sm">
            <DollarSign className="h-6 w-6 stroke-[2.5]" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border-2 border-black p-4 shadow-solid flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Porciones Vendidas</p>
            <p className="text-xl md:text-2xl font-black text-sky-900 mt-1">
              {summaryKPIs.totalHeladosVendidosUnidades.toLocaleString("es-CO")} <span className="text-xs font-normal">uds</span>
            </p>
            <p className="text-[10px] text-gray-600 font-bold mt-0.5">Ventas directas registradas</p>
          </div>
          <div className="p-3 bg-sky-400 border-2 border-black text-white shadow-sm">
            <ShoppingCart className="h-6 w-6 stroke-[2.5]" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border-2 border-black p-4 shadow-solid flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Consumo Helado en Recetas</p>
            <p className="text-xl md:text-2xl font-black text-terracotta-accent mt-1">
              {summaryKPIs.totalKilosHeladoRecetasSecundarias.toFixed(2)} <span className="text-xs font-normal">kg</span>
            </p>
            <p className="text-[10px] text-terracotta-accent font-bold mt-0.5">
              Valor insumo: ${summaryKPIs.totalCostoHeladoConsumido.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3 bg-terracotta-accent border-2 border-black text-white shadow-sm">
            <Layers className="h-6 w-6 stroke-[2.5]" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border-2 border-black p-4 shadow-solid flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Margen Promedio Helados</p>
            <p className="text-xl md:text-2xl font-black text-emerald-700 mt-1">
              {summaryKPIs.marginAverage.toFixed(1)}%
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Retorno de inversión por copa/cono</p>
          </div>
          <div className="p-3 bg-emerald-400 border-2 border-black text-black shadow-sm">
            <TrendingUp className="h-6 w-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* SECTION 1: VENTAS DIRECTAS DE HELADOS EN EL MENÚ */}
      <div className="bg-white border-2 border-black p-4 md:p-5 shadow-solid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div>
            <h3 className="font-bold text-base md:text-lg text-amber-950 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-600" />
              1. Ventas Directas de Ítems de Menú (Heladería)
            </h3>
            <p className="text-xs text-gray-600">
              Desglose de productos de menú configurados como Helados, Gelatos o Soft Serve (Haz clic en Receta Modal para ver/editar ingredientes y costos).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar ítem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border-2 border-black font-bold focus:bg-amber-50 focus:outline-none w-36 sm:w-48"
              />
            </div>

            {/* Toggle Filter Helados Only */}
            <button
              onClick={() => setFilterHeladosOnly(!filterHeladosOnly)}
              className={`px-3 py-1 border-2 border-black text-xs font-bold shadow-sm transition-all flex items-center gap-1 ${
                filterHeladosOnly
                  ? "bg-amber-400 text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🍦 {filterHeladosOnly ? "Solo Helados (Filtrado)" : "Mostrar Todo el Menú"}
            </button>
          </div>
        </div>

        {/* TABLE OF MENU HELADOS */}
        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-amber-100 border-b-2 border-black font-bold text-amber-950">
                <th className="p-3">Producto Menú</th>
                <th className="p-3">Grupo / Categoría</th>
                <th className="p-3 text-center">Tipo (Receta / Gasto)</th>
                <th className="p-3 text-right">Precio Venta</th>
                <th className="p-3 text-center">Unidades Vendidas</th>
                <th className="p-3 text-right">Ingresos Totales</th>
                <th className="p-3 text-right">Costo Unit. (Dubovik)</th>
                <th className="p-3 text-right">Margen %</th>
                <th className="p-3 text-right">Ganancia Est.</th>
                <th className="p-3 text-center">Acción / Receta Modal</th>
              </tr>
            </thead>
            <tbody className="divide-y border-black font-medium">
              {menuHeladosList.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-6 text-center text-gray-500 font-bold bg-gray-50">
                    No se encontraron ítems de helados con el filtro aplicado.
                  </td>
                </tr>
              ) : (
                menuHeladosList.map((item, idx) => {
                  const hasRecipe = Boolean(item.receta);
                  const recipeId = item.Receta || (item.receta && item.receta._id);
                  return (
                    <tr key={item._id || idx} className="hover:bg-amber-50 transition-colors">
                      <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-base">🍦</span>
                        <div>
                          <p className="font-bold text-amber-950">{item.nombre}</p>
                          {hasRecipe ? (
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 border border-black text-emerald-800 font-mono font-bold inline-block mt-0.5">
                              ✓ Receta: {item.recipeName}
                            </span>
                          ) : (
                            <span className="text-[9px] text-amber-700 font-mono font-bold">Venta / Gasto Directo</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-white border border-black text-[10px] font-bold text-gray-700">
                          {item.GRUPO || "HELADOS"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {hasRecipe ? (
                          <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-500 text-emerald-900 font-extrabold text-[10px] inline-flex items-center gap-1">
                            📖 En Receta (Libro)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 border border-amber-500 text-amber-950 font-extrabold text-[10px] inline-flex items-center gap-1">
                            💵 Gasto / Venta Directa
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-gray-800">
                        ${item.precio.toLocaleString("es-CO")}
                      </td>
                      <td className="p-3 text-center font-bold font-mono">
                        <span className={`px-2 py-0.5 border border-black ${item.unidadesVendidas > 0 ? "bg-amber-200 text-black font-extrabold" : "bg-gray-100 text-gray-500"}`}>
                          {item.unidadesVendidas} uds
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-950">
                        ${item.ingresosTotales.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-700">
                        ${item.costoUnitario.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={`px-1.5 py-0.5 border border-black ${item.margenPct >= 60 ? "bg-emerald-200 text-emerald-950" : item.margenPct >= 40 ? "bg-yellow-200 text-yellow-950" : "bg-red-100 text-red-900"}`}>
                          {item.margenPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-emerald-700">
                        ${item.gananciaTotal.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {hasRecipe && recipeId ? (
                            <button
                              onClick={() => setSelectedRecetaModal({ Receta: recipeId })}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[10px] font-black border border-black shadow-sm flex items-center gap-1 transition-all active:translate-y-0.5"
                              title={`Abrir Receta Modal (ID: ${recipeId})`}
                            >
                              📕 Receta Modal
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate('/VentaCompra')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold border border-black shadow-sm flex items-center gap-1 transition-all"
                              title="Ir a la Caja (Ventas)"
                            >
                              💵 Ir a Caja
                            </button>
                          )}
                          <button
                            onClick={() => navigate('/Gastos')}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold border border-black shadow-sm flex items-center gap-1 transition-all"
                            title="Ir a Gastos Directos"
                          >
                            🧾 Gastos
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: CONSUMO DE HELADO EN RECETAS SECUNDARIAS */}
      <div className="bg-white border-2 border-black p-4 md:p-5 shadow-solid space-y-4">
        <div className="border-b-2 border-black pb-3">
          <h3 className="font-bold text-base md:text-lg text-amber-950 flex items-center gap-2">
            <Layers className="h-5 w-5 text-terracotta-accent" />
            2. Gasto & Consumo de Helado de Producción en Otras Recetas (Sub-recetas)
          </h3>
          <p className="text-xs text-gray-600">
            Muestra los platos o recetas (ej: Affogato, Milkshake, Waffles, Desserts) que consumen bases de helado producidas como insumo.
          </p>
        </div>

        {/* TABLE OF INGREDIENT USAGE */}
        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-orange-100 border-b-2 border-black font-bold text-orange-950">
                <th className="p-3">Plato / Receta Final</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Helado Utilizado como Insumo</th>
                <th className="p-3 text-right">Dosis por Porción</th>
                <th className="p-3 text-center">Porciones Vendidas</th>
                <th className="p-3 text-right">Consumo Total (kg)</th>
                <th className="p-3 text-right">Costo Estimado Helado</th>
                <th className="p-3 text-center">Acción / Receta Modal</th>
              </tr>
            </thead>
            <tbody className="divide-y border-black font-medium">
              {consumoHeladoEnRecetas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500 font-bold bg-gray-50">
                    No se han registrado aún recetas secundarias que utilicen helado como ingrediente en las tablas de Supabase.
                  </td>
                </tr>
              ) : (
                consumoHeladoEnRecetas.map((row, idx) => (
                  <tr key={idx} className="hover:bg-orange-50 transition-colors">
                    <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-base">☕</span>
                      <span className="font-bold text-amber-950">{row.productoFinal}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-white border border-black text-[10px] font-bold text-gray-700">
                        {row.origen}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-terracotta-accent">
                      🍦 {row.heladoIngrediente}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-gray-800">
                      {row.dosisPorcionGramos} g
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className="px-2 py-0.5 bg-orange-200 border border-black text-black">
                        {row.unidadesVendidas} uds
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-terracotta-accent">
                      {row.consumoTotalKg.toFixed(2)} kg
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-gray-900">
                      ${row.costoTotalConsumido.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.recetaId ? (
                          <button
                            onClick={() => setSelectedRecetaModal({ Receta: row.recetaId })}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[10px] font-black border border-black shadow-sm flex items-center gap-1 transition-all active:translate-y-0.5"
                            title={`Abrir Receta Modal (ID: ${row.recetaId})`}
                          >
                            📕 Receta Modal
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/Recetas')}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold border border-black shadow-sm flex items-center gap-1 transition-all"
                            title="Ir a Libro de Recetas"
                          >
                            📕 Ir a Libro
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/VentaCompra')}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold border border-black shadow-sm flex items-center gap-1 transition-all"
                          title="Ir a Caja POS"
                        >
                          💵 Ir a Caja
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FICHA DE REPARTICIÓN DE DIVIDENDOS IMPRIMIBLE */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-xl shadow-2xl space-y-4 rounded-none">
            <div className="border-b-2 border-black pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-base md:text-lg text-amber-950 flex items-center gap-2">
                <Printer className="h-5 w-5 text-amber-600" /> Ficha de Repartición de Ganancias — Helados Dubovik
              </h3>
              <button onClick={() => setShowExportModal(false)} className="px-2.5 py-1 bg-gray-200 border border-black font-bold text-xs">✕</button>
            </div>

            <div className="bg-amber-50 p-4 border-2 border-black space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-gray-300 pb-1">
                <span>Rango de Fechas:</span>
                <span className="font-bold">{startDate && endDate ? `Del ${startDate} al ${endDate}` : "Todo el Histórico"} ({diasPeriodo} días)</span>
              </div>
              <div className="flex justify-between border-b border-gray-300 pb-1">
                <span>Ingresos Totales Ventas:</span>
                <span className="font-bold">${reparticionSociedad.ingresosTotal.toLocaleString("es-CO")} COP</span>
              </div>
              <div className="flex justify-between border-b border-gray-300 pb-1">
                <span>Costos de Producción / Insumos:</span>
                <span className="font-bold">${reparticionSociedad.costoTotal.toLocaleString("es-CO")} COP</span>
              </div>
              <div className="flex justify-between border-b border-black pb-1 text-sm font-black text-amber-950">
                <span>Utilidad Neta a Repartir:</span>
                <span>${reparticionSociedad.utilidadDistribuible.toLocaleString("es-CO")} COP</span>
              </div>
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-amber-900 font-bold bg-amber-200/60 p-1.5 border border-black">
                  <span>☕ Proyecto Café ({reparticionSociedad.pctCafeCalculado}%):</span>
                  <span>${reparticionSociedad.montoProyectoCafe.toLocaleString("es-CO")} COP</span>
                </div>
                <div className="flex justify-between text-sky-900 font-bold bg-sky-200/60 p-1.5 border border-black">
                  <span>🍦 Socio Inversionista ({reparticionSociedad.pctInvCalculado}%):</span>
                  <span>${reparticionSociedad.montoInversionista.toLocaleString("es-CO")} COP</span>
                </div>
                {reparticionSociedad.montoReserva > 0 && (
                  <div className="flex justify-between text-orange-900 font-bold bg-orange-200/60 p-1.5 border border-black">
                    <span>🛠️ Fondo Reserva ({pctReserva}%):</span>
                    <span>${reparticionSociedad.montoReserva.toLocaleString("es-CO")} COP</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-400 text-black border-2 border-black font-extrabold text-xs shadow-solid flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Imprimir Ficha
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-200 text-black border-2 border-black font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECETA MODAL INTERACTIVO AL HACER CLIC EN 'RECETA MODAL' */}
      {selectedRecetaModal && (
        <RecetaModal
          item={selectedRecetaModal}
          onClose={() => setSelectedRecetaModal(null)}
        />
      )}

      {/* FOOTER ADVISORY */}
      <div className="bg-yellow-50 border-2 border-black p-3 text-xs text-amber-950 font-bold flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0 text-amber-700" />
        <span>
          💡 Tip Dubovik: Puedes vincular directamente cualquier helado formulado en esta herramienta con sus correspondientes productos en Supabase usando la pestaña <strong>2. Costeo & Inventario</strong>.
        </span>
      </div>
    </div>
  );
}
