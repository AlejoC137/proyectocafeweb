import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Mesa from "./Mesa";
import MesaBarra from "./MesaBarra";
import Gastos from "../../components/gastos/Gastos";
import { MENU, ITEMS, PRODUCCION, PROVEE } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import MenuDelDiaPrint from "./MenuDelDiaPrint";
import { Button } from "@/components/ui/button"; // Importamos el botón para consistencia
import { Eye, UtensilsCrossed } from "lucide-react"; // Iconos para los botones

/**
 * Componente principal para la gestión de ventas, con un diseño modernizado.
 * Organiza las mesas y la barra, y permite alternar la visibilidad de
 * los gastos y el menú del día.
 */
function VentaCompra() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [showGastos, setShowGastos] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Carga las ventas activas (no pagadas) desde Supabase
  const fetchVentas = async () => {
    try {
      const { data, error } = await supabase
        .from("Ventas")
        .select("*")
        .eq("Pagado", false);

      if (error) {
        console.error("Error fetching ventas:", error);
        alert("No se pudieron cargar las ventas activas.");
      } else {
        setVentas(data);
      }
    } catch (error) {
      console.error("Error cargando datos de ventas:", error);
      alert("Ocurrió un error al cargar los datos de ventas.");
    }
  };

  // Efecto inicial para cargar todos los datos necesarios para la aplicación
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargamos datos maestros en paralelo
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROVEE)),
        ]);
        // Una vez cargados los datos maestros, cargamos las ventas
        await fetchVentas();
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Si está cargando, muestra un mensaje
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
          <p className="text-lg font-semibold text-gray-700 mt-4">Cargando Datos...</p>
        </div>
      </div>
    );
  }

  // Renderizado del componente principal
  return (
    <div className="h-[calc(100vh-5rem)] w-screen  bg-slate-100 dark:bg-slate-900 overflow-auto p-4 md:p-6">
      <div className="max-w-screen-2xl mx-auto">
        {/* --- Cabecera con Controles --- */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mr-auto">Gestión de Ventas</h1>
          <Button onClick={() => setShowGastos(!showGastos)} variant="outline" className="gap-2">
            <Eye size={16} />
            {showGastos ? "Ocultar Gastos" : "Mostrar Gastos"}
          </Button>
          <Button onClick={() => setShowMenu(!showMenu)} variant="outline" className="gap-2">
             <UtensilsCrossed size={16} />
            {showMenu ? "Ocultar Almuerzo" : "Mostrar Almuerzo"}
          </Button>
        </div>

        {/* --- Componentes Condicionales (Gastos y Menú) --- */}
        <div className="space-y-4 mb-6">
          {showMenu && <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4"><MenuDelDiaPrint /></div>}
          {showGastos && <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4"><Gastos /></div>}
        </div>

        {/* --- Contenido Principal (Barra y Mesas) --- */}
        <div className="space-y-6">
          {/* Componente para la Barra */}
          <MesaBarra
            key="mesa-barra"
            index={0} // '0' para identificar que es la barra
            ventas={ventas}
            reloadVentas={fetchVentas}
          />

          {/* Grid responsivo para las Mesas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => {
              const mesaIndex = index + 1;
              const ventaParaMesa = ventas.find(venta => venta.Mesa === mesaIndex && !venta.Pagado);
              return (
                <Mesa
                  key={`mesa-${mesaIndex}`}
                  index={mesaIndex}
                  ventaActual={ventaParaMesa}
                  onVentaChange={fetchVentas}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VentaCompra;
