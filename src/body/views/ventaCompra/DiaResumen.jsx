import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MENU, RECETAS_MENU } from "../../../redux/actions-types";
import { getAllFromTable, getRecepie, trimRecepie } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import { recetaMariaPaula } from "../../../redux/calcularReceta";
import DiaResumentStats from "./DiaResumentStats";

function DiaResumen() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [productosRecetasHoy, setProductosRecetasHoy] = useState([]);
  const [totalIngreso, setTotalIngreso] = useState(0);
  const [totalTip, setTotalTip] = useState(0);
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [hoy, setHoy] = useState(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }).split(",")[0]);
  const allMenu = useSelector((state) => state.allMenu);
  const allItems = useSelector((state) => state.allItems);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const allProduccion = useSelector((state) => state.allProduccion);

  const handleDateChange = (e) => {
    const date = e.target.value
    const dateList = date.split("-")

    let formattedDate = `${dateList[1]}/${dateList[2]}/${dateList[0]}`;
    
    if (formattedDate[0] === '0') {
      formattedDate = formattedDate.slice(1);
    }

    setHoy(formattedDate)
    console.log(formattedDate); // Output: "01/16/2025"
    


new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }).split(",")[0]

    setHoy(formattedDate);
    // console.log(formattedDate);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(RECETAS_MENU)),
        ]);

        const { data, error } = await supabase
          .from("Ventas")
          .select("*")
          .order("Date", { ascending: true });

        if (error) {
          console.error("Error fetching ventas:", error);
        } else {
          const productosRecetas = [];

          data.forEach((venta) => {
            if (venta.Productos) {
              const productos = JSON.parse(venta.Productos);
              productos.forEach((producto) => {
                if (producto.Receta) {
                  productosRecetas.push(producto.Receta);
                }
              });
            }
          });

          const ventasHoy = data.filter((venta) => venta.Date.split(",")[0] === hoy );

          // Ordenar las ventas por fecha y hora
          ventasHoy.sort((a, b) => new Date(a.Date) - new Date(b.Date));

          setVentas(ventasHoy);
          setProductosRecetasHoy(productosRecetas);

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
          const recetasMap = {};
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
                    recetaId: producto.Receta || "N/A",
                    recetaValor: 0,
                    ingredientes: []
                  };
                }
                if (producto.Receta) {
                  if (recetasMap[producto.Receta]) {
                    recetasMap[producto.Receta].cantidad += parseFloat(producto.quantity);
                  } else {
                    recetasMap[producto.Receta] = {
                      receta: producto.Receta,
                      cantidad: parseFloat(producto.quantity),
                    };
                  }
                }
              });
            }
          });

          const productosArray = Object.values(productosMap);
          setProductosVendidos(productosArray);

          const recetasArray = Object.values(recetasMap);
          setRecetas(recetasArray);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };





    fetchData();
    const calculateRecipeValues = async () => {
      const updatedProductosVendidos = await Promise.all(productosVendidos.map(async (producto) => {
        if (producto.recetaId !== "N/A") {
          const menuItem = allMenu.find((item) => item.uuid_receta === producto.recetaId);
          if (menuItem) {
            const recetaData = await getRecepie(menuItem.uuid_receta, "Recetas");
            const trimmedRecepie = trimRecepie([...allItems, ...allProduccion], recetaData);
            const receta = recetaMariaPaula(trimmedRecepie, menuItem.currentType, menuItem.id, menuItem.source);
            return { ...producto, recetaValor: receta.consolidado, ingredientes: trimmedRecepie };
          }
        }
        return producto;
      }));
      setProductosVendidos(updatedProductosVendidos);
    };

    // if (productosVendidos.length > 0 && allMenu.length > 0) {
      calculateRecipeValues();
    // }

  }, [dispatch, hoy]);

  // useEffect(() => {

  // }, [allMenu, productosVendidos, allItems, allProduccion ]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalProductosVendidos = productosVendidos.reduce((acc, producto) => acc + producto.cantidad, 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      <div>
        <label htmlFor="date" className="block bg-white text-sm font-medium text-gray-700">Select Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          className="bg-white mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          onChange={handleDateChange}
        />
        <p>Selected Date: {hoy}</p>
      </div>
      <DiaResumentStats ventasRecepies={productosVendidos} />
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
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    ID Receta
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Valor Receta
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Ingredientes
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
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {producto.recetaId}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {producto.recetaValor}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {producto.ingredientes.map((ingrediente, i) => (
                        <div key={i}>
                          {ingrediente.name}: {ingrediente.cuantity} {ingrediente.units}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recetas Vendidas */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Recetas Vendidas
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Receta
                  </th>
                  <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                    Cantidad Vendida
                  </th>
                </tr>
              </thead>
              <tbody>
                {recetas.map((receta, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 border-b text-sm text-gray-700">
                      {receta.receta}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">
                      {receta.cantidad}
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