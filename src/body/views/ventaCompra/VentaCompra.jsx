import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Mesa from "./Mesa";
import MesaBarra from "./MesaBarra";
import ClientForm from "./ClientForm";
import Gastos from "../../components/gastos/Gastos";
import { MENU, ITEMS, PRODUCCION, PROVEE, USER_PREFERENCES } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import MenuDelDiaPrint from "./MenuDelDiaPrint";
import Propina from "./Propina";
import { Button } from "@/components/ui/button";
import { Eye, UtensilsCrossed, UserPlus } from "lucide-react";

function VentaCompra() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [showGastos, setShowGastos] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);

  const fetchVentasDelDia = async () => {
    const fecha = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase.functions.invoke("DateFilter", {
      body: { fecha },
    });
    if (!error && data?.data?.items?.length) {
      setVentasDelDia(data.data.items);
    } else {
      setVentasDelDia([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROVEE)),
          dispatch(getAllFromTable(USER_PREFERENCES)),
        ]);
        await fetchVentasDelDia();
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

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

        <Button
          onClick={() => setShowClientForm(!showClientForm)}
          className={`gap-2 h-10 border-2 font-bold w-full sm:w-auto ${showClientForm ? 'bg-orange-100 border-orange-400 text-orange-800' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-800'}`}
        >
          <UserPlus size={18} />
          {showClientForm ? "Ocultar Registro" : "Nuevo Cliente"}
        </Button>
      </div>

      {/* --- Componentes Condicionales (Gastos y Menú) --- */}
      <div className="space-y-4 mb-2 shrink-0">
        {showMenu && <div className="bg-white rounded-lg shadow-md p-4"><MenuDelDiaPrint /></div>}
        {showGastos && <div className="bg-white rounded-lg shadow-md p-4"><Gastos /></div>}
        {showClientForm && <div className="animate-in slide-in-from-top-2 duration-300"><ClientForm onClose={() => setShowClientForm(false)} /></div>}
      </div>

      {/* --- Grid de Mesas --- */}
      <div className="flex-grow min-h-[600px]">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 h-full"
          style={{ gridAutoRows: 'minmax(0, 1fr)' }}
        >
          {[...Array(6)].map((_, index) => {
            const mesaIndex = index + 1;
            const ventaActual = ventasDelDia.find(v => v.Mesa === mesaIndex && !v.Pagado);
            return (
              <Mesa
                key={`mesa-${mesaIndex}`}
                index={mesaIndex}
                ventaActual={ventaActual}
                onVentaChange={fetchVentasDelDia}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VentaCompra;
