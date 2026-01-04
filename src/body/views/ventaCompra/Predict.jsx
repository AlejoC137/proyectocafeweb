import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import supabase from "../../../config/supabaseClient";
import { X, TrendingUp, TrendingDown, Minus, DollarSign, Calendar, Scale, ChefHat, AlertCircle } from "lucide-react";

/**
 * Predict Component - Refactored for High Efficiency & Clean UI
 */
function Predict({ item, onClose, selectedMonth, selectedYear, ventas }) {
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [ventasGroupedByDate, setVentasGroupedByDate] = useState([]);
  const [averageByDay, setAverageByDay] = useState({});
  const [maxAverage, setMaxAverage] = useState(0); // For bar chart scaling
  const [trend, setTrend] = useState(null);
  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [financials, setFinancials] = useState({ unitCost: 0, totalCost: 0, totalRevenue: 0, totalProfit: 0 });

  // --- Redux Data (Split for Memoization) ---
  const allRecetasMenu = useSelector(state => state.allRecetasMenu || []);
  const allItems = useSelector(state => state.allItems || []);
  const allProduccion = useSelector(state => state.allProduccion || []);
  const allMenu = useSelector(state => state.allMenu || []);

  // --- Helpers ---
  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "$0";
    return Number(val).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  };

  const formatInt = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "0";
    return Math.round(val).toLocaleString('es-CO');
  };

  const formatQty = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "0";
    // If integer, show as integer. If decimal, max 2 digits.
    return Number(val) % 1 === 0 ? Math.round(val).toString() : Number(val).toFixed(2);
  };

  // --- 1. Calculate Unit Price & Recipe Details ---
  const unitPrice = useMemo(() => {
    if (!item?.nombre || !allMenu?.length) return 0;
    const menuItem = allMenu.find(m => m.NombreES === item.nombre);
    return parseFloat(menuItem?.Precio) || 0;
  }, [item, allMenu]);

  const recipeDetails = useMemo(() => {
    if (!item?.recetaId || !allRecetasMenu?.length) {
      return { ingredients: [], processes: [], emplatado: "", notas: [], unitCost: 0 };
    }
    const recipe = allRecetasMenu.find(r => r._id === item.recetaId);
    if (!recipe) {
      return { ingredients: [], processes: [], emplatado: "", notas: [], unitCost: 0 };
    }

    const ingredients = [];
    const processes = [];
    const notas = [];
    const combinedInventory = [...allItems, ...allProduccion];
    let unitCost = 0;

    // Defensive parsing for recipe cost
    if (recipe.costo) {
      try {
        const costData = typeof recipe.costo === 'string' ? JSON.parse(recipe.costo) : recipe.costo;
        // Handle various cost structures (number or object with vCMP)
        if (typeof costData === 'number') {
          unitCost = costData;
        } else {
          unitCost = (parseFloat(costData?.vCMP) || 0) + (parseFloat(costData?.vCMO) || 0);
        }
      } catch (e) {
        console.warn("Error parsing recipe cost", e);
        unitCost = 0;
      }
    }

    // Helper to extract ingredients
    const addIngredientsFromSource = (prefix, limit) => {
      for (let i = 1; i <= limit; i++) {
        const itemId = recipe[`${prefix}${i}_Id`];
        const itemCuantityStr = recipe[`${prefix}${i}_Cuantity_Units`];

        if (itemId) {
          const inventoryItem = combinedInventory.find(inv => inv._id === itemId);
          const name = inventoryItem?.Nombre_del_producto || `ID: ${itemId} (Missing)`;
          let baseQuantity = 0;
          let units = "";

          if (itemCuantityStr) {
            try {
              const parsed = JSON.parse(itemCuantityStr);
              baseQuantity = parseFloat(parsed.metric?.cuantity) || 0;
              units = parsed.metric?.units ?? "";
            } catch (e) { /* Ignore invalid JSON */ }
          }

          // Avoid NaN propagation
          baseQuantity = isNaN(baseQuantity) ? 0 : baseQuantity;
          const ingredientUnitCost = parseFloat(inventoryItem?.precioUnitario) || 0;

          // These will be multiplied by total sold later, but we need per-unit stats too
          ingredients.push({
            name,
            baseQuantity,
            units,
            ingredientUnitCost: isNaN(ingredientUnitCost) ? 0 : ingredientUnitCost
          });
        }
      }
    };

    addIngredientsFromSource('item', 30);
    addIngredientsFromSource('producto_interno', 20);

    for (let i = 1; i <= 20; i++) if (recipe[`proces${i}`]) processes.push(recipe[`proces${i}`]);
    for (let i = 1; i <= 10; i++) if (recipe[`nota${i}`]) notas.push(recipe[`nota${i}`]);

    return { ingredients, processes, emplatado: recipe.emplatado, notas, unitCost };
  }, [item, allRecetasMenu, allItems, allProduccion]);

  // --- 2. Sales Data Analysis (Restored Logic using 'ventas' prop) ---
  useEffect(() => {
    if (!item?.nombre || selectedMonth === undefined || selectedYear === undefined || !ventas) return;

    setLoading(true);

    // Process the passed 'ventas' prop immediately instead of refetching
    // This restores the behavior that was working before
    setTimeout(() => { // Minimal timeout to allow UI to settle, though not strictly necessary
      try {
        const monthAsNumber = parseInt(selectedMonth, 10);
        const yearAsNumber = parseInt(selectedYear, 10);

        // Filter sales for the selected date range
        const filteredSales = ventas.filter(venta => {
          if (!venta.Date) return false;
          // Handle different date formats if necessary, but standard Date object works for ISO/Supabase
          const saleDate = new Date(venta.Date);
          // Adjust for timezone if needed, but usually Month/Year check is stable enough
          // The previous fix used getMonth() directly.
          return saleDate.getMonth() === monthAsNumber && saleDate.getFullYear() === yearAsNumber;
        });

        // Aggregate data
        const groupedByDate = {};
        let grandTotal = 0;

        filteredSales.forEach(venta => {
          try {
            const productos = typeof venta.Productos === 'string' ? JSON.parse(venta.Productos) : venta.Productos;
            if (Array.isArray(productos)) {
              const target = productos.find(p => p.NombreES === item.nombre);
              if (target) {
                const qty = parseFloat(target.quantity || 0);
                if (!isNaN(qty) && qty > 0) {
                  // Use raw date string part for grouping to avoid timezone shifts on day boundaries
                  const dateKey = venta.Date.split('T')[0];
                  if (!groupedByDate[dateKey]) groupedByDate[dateKey] = 0;
                  groupedByDate[dateKey] += qty;
                  grandTotal += qty;
                }
              }
            }
          } catch (e) { /* ignore */ }
        });

        const groupedArray = Object.entries(groupedByDate)
          .map(([date, qty]) => ({ date, qty }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setVentasGroupedByDate(groupedArray);
        setTotalItemsSold(grandTotal);

        // Analysis
        const daysMap = { 0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb" };
        const dayTotals = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

        groupedArray.forEach(d => {
          const dayIdx = new Date(d.date).getUTCDay();
          dayTotals[dayIdx] += d.qty;
          dayCounts[dayIdx] += 1;
        });

        const averages = {};
        let maxAvg = 0;
        Object.keys(daysMap).forEach(k => {
          const idx = parseInt(k);
          if (dayCounts[idx] > 0) {
            const avg = dayTotals[idx] / dayCounts[idx];
            averages[daysMap[idx]] = avg;
            if (avg > maxAvg) maxAvg = avg;
          } else {
            averages[daysMap[idx]] = 0;
          }
        });
        setAverageByDay(averages);
        setMaxAverage(maxAvg);

        if (groupedArray.length > 0) {
          // Trend
          if (groupedArray.length >= 2) {
            const first = groupedArray[0].qty;
            const last = groupedArray[groupedArray.length - 1].qty;
            const diff = last - first;
            if (diff > 0) setTrend("up");
            else if (diff < 0) setTrend("down");
            else setTrend("stable");
          } else {
            setTrend("stable");
          }
        } else {
          setTrend("stable");
        }

      } catch (err) {
        console.error("Predict calc error:", err);
      } finally {
        setLoading(false);
      }
    }, 0);

  }, [item, selectedMonth, selectedYear, ventas]);

  // --- 3. Financials Update ---
  useEffect(() => {
    // Recalculate if totalItemsSold or unitCost changes
    // Defensive values
    const safeTotal = isNaN(totalItemsSold) ? 0 : totalItemsSold;
    const safeUnitCost = isNaN(recipeDetails.unitCost) ? 0 : recipeDetails.unitCost;
    const safeUnitPrice = isNaN(unitPrice) ? 0 : unitPrice;

    const totalRevenue = safeUnitPrice * safeTotal;
    const totalCost = safeUnitCost * safeTotal;
    const totalProfit = totalRevenue - totalCost;

    setFinancials({
      unitCost: safeUnitCost,
      totalCost,
      totalRevenue,
      totalProfit
    });

  }, [totalItemsSold, recipeDetails.unitCost, unitPrice]);


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-2" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Scale size={20} className="text-indigo-600" />
              {item?.nombre || "Análisis de Producto"}
            </h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">
              {new Date(selectedYear, selectedMonth).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-500 font-medium">Analizando datos...</span>
            </div>
          ) : totalItemsSold === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <AlertCircle size={48} className="mb-2 opacity-50" />
              <p>No se encontraron ventas en este periodo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT COLUMN: STATS & CHARTS (5 cols) */}
              <div className="lg:col-span-5 space-y-6">

                {/* KPI GRID */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total Ventas</div>
                    <div className="text-2xl font-bold text-gray-800">{formatInt(totalItemsSold)} <span className="text-sm font-normal text-gray-400">uds</span></div>
                    <div className="absolute top-4 right-4 text-gray-200">
                      {trend === 'up' ? <TrendingUp size={24} /> : trend === 'down' ? <TrendingDown size={24} /> : <Minus size={24} />}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Margen U.</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(financials.unitCost > 0 ? ((unitPrice - financials.unitCost)) : 0)}
                    </div>
                  </div>
                </div>

                {/* FINANCIAL CARDS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Ingresos</div>
                    <div className="text-sm font-bold text-blue-600">{formatCurrency(financials.totalRevenue)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Costos</div>
                    <div className="text-sm font-bold text-slate-600">{formatCurrency(financials.totalCost)}</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                    <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Utilidad</div>
                    <div className="text-sm font-extrabold text-emerald-700">{formatCurrency(financials.totalProfit)}</div>
                  </div>
                </div>

                {/* DAILY AVERAGE CHART */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Calendar size={16} /> Comportamiento Semanal
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(averageByDay).map(([day, val]) => {
                      const pct = maxAverage > 0 ? (val / maxAverage) * 100 : 0;
                      return (
                        <div key={day} className="flex items-center text-xs">
                          <div className="w-8 font-medium text-gray-500">{day}</div>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full mx-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${val >= maxAverage ? 'bg-indigo-500' : 'bg-indigo-300'}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <div className="w-10 text-right font-bold text-gray-700">{formatQty(val)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* HISTORY CHECK */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Historial Reciente
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-gray-400 font-medium bg-white sticky top-0">
                        <tr>
                          <th className="px-4 py-2">Fecha</th>
                          <th className="px-4 py-2 text-right">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ventasGroupedByDate.slice().reverse().map((g) => (
                          <tr key={g.date} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2 text-gray-600">{g.date}</td>
                            <td className="px-4 py-2 text-right font-bold text-gray-800">{formatInt(g.qty)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: RECIPE & INGREDIENTS (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* INGREDIENTS TABLE */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[600px]">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <ChefHat size={16} /> Composición de Costo
                    </h3>
                    <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500 font-mono">
                      Costo Unit: {formatCurrency(financials.unitCost)}
                    </span>
                  </div>

                  <div className="overflow-auto flex-1 p-0">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 border-b border-gray-200">Ingrediente</th>
                          <th className="px-4 py-3 border-b border-gray-200 text-center">Fórmula</th>
                          <th className="px-4 py-3 border-b border-gray-200 text-right">Total Req.</th>
                          <th className="px-4 py-3 border-b border-gray-200 text-right">Costo Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recipeDetails.ingredients.length > 0 ? (
                          recipeDetails.ingredients.map((ing, i) => {
                            const totalReq = ing.baseQuantity * totalItemsSold;
                            const totalCost = ing.ingredientUnitCost * totalReq;
                            return (
                              <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-4 py-2 text-gray-700 font-medium truncate max-w-[200px]" title={ing.name}>
                                  {ing.name}
                                </td>
                                <td className="px-4 py-2 text-center text-gray-400 text-[10px]">
                                  {formatQty(ing.baseQuantity)} {ing.units}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-800 font-bold">
                                  {formatQty(totalReq)} {ing.units}
                                </td>
                                <td className="px-4 py-2 text-right text-slate-600 font-medium tabular-nums">
                                  {formatCurrency(totalCost)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic">
                              Esta receta no tiene ingredientes desglosados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {recipeDetails.ingredients.length > 0 && (
                        <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right text-gray-600 uppercase text-[10px] tracking-widest">
                              Costo Total Insumos
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700 text-sm">
                              {formatCurrency(financials.totalCost)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* NOTES & PREP - COMPACT */}
                {(recipeDetails.notes?.length > 0 || recipeDetails.processes?.length > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-xs">
                      <strong className="block text-yellow-800 mb-2 uppercase tracking-wide">Notas</strong>
                      <ul className="list-disc list-inside space-y-1 text-yellow-900/80">
                        {recipeDetails.notas.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-xs">
                      <strong className="block text-gray-700 mb-2 uppercase tracking-wide">Preparación</strong>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        {recipeDetails.processes.slice(0, 5).map((p, i) => <li key={i} className="line-clamp-1" title={p}>{p}</li>)}
                        {recipeDetails.processes.length > 5 && <li className="italic text-gray-400">...y {recipeDetails.processes.length - 5} pasos más</li>}
                      </ol>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Predict;