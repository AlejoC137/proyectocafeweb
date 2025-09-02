import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups, toggleShowEdit } from "../../../redux/actions";
import {WORKISUE, Staff, WorkIsue, Procedimientos, STAFF, MENU, ITEMS, PRODUCCION, PROVEE, PROCEDE, MenuItems } from "../../../redux/actions-types";
import AccionesRapidasActividades from "../actualizarPrecioUnitario/AccionesRapidasActividades";
import { CardGridWorkIsue } from "./gridInstance/CardGridWorkIsue";
import { CardGridStaff } from "./gridInstance/CardGridStaff";
import { CardGridProcedimientos } from "./gridInstance/CardGridProcedimientos";
import { CardGridInventarioMenu } from "@/components/ui/cardGridInventarioMenu";
import { CardGridInventarioMenuLunch } from "@/components/ui/CardGridInventarioMenuLunch";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import CategoryNavBar from "../../../components/ui/category-nav-bar";
import { Button } from "@/components/ui/button";
import { 
  UtensilsCrossed, 
  FileText, 
  Users, 
  Wrench, 
  Settings, 
  Zap,
  BarChart3 
} from "lucide-react";

function Manager() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(Staff);
  const [showAccionesRapidasActividades, setShowAccionesRapidasActividades] = useState(false);

  // Redux selectors
  const AllProcedimientos = useSelector((state) => state.allProcedimientos || []);
  const AllStaff = useSelector((state) => state.allStaff || []);
  const AllWorkIsue = useSelector((state) => state.allWorkIsue || []);
  const recetas = useSelector((state) => state.allRecetasMenu || []);
  const showEdit = useSelector((state) => state.showEdit);
  const Menu = useSelector((state) => state.allMenu || []);

  // Memoize filtered items to prevent recalculation on every render
  const filteredItems = useMemo(() => {
    const items = {
      [Staff]: AllStaff,
      [WorkIsue]: AllWorkIsue,
      [Procedimientos]: AllProcedimientos,
      [MenuItems]: Menu,
    }[currentType];
    
    return Array.isArray(items) ? items : [];
  }, [currentType, AllStaff, AllWorkIsue, AllProcedimientos, Menu]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(PROVEE)),
          dispatch(getAllFromTable(WORKISUE)),
          dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROCEDE)),

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

  // Categorías para CategoryNavBar
  const categories = [
    { type: MenuItems, label: "Menú", icon: "🗺️" },
    { type: Procedimientos, label: "Procedimientos", icon: "📝" },
    { type: Staff, label: "Staff", icon: "👩‍🚀" },
    { type: WorkIsue, label: "Work Issues", icon: "🧹" }
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

  // Function to render appropriate grid based on current type
  const renderGrid = () => {
    switch (currentType) {
      case WorkIsue:
        return <CardGridWorkIsue currentType={currentType} />;
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
  };

  // Get statistics for the current type
  const getTypeStats = () => {
    const total = filteredItems.length;
    const typeLabels = {
      [Staff]: "empleados",
      [WorkIsue]: "work issues", 
      [Procedimientos]: "procedimientos",
      [MenuItems]: "items del menú"
    };
    
    return {
      total,
      label: typeLabels[currentType] || "elementos"
    };
  };

  const stats = getTypeStats();

  return (
    <PageLayout title="Manager - Centro de Control" actions={headerActions} loading={loading}>
      {/* Quick stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Total {stats.label}</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <Settings className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Modo edición</p>
              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                {showEdit ? 'Activado' : 'Desactivado'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <Zap className="text-purple-600" size={20} />
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Acciones rápidas</p>
              <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                {showAccionesRapidasActividades ? 'Visibles' : 'Ocultas'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            {currentType === Staff && <Users className="text-amber-600" size={20} />}
            {currentType === WorkIsue && <Wrench className="text-amber-600" size={20} />}
            {currentType === Procedimientos && <FileText className="text-amber-600" size={20} />}
            {currentType === MenuItems && <UtensilsCrossed className="text-amber-600" size={20} />}
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400">Categoría activa</p>
              <p className="text-lg font-bold text-amber-800 dark:text-amber-200 capitalize">
                {currentType}
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Quick Actions */}
      {showAccionesRapidasActividades && (
        <ContentCard title="Acciones Rápidas">
          <AccionesRapidasActividades currentType={currentType} />
        </ContentCard>
      )}

      {/* Main content grid */}
      <ContentCard 
        title={`Listado de ${currentType}`}
        actions={
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            {currentType === Staff && <Users size={16} />}
            {currentType === WorkIsue && <Wrench size={16} />}
            {currentType === Procedimientos && <FileText size={16} />}
            {currentType === MenuItems && <UtensilsCrossed size={16} />}
            <span>{stats.total} elementos</span>
          </div>
        }
        noPadding
      >
        <div className="p-4">
          {stats.total > 0 ? (
            renderGrid()
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {currentType === Staff && <Users size={48} className="mx-auto mb-4 opacity-50" />}
              {currentType === WorkIsue && <Wrench size={48} className="mx-auto mb-4 opacity-50" />}
              {currentType === Procedimientos && <FileText size={48} className="mx-auto mb-4 opacity-50" />}
              {currentType === MenuItems && <UtensilsCrossed size={48} className="mx-auto mb-4 opacity-50" />}
              <p className="text-lg font-medium">No hay {stats.label} disponibles</p>
              <p className="text-sm">Los elementos aparecerán aquí cuando se agreguen</p>
            </div>
          )}
        </div>
      </ContentCard>
    </PageLayout>
  );
}

export default Manager;
