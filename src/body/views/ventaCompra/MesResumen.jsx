import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { ITEMS, MENU, RECETAS_MENU, PRODUCCION, RECETAS_PRODUCCION, STAFF } from "../../../redux/actions-types";
import { trimRecepie } from "../../../redux/actions";
import { fetchAndProcessSales } from "./slicer";
import {
  fetchVentasByMonth,
  fetchComprasByMonth,
  fetchConsumoStaffByMonth,
  ensureCatalogTablesLoaded,
  isSalePaid,
  parseSaleProductos,
  getSalePaymentBreakdown,
  getProductUnitPrice,
} from "./resumenQueries";

import ProductosVendidosRentabilidad from "./ProductosVendidosRentabilidad";
import MesResumenStats from "./MesResumenStats";
import DiaResumenBolsillos from "./DiaResumenBolsillos";
import { calculateFinancialPockets } from "./bolsillos/pocketEngine";

function MesResumen() {
  const dispatch = useDispatch();
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("resumen"); // "resumen" | "bolsillos"
  const [reloadTick, setReloadTick] = useState(0);
  const [ventas, setVentas] = useState([]);
  const [comprasMes, setComprasMes] = useState([]);
  const [consumoStaffMes, setConsumoStaffMes] = useState([]);
  const [productosVendidosConReceta, setProductosVendidosConReceta] = useState([]);
  const [hoy, setHoy] = useState(new Date().toISOString().split('T')[0]);

  const allMenu = useSelector((state) => state.allMenu || []);
  const allItems = useSelector((state) => state.allItems || []);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
  const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allStaff = useSelector((state) => state.allStaff || []);

  const { selectedMonth, selectedYear } = useMemo(() => {
    const selectedDate = new Date(hoy);
    selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
    return {
      selectedMonth: selectedDate.getMonth(),
      selectedYear: selectedDate.getFullYear(),
    };
  }, [hoy]);

  useEffect(() => {
    let cancelled = false;

    const fetchMonthData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Consultar solo el mes seleccionado en Ventas, Compras y ConsumoStaff,
        // y cargar tablas de catálogo únicamente si aún no están en Redux
        const [ventasDelMes, comprasDelMes, consumosDelMes] = await Promise.all([
          fetchVentasByMonth(selectedYear, selectedMonth, { force: reloadTick > 0 }),
          fetchComprasByMonth(selectedYear, selectedMonth, { force: reloadTick > 0 }),
          fetchConsumoStaffByMonth(selectedYear, selectedMonth),
          ensureCatalogTablesLoaded(
            dispatch,
            store.getState,
            [MENU, ITEMS, PRODUCCION, RECETAS_MENU, RECETAS_PRODUCCION, STAFF],
            { force: reloadTick > 0 }
          ),
        ]);

        if (cancelled) return;

        ventasDelMes.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        setVentas(ventasDelMes);
        setComprasMes(comprasDelMes);
        setConsumoStaffMes(consumosDelMes);
      } catch (error) {
        if (cancelled) return;
        console.error("Error al cargar los datos del mes:", error);
        setErrorMsg(error?.message || "No se pudieron cargar los datos del mes.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMonthData();

    return () => {
      cancelled = true;
    };
  }, [dispatch, store, selectedMonth, selectedYear, reloadTick]);



  const datosCalculadosDelMes = useMemo(() => {
    let total = 0;
    let tipTotal = 0;
    let tarjeta = 0;
    let efectivo = 0;
    let transferencia = 0;
    const productosMap = {};

    ventas.forEach((venta) => {
      if (!isSalePaid(venta)) return;

      const ingresoVenta = parseFloat(venta.Total_Ingreso || 0) || 0;
      total += ingresoVenta;
      tipTotal += parseFloat(venta.Tip || 0) || 0;

      const pagos = getSalePaymentBreakdown(venta);
      tarjeta += pagos.tarjeta;
      efectivo += pagos.efectivo;
      transferencia += pagos.transferencia;

      const productos = parseSaleProductos(venta.Productos);
      productos.forEach((producto) => {
        const nombre = producto.NombreES || producto.nombre;
        if (!nombre) return;

        const cantidad = parseFloat(producto.quantity ?? producto.cantidad ?? 0) || 0;
        if (cantidad <= 0) return;

        const price = getProductUnitPrice(producto, allMenu);

        if (productosMap[nombre]) {
          productosMap[nombre].cantidad += cantidad;
          productosMap[nombre].totalIngreso += price * cantidad;
        } else {
          const recetaIdDefinitiva =
            producto.Receta ||
            allMenu.find((menu) => menu.NombreES === nombre)?.Receta ||
            null;

          productosMap[nombre] = {
            nombre,
            cantidad,
            totalIngreso: price * cantidad,
            recetaId: recetaIdDefinitiva || "N/A",
            recetaValor: 0,
            ingredientes: [],
          };
        }
      });
    });

    const productosVendidos = Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad);

    const totalCompras = comprasMes.reduce(
      (acc, compra) => acc + parseFloat(compra.Valor || 0),
      0
    );

    // Calcular el total consumido por el staff en costo de producción
    let totalConsumoCosto = 0;
    consumoStaffMes.forEach((consumo) => {
      if (!consumo.Productos) return;
      try {
        const productos = typeof consumo.Productos === 'string' ? JSON.parse(consumo.Productos) : consumo.Productos;
        productos.forEach((p) => {
          const cantidad = parseFloat(p.quantity || 0);
          const menuItem = allMenu.find((m) => m.NombreES === p.NombreES);
          if (menuItem && menuItem.Receta) {
            const receta = allRecetasMenu.find(r => r._id === menuItem.Receta) || allRecetasProduccion.find(r => r._id === menuItem.Receta);
            if (receta && receta.costo) {
              try {
                const costData = typeof receta.costo === 'string' ? JSON.parse(receta.costo) : receta.costo;
                let cCost = 0;
                if (typeof costData === 'number') {
                  cCost = costData;
                } else if (costData) {
                  cCost = (Number(costData.vCMP) || 0) + (Number(costData.vCMO) || 0);
                }
                totalConsumoCosto += cCost * cantidad;
              } catch (err) {
                console.warn("Error parsing recipe cost", err);
              }
            }
          }
        });
      } catch (err) {
        console.error("Error parsing consumo.Productos", err);
      }
    });

    return {
      totalIngreso: total,
      totalTip: tipTotal,
      totalTarjeta: tarjeta,
      totalEfectivo: efectivo,
      totalTransferencia: transferencia,
      productosVendidos,
      totalCompras,
      totalConsumoStaff: totalConsumoCosto,
      totalProductosVendidos: productosVendidos.reduce((acc, p) => acc + p.cantidad, 0),
    };
  }, [ventas, comprasMes, allMenu, consumoStaffMes, allRecetasMenu, allRecetasProduccion]);

  useEffect(() => {
    if (datosCalculadosDelMes.productosVendidos.length === 0 || !allItems.length || !allMenu.length) {
      setProductosVendidosConReceta([]);
      return;
    }

    const calculateRecipeValues = () => {

      const updatedProductos = datosCalculadosDelMes.productosVendidos.map((producto) => {

        let recetaData = null;
        let consolidatedCost = 0;
        let vCMP = 0;
        let vCMO = 0;
        let ingredients = [];

        if (producto.recetaId !== "N/A") {
          try {
            const menuItem = allMenu.find((item) => item.Receta === producto.recetaId);
            if (menuItem) {
              // Try to find the recipe in the Redux store (Menu or Produccion)
              recetaData = allRecetasMenu.find(r => r._id === menuItem.Receta) || allRecetasProduccion.find(r => r._id === menuItem.Receta);

              if (recetaData) {
                // Use stored cost instead of recalculating
                if (recetaData.costo) {
                  try {
                    const costData = typeof recetaData.costo === 'string' ? JSON.parse(recetaData.costo) : recetaData.costo;

                    if (typeof costData === 'number') {
                      // Case for pure production recipes sometimes stored as number
                      consolidatedCost = costData;
                      vCMP = costData; // Assume all is material if simple number
                    } else if (costData) {
                      // Case for detailed object cost (vCMP + vCMO)
                      // Safely parse numbers and ensure 0 if missing
                      const rawCMP = Number(costData.vCMP) || 0;
                      const rawCMO = Number(costData.vCMO) || 0;

                      vCMP = Number(rawCMP.toFixed(0));
                      vCMO = Number(rawCMO.toFixed(0));

                      // If consolidated cost logic needs to be sum:
                      consolidatedCost = vCMP + vCMO;
                    }
                  } catch (e) {
                    console.warn("Could not parse cost for recipe:", recetaData.legacyName);
                  }
                }

                // Still trim ingredients for the "Predict" modal usage if needed
                ingredients = trimRecepie([...allItems, ...allProduccion], recetaData);
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
          vCMP,
          vCMO,
          ingredientes: ingredients,
          totalCosto: totalCosto,
          totalUtilidad: totalUtilidad
        };
      });

      setProductosVendidosConReceta(updatedProductos);
    };

    calculateRecipeValues();
  }, [datosCalculadosDelMes.productosVendidos, allMenu, allItems, allProduccion, allRecetasMenu, allRecetasProduccion]);




  const bolsillosMesResumen = useMemo(() => {
    return calculateFinancialPockets({
      ventas,
      consumoStaff: consumoStaffMes,
      allStaff,
      allMenu,
      allRecetasMenu,
      allRecetasProduccion,
      allItems,
      allProduccion,
      periodParams: {
        periodType: "month",
        targetMonth: selectedMonth,
        targetYear: selectedYear,
      },
    });
  }, [ventas, consumoStaffMes, allStaff, allMenu, allRecetasMenu, allRecetasProduccion, allItems, allProduccion, selectedMonth, selectedYear]);

  const handleDateChange = (e) => {
    setHoy(e.target.value);
  };

  const handleFetchSales = async () => {
    await fetchAndProcessSales(dispatch);
    setReloadTick((t) => t + 1);
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

      {errorMsg && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700">
          <span className="text-sm font-medium">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Reintentar
          </button>
        </div>
      )}

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
        totalConsumoStaff={datosCalculadosDelMes.totalConsumoStaff}
        totalNomina={bolsillosMesResumen.totalNomina}
        totalBolsillos={bolsillosMesResumen.totalAGuardarGlobal}
      />

      {/* Pestañas del Resumen del Mes */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50 px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("resumen")}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "resumen"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span>Ventas y Rentabilidad</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {ventas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bolsillos")}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "bolsillos"
                ? "border-amber-600 text-amber-800 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span>💰 Bolsillos del Mes</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === "resumen" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-lg border border-gray-200">
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
                        <tr key={venta._id || venta.id || index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">
                            {(Number(venta.Total_Ingreso) || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
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
                            {(() => {
                              if (!venta.Pago_Info) return 'N/A';
                              try {
                                const parsed = typeof venta.Pago_Info === 'string' ? JSON.parse(venta.Pago_Info) : venta.Pago_Info;
                                return parsed?.metodo || 'N/A';
                              } catch {
                                return 'N/A';
                              }
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="h-full">
                <ProductosVendidosRentabilidad
                  productos={productosVendidosConReceta}
                  ventas={ventas}
                  targetMonth={selectedMonth}
                  targetYear={selectedYear}
                />
              </div>
            </div>
          )}

          {activeTab === "bolsillos" && (
            <DiaResumenBolsillos
              ventas={ventas}
              consumoStaff={consumoStaffMes}
              totalIngreso={datosCalculadosDelMes.totalIngreso}
              periodParams={{
                periodType: "month",
                targetMonth: selectedMonth,
                targetYear: selectedYear,
              }}
              periodLabel="del Mes"
              allStaff={allStaff}
              allMenu={allMenu}
              allRecetasMenu={allRecetasMenu}
              allRecetasProduccion={allRecetasProduccion}
              allItems={allItems}
              allProduccion={allProduccion}
              loadingCatalogs={false}
            />
          )}
        </div>
      </div>



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