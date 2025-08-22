import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { COMPRAS, MENU, RECETAS_MENU } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import DiaResumentStats from "./DiaResumentStats";

// --- Helper para formatear moneda ---
const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(number)}`;
};

function DiaResumen() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [resumen, setResumen] = useState({
    totalIngreso: 0,
    totalTip: 0,
    totalTarjeta: 0,
    totalEfectivo: 0,
    totalTransferencia: 0,
    totalCompras: 0,
  });

  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const allCompras = useSelector((state) => state.Compras);

  const handleDateChange = (e) => {
    setFechaSeleccionada(e.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(RECETAS_MENU)),
          dispatch(getAllFromTable(COMPRAS)),
        ]);

        const fechaObj = new Date(fechaSeleccionada + 'T00:00:00.000-05:00');
        const fechaFormateada = `${fechaObj.getMonth() + 1}/${fechaObj.getDate()}/${fechaObj.getFullYear()}`;

        const { data, error } = await supabase.from("Ventas").select("*");

        if (error) throw error;
        
        const ventasHoy = data.filter((venta) => venta.Date.split(",")[0] === fechaFormateada && venta.Pagado);
        ventasHoy.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        let totalIngreso = 0, totalTip = 0, totalTarjeta = 0, totalEfectivo = 0, totalTransferencia = 0;
        const productosMap = {};

        ventasHoy.forEach((venta) => {
          totalIngreso += parseFloat(venta.Total_Ingreso || 0);
          totalTip += parseFloat(venta.Tip || 0);

          if (venta.Pago_Info) {
            try {
              const pago = JSON.parse(venta.Pago_Info);
              if (pago.metodo === "Tarjeta") totalTarjeta += parseFloat(venta.Total_Ingreso || 0);
              if (pago.metodo === "Efectivo") totalEfectivo += parseFloat(venta.Total_Ingreso || 0);
              if (pago.metodo === "Transferencia") totalTransferencia += parseFloat(venta.Total_Ingreso || 0);
            } catch (e) { console.error("Error parsing Pago_Info:", e); }
          }
          
          if (venta.Productos) {
            try {
              const productos = JSON.parse(venta.Productos);
              productos.forEach((p) => {
                if (!p.NombreES) return;
                productosMap[p.NombreES] = {
                  nombre: p.NombreES,
                  cantidad: (productosMap[p.NombreES]?.cantidad || 0) + parseFloat(p.quantity),
                  recetaId: p.Receta || null,
                };
              });
            } catch (e) { console.error("Error parsing Productos:", e); }
          }
        });
        
        const totalComprasHoy = allCompras
          .filter(c => new Date(c.Date).toISOString().split('T')[0] === fechaSeleccionada)
          .reduce((acc, c) => acc + parseFloat(c.Valor), 0);
        
        setVentasDelDia(ventasHoy);
        setProductosVendidos(Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad));
        setResumen({ totalIngreso, totalTip, totalTarjeta, totalEfectivo, totalTransferencia, totalCompras: totalComprasHoy });

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fechaSeleccionada, dispatch, allCompras]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-xl font-semibold">📈 Cargando resumen...</div>;
  }

  const totalProductosVendidos = productosVendidos.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Resumen Diario</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="date" className="font-semibold">Fecha:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={fechaSeleccionada}
            onChange={handleDateChange}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>
      
      <main className="flex flex-col gap-6">
        <DiaResumentStats
          ventasRecepies={productosVendidos}
          allRecetasMenu={allRecetasMenu}
          {...resumen}
          totalProductosVendidos={totalProductosVendidos}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card: Productos Vendidos */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Productos Más Vendidos</h3>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="py-2 px-3 text-left font-bold text-gray-600">Producto</th>
                    <th className="py-2 px-3 text-right font-bold text-gray-600">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {productosVendidos.map((producto, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">{producto.nombre}</td>
                      <td className="py-3 px-3 text-right font-bold text-blue-600">{producto.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Detalles de Ventas */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalle de Ventas del Día</h3>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="py-2 px-3 text-left font-bold text-gray-600">Hora</th>
                    <th className="py-2 px-3 text-left font-bold text-gray-600 w-2/5">Productos</th>
                    <th className="py-2 px-3 text-right font-bold text-gray-600">Total</th>
                    <th className="py-2 px-3 text-center font-bold text-gray-600">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasDelDia.map((venta) => (
                    <tr key={venta._id} className="border-b hover:bg-gray-50 align-top">
                      <td className="py-3 px-3 text-gray-700 whitespace-nowrap">{new Date(venta.Date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-3">
                        {(() => {
                          try {
                            const productos = JSON.parse(venta.Productos);
                            if (!Array.isArray(productos)) return null;
                            return (
                              <ul className="list-disc pl-4 space-y-1">
                                {productos.map((p, idx) => (
                                  <li key={`${venta._id}-${idx}`} className="text-xs text-gray-600">
                                    <span className="font-semibold">{p.quantity}</span> x {p.NombreES}
                                  </li>
                                ))}
                              </ul>
                            );
                          } catch (e) {
                            return <span className="text-xs text-red-500">Error en productos</span>;
                          }
                        })()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-green-600">{formatCurrency(venta.Total_Ingreso)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                           {venta.Pago_Info ? JSON.parse(venta.Pago_Info).metodo : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DiaResumen;