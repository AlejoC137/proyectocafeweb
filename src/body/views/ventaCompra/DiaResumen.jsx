import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { MENU } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";

function DiaResumen() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [totalIngreso, setTotalIngreso] = useState(0);
  const [totalTip, setTotalTip] = useState(0);
  const [productosVendidos, setProductosVendidos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([dispatch(getAllFromTable(MENU))]);

        const { data, error } = await supabase
          .from("Ventas")
          .select("*")
          .order("Date", { ascending: true });

        if (error) {
          console.error("Error fetching ventas:", error);
        } else {
          const today = new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }).split(",")[0];

          data.forEach((venta) => {
            if (venta.Productos) {
              const productos = JSON.parse(venta.Productos);
              productos.forEach((producto) => {
                console.log(producto);
              });
            }
          });

          const ventasHoy = data.filter((venta) => venta.Date.split(",")[0] === today);

          // Ordenar las ventas por fecha y hora
          ventasHoy.sort((a, b) => new Date(a.Date) - new Date(b.Date));

          setVentas(ventasHoy);

          // Calcular ingresos y tips totales
          const total = ventasHoy
            .filter((venta) => venta.Pagado === true)
            .reduce((acc, venta) => acc + parseFloat(venta.Total_Ingreso || 0), 0);
          setTotalIngreso(total);

          const totalTip = ventasHoy
            .filter((venta) => venta.Pagado === true)
            .reduce((acc, venta) => acc + parseFloat(venta.Tip || 0), 0);
          setTotalTip(totalTip);

          // Calcular productos vendidos
          const productosMap = {};
          ventasHoy.forEach((venta) => {
            if (venta.Productos) {
              const productos = JSON.parse(venta.Productos); // Suponiendo que Productos es un JSON
              productos.forEach((producto) => {
                if (producto.id === '' && producto.NombreES === '' && producto.Precio === 0 && producto.quantity === 1 && producto.matches.length === 0) {
                  return; // Descartar el producto
                }
                if (productosMap[producto.NombreES]) {
                  productosMap[producto.NombreES].cantidad += parseFloat(producto.quantity);
                } else {
                  productosMap[producto.NombreES] = {
                    nombre: producto.NombreES,
                    cantidad: parseFloat(producto.quantity),
                  };
                }
              });
            }
          });

          const productosArray = Object.values(productosMap);
          setProductosVendidos(productosArray);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalProductosVendidos = productosVendidos.reduce((acc, producto) => acc + producto.cantidad, 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      {/* Resumen del Día */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-6 flex justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Resumen del Día
          </h2>
          <p className="text-lg text-gray-700">
            <span className="font-medium">Total Ingreso del Día (Pagado): </span>
            <span className="text-green-600 font-bold">{totalIngreso}$</span>
          </p>
          <p className="text-lg text-gray-700">
            <span className="font-medium">Total Tip del Día (Pagado): </span>
            <span className="text-blue-600 font-bold">{totalTip}$</span>
          </p>
          <p className="text-lg text-gray-700">
            <span className="font-medium">Total Productos Vendidos: </span>
            <span className="text-purple-600 font-bold">{totalProductosVendidos}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalles de Ventas */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Detalles de Ventas
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Cliente
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Cajero
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Total Ingreso
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Tip
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Pagado
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Fecha y Hora
                  </th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr
                    key={venta._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {venta.Cliente}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {venta.Cajero}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">
                      {venta.Total_Ingreso}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-blue-600 font-bold">
                      {venta.Tip}
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
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {new Date(venta.Date).toLocaleString("en-US", { timeZone: "America/Bogota" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Productos Vendidos */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
    </div>
  );
}

export default DiaResumen;
