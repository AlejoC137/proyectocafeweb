import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { COMPRAS, ITEMS, MENU, RECETAS_MENU , PRODUCCION } from "../../../redux/actions-types";
import { getAllFromTable, getRecepie, trimRecepie } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import { recetaMariaPaula } from "../../../redux/calcularReceta";
import MesResumenStats from "./MesResumenStats";
import { fetchAndProcessSales } from "./slicer"; // Import the function
import Predict from "./Predict"; // Asegúrate que la ruta de importación sea correcta

function MesResumen() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [productosRecetasHoy, setProductosRecetasHoy] = useState([]);
  const [totalIngreso, setTotalIngreso] = useState(0);
  const [totalTip, setTotalTip] = useState(0);
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [hoy, setHoy] = useState(new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD para el input date
  const [totalTarjeta, setTotalTarjeta] = useState(0);
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [totalTransferencia, setTotalTransferencia] = useState(0);

  // --- ESTADO PARA EL MODAL/COMPONENTE PREDICT ---
  // 1. Añadimos los estados para controlar la visibilidad del componente Predict y el item seleccionado.
  const [showPredict, setShowPredict] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const allMenu = useSelector((state) => state.allMenu);
  const allItems = useSelector((state) => state.allItems);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const allProduccion = useSelector((state) => state.allProduccion);
  const allCompras = useSelector((state) => state.Compras);

  // 2. Actualizamos la lógica del handler para que actualice el estado.
  const handleRecetaClick = (item) => {
 
    setSelectedItem(item); // Guarda el producto en el que se hizo clic
    setShowPredict(true);  // Activa la visualización del componente Predict
  };
  
  const handleClosePredict = () => {
    setShowPredict(false); // Cierra el componente Predict
    setSelectedItem(null); // Limpia el item seleccionado
  };

  const handleDateChange = (e) => {
    const date = e.target.value; // El valor ya está en formato YYYY-MM-DD
    setHoy(date);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(RECETAS_MENU)),
          dispatch(getAllFromTable(COMPRAS)),
        ]);

        const { data, error } = await supabase
          .from('Ventas')
          .select('*')
          .order('Date', { ascending: false });

        if (error) {
          throw error;
        }

        // 3. Lógica de filtrado de fecha mejorada.
        // const selectedDate = new Date(hoy);
        // Ajustamos la fecha para evitar problemas de zona horaria al comparar
        selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();

        const ventasMES = data.filter((venta) => {
          const ventaDate = new Date(venta.Date);
          return ventaDate.getMonth() === selectedMonth && ventaDate.getFullYear() === selectedYear;
        });

        // Ordenar las ventas por fecha y hora
        ventasMES.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        setVentas(ventasMES);

        // Calcular ingresos, tips y pagos
        let total = 0;
        let tipTotal = 0;
        let tarjeta = 0;
        let efectivo = 0;
        let transferencia = 0;
        const productosMap = {};

    ventasMES.forEach((venta) => {
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
        console.error("Error parsing Pago_Info:", e);
      }
    }
  }
  
  if (venta.Productos) {
    try {
      const productos = JSON.parse(venta.Productos);
      productos.forEach((producto) => {
        if (!producto.NombreES) return; // Ignorar si no hay nombre

        if (productosMap[producto.NombreES]) {
          productosMap[producto.NombreES].cantidad += parseFloat(producto.quantity || 0);
        } else {
          // --- LÓGICA MODIFICADA AQUÍ ---

          // 1. Inicia con el ID de receta de la venta, si es que existe.
          let recetaIdDefinitiva = producto.Receta || null;

          // 2. Si no se encontró un ID en la venta, busca en 'allMenu' como respaldo.
          if (!recetaIdDefinitiva) {
            const menuItem = allMenu.find(menu => menu.NombreES === producto.NombreES);
            
            // 3. Si se encuentra el producto en el menú y tiene una receta, úsala.
            if (menuItem && menuItem.Receta) {
              recetaIdDefinitiva = menuItem.Receta;
            }
          }

          // 4. Crea el nuevo producto en el mapa con el ID de receta final.
          productosMap[producto.NombreES] = {
            nombre: producto.NombreES,
            cantidad: parseFloat(producto.quantity || 0),
            // Usa el ID encontrado o "N/A" si sigue sin existir.
            recetaId: recetaIdDefinitiva || "N/A", 
            recetaValor: 0,
            ingredientes: []
          };
        }
      });
    } catch (e) {
        console.error("Error parsing Productos:", e);
    }
  }
});

        setTotalIngreso(total);
        setTotalTip(tipTotal);
        setTotalTarjeta(tarjeta);
        setTotalEfectivo(efectivo);
        setTotalTransferencia(transferencia);

        const productosArray = Object.values(productosMap);
        productosArray.sort((a, b) => b.cantidad - a.cantidad);
        setProductosVendidos(productosArray);

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hoy, dispatch]); // Se agrega dispatch al array de dependencias

  // 4. Se corrige el array de dependencias para este useEffect.
  // Ahora se ejecutará cada vez que 'productosVendidos' se actualice.
  useEffect(() => {
    if (productosVendidos.length === 0 || !allItems.length || !allMenu.length) {
      return; // No hacer nada si no hay datos necesarios.
    }

    const calculateRecipeValues = async () => {
      const updatedProductosVendidos = await Promise.all(
        productosVendidos.map(async (producto) => {
          if (producto.recetaId !== "N/A") {
            const menuItem = allMenu.find((item) => item.uuid_receta === producto.recetaId);
            if (menuItem) {
              try {
                const recetaData = await getRecepie(menuItem.uuid_receta, "Recetas");
                const trimmedRecepie = trimRecepie([...allItems, ...allProduccion], recetaData);
                const receta = recetaMariaPaula(trimmedRecepie, menuItem.currentType, menuItem.id, menuItem.source);
                return { ...producto, recetaValor: receta.consolidado, ingredientes: trimmedRecepie };
              } catch (error) {
                console.error(`Error processing recipe for ${producto.nombre}:`, error);
              }
            }
          }
          return producto;
        })
      );
      setProductosVendidos(updatedProductosVendidos);
    };

    calculateRecipeValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMenu, allItems, allProduccion]); // Se ejecuta cuando los datos de Redux o los productos vendidos cambien.


  const handleFetchSales = async () => {
    const processedSales = await fetchAndProcessSales(dispatch);
    console.log("Fetched and Processed Sales:", processedSales);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  const totalProductosVendidos = productosVendidos.reduce((acc, producto) => acc + producto.cantidad, 0);

  // Se filtra por el mes actual, igual que las ventas.
  const selectedDate = new Date(hoy);
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  const totalCompras = allCompras
    .filter((compra) => {
        const compraDate = new Date(compra.Date);
        return compraDate.getMonth() === selectedMonth && compraDate.getFullYear() === selectedYear;
    })
    .reduce((acc, compra) => acc + parseFloat(compra.Valor || 0), 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      <div>
        <label htmlFor="date" className="block bg-white text-sm font-medium text-gray-700">Select Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          value={hoy} // Controlar el valor del input
          className="bg-gray-500 mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          onChange={handleDateChange}
        />
        <p>Selected Date: {new Date(hoy).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</p>
      </div>
      
      {/* Componente de estadísticas descomentado */}
      <MesResumenStats
        ventasRecepies={productosVendidos}
        totalIngreso={totalIngreso}
        totalTip={totalTip}
        totalProductosVendidos={totalProductosVendidos}
        totalTarjeta={totalTarjeta}
        totalEfectivo={totalEfectivo}
        totalTransferencia={totalTransferencia}
        totalCompras={totalCompras}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Detalles de Ventas */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalles de Ventas del Mes</h3>
          <div className="overflow-x-auto max-h-96"> {/* Se agrega max-h-96 para scroll */}
            <table className="min-w-full border-collapse border border-gray-200">
                {/* ... Thead ... */}
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
                      {venta.Pago_Info && (() => {
                        try {
                          const pagos = JSON.parse(venta.Pago_Info);
                          return pagos.metodo || 'N/A';
                        } catch (e) { return 'Error'; }
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
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Productos Vendidos en el Mes</h3>
          <div className="overflow-x-auto max-h-96"> {/* Se agrega max-h-96 para scroll */}
            <table className="min-w-full border-collapse border border-gray-200">
               {/* ... Thead ... */}
               <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Producto</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Cantidad Vendida</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Acción</th>
                  </tr>
                </thead>
              <tbody>
                {productosVendidos.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 border-b text-sm text-gray-700">{producto.nombre}</td>
                    <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">{producto.cantidad}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <button
                        onClick={() => handleRecetaClick(producto)}
                        className="bg-yellow-500 text-white text-sm w-[30px] rounded"
                        title="Ver predicción y receta"
                      >
                        📕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* 5. Renderizado condicional del componente Predict. */}
      {/* Se muestra como un overlay/modal cuando showPredict es true. */}
      {showPredict && selectedItem && (
        <Predict item={selectedItem} onClose={handleClosePredict} />
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