import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector, useStore } from "react-redux";
import {
  MENU,
  ITEMS,
  PRODUCCION,
  RECETAS_MENU,
  RECETAS_PRODUCCION,
  STAFF,
} from "../../../redux/actions-types";
import { trimRecepie } from "../../../redux/actions";
import MesResumenStats from "./MesResumenStats";
import DiaResumenBolsillos from "./DiaResumenBolsillos";
import { fetchAndProcessSales } from "./slicer";
import {
  fetchVentasByRange,
  fetchComprasByRange,
  fetchConsumoStaffByRange,
  ensureCatalogTablesLoaded,
} from "./resumenQueries";
import { calculateFinancialPockets } from "./bolsillos/pocketEngine";

const getTodayBogota = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Dada una fecha ISO (YYYY-MM-DD), devuelve el rango de su semana (Lunes a Domingo).
 */
const getWeekRangeFromIso = (isoDate) => {
  const parts = (isoDate || getTodayBogota()).split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return getWeekRangeFromIso(getTodayBogota());
  }
  const base = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const day = base.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(base);
  monday.setDate(base.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) =>
    d.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  return {
    startIso: toIsoDate(monday),
    endIso: toIsoDate(sunday),
    label: `${fmt(monday)} – ${fmt(sunday)} ${sunday.getFullYear()}`,
  };
};

const shiftIsoDateByDays = (isoDate, deltaDays) => {
  const parts = (isoDate || getTodayBogota()).split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  d.setDate(d.getDate() + deltaDays);
  return toIsoDate(d);
};

