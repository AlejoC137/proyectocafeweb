import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { COMPRAS, ITEMS, MENU, RECETAS_MENU, PRODUCCION } from "../../../redux/actions-types";
import { getAllFromTable, getRecepie, trimRecepie } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import { recetaMariaPaula } from "../../../redux/calcularReceta";
import MesResumenStats from "./MesResumenStats";
import { fetchAndProcessSales } from "./slicer";
import Predict from "./Predict";

function MesResumen() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [productosVendidosConReceta, setProductosVendidosConReceta] = useState([]);
  const [hoy, setHoy] = useState(new Date().toISOString().split('T')[0]);

  // --- Estados para el modal Predict ---
  const [showPredict, setShowPredict] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const allMenu = useSelector((state) => state.allMenu);
  const allItems = useSelector((state) => state.allItems);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const allProduccion = useSelector((state) => state.allProduccion);
  const allCompras = useSelector((state) => state.allCompras);

  const { selectedMonth, selectedYear } = useMemo(() => {
    const selectedDate = new Date(hoy);
    selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
    return {
      selectedMonth: selectedDate.getMonth(),
      selectedYear: selectedDate.getFullYear(),
    };
  }, [hoy]);




  useEffect(() => {



    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Carga los datos de Redux en paralelo
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(RECETAS_MENU)),
          dispatch(getAllFromTable(COMPRAS)),
        ]);

        let allVentas = [];
        let page = 0;
        const pageSize = 1000; // El tamaño de cada lote que pedimos

        // Bucle para pedir datos en lotes hasta que no haya más
        while (true) {
          const from = page * pageSize;
          const to = from + pageSize - 1;

          // Pedimos un lote de registros usando .range()
          const { data, error } = await supabase
            .from('Ventas')
            .select('*')
            .order('Date', { ascending: false })
            .range(from, to);
          // console.log(data);

          if (error) throw error;

          // Añadimos el lote de datos al array principal
          if (data) {
            allVentas = [...allVentas, ...data];
          }

          // Si el lote devuelto tiene menos de 1000, significa que es la última página.
          if (!data || data.length < pageSize) {
            break; // Salimos del bucle
          }

          // Si no, pasamos a la siguiente página para la próxima iteración
          page++;
        }

        // Ahora 'allVentas' contiene absolutamente todos los registros de la tabla.
        // Procedemos a filtrar el mes seleccionado en el navegador.
        const ventasDelMes = allVentas.filter((venta) => {
          const ventaDate = new Date(venta.Date);
          return ventaDate.getMonth() === selectedMonth && ventaDate.getFullYear() === selectedYear;
        });

        // Ordenamos y actualizamos el estado
        ventasDelMes.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        setVentas(ventasDelMes);

      } catch (error) {
        console.error("Error al cargar todos los datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dispatch, selectedMonth, selectedYear]);

  const [showFinancials, setShowFinancials] = useState(false);

  const datosCalculadosDelMes = useMemo(() => {
    let total = 0;
    let tipTotal = 0;
    let tarjeta = 0;
    let efectivo = 0;
    let transferencia = 0;
    const productosMap = {};

    ventas.forEach((venta) => {
      if (venta.Pagado) {
        const ingresoVenta = parseFloat(venta.Total_Ingreso || 0);
        total += ingresoVenta;
        tipTotal += parseFloat(venta.Tip || 0);

        if (venta.Pago_Info) {
          try {
            const pagos = JSON.parse(venta.Pago_Info);
            if (pagos.metodo === "Tarjeta") tarjeta += ingresoVenta;
            if (pagos.metodo === "Efectivo") efectivo += ingresoVenta;
            if (pagos.metodo === "Transferencia") transferencia += ingresoVenta;
          } catch (e) {
            console.error("Error al parsear Pago_Info:", e);
          }
        }
      }

      if (venta.Productos) {
        try {
          const productos = JSON.parse(venta.Productos);
          productos.forEach((producto) => {

            if (!producto.NombreES) return;

            const cantidad = parseFloat(producto.quantity || 0);


            // Attempt to get price from the record
            let price = parseFloat(producto.price || producto.valor || producto.precio || 0);

            // If price is 0 (missing in historical record), fallback to current menu price
            if (price === 0) {
              const menuProduct = allMenu.find(m => m.NombreES === producto.NombreES);
              if (menuProduct) {
                price = parseFloat(menuProduct.Precio || 0);
              }
            }

            if (productosMap[producto.NombreES]) {
              productosMap[producto.NombreES].cantidad += cantidad;
              productosMap[producto.NombreES].totalIngreso += (price * cantidad);
            } else {
              let recetaIdDefinitiva = producto.Receta || allMenu.find(menu => menu.NombreES === producto.NombreES)?.Receta || null;

              productosMap[producto.NombreES] = {
                nombre: producto.NombreES,
                cantidad: cantidad,
                totalIngreso: (price * cantidad),
                recetaId: recetaIdDefinitiva || "N/A",
                recetaValor: 0,
                ingredientes: [],
              };
            }
          });
        } catch (e) {
          console.error("Error al parsear Productos:", e);
        }
      }
    });

    const productosVendidos = Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad);

    const totalCompras = allCompras
      .filter((compra) => {
        const compraDate = new Date(compra.Date);
        return compraDate.getMonth() === selectedMonth && compraDate.getFullYear() === selectedYear;
      })
      .reduce((acc, compra) => acc + parseFloat(compra.Valor || 0), 0);

    return {
      totalIngreso: total,
      totalTip: tipTotal,
      totalTarjeta: tarjeta,
      totalEfectivo: efectivo,
      totalTransferencia: transferencia,
      productosVendidos,
      totalCompras,
      totalProductosVendidos: productosVendidos.reduce((acc, p) => acc + p.cantidad, 0),
    };
  }, [ventas, allCompras, allMenu, selectedMonth, selectedYear]);

  useEffect(() => {
    if (datosCalculadosDelMes.productosVendidos.length === 0 || !allItems.length || !allMenu.length) {
      setProductosVendidosConReceta([]);
      return;
    }

    const calculateRecipeValues = async () => {
      // console.log(allMenu);

      const updatedProductos = await Promise.all(
        datosCalculadosDelMes.productosVendidos.map(async (producto) => {

          let recetaData = null;
          let consolidatedCost = 0;
          let ingredients = [];

          if (producto.recetaId !== "N/A") {
            try {
              const menuItem = allMenu.find((item) => item.Receta === producto.recetaId);
              if (menuItem) {
                // Determine source table based on what we find
                recetaData = await getRecepie(menuItem.Receta, "Recetas");
                let source = "Recetas";
                if (!recetaData) {
                  recetaData = await getRecepie(menuItem.Receta, "RecetasProduccion");
                  source = "RecetasProduccion";
                }

                if (recetaData) {
                  const trimmedRecepie = trimRecepie([...allItems, ...allProduccion], recetaData);
                  // Note: We use 1 portion for unit cost calculation
                  const receta = recetaMariaPaula(trimmedRecepie, menuItem.currentType, menuItem.id, source);
                  consolidatedCost = receta.consolidado || 0;
                  if (receta.detalles && receta.detalles.vCMP) consolidatedCost = receta.detalles.vCMP; // Use Material Cost if available, otherwise consolidated
                  ingredients = trimmedRecepie;
                }
              }
            } catch (error) {
              console.error(`Error procesando receta para ${producto.nombre}:`, error);
            }
          }

          const totalCosto = consolidatedCost * producto.cantidad;
          const totalUtilidad = producto.totalIngreso - totalCosto;

          return {
            ...producto,
            recetaValor: consolidatedCost,
            ingredientes: ingredients,
            totalCosto: totalCosto,
            totalUtilidad: totalUtilidad
          };
        })
      );
      setProductosVendidosConReceta(updatedProductos);
    };

    calculateRecipeValues();
  }, [datosCalculadosDelMes.productosVendidos, allMenu, allItems, allProduccion]);


  const handleRecetaClick = (item) => {
    setSelectedItem(item);
    setShowPredict(true);
  };

  const handleClosePredict = () => {
    setShowPredict(false);
    setSelectedItem(null);
  };

  const handleDateChange = (e) => {
    setHoy(e.target.value);
  };

  const handleFetchSales = async () => {
    const processedSales = await fetchAndProcessSales(dispatch);
    console.log("Fetched and Processed Sales:", processedSales);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen w-screen">Cargando...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      <div>
        <label htmlFor="date" className="block bg-white text-sm font-medium text-gray-700">Seleccionar Fecha:</label>
        <input
          type="date"
          id="date"
          name="date"
          value={hoy}
          className="bg-gray-500 mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          onChange={handleDateChange}
        />
        <p>Mostrando resumen para el mes de: {new Date(hoy).toLocaleDateString('es-CO', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</p>
      </div>

      <MesResumenStats
        ventasRecepies={productosVendidosConReceta}
        totalIngreso={datosCalculadosDelMes.totalIngreso}
        totalTip={datosCalculadosDelMes.totalTip}
        totalProductosVendidos={datosCalculadosDelMes.totalProductosVendidos}
        totalTarjeta={datosCalculadosDelMes.totalTarjeta}
        totalEfectivo={datosCalculadosDelMes.totalEfectivo}
        totalTransferencia={datosCalculadosDelMes.totalTransferencia}
        totalCompras={datosCalculadosDelMes.totalCompras}
        cantidadDeDias={ventas}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalles de Ventas del Mes</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Total Ingreso</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Pagado</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Fecha y Hora</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Método de Pago</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta, index) => (
                  <tr key={venta.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">
                      {venta.Total_Ingreso.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${venta.Pagado ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                        {venta.Pagado ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {new Date(venta.Date).toLocaleString("es-CO", { timeZone: "America/Bogota" })}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {venta.Pago_Info && JSON.parse(venta.Pago_Info).metodo || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Productos Vendidos en el Mes</h3>
            <button
              onClick={() => setShowFinancials(!showFinancials)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${showFinancials ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {showFinancials ? 'Ocultar Rentabilidad' : 'Ver Rentabilidad'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Producto</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Cant.</th>

                  {showFinancials ? (
                    <>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Ingresos Tot.</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Costo Tot.</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Ganancia</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Costo Unit.</th>
                    </>
                  ) : (
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {showFinancials && (
                  <tr className="bg-blue-50 font-bold border-b-2 border-blue-200">
                    <td className="py-3 px-4 text-sm text-blue-800">TOTALES</td>
                    <td className="py-3 px-4 text-center text-sm text-blue-800">
                      {productosVendidosConReceta.reduce((acc, p) => acc + (p.cantidad || 0), 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-green-700">
                      {productosVendidosConReceta.reduce((acc, p) => acc + (p.totalIngreso || 0), 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-red-600">
                      {productosVendidosConReceta.reduce((acc, p) => acc + (p.totalCosto || 0), 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-blue-700">
                      {productosVendidosConReceta.reduce((acc, p) => acc + (p.totalUtilidad || 0), 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                )}
                {productosVendidosConReceta.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 border-b text-sm text-gray-700 max-w-[150px] truncate" title={producto.nombre}>{producto.nombre}</td>
                    <td className="py-3 px-4 border-b text-sm text-center font-bold">{producto.cantidad}</td>

                    {showFinancials ? (
                      <>
                        <td className="py-3 px-4 border-b text-sm text-green-600 font-semibold text-right">{producto.totalIngreso?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                        <td className="py-3 px-4 border-b text-sm text-red-500 text-right">{producto.totalCosto?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                        <td className={`py-3 px-4 border-b text-sm text-right font-bold ${(producto.totalUtilidad || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>{producto.totalUtilidad?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                        <td className="py-3 px-4 border-b text-xs text-gray-500 text-right">{producto.recetaValor?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                      </>
                    ) : (
                      <td className="py-3 px-4 border-b text-sm">
                        <button
                          onClick={() => handleRecetaClick(producto)}
                          className="bg-yellow-500 text-white text-sm w-[30px] rounded"
                          title="Ver predicción y receta"
                        >
                          📕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPredict && selectedItem && (
        <Predict
          item={selectedItem}
          onClose={handleClosePredict}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          ventas={ventas}
        />
      )}

      <button
        onClick={handleFetchSales}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Fetch and Process Sales
      </button>
    </div>
  );
}

export default MesResumen;