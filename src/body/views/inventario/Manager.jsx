import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups, toggleShowEdit } from "../../../redux/actions";
import { Comanda, Staff, Procedimientos, STAFF, MENU, ITEMS, PRODUCCION, PROVEE, PROCEDE, MenuItems, AGENDA } from "../../../redux/actions-types";
import AccionesRapidasActividades from "../actualizarPrecioUnitario/AccionesRapidasActividades";
// Vistas tipo grid (cards)
import { CardGridComanda } from "./gridInstance/CardGridComanda";
import { CardGridStaff } from "./gridInstance/CardGridStaff";
import { CardGridProcedimientos } from "./gridInstance/CardGridProcedimientos";
import { CardGridInventarioMenuLunch } from "@/components/ui/CardGridInventarioMenuLunch";
// Vista tipo Excel (tabla)


import { TableViewManager } from "@/components/ui/tableViewManager";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
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
import ComandaExcelView from "../actividades/WorkE/ComandaExcelView";
import ProcedimientoImportModal from "../ventaCompra/ProcedimientoImportModal";

function Manager() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(MenuItems);
  const [showAccionesRapidasActividades, setShowAccionesRapidasActividades] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' por defecto, como Inventario
  const [showProcedimientoImportModal, setShowProcedimientoImportModal] = useState(false);

  // Redux selectors
  const AllProcedimientos = useSelector((state) => state.allProcedimientos || []);
  const AllStaff = useSelector((state) => state.allStaff || []);
  const AllComanda = useSelector((state) => state.allComanda || []);
  const recetas = useSelector((state) => state.allRecetasMenu || []);
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
  }, [currentType, AllStaff, AllComanda, AllProcedimientos, Menu]);

  useEffect(() => {
    if (currentType === MenuItems) {
    }
  }, [currentType, filteredItems]);

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
      setCurrentType(type);
    }
  };

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  const handleToggleAccionesRapidasActividades = () => {
    setShowAccionesRapidasActividades((prev) => !prev);
  };

  const handleToggleViewMode = () => {
    setViewMode((prev) => prev === 'table' ? 'cards' : 'table');
  };

  // Categorías para CategoryNavBar
  const categories = [
    { type: MenuItems, label: "Menú", icon: "🗺️" },
    { type: Procedimientos, label: "Procedimientos", icon: "📝" },
    { type: Staff, label: "Staff", icon: "👩‍🚀" },
    { type: Comanda, label: "Comandas", icon: "🧹" },
    { type: AGENDA, label: "Eventos", icon: "📅" }
  ];

  const headerActions = (
    <CategoryNavBar
      categories={categories}
      currentType={currentType}
      onTypeChange={handleToggleType}
      showEdit={showEdit}
      onToggleEdit={handleToggleShowEdit}
      showActions={showAccionesRapidasActividades}
      onToggleActions={handleToggleAccionesRapidasActividades}
    />
  );

  // Render vista según el modo seleccionado
  const renderGrid = () => {
    if (viewMode === 'table') {
      // Vista tipo Excel (Tabla)


      return (
        <TableViewManager
          products={filteredItems}
          currentType={currentType}
        />
      );
    } else {
      // Vista tipo Cards (Grid original)
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

  // Get statistics for the current type
  const getTypeStats = () => {
    const total = filteredItems.length;
    const typeLabels = {
      [Staff]: "empleados",
      [Comanda]: "Comandas",
      [Procedimientos]: "procedimientos",
      [MenuItems]: "items del menú",
      [AGENDA]: "eventos"
    };

    return {
      total,
      label: typeLabels[currentType] || "elementos"
    };
  };

  const stats = getTypeStats();

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Bar Ultra Compacta */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <Settings size={18} className="text-blue-600" />
            Manager
          </h1>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          {/* Categorías integradas en el Top Bar en lugar de un navbar grande */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {categories.map(cat => (
              <button 
                key={cat.type}
                onClick={() => handleToggleType(cat.type)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${currentType === cat.type ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
              >
                {cat.icon} <span className="hidden xl:inline">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
             className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors shadow-sm border ${showEdit ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
           >
             <Settings size={14} /> <span className="hidden md:inline">{showEdit ? "Edición Activa" : "Modo Edición"}</span>
           </button>
        </div>
      </div>

      {/* Main Content Split - TV Dashboard Style */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel Izquierdo: Resumen y Estadísticas (28%) */}
        <div className="w-[28%] min-w-[320px] max-w-[400px] bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)]">
           <div className="bg-slate-800 text-white p-3 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-0.5">Dashboard</h2>
                <h2 className="text-sm font-black text-white uppercase tracking-wide leading-tight">
                   {categories.find(c => c.type === currentType)?.label || "Categoría"}
                </h2>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex justify-center items-center text-white">
                <BarChart3 size={16} />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-3 bg-slate-50/50">
             {/* Stats rápidas */}
             <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-slate-700">{filteredItems.length}</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 shadow-sm flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Activos</span>
                  <span className="text-2xl font-black text-blue-700">
                    {filteredItems.filter(i => i.Estado === "Activo" || i.Activo || !i.Terminado).length}
                  </span>
                </div>
             </div>

             {/* Acciones Rápidas del componente existente si está activado */}
             {showAccionesRapidasActividades && (
                <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm mt-2">
                   <h3 className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wider flex items-center gap-1"><Zap size={12}/> Acciones Rápidas</h3>
                   <AccionesRapidasActividades currentType={currentType} />
                </div>
             )}

             {/* Lista de recientes o resumen */}
             <div className="mt-2 flex-1">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 border-b border-slate-200 pb-1">Recientes</h3>
               <div className="flex flex-col gap-1">
                 {filteredItems.slice(0, 15).map((item, i) => (
                   <div key={item._id || i} className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-colors cursor-default">
                     <span className="text-xs font-semibold text-slate-700 truncate max-w-[70%]">{item.NombreES || item.Tittle || item.Nombre || "Item"}</span>
                     <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase truncate max-w-[25%]">
                       {item.Categoria || item.SUB_GRUPO || "Gral"}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        </div>

        {/* Panel Derecho: Contenido Principal */}
        <div className="flex-1 bg-slate-100 p-4 overflow-y-auto no-scrollbar flex flex-col relative">
           {viewMode === "cards" ? (
             filteredItems.length > 0 ? (
               <div className="w-full pb-10">
                 {renderGrid()}
               </div>
             ) : (
               <div className="m-auto flex flex-col items-center text-center text-slate-400 max-w-sm">
                 {currentType === Staff && <Users size={48} className="mb-4 opacity-50" />}
                 {currentType === Comanda && <Wrench size={48} className="mb-4 opacity-50" />}
                 {currentType === Procedimientos && <FileText size={48} className="mb-4 opacity-50" />}
                 {currentType === MenuItems && <UtensilsCrossed size={48} className="mb-4 opacity-50" />}
                 {currentType === AGENDA && <Calendar size={48} className="mb-4 opacity-50" />}
                 <p className="text-lg font-bold text-slate-600 mb-1">No hay {stats.label} disponibles</p>
                 <p className="text-xs">Selecciona otra categoría o agrega nuevos elementos para verlos aquí.</p>
               </div>
             )
           ) : (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
               <TableViewManager
                  products={filteredItems}
                  currentType={currentType}
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
