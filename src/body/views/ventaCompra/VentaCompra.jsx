import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Mesa from "./Mesa";
import MesaBarra from "./MesaBarra";
import Gastos from "../../components/gastos/Gastos";
import { MENU, ITEMS, PRODUCCION, PROVEE } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import MenuDelDiaPrint from "./MenuDelDiaPrint";
import Propina from "./Propina";
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
  const [errorVentas, setErrorVentas] = useState(false);

  // Carga las ventas activas (no pagadas) desde Supabase
  const fetchVentas = async () => {
    try {
      setErrorVentas(false); // Reset error state on new attempt
      const { data, error } = await supabase
        .from("Ventas")
        .select("*")
        .eq("Pagado", false);

      if (error) {
        console.error("Error fetching ventas:", error);
        setErrorVentas(true);
      } else {
        setVentas(data);
      }
    } catch (error) {
      console.error("Error cargando datos de ventas:", error);
      setErrorVentas(true);
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
      <div className="flex  items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
          <p className="text-lg font-semibold text-gray-700 mt-4">Cargando Datos...</p>
        </div>
      </div>
    );
  }

  // Renderizado del componente principal
  return (
    <div className="h-[calc(100dvh-5rem)] w-full bg-slate-100 overflow-y-auto p-2 flex flex-col">
      {/* --- Cabecera con Controles --- */}
      <div className="flex flex-wrap items-center gap-2 mb-2 mt-4 shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mr-auto w-full sm:w-auto">Gestión de Ventas</h1>

        <div className="w-full sm:w-auto">
          <Propina />
        </div>

        <Button
          onClick={() => setShowGastos(!showGastos)}
          className={`gap-2 h-10 border-2 font-bold w-full sm:w-auto ${showGastos ? 'bg-amber-100 border-amber-400 text-amber-800' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-800'}`}
        >
          <Eye size={18} />
          {showGastos ? "Ocultar Gastos" : "Mostrar Gastos"}
        </Button>

        <Button
          onClick={() => setShowMenu(!showMenu)}
          className={`gap-2 h-10 border-2 font-bold w-full sm:w-auto ${showMenu ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-800'}`}
        >
          <UtensilsCrossed size={18} />
          {showMenu ? "Ocultar Almuerzo" : "Mostrar Almuerzo"}
        </Button>
      </div>

      {/* --- Error Alert / Retry --- */}
      {errorVentas && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-2 shrink-0" role="alert">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-red-700">Error de Conexión</p>
              <p className="text-red-600">No se pudieron cargar las ventas activas.</p>
            </div>
            <Button onClick={fetchVentas} variant="destructive" size="sm">
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* --- Componentes Condicionales (Gastos y Menú) --- */}
      <div className="space-y-4 mb-2 shrink-0">
        {showMenu && <div className="bg-white rounded-lg shadow-md p-4"><MenuDelDiaPrint /></div>}
        {showGastos && <div className="bg-white rounded-lg shadow-md p-4"><Gastos /></div>}
      </div>

      {/* --- Contenido Principal (Grid de Mesas) --- */}
      <div className="flex-grow min-h-[600px]">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 h-full"
          style={{ gridAutoRows: 'minmax(0, 1fr)' }}
        >
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
  );
}

export default VentaCompra;