function SemanaResumen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const store = useStore();
  const { date } = useParams();

  const [inputDate, setInputDate] = useState(date || getTodayBogota());
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState("detalles"); // "detalles" | "productos" | "bolsillos"
  const [reloadTick, setReloadTick] = useState(0);

  const [ventas, setVentas] = useState([]);
  const [comprasSemana, setComprasSemana] = useState([]);
  const [consumoStaffSemana, setConsumoStaffSemana] = useState([]);

  const allMenu = useSelector((state) => state.allMenu || []);
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
  const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []);
  const allStaff = useSelector((state) => state.allStaff || []);

  const weekRange = useMemo(() => getWeekRangeFromIso(inputDate), [inputDate]);

  useEffect(() => {
    if (!date) {
      navigate(`/SemanaResumen/${getTodayBogota()}`, { replace: true });
    } else if (date !== inputDate) {
      setInputDate(date);
    }
  }, [date, navigate, inputDate]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (!newDate) return;
    navigate(`/SemanaResumen/${newDate}`);
  };

  const handleShiftWeek = (deltaWeeks) => {
    navigate(`/SemanaResumen/${shiftIsoDateByDays(weekRange.startIso, deltaWeeks * 7)}`);
  };

  const handleThisWeek = () => {
    navigate(`/SemanaResumen/${getTodayBogota()}`);
  };

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;
    let attempt = 0;

    setLoading(true);
    setRetryCount(0);

    const fetchData = async () => {
      if (cancelled) return;
      try {
        const [ventasSem, comprasSem, consumosSem] = await Promise.all([
          fetchVentasByRange(weekRange.startIso, weekRange.endIso, { force: reloadTick > 0 }),
          fetchComprasByRange(weekRange.startIso, weekRange.endIso, { force: reloadTick > 0 }),
          fetchConsumoStaffByRange(weekRange.startIso, weekRange.endIso),
          ensureCatalogTablesLoaded(
            dispatch,
            store.getState,
            [MENU, ITEMS, PRODUCCION, RECETAS_MENU, RECETAS_PRODUCCION, STAFF],
            { force: reloadTick > 0 }
          ),
        ]);

        if (cancelled) return;

        ventasSem.sort((a, b) => {
          const dateA = new Date(a.Time && !String(a.Date || "").includes(",") ? `${a.Date} ${a.Time}` : a.Date);
          const dateB = new Date(b.Time && !String(b.Date || "").includes(",") ? `${b.Date} ${b.Time}` : b.Date);
          return dateA - dateB;
        });

        setVentas(ventasSem);
        setComprasSemana(comprasSem);
        setConsumoStaffSemana(consumosSem);
        setRetryCount(0);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        attempt += 1;
        setRetryCount(attempt);
        console.warn(`Error cargando SemanaResumen (intento ${attempt}), reintentando...`, error);
        const delay = Math.min(1500 * attempt, 5000);
        retryTimer = setTimeout(fetchData, delay);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [weekRange.startIso, weekRange.endIso, dispatch, store, reloadTick]);

  const datosCalculados = useMemo(() => {
    let totalIngreso = 0;
    let totalTip = 0;
    let totalTarjeta = 0;
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    const productosMap = {};

    ventas.forEach((venta) => {
      if (venta.Pagado) {
        const ingresoVenta = parseFloat(venta.Total_Ingreso || 0);
        totalIngreso += ingresoVenta;
        totalTip += parseFloat(venta.Tip || 0);

        if (venta.Pago_Info) {
          try {
            const pagos = typeof venta.Pago_Info === "string" ? JSON.parse(venta.Pago_Info) : venta.Pago_Info;
            if (pagos?.metodo === "Tarjeta") totalTarjeta += ingresoVenta;
            if (pagos?.metodo === "Efectivo") totalEfectivo += ingresoVenta;
            if (pagos?.metodo === "Transferencia") totalTransferencia += ingresoVenta;
          } catch (e) {
            console.error("Error parsing Pago_Info:", e);
          }
        }
      }

      if (venta.Productos) {
        try {
          const productos = typeof venta.Productos === "string" ? JSON.parse(venta.Productos) : venta.Productos;
          if (!Array.isArray(productos)) return;

          productos.forEach((producto) => {
            if (!producto?.NombreES) return;
            const cantidad = parseFloat(producto.quantity || 0);
            if (cantidad <= 0) return;

            let price = parseFloat(producto.price || producto.valor || producto.precio || 0);
            if (price === 0) {
              const menuProduct = allMenu.find((m) => m.NombreES === producto.NombreES);
              if (menuProduct) price = parseFloat(menuProduct.Precio || 0);
            }

            if (productosMap[producto.NombreES]) {
              productosMap[producto.NombreES].cantidad += cantidad;
              productosMap[producto.NombreES].totalIngreso += price * cantidad;
            } else {
              const recetaId =
                producto.Receta ||
                allMenu.find((m) => m.NombreES === producto.NombreES)?.Receta ||
                "N/A";
              productosMap[producto.NombreES] = {
                nombre: producto.NombreES,
                cantidad,
                totalIngreso: price * cantidad,
                recetaId,
                totalCosto: 0,
              };
            }
          });
        } catch (e) {
          console.error("Error parsing Productos:", e);
        }
      }
    });

    const productosVendidos = Object.values(productosMap)
      .map((producto) => {
        let consolidatedCost = 0;
        if (producto.recetaId !== "N/A") {
          const recetaData =
            allRecetasMenu.find((r) => r._id === producto.recetaId) ||
            allRecetasProduccion.find((r) => r._id === producto.recetaId);
          if (recetaData?.costo) {
            try {
              const costData = typeof recetaData.costo === "string" ? JSON.parse(recetaData.costo) : recetaData.costo;
              if (typeof costData === "number") {
                consolidatedCost = costData;
              } else if (costData) {
                consolidatedCost = Math.round(Number(costData.vCMP) || 0) + Math.round(Number(costData.vCMO) || 0);
              }
            } catch {}
          } else if (recetaData) {
            trimRecepie([...allItems, ...allProduccion], recetaData);
          }
        }
        return {
          ...producto,
          totalCosto: consolidatedCost * producto.cantidad,
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad);

    const totalCompras = comprasSemana.reduce(
      (acc, compra) => acc + (parseFloat(compra.Valor) || 0),
      0
    );

    let totalConsumoStaff = 0;
    consumoStaffSemana.forEach((consumo) => {
      if (!consumo.Productos) return;
      try {
        const productos = typeof consumo.Productos === "string" ? JSON.parse(consumo.Productos) : consumo.Productos;
        if (!Array.isArray(productos)) return;
        productos.forEach((p) => {
          const cantidad = parseFloat(p.quantity || 0);
          const menuItem = allMenu.find((m) => m.NombreES === p.NombreES);
          if (menuItem?.Receta) {
            const receta =
              allRecetasMenu.find((r) => r._id === menuItem.Receta) ||
              allRecetasProduccion.find((r) => r._id === menuItem.Receta);
            if (receta?.costo) {
              try {
                const costData = typeof receta.costo === "string" ? JSON.parse(receta.costo) : receta.costo;
                const cCost =
                  typeof costData === "number"
                    ? costData
                    : (Number(costData?.vCMP) || 0) + (Number(costData?.vCMO) || 0);
                totalConsumoStaff += cCost * cantidad;
              } catch {}
            }
          }
        });
      } catch {}
    });

    return {
      totalIngreso,
      totalTip,
      totalTarjeta,
      totalEfectivo,
      totalTransferencia,
      totalCompras,
      totalConsumoStaff,
      productosVendidos,
      totalProductosVendidos: productosVendidos.reduce((acc, p) => acc + p.cantidad, 0),
    };
  }, [ventas, comprasSemana, consumoStaffSemana, allMenu, allItems, allProduccion, allRecetasMenu, allRecetasProduccion]);

  const bolsillosSemanaResumen = useMemo(() => {
    return calculateFinancialPockets({
      ventas,
      consumoStaff: consumoStaffSemana,
      allStaff,
      allMenu,
      allRecetasMenu,
      allRecetasProduccion,
      allItems,
      allProduccion,
      periodParams: {
        periodType: "custom",
        customStartDate: weekRange.startIso,
        customEndDate: weekRange.endIso,
      },
    });
  }, [ventas, consumoStaffSemana, allStaff, allMenu, allRecetasMenu, allRecetasProduccion, allItems, allProduccion, weekRange.startIso, weekRange.endIso]);

  const handleFetchSales = async () => {
    await fetchAndProcessSales(dispatch);
    setReloadTick((t) => t + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-gray-50 gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        <div className="text-center">
          <p className="text-base font-semibold text-gray-700">
            Cargando resumen de la semana...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {retryCount > 0
              ? `Reintentando conexión automáticamente (intento ${retryCount})...`
              : `Consultando ventas, compras y turnos (${weekRange.startIso} a ${weekRange.endIso})`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      {/* Header y Selector de Semana */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Resumen de la Semana</h1>
          <p className="text-sm text-gray-500 mt-1">
            Métricas, ventas y bolsillos consolidados de lunes a domingo:{" "}
            <strong className="text-gray-700">{weekRange.label}</strong> ({weekRange.startIso} al {weekRange.endIso})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleShiftWeek(-1)}
            className="px-3 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors"
          >
            ◀ Anterior
          </button>
          <button
            type="button"
            onClick={handleThisWeek}
            className="px-3 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => handleShiftWeek(1)}
            className="px-3 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors"
          >
            Siguiente ▶
          </button>
          <input
            type="date"
            id="week-date"
            name="week-date"
            value={inputDate}
            onChange={handleDateChange}
            className="px-3 py-2 text-sm text-gray-700 font-medium bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors"
            title="Recargar datos de la semana"
          >
            Recargar
          </button>
        </div>
      </div>

      <MesResumenStats
        title={`Resumen de la Semana (${weekRange.label})`}
        ventasRecepies={datosCalculados.productosVendidos}
        totalIngreso={datosCalculados.totalIngreso}
        totalTip={datosCalculados.totalTip}
        totalProductosVendidos={datosCalculados.totalProductosVendidos}
        totalTarjeta={datosCalculados.totalTarjeta}
        totalEfectivo={datosCalculados.totalEfectivo}
        totalTransferencia={datosCalculados.totalTransferencia}
        totalCompras={datosCalculados.totalCompras}
        cantidadDeDias={ventas}
        totalConsumoStaff={datosCalculados.totalConsumoStaff}
        totalNomina={bolsillosSemanaResumen.totalNomina}
        totalBolsillos={bolsillosSemanaResumen.totalAGuardarGlobal}
      />

      {/* Pestañas de la Semana */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50 px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("detalles")}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "detalles"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span>Detalles de Ventas</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {ventas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("productos")}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "productos"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span>Productos Vendidos</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {datosCalculados.productosVendidos.length}
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
            <span>💰 Bolsillos de la Semana</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === "detalles" && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                      Total Ingreso
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                      Pagado
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                      Contenido de venta
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                      Fecha y Hora
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                      Método de Pago
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((venta, index) => (
                    <tr
                      key={venta._id || index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">
                        {(Number(venta.Total_Ingreso) || 0).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="py-3 px-4 border-b text-sm text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            venta.Pagado ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                          }`}
                        >
                          {venta.Pagado ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b text-xs text-gray-700">
                        {venta.Productos
                          ? (() => {
                              try {
                                const productosArr =
                                  typeof venta.Productos === "string"
                                    ? JSON.parse(venta.Productos)
                                    : venta.Productos;
                                if (Array.isArray(productosArr) && productosArr.length > 0) {
                                  return productosArr
                                    .map((prod) => `${prod.NombreES ?? "Sin nombre"} (${prod.quantity ?? 0})`)
                                    .join(", ");
                                }
                                return "Sin productos";
                              } catch {
                                return "Error al leer productos";
                              }
                            })()
                          : "No"}
                      </td>
                      <td className="py-3 px-4 border-b text-sm text-gray-700 whitespace-nowrap">
                        {venta.Date}
                        {venta.Time ? (
                          <>
                            <br />
                            <span className="text-xs text-gray-500">{venta.Time}</span>
                          </>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 border-b text-sm text-gray-700">
                        {venta.Pago_Info
                          ? (() => {
                              try {
                                const pagos =
                                  typeof venta.Pago_Info === "string"
                                    ? JSON.parse(venta.Pago_Info)
                                    : venta.Pago_Info;
                                return pagos?.metodo || "N/A";
                              } catch {
                                return "N/A";
                              }
                            })()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "productos" && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                      Producto
                    </th>
                    <th className="py-3 px-4 border-b text-right text-sm font-medium text-gray-700">
                      Cantidad Vendida
                    </th>
                    <th className="py-3 px-4 border-b text-right text-sm font-medium text-gray-700">
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datosCalculados.productosVendidos.map((producto, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 border-b text-sm text-gray-700">
                        {producto.nombre}
                      </td>
                      <td className="py-3 px-4 border-b text-sm text-right text-green-600 font-bold">
                        {producto.cantidad}
                      </td>
                      <td className="py-3 px-4 border-b text-sm text-right text-gray-800 font-semibold">
                        {(Number(producto.totalIngreso) || 0).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "bolsillos" && (
            <DiaResumenBolsillos
              ventas={ventas}
              consumoStaff={consumoStaffSemana}
              totalIngreso={datosCalculados.totalIngreso}
              periodParams={{
                periodType: "custom",
                customStartDate: weekRange.startIso,
                customEndDate: weekRange.endIso,
              }}
              periodLabel="de la Semana"
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

      {/* Footer Sync Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleFetchSales}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          Sincronizar y Procesar Ventas
        </button>
      </div>
    </div>
  );
}

export default SemanaResumen;
