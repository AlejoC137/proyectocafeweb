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
          .select("*");

        if (error) {
          console.error("Error fetching ventas:", error);
        } else {
          setVentas(data);

          // Calcular ingresos y tips totales
          const total = data
            .filter((venta) => venta.Pagado === true)
            .reduce((acc, venta) => acc + parseFloat(venta.Total_Ingreso || 0), 0);
          setTotalIngreso(total);

          const totalTip = data
            .filter((venta) => venta.Pagado === true)
            .reduce((acc, venta) => acc + parseFloat(venta.Tip || 0), 0);
          setTotalTip(totalTip);

          // Calcular productos vendidos
          const productosMap = {};
          data.forEach((venta) => {
            if (venta.Productos) {
              const productos = JSON.parse(venta.Productos); // Suponiendo que Productos es un JSON
              productos.forEach((producto) => {
                if (productosMap[producto.NombreES]) {
                  productosMap[producto.NombreES] += producto.quantity;
                } else {
                  productosMap[producto.NombreES] = producto.quantity;
                }
              });
            }
          });

          const productosArray = Object.entries(productosMap).map(([nombre, cantidad]) => ({
            nombre,
            cantidad,
          }));
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Resumen del Día */}
      <div className="p-6 bg-white rounded-lg shadow-md">
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
      </div>

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
                        venta.Pagado
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {venta.Pagado ? "Sí" : "No"}
                    </span>
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
  );
}

export default DiaResumen;
