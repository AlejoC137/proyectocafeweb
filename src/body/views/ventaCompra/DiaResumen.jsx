import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector, useStore } from "react-redux";
import { RECETAS_MENU } from "../../../redux/actions-types";
import DiaResumentStats from "./DiaResumentStats";
import { fetchAndProcessSales } from "./slicer"; // Import the function
import {
  fetchVentasByDay,
  fetchComprasByDay,
  ensureCatalogTablesLoaded,
} from "./resumenQueries";

const getToday = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseDateParts = (isoDate) => {
  const parts = (isoDate || getToday()).split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return { year, month, day };
};

function DiaResumen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const store = useStore();
  const { date } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [ventas, setVentas] = useState([]);
  const [totalIngreso, setTotalIngreso] = useState(0);
  const [totalTip, setTotalTip] = useState(0);
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [inputDate, setInputDate] = useState(date || getToday());
  const [hoy, setHoy] = useState(() => {
    const parts = parseDateParts(date || getToday());
    return parts ? `${parts.month}/${parts.day}/${parts.year}` : "";
  });
  const [totalTarjeta, setTotalTarjeta] = useState(0);
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [totalTransferencia, setTotalTransferencia] = useState(0);
  const [totalCompras, setTotalCompras] = useState(0);

  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);

  useEffect(() => {
    if (!date) {
      navigate(`/DiaResumen/${getToday()}`, { replace: true });
    } else if (date !== inputDate) {
      setInputDate(date);
      const parts = parseDateParts(date);
      if (parts) {
        setHoy(`${parts.month}/${parts.day}/${parts.year}`);
      }
    }
  }, [date, navigate, inputDate]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (!newDate) return;
    navigate(`/DiaResumen/${newDate}`);
  };

  useEffect(() => {
    const parts = parseDateParts(inputDate);
    if (!parts) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Consultar solo el día seleccionado en Ventas y Compras, y cargar Recetas solo si no están en Redux
        const [ventasHoy, comprasHoy] = await Promise.all([
          fetchVentasByDay(parts.year, parts.month, parts.day),
          fetchComprasByDay(parts.year, parts.month, parts.day),
          ensureCatalogTablesLoaded(dispatch, store.getState, [RECETAS_MENU]),
        ]);

        if (cancelled) return;

        // Ordenar las ventas por fecha y hora
        ventasHoy.sort((a, b) => {
          const dateA = new Date(a.Time && !a.Date.includes(",") ? `${a.Date} ${a.Time}` : a.Date);
          const dateB = new Date(b.Time && !b.Date.includes(",") ? `${b.Date} ${b.Time}` : b.Date);
          return dateA - dateB;
        });

        setVentas(ventasHoy);

        // Calcular ingresos y tips totales
        const total = ventasHoy
          .filter((venta) => venta.Pagado === true)
          .reduce((acc, venta) => acc + parseFloat(venta.Total_Ingreso || 0), 0);
        setTotalIngreso(total);

        const tipSum = ventasHoy
          .filter((venta) => venta.Pagado === true)
          .reduce((acc, venta) => acc + parseFloat(venta.Tip || 0), 0);
        setTotalTip(tipSum);

        // Calcular pagos por método
        let tarjeta = 0;
        let efectivo = 0;
        let transferencia = 0;

        ventasHoy.forEach((venta) => {
          if (venta.Pago_Info) {
            let pagos;
            try {
              pagos = typeof venta.Pago_Info === "string" ? JSON.parse(venta.Pago_Info) : venta.Pago_Info;
            } catch (e) {
              console.error("Error parsing Pago_Info:", e);
              return;
            }

            if (pagos?.metodo === "Tarjeta") {
              tarjeta += parseFloat(venta.Total_Ingreso || 0);
            }
            if (pagos?.metodo === "Efectivo") {
              efectivo += parseFloat(venta.Total_Ingreso || 0);
            }
            if (pagos?.metodo === "Transferencia") {
              transferencia += parseFloat(venta.Total_Ingreso || 0);
            }
          }
        });

        setTotalTarjeta(tarjeta);
        setTotalEfectivo(efectivo);
        setTotalTransferencia(transferencia);

        // Calcular productos vendidos
        const productosMap = {};
        ventasHoy.forEach((venta) => {
          if (venta.Productos) {
            let productos;
            try {
              productos = typeof venta.Productos === "string" ? JSON.parse(venta.Productos) : venta.Productos;
            } catch (e) {
              console.error("Error parsing Productos:", e);
              return;
            }

            if (!Array.isArray(productos)) return;

            productos.forEach((producto) => {
              if (
                producto.id === "" &&
                producto.NombreES === "" &&
                producto.Precio === 0 &&
                producto.quantity === 1 &&
                Array.isArray(producto.matches) &&
                producto.matches.length === 0
              ) {
                return; // Descartar el producto vacío
              }
              const qty = parseFloat(producto.quantity || 0);
              if (productosMap[producto.NombreES]) {
                productosMap[producto.NombreES].cantidad += qty;
              } else {
                productosMap[producto.NombreES] = {
                  nombre: producto.NombreES,
                  cantidad: qty,
                  recetaId: producto.Receta || "N/A",
                };
              }
            });
          }
        });

        const productosArray = Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad);
        setProductosVendidos(productosArray);

        const comprasSum = comprasHoy.reduce(
          (acc, compra) => acc + (parseFloat(compra.Valor) || 0),
          0
        );
        setTotalCompras(comprasSum);
      } catch (error) {
        if (cancelled) return;
        console.error("Error loading data:", error);
        setErrorMsg(error?.message || "No se pudieron cargar los datos del día.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [inputDate, dispatch, store, reloadTick]);

  const handleFetchSales = async () => {
    await fetchAndProcessSales(dispatch);
    setReloadTick((t) => t + 1);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalProductosVendidos = productosVendidos.reduce((acc, producto) => acc + producto.cantidad, 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      {/* Header and Date Selector Container */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Resumen del Día</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta las métricas y ventas detalladas de un día específico. ({hoy})
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <label htmlFor="date" className="text-sm font-semibold text-gray-700 shrink-0">
            Fecha:
          </label>
          <div className="relative">
            <input
              type="date"
              id="date"
              name="date"
              value={inputDate}
              className="block w-full px-4 py-2.5 text-gray-700 font-medium bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
              onChange={handleDateChange}
            />
          </div>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="px-3 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors"
            title="Recargar datos del día"
          >
            Recargar
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700">
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

      <DiaResumentStats
        ventasRecepies={productosVendidos}
        allRecetasMenu={allRecetasMenu}
        totalIngreso={totalIngreso}
        totalTip={totalTip}
        totalProductosVendidos={totalProductosVendidos}
        totalTarjeta={totalTarjeta}
        totalEfectivo={totalEfectivo}
        totalTransferencia={totalTransferencia}
        totalCompras={totalCompras}
      />
      {/* Resumen del Día */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Detalles de Ventas */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">
            Detalles de Ventas
          </h3>
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
                {ventas.map((venta) => (
                  <tr
                    key={venta._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">
                      {venta.Total_Ingreso}
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
                    <td className="py-3 px-4 border-b text-sm text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          venta.Productos ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}
                      >
                        {venta.Productos
                          ? (() => {
                              try {
                                const productosArr = JSON.parse(venta.Productos);
                                if (Array.isArray(productosArr) && productosArr.length > 0) {
                                  return productosArr
                                    .map(
                                      (prod) =>
                                        `${prod.NombreES ?? "Sin nombre"} (${prod.quantity ?? 0})`
                                    )
                                    .join(", ");
                                } else {
                                  return "Sin productos";
                                }
                              } catch (e) {
                                return "Error al leer productos";
                              }
                            })()
                          : "No"}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                     {venta.Date && venta.Date } 
                     <br />
                     {venta.Time && venta.Time}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {venta.Pago_Info && (() => {
                        let pagos;
                        try {
                          pagos = JSON.parse(venta.Pago_Info);
                        } catch (e) {
                          console.error("Error parsing Pago_Info:", e);
                          return null;
                        }
                        return pagos ? 
                          <div >{pagos.metodo}$</div>
                         : null;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Productos Vendidos */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">
            Productos Vendidos
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Producto
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Cantidad Vendida
                  </th>
                </tr>
              </thead>
              <tbody>
                {productosVendidos.map((producto, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {producto.nombre}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">
                      {producto.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


      </div>
      
      {/* Footer Sync Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleFetchSales}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Sincronizar y Procesar Ventas
        </button>
      </div>
    </div>
  );
}

export default DiaResumen;
