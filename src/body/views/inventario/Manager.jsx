import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups, toggleShowEdit, updateViewPreference } from "../../../redux/actions";
import { Comanda, Staff, Procedimientos, STAFF, MENU, ITEMS, PRODUCCION, PROVEE, PROCEDE, MenuItems, AGENDA, RECETAS_MENU, RECETAS_PRODUCCION } from "../../../redux/actions-types";
import AccionesRapidasActividades from "../actualizarPrecioUnitario/AccionesRapidasActividades";
// Vistas tipo grid (cards)
import { CardGridComanda } from "./gridInstance/CardGridComanda";
import { CardGridStaff } from "./gridInstance/CardGridStaff";
import { CardGridProcedimientos } from "./gridInstance/CardGridProcedimientos";
import { CardGridInventarioMenuLunch } from "@/components/ui/CardGridInventarioMenuLunch";
// Vista tipo Excel (tabla)
import { TableViewManager } from "@/components/ui/tableViewManager";
import CategoryNavBar from "../../../components/ui/category-nav-bar";
import { ViewToggle } from "@/components/ui/viewToggle";
import {
  UtensilsCrossed,
  FileText,
  Users,
  Wrench,
  Settings,
  Zap,
  BarChart3,
  Calendar
} from "lucide-react";
import ProcedimientoImportModal from "../ventaCompra/ProcedimientoImportModal";

