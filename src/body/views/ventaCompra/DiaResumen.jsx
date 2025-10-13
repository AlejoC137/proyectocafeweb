import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { COMPRAS, MENU, PROVEE, RECETAS_MENU } from "../../../redux/actions-types";
import { getAllFromTable, getRecepie, trimRecepie } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import { recetaMariaPaula } from "../../../redux/calcularReceta";
import DiaResumentStats from "./DiaResumentStats";
import { fetchAndProcessSales } from "./slicer"; // Import the function

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
  const [totalTarjeta, setTotalTarjeta] = useState(0);
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [totalTransferencia, setTotalTransferencia] = useState(0);
  
  
  
  const allMenu = useSelector((state) => state.allMenu);
  const allItems = useSelector((state) => state.allItems);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const allProduccion = useSelector((state) => state.allProduccion);
  const allCompras = useSelector((state) =>  state.allCompras); // Fetch Compras from Redux
  
  // console.log(allCompras);
  const handleDateChange = (e) => {
    const date = e.target.value;
    const dateList = date.split("-");

    // Remove leading zeros from month and day
    dateList[1] = dateList[1].replace(/^0+/, '');
    dateList[2] = dateList[2].replace(/^0+/, '');

    let formattedDate = `${dateList[1]}/${dateList[2]}/${dateList[0]}`;

    setHoy(formattedDate);
    // console.log(formattedDate); // Output: "2/3/2025"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(RECETAS_MENU)),
          dispatch(getAllFromTable(COMPRAS)),
        ]);

        // console.log("Compras from Redux:", allCompras); // Log Compras to console

        // const responce = await supabase
        const { data, error } = await supabase
          .from("Ventas")
          .select("*")
          .filter("Date", "eq", hoy)
          .order("Date", { ascending: true });

// console.log("Venta" , data[900].Date);
// console.log("Fencha" , hoy);
console.log(data);


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
          // console.log(ventasHoy);

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

          // Calculate total payments by method
          let tarjeta = 0;
          let efectivo = 0;
          let transferencia = 0;

          ventasHoy.forEach((venta) => {
            if (venta.Pago_Info) {
              let pagos;
              try {
                pagos = JSON.parse(venta.Pago_Info);
              } catch (e) {
                console.error("Error parsing Pago_Info:", e);
                return;
              }
              // console.log(pagos.metodo);

              // if (Array.isArray(pagos)) {
                // pagos.forEach((pago) => {
                  if (pagos.metodo === "Tarjeta") {
                    tarjeta += parseFloat(venta.Total_Ingreso || 0);
                  } if (pagos.metodo === "Efectivo") {
                    efectivo += parseFloat(venta.Total_Ingreso || 0);
                  }  
                  if (pagos.metodo === "Transferencia") {
             
                    
                    transferencia += parseFloat(venta.Total_Ingreso || 0);
                  }
                  // console.log(transferencia);
                  
               
                // });
              }
            // }
          });

          setTotalTarjeta(tarjeta);
          setTotalEfectivo(efectivo);
          setTotalTransferencia(transferencia);

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
  }, [ hoy]);
  // }, [ ]);

  useEffect(() => {

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

    calculateRecipeValues();
  }, []);

  const handleFetchSales = async () => {
    const processedSales = await fetchAndProcessSales(dispatch);
    console.log("Fetched and Processed Sales:", processedSales);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalProductosVendidos = productosVendidos.reduce((acc, producto) => acc + producto.cantidad, 0);

  productosVendidos.sort((a, b) => b.cantidad - a.cantidad);

  // Filter and sum the Valor fields from allCompras for today
  const totalCompras = allCompras
    .filter((compra) => compra.Date === hoy)
    .reduce((acc, compra) => acc + parseFloat(compra.Valor), 0);



    console.log(ventas);
    
  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      <div>
        <label htmlFor="date" className="block bg-white text-sm font-medium text-gray-700">Select Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          className=" bg-gray-500 mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          onChange={handleDateChange}
        />
        <p>Selected Date: {hoy}</p>
      </div>
      <DiaResumentStats
        ventasRecepies={productosVendidos}
        totalIngreso={totalIngreso}
        totalTip={totalTip}
        totalProductosVendidos={totalProductosVendidos}
        totalTarjeta={totalTarjeta}
        totalEfectivo={totalEfectivo}
        totalTransferencia={totalTransferencia}
        totalCompras={totalCompras}
      />
      {/* Resumen del Día */}
      {/* Removed inline rendering */}
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
      <button
        onClick={handleFetchSales}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Fetch and Process Sales
      </button>
    </div>
  );
}

export default DiaResumen;
