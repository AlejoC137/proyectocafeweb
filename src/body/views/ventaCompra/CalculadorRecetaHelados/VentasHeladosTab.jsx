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
  ExternalLink
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHeladosOnly, setFilterHeladosOnly] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("ALL"); // 'ALL' | 'THIS_MONTH' | 'LAST_MONTH'
  const [selectedRecetaModal, setSelectedRecetaModal] = useState(null);

  // Filter sales by selected time period
  const filteredVentas = useMemo(() => {
    if (!allVentas || !Array.isArray(allVentas)) return [];
    if (selectedPeriod === "ALL") return allVentas;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return allVentas.filter((v) => {
      if (!v || !v.Date) return false;
      const vDate = new Date(v.Date);
      if (selectedPeriod === "THIS_MONTH") {
        return vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear;
      }
      if (selectedPeriod === "LAST_MONTH") {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return vDate.getMonth() === lastMonth && vDate.getFullYear() === lastMonthYear;
      }
      return true;
    });
  }, [allVentas, selectedPeriod]);

  // Aggregate Sales per Menu Item
  const salesMap = useMemo(() => {
    const map = {};

    // 1. From allVentas table
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

    // 2. Fallback / supplement from allComanda if available
    if (allComanda && Array.isArray(allComanda)) {
      allComanda.forEach((cmd) => {
        const name = cmd.NombreES || cmd.Nombre || cmd.nombre;
        if (!name) return;
        const qty = parseFloat(cmd.Cantidad || cmd.cantidad || 1);
        if (!map[name]) {
          map[name] = { qty: 0, revenue: 0, ordersCount: 0 };
        }
        map[name].ordersCount += 1;
      });
    }

    return map;
  }, [filteredVentas, allComanda]);

  // Determine if a Menu item belongs strictly to Helado category (MICHELADO IS NOT HELADO)
  const isHeladoMenuItem = (item) => {
    if (!item) return false;
    const name = (item.NombreES || "").toLowerCase();
    const g = (item.GRUPO || "").toUpperCase();
    const sub = (item.SUB_GRUPO || "").toUpperCase();

    // EXPLICIT EXCLUSION: Michelado / Michelada AND ADICIONES (Grupo or SubGrupo) are NOT Ice Cream
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
        
        // Calculated revenue fallback if price exists
        const totalRevenue = salesData.revenue > 0 ? salesData.revenue : salesData.qty * price;

        // Recipe matching
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

  // Identify Ice Cream Production Items (Base Helados en ProduccionInterna)
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

  // Track usage of Ice Cream Production items as ingredients in other recipes (Recetas Secundarias)
  const consumoHeladoEnRecetas = useMemo(() => {
    const usageList = [];

    // Search through all Menu recipes and Production recipes
    const combinedRecipes = [
      ...allRecetasMenu.map((r) => ({ ...r, origin: "Menu" })),
      ...allRecetasProduccion.map((r) => ({ ...r, origin: "Produccion" }))
    ];

    combinedRecipes.forEach((receta) => {
      // Find parent item
      const parentMenu = allMenu.find((m) => m._id === receta.forId || m.Receta === receta._id);
      const parentProd = allProduccion.find((p) => p._id === receta.forId || p.Receta === receta._id);

      const parentName = parentMenu?.NombreES || parentProd?.Nombre_del_producto || receta.legacyName || "Receta #" + receta._id;

      // Check ingredients details
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

        // Exclude michelado and adiciones from ingredients search
        if (ingName.includes("michelad") || ingName.includes("adicion")) return;

        // Check if ingredient is an Ice Cream production item
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
            Monitoreo en tiempo real de ventas directas y consumo en recetas. <strong>Nota:</strong> Los filtros excluyen estrictamente adiciones de bebidas como Michelado.
          </p>
        </div>

        {/* PERIOD SELECTOR & QUICK NAV */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border-2 border-black p-1.5 shadow-sm text-xs font-bold shrink-0">
            <Filter className="h-4 w-4 text-amber-800" />
            <span className="text-gray-700">Período:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-amber-100 text-amber-950 font-bold border border-black px-2 py-1 cursor-pointer focus:outline-none"
            >
              <option value="ALL">🗓️ Todo el Histórico</option>
              <option value="THIS_MONTH">📅 Este Mes</option>
              <option value="LAST_MONTH">⏮️ Mes Anterior</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/Recetas')}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs border-2 border-black shadow-solid flex items-center gap-1.5 transition-all"
            title="Ir al Libro de Recetas"
          >
            <BookOpen className="h-4 w-4" /> 📕 Ir a Libro (Recetas)
          </button>
          <button
            onClick={() => navigate('/VentaCompra')}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-2 border-black shadow-solid flex items-center gap-1.5 transition-all"
            title="Ir a la Caja POS / Ventas"
          >
            <ShoppingCart className="h-4 w-4" /> 💵 Ir a Caja
          </button>
        </div>
      </div>

      {/* TOP SUMMARY KPIS */}
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
