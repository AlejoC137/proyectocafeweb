import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups, toggleShowEdit } from "../../../redux/actions";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE, ItemsAlmacen, ProduccionInterna, MenuItems, RECETAS_MENU, RECETAS_PRODUCCION } from "../../../redux/actions-types";
import { CardGridInventario } from "@/components/ui/cardGridInventario";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";
import { CardGridInventarioMenu } from "@/components/ui/cardGridInventarioMenu";
import { TableViewInventario } from "@/components/ui/tableViewInventario";
// import { TableViewInventario } from "./tableView/TableViewInventario";
import { ViewToggle } from "@/components/ui/viewToggle";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import CategoryNavBar from "../../../components/ui/category-nav-bar";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Package, ChefHat, Settings, Zap } from "lucide-react";

function Inventario() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(ItemsAlmacen);
  const [showAccionesRapidas, setShowAccionesRapidas] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "cards" o "table"

  const Menu = useSelector((state) => state.allMenu || []);
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);
  const showEdit = useSelector((state) => state.showEdit);
  const recetas = useSelector((state) => state.allRecetasMenu || []);
  const recetasProduccion = useSelector((state) => state.allRecetasProduccion || []);

  const filteredItems = {
    [ItemsAlmacen]: Items,
    [ProduccionInterna]: Produccion,
    [MenuItems]: Menu,
  }[currentType] || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROVEE)),
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
      setCurrentType(type);
    }
  };

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  const handleToggleAccionesRapidas = () => {
    setShowAccionesRapidas((prev) => !prev);
  };

  // Categorías para CategoryNavBar
  const categories = [
    { type: MenuItems, label: "Menú", icon: "🗺️" },
    { type: ItemsAlmacen, label: "Almacén", icon: "🛒" },
    { type: ProduccionInterna, label: "Producción", icon: "🥘" }
  ];

  const headerActions = (
    <CategoryNavBar
      categories={categories}
      currentType={currentType}
      onTypeChange={handleToggleType}
      showEdit={showEdit}
      onToggleEdit={handleToggleShowEdit}
      showActions={showAccionesRapidas}
      onToggleActions={handleToggleAccionesRapidas}
    />
  );

  return (
    <PageLayout title="Gestión de Inventario" actions={headerActions} loading={loading}>
      {/* Acciones Rápidas */}
      {showAccionesRapidas && (
        <ContentCard title="Acciones Rápidas">
          <AccionesRapidas currentType={currentType} />
        </ContentCard>
      )}

      {/* Contenido principal del inventario */}
      <ContentCard
        title={`Listado de ${currentType}`}
        actions={
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        }
      >
        {viewMode === "cards" ? (
          // Vista de tarjetas (actual)
          currentType !== MenuItems ? (
            <CardGridInventario
              products={filteredItems}
              category="Grouped"
              currentType={currentType}
              showEdit={showEdit}
            />
          ) : (
            <CardGridInventarioMenu
              products={filteredItems}
              showEdit={showEdit}
            />
          )
        ) : (
          // Vista de tabla tipo Excel
          <TableViewInventario
            products={filteredItems}
            currentType={currentType}
            recetasMenu={recetas}
            recetasProduccion={recetasProduccion}
          />
        )}
      </ContentCard>

      {/* Información de estado */}
      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>Total de elementos: {filteredItems.length}</span>
        <span>Modo edición: {showEdit ? 'Activado' : 'Desactivado'}</span>
      </div>
    </PageLayout>
  );
}

export default Inventario;
