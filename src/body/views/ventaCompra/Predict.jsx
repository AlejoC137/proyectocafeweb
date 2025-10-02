import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import supabase from "../../../config/supabaseClient"; // Asegúrate que la ruta sea correcta


/**
 * Componente Predict
 * Muestra una vista modal con análisis financiero, de ventas y los detalles de una receta.
 *
 * @param {object} props - Propiedades del componente.
 * @param {object} props.item - El producto seleccionado. Debe contener 'nombre' y 'recetaId'.
 * @param {function} props.onClose - Función para cerrar el modal.
 * @param {number|string} props.selectedMonth - El mes seleccionado para el análisis (esperado en formato 0-11).
 * @param {number|string} props.selectedYear - El año seleccionado para el análisis.
 */
function Predict({ item, onClose, selectedMonth, selectedYear ,ventas  }) {

  // --- Estados del Componente ---
  const [loading, setLoading] = useState(true);
  const [ventasGroupedByDate, setVentasGroupedByDate] = useState([]);
  const [averageByDay, setAverageByDay] = useState({});
  const [trend, setTrend] = useState(null);
  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [financials, setFinancials] = useState({ unitCost: 0, totalCost: 0, totalRevenue: 0, totalProfit: 0 });
  const [analysisPeriod, setAnalysisPeriod] = useState({ start: null, end: null });

  // --- 1. OBTENCIÓN DE DATOS DESDE REDUX ---
  const { allRecetasMenu, allItems, allProduccion, allMenu } = useSelector((state) => ({
    allRecetasMenu: state.allRecetasMenu,
    allItems: state.allItems,
    allProduccion: state.allProduccion,
    allMenu: state.allMenu,
  }));
  
  // --- 2. CÁLCULO DE PRECIO Y DETALLES DE RECETA ---
  const unitPrice = useMemo(() => {
    if (!item?.nombre || !allMenu?.length) return 0;
    const menuItem = allMenu.find(menuItem => menuItem.NombreES === item.nombre);
    return parseFloat(menuItem?.Precio) || 0;
  }, [item, allMenu]);

  const recipeDetails = useMemo(() => {
    if (!item?.recetaId || !allRecetasMenu?.length) {
      return { ingredients: [], processes: [], emplatado: "", notas: [], unitCost: 0 };
    }
    const recipe = allRecetasMenu.find(r => r._id === item  .recetaId);
    if (!recipe) {
      return { ingredients: [], processes: [], emplatado: "", notas: [], unitCost: 0 };
    }

    const ingredients = [];
    const processes = [];
    const notas = [];
    const combinedInventory = [...(allItems || []), ...(allProduccion || [])];
    let unitCost = 0;

    if (recipe.costo) {
        try {
            const costData = JSON.parse(recipe.costo);
            unitCost = parseFloat(costData.vCMP) || 0;
        } catch (e) {
            console.error("Error al parsear el costo de la receta:", e);
        }
    }

    for (let i = 1; i <= 30; i++) {
      const itemId = recipe[`item${i}_Id`] || recipe[`producto_interno${i}_Id`];
      const itemCuantityStr = recipe[`item${i}_Cuantity_Units`];
      if (itemId) {
        const inventoryItem = combinedInventory.find(inv => inv._id === itemId);
        const name = inventoryItem?.Nombre_del_producto || `ID: ${itemId} (No encontrado)`;
        let baseQuantity = 0;
        let units = "";
        if (itemCuantityStr) {
          try {
            const parsed = JSON.parse(itemCuantityStr);
            baseQuantity = parseFloat(parsed.metric?.cuantity) || 0;
            units = parsed.metric?.units ?? "";
          } catch (e) { /* Ignorar JSON inválido */ }
        }
        
        const totalQuantity = baseQuantity * totalItemsSold;
        
        const ingredientUnitCost = parseFloat(inventoryItem?.precioUnitario) || 0;
        const ingredientTotalCost = totalQuantity * ingredientUnitCost;

        ingredients.push({ 
            name, 
            baseQuantity, 
            totalQuantity, 
            units, 
            ingredientTotalCost
        });
      }
    }

    for (let i = 1; i <= 20; i++) if (recipe[`proces${i}`]) processes.push(recipe[`proces${i}`]);
    for (let i = 1; i <= 10; i++) if (recipe[`nota${i}`]) notas.push(recipe[`nota${i}`]);
    
    return { ingredients, processes, emplatado: recipe.emplatado, notas, unitCost };
  }, [item, allRecetasMenu, allItems, allProduccion, totalItemsSold]);

  // --- 3. OBTENCIÓN Y ANÁLISIS DE DATOS DE VENTAS ---
  useEffect(() => {
    
    if (!item?.nombre || selectedMonth === undefined || selectedYear === undefined) return;

    const calculateAverageByDay = (dailySales) => {
        const dayOfWeekTotals = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        const dayOfWeekOccurrences = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

        dailySales.forEach(dailySale => {
            const dateParts = dailySale.date.split('-');
            const safeDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const dayOfWeek = safeDate.getUTCDay();
            dayOfWeekTotals[dayOfWeek] += dailySale.totalCantidad;
            dayOfWeekOccurrences[dayOfWeek] += 1;
        });

        const averages = {};
        for (const dayIndex in dayOfWeekTotals) {
            if (dayOfWeekOccurrences[dayIndex] > 0) {
                const dayName = dayNames[dayIndex];
                averages[dayName] = dayOfWeekTotals[dayIndex] / dayOfWeekOccurrences[dayIndex];
            }
        }
        setAverageByDay(averages);
    };

    const calculateTrend = (groupedData) => {
        if (groupedData.length < 2) { setTrend("No suficiente información"); return; }
        const last = groupedData[groupedData.length - 1].totalCantidad;
        const first = groupedData[0].totalCantidad;
        const avgChange = (last - first) / groupedData.length;
        if (avgChange > 0.1) setTrend("📈 Creciente");
        else if (avgChange < -0.1) setTrend("📉 Decreciente");
        else setTrend("📊 Estable");
    };

    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('Ventas').select('Date, Productos').order('Date', { ascending: false });
        if (error) throw error;
// console.log(data); 

        const monthAsNumber = parseInt(selectedMonth, 10);
        const yearAsNumber = parseInt(selectedYear, 10);

        const filteredSales = ventas.filter(venta => {
            if (!venta.Date) return false;
            const saleDate = new Date(venta.Date);
            
            // --- INICIO DE LA CORRECCIÓN ---
            // Se elimina el "+ 1" para que la comparación funcione con los meses 0-11
            // que probablemente envía el componente padre (ej: 8 para Septiembre).
            return saleDate.getMonth() === monthAsNumber && saleDate.getFullYear() === yearAsNumber;
            // --- FIN DE LA CORRECCIÓN ---
        });
        
        const groupedByDate = filteredSales.reduce((acc, venta) => {
            try {
                const productos = JSON.parse(venta.Productos);
                const productoTarget = productos.find(p => p.NombreES === item.nombre);
                if (productoTarget) {
                    const dateKey = new Date(venta.Date).toLocaleDateString('en-CA'); // YYYY-MM-DD
                    const quantity = parseFloat(productoTarget.quantity || 0);
                    if (!acc[dateKey]) {
                        acc[dateKey] = { date: dateKey, totalCantidad: 0 };
                    }
                    acc[dateKey].totalCantidad += quantity;
                }
            } catch (e) { /* Ignorar errores */ }
            return acc;
        }, {});

        const groupedArray = Object.values(groupedByDate).sort((a, b) => new Date(a.date) - new Date(b.date));
        setVentasGroupedByDate(groupedArray);

        const grandTotal = groupedArray.reduce((sum, group) => sum + group.totalCantidad, 0);
        setTotalItemsSold(grandTotal);
        
        if (groupedArray.length > 0) {
            setAnalysisPeriod({ start: groupedArray[0].date, end: groupedArray[groupedArray.length - 1].date });
        } else {
            setAnalysisPeriod({ start: null, end: null });
        }

        calculateAverageByDay(groupedArray);
        calculateTrend(groupedArray);

      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [item, selectedMonth, selectedYear , ventas , onClose]); 

  // --- 4. CÁLCULO DE DATOS FINANCIEROS ---
  useEffect(() => {
    if (totalItemsSold > 0 && recipeDetails.unitCost) {
        const totalRevenue = unitPrice * totalItemsSold;
        const totalCost = recipeDetails.unitCost * totalItemsSold;
        const totalProfit = totalRevenue - totalCost;
        setFinancials({ unitCost: recipeDetails.unitCost, totalCost, totalRevenue, totalProfit });
    } else {
        setFinancials({ unitCost: recipeDetails.unitCost, totalCost: 0, totalRevenue: 0, totalProfit: 0 });
    }
  }, [totalItemsSold, recipeDetails.unitCost, unitPrice]);

  // --- 5. RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Análisis y Receta de: {item?.nombre}</h1>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</button>
        </div>
        
        {loading ? <p className="text-center text-gray-600 py-8">Cargando análisis para el mes seleccionado...</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {totalItemsSold > 0 && analysisPeriod.start && (
              <div className="lg:col-span-2 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 p-4 rounded-md -mt-2 mb-4" role="alert">
                <p className="font-bold text-lg">Resumen del Periodo</p>
                <p>
                  Total de <strong className="text-xl">{totalItemsSold.toFixed(2)}</strong> unidades vendidas 
                  {analysisPeriod.start === analysisPeriod.end
                      ? ` durante el día ${new Date(analysisPeriod.start + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}.`
                      : ` entre el ${new Date(analysisPeriod.start + 'T00:00:00').toLocaleDateString('es-CO')} y el ${new Date(analysisPeriod.end + 'T00:00:00').toLocaleDateString('es-CO')}.`
                  }
                </p>
              </div>
            )}
            
            {/* Columna Izquierda: Análisis Financiero y de Ventas */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-700">Análisis Financiero</h2>
                <div className="bg-blue-50 p-4 rounded-lg grid grid-cols-2 gap-4 text-center">
                    <div><h3 className="text-sm font-semibold text-gray-600">Ingresos Totales</h3><p className="text-2xl font-bold text-green-600">{financials.totalRevenue.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p></div>
                    <div><h3 className="text-sm font-semibold text-gray-600">Costo Total</h3><p className="text-2xl font-bold text-red-500">{financials.totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p></div>
                    <div className="col-span-2 bg-white p-3 rounded-lg"><h3 className="text-md font-semibold text-gray-600">Ganancia Total</h3><p className="text-3xl font-bold text-blue-600">{financials.totalProfit.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p></div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-700">Análisis de Ventas</h2>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div><h3 className="text-lg font-semibold">Tendencia General:</h3><p className="text-gray-700 text-xl">{trend}</p></div>
                  <div><h3 className="text-lg font-semibold">Promedio por día:</h3><ul>{Object.keys(averageByDay).length > 0 ? Object.entries(averageByDay).map(([day, avg]) => <li key={day} className="text-gray-700">{day}: <strong>{avg.toFixed(2)}</strong> uds.</li>) : <li className="text-gray-500">No hay datos suficientes.</li>}</ul></div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-700">Historial de Ventas Diarias</h2>
                <div className="overflow-x-auto border rounded-lg max-h-80">{ventasGroupedByDate.length > 0 ? (
                  <table className="min-w-full text-sm text-left"><thead className="bg-gray-100"><tr className="border-b"><th className="p-2">Fecha</th><th className="p-2">Cantidad Vendida</th></tr></thead><tbody>{ventasGroupedByDate.map((group) => (<tr key={group.date} className="border-t"><td className="p-2">{group.date}</td><td className="p-2 font-bold text-green-600">{group.totalCantidad}</td></tr>))}</tbody><tfoot><tr className="border-t bg-gray-200 font-bold"><td className="p-2">Total Vendido</td><td className="p-2 text-blue-600">{totalItemsSold.toFixed(2)}</td></tr></tfoot></table>
                ) : <p className="text-gray-500 p-4">No se encontraron ventas para este producto en el mes y año seleccionados.</p>}</div>
              </div>
            </div>

            {/* Columna Derecha: Detalles de la Receta */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800">Consumo Total de Ingredientes</h3>
                <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                  {recipeDetails.ingredients.length > 0 ? recipeDetails.ingredients.map((ing, i) => (
                    <li key={i}>
                      <span>{ing.name}: </span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded-md">
                        ({ing.baseQuantity} {ing.units} x {totalItemsSold.toFixed(0)} unds)
                      </span>
                      <strong className="ml-2 text-blue-600">
                        {ing.totalQuantity.toFixed(2)} {ing.units}
                      </strong>
                      <span className="ml-2 font-semibold text-red-500">
                        ({ing.ingredientTotalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })})
                      </span>
                    </li>
                  )) : <li>No se encontraron ingredientes para la receta.</li>}
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800">Notas y Presentación</h3>
                {recipeDetails.emplatado && <p className="mt-1 text-gray-700"><strong className="font-semibold">Emplatado:</strong> {recipeDetails.emplatado}</p>}
                {recipeDetails.notas.length > 0 && <div className="mt-2"><strong className="font-semibold">Notas:</strong><ul className="list-disc list-inside text-sm">{recipeDetails.notas.map((n, i) => <li key={i}>{n}</li>)}</ul></div>}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800">Preparación</h3>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">{recipeDetails.processes.length > 0 ? recipeDetails.processes.map((step, i) => <li key={i}>{step}</li>) : <li>No se encontraron pasos de preparación.</li>}</ol>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default Predict;