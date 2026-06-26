import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const allMenu = useSelector((state) => state.allMenu || []);
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const Proveedores = useSelector((state) => state.Proveedores || []);
  const allUserPreferences = useSelector((state) => state.allUserPreferences || []);

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [ventasLargas, setVentasLargas] = useState([]);
  const [activeTab, setActiveTab] = useState("diarias");
  const [showGastos, setShowGastos] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);

  const fetchVentasDelDia = async (showSyncIndicator = false) => {
    if (showSyncIndicator === true) setIsSyncing(true);
    const currentDate = new Date();
    const ADate = currentDate.toLocaleDateString("en-US", { timeZone: "America/Bogota" });

    const { data, error } = await supabase
      .from("Ventas")
      .select("*")
      .eq("Pagado", false)
      .order("Time", { ascending: false });
      
    if (!error && data) {
      const diarias = data.filter(v => Number(v.Mesa) < 100 && v.Date === ADate);
      const largas = data.filter(v => Number(v.Mesa) >= 100);
      setVentasDelDia(diarias);
      setVentasLargas(largas);
    } else {
      if (error) console.error("Error al obtener ventas activas:", error);
      setVentasDelDia([]);
      setVentasLargas([]);
    }
    if (showSyncIndicator === true) setIsSyncing(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const promises = [];
        if (allMenu.length === 0) promises.push(dispatch(getAllFromTable(MENU)));
        if (allItems.length === 0) promises.push(dispatch(getAllFromTable(ITEMS)));
        if (allProduccion.length === 0) promises.push(dispatch(getAllFromTable(PRODUCCION)));
        if (Proveedores.length === 0) promises.push(dispatch(getAllFromTable(PROVEE)));
        if (allUserPreferences.length === 0) promises.push(dispatch(getAllFromTable(USER_PREFERENCES)));
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
        await fetchVentasDelDia();
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* --- Pestañas --- */}
      <div className="flex border-b border-slate-200 mb-2 shrink-0">
        <button
          onClick={() => setActiveTab("diarias")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "diarias" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          Mesas Diarias
        </button>
        <button
          onClick={() => setActiveTab("largas")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "largas" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          Cuentas Largas
        </button>
      </div>

      {/* --- Grid de Mesas --- */}
      <div className="flex-grow min-h-[600px] relative">
        {isSyncing && (
          <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-lg">
            <div className="text-center bg-white p-4 rounded-xl shadow-lg border border-slate-200">
              <div className="h-10 w-10 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
              <p className="text-sm font-bold text-slate-700 mt-3">Sincronizando Comandas...</p>
            </div>
          </div>
        )}
        {activeTab === "diarias" ? (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 h-full ${isSyncing ? 'opacity-60 pointer-events-none' : ''}`}
            style={{ gridAutoRows: 'minmax(0, 1fr)' }}
          >
            {[...Array(6)].map((_, index) => {
              const mesaIndex = index + 1;
              const ventaActual = ventasDelDia.find(v => Number(v.Mesa) === mesaIndex && !v.Pagado);
              return (
                <Mesa
                  key={`mesa-${mesaIndex}`}
                  index={mesaIndex}
                  ventaActual={ventaActual}
                  onVentaChange={() => fetchVentasDelDia(true)}
                />
              );
            })}
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 h-full ${isSyncing ? 'opacity-60 pointer-events-none' : ''}`}
            style={{ gridAutoRows: 'minmax(0, 1fr)' }}
          >
            {ventasLargas.map((ventaActual) => (
              <Mesa
                key={`mesa-larga-${ventaActual.Mesa}`}
                index={Number(ventaActual.Mesa)}
                ventaActual={ventaActual}
                onVentaChange={() => fetchVentasDelDia(true)}
              />
            ))}
            {/* Always show one empty slot for a new cuenta larga */}
            <Mesa
              key={`mesa-larga-new`}
              index={ventasLargas.length > 0 ? Math.max(...ventasLargas.map(v => Number(v.Mesa))) + 1 : 101}
              ventaActual={null}
              onVentaChange={() => fetchVentasDelDia(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default VentaCompra;