function Manager() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const getTabType = (tabParam) => {
    switch (tabParam?.toLowerCase()) {
      case 'procedimientos': return Procedimientos;
      case 'staff': return Staff;
      case 'comandas': return Comanda;
      case 'eventos': return AGENDA;
      case 'menu':
      default: return MenuItems;
    }
  };

  const [currentType, setCurrentType] = useState(getTabType(tab));

  useEffect(() => {
    setCurrentType(getTabType(tab));
  }, [tab]);

  const [showAccionesRapidasActividades, setShowAccionesRapidasActividades] = useState(false);
  const [showProcedimientoImportModal, setShowProcedimientoImportModal] = useState(false);

  // Sync viewMode preference with Redux like Inventario view
  const currentStaff = useSelector((state) => state.currentStaff);
  const viewPreferences = useSelector((state) => state.viewPreferences || {});
  const managerPrefs = viewPreferences.manager || {};
  const [viewMode, setViewModeState] = useState(managerPrefs.viewMode || 'cards');

  useEffect(() => {
    if (managerPrefs.viewMode && managerPrefs.viewMode !== viewMode) {
      setViewModeState(managerPrefs.viewMode);
    }
  }, [managerPrefs.viewMode]);

  const setViewMode = (mode) => {
    setViewModeState(mode);
    if (currentStaff?._id) {
      dispatch(updateViewPreference(currentStaff._id, "manager", { viewMode: mode }));
    }
  };

  // Redux selectors
  const AllProcedimientos = useSelector((state) => state.allProcedimientos || []);
  const AllStaff = useSelector((state) => state.allStaff || []);
  const AllComanda = useSelector((state) => state.allComanda || []);
  const recetasMenu = useSelector((state) => state.allRecetasMenu || []);
  const recetasProduccion = useSelector((state) => state.allRecetasProduccion || []);
  const showEdit = useSelector((state) => state.showEdit);
  const Menu = useSelector((state) => state.allMenu || []);
  const allAgenda = useSelector((state) => state.allAgenda || []);

  // Memoize filtered items to prevent recalculation on every render
  const filteredItems = useMemo(() => {
    const items = {
      [Staff]: AllStaff,
      [Comanda]: AllComanda,
      [Procedimientos]: AllProcedimientos,
      [MenuItems]: Menu,
      [AGENDA]: allAgenda,
    }[currentType];

    return Array.isArray(items) ? items : [];
  }, [currentType, AllStaff, AllComanda, AllProcedimientos, Menu, allAgenda]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(PROVEE)),
          dispatch(getAllFromTable(Comanda)),
          dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROCEDE)),
          dispatch(getAllFromTable(AGENDA)),
          dispatch(getAllFromTable(RECETAS_MENU)),
          dispatch(getAllFromTable(RECETAS_PRODUCCION)),
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleToggleType = (type) => {
    if (currentType === type) {
      dispatch(resetExpandedGroups());
    } else {
      let tabStr = 'menu';
      if (type === Procedimientos) tabStr = 'procedimientos';
      else if (type === Staff) tabStr = 'staff';
      else if (type === Comanda) tabStr = 'comandas';
      else if (type === AGENDA) tabStr = 'eventos';
      navigate(`/Manager/${tabStr}`);
    }
  };

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  const handleToggleAccionesRapidasActividades = () => {
    setShowAccionesRapidasActividades((prev) => !prev);
  };

  // Categorías para CategoryNavBar
  const categories = [
    { type: MenuItems, label: "Menú", icon: "🗺️" },
    { type: Procedimientos, label: "Procedimientos", icon: "📝" },
    { type: Staff, label: "Staff", icon: "👩‍🚀" },
    { type: Comanda, label: "Comandas", icon: "🧹" },
    { type: AGENDA, label: "Eventos", icon: "📅" }
  ];

  // Render vista según el modo seleccionado
  const renderGrid = () => {
    if (viewMode === 'table') {
      return (
        <TableViewManager
          products={filteredItems}
          currentType={currentType}
          recetasMenu={recetasMenu}
          recetasProduccion={recetasProduccion}
        />
      );
    } else {
      switch (currentType) {
        case Comanda:
          return <CardGridComanda currentType={currentType} />;
        case Staff:
          return <CardGridStaff currentType={currentType} />;
        case MenuItems:
          return (
            <CardGridInventarioMenuLunch
              products={filteredItems}
              showEdit={showEdit}
            />
          );
        case Procedimientos:
        default:
          return <CardGridProcedimientos currentType={currentType} />;
      }
    }
  };

  // Statistics calculation for the current type
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const typeLabels = {
      [Staff]: "empleados",
      [Comanda]: "comandas",
      [Procedimientos]: "procedimientos",
      [MenuItems]: "ítems del menú",
      [AGENDA]: "eventos"
    };

    const activeCount = filteredItems.filter(
      i => i.Estado === "Activo" || i.Activo || (i.Terminado === false) || i.estado === "Activo"
    ).length;

    return {
      total,
      activeCount,
      label: typeLabels[currentType] || "elementos"
    };
  }, [filteredItems, currentType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center text-slate-700 text-lg font-medium">Cargando datos del Manager...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] bg-slate-100 font-sans overflow-hidden min-h-0">
      {/* Top Bar Ultra Compacta */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto custom-scrollbar py-0.5">
          <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-tight uppercase flex items-center gap-1.5 shrink-0">
            <Settings size={18} className="text-blue-600" />
            Manager
          </h1>
          <div className="h-6 w-px bg-slate-200 mx-0.5 shrink-0 hidden sm:block"></div>
          {/* Categorías en el Top Bar */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            {categories.map(cat => (
              <button
                key={cat.type}
                onClick={() => handleToggleType(cat.type)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  currentType === cat.type 
                    ? "bg-white text-blue-700 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <span>{cat.icon}</span> 
                <span className="inline">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          {currentType === Procedimientos && (
            <button
              onClick={() => setShowProcedimientoImportModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              📥 <span className="hidden sm:inline">Importar JSON</span>
            </button>
          )}
          <button
            onClick={handleToggleShowEdit}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors shadow-sm border ${
              showEdit 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Settings size={14} /> 
            <span className="hidden sm:inline">{showEdit ? "Edición Activa" : "Modo Edición"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Split - Responsive Dashboard & Content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        {/* Panel Izquierdo: Resumen y Estadísticas */}
        <div className="w-full lg:w-[28%] lg:min-w-[300px] lg:max-w-[380px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col z-10 shadow-sm shrink-0 max-h-[30vh] lg:max-h-none min-h-0">
          <div className="bg-slate-800 text-white p-2.5 sm:p-3 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-0.5">Dashboard</h2>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide leading-tight">
                {categories.find(c => c.type === currentType)?.label || "Categoría"}
              </h2>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-700 flex justify-center items-center text-white shrink-0">
              <BarChart3 size={16} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3 bg-slate-50/50 min-h-0">
            {/* Stats rápidas */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-xl sm:text-2xl font-black text-slate-700">{stats.total}</span>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 shadow-sm flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Activos</span>
                <span className="text-xl sm:text-2xl font-black text-blue-700">{stats.activeCount}</span>
              </div>
            </div>

            {/* Acciones Rápidas */}
            {showAccionesRapidasActividades && (
              <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm mt-1 shrink-0">
                <h3 className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <Zap size={12}/> Acciones Rápidas
                </h3>
                <AccionesRapidasActividades currentType={currentType} />
              </div>
            )}

            {/* Lista de recientes o resumen */}
            <div className="mt-1 flex-1 flex flex-col min-h-0">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 border-b border-slate-200 pb-1 shrink-0">
                Recientes ({stats.label})
              </h3>
              <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1">
                {filteredItems.slice(0, 20).map((item, i) => (
                  <div key={item._id || i} className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex justify-between items-center hover:border-blue-300 transition-colors cursor-default">
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[70%]">
                      {item.NombreES || item.Tittle || item.tittle || item.Nombre || item.nombreES || "Item sin nombre"}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase truncate max-w-[28%]">
                      {item.Categoria || item.SUB_GRUPO || item.Cargo || "Gral"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Contenido Principal con Scroll Apto */}
        <div className="flex-1 bg-slate-100 p-3 sm:p-4 overflow-y-auto custom-scrollbar flex flex-col relative min-h-0">
          {viewMode === "cards" ? (
            filteredItems.length > 0 ? (
              <div className="w-full pb-8">
                {renderGrid()}
              </div>
            ) : (
              <div className="m-auto flex flex-col items-center text-center text-slate-400 max-w-sm py-12">
                {currentType === Staff && <Users size={48} className="mb-4 opacity-50" />}
                {currentType === Comanda && <Wrench size={48} className="mb-4 opacity-50" />}
                {currentType === Procedimientos && <FileText size={48} className="mb-4 opacity-50" />}
                {currentType === MenuItems && <UtensilsCrossed size={48} className="mb-4 opacity-50" />}
                {currentType === AGENDA && <Calendar size={48} className="mb-4 opacity-50" />}
                <p className="text-base sm:text-lg font-bold text-slate-600 mb-1">No hay {stats.label} disponibles</p>
                <p className="text-xs text-slate-400">Selecciona otra categoría o agrega nuevos elementos para verlos aquí.</p>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
              <TableViewManager
                products={filteredItems}
                currentType={currentType}
                recetasMenu={recetasMenu}
                recetasProduccion={recetasProduccion}
              />
            </div>
          )}
        </div>
      </div>

      {showProcedimientoImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 py-8 overflow-hidden">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-full">
            <ProcedimientoImportModal
              onClose={() => setShowProcedimientoImportModal(false)}
              onSuccess={() => {
                dispatch(getAllFromTable(PROCEDE));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Manager;
