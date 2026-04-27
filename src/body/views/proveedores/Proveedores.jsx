import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups, toggleShowEdit } from "../../../redux/actions";
import { ITEMS, PROVEE } from "../../../redux/actions-types";
import { CardGridProveedores } from "@/components/ui/CardGridProveedores";
import { TableViewProveedores } from "@/components/ui/tableViewProveedores";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";
import { ViewToggle } from "@/components/ui/viewToggle";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import CategoryNavBar from "../../../components/ui/category-nav-bar";
import { Button } from "@/components/ui/button";
import { Users, Settings, Zap } from "lucide-react";

function Proveedores() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [showAccionesRapidas, setShowAccionesRapidas] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "cards" o "table"

  const proveedores = useSelector((state) => state.Proveedores || []);
  const items = useSelector((state) => state.Items || []); // O el nombre real

  const proveedoresConPendientes = proveedores.map(prov => ({
    ...prov,
    pendientes: items.filter(item => item.proveedorId === prov._id)
  }));

  const showEdit = useSelector((state) => state.showEdit);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable(PROVEE));
        await dispatch(getAllFromTable(ITEMS));

        
        setLoading(false);
        
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  const handleToggleAccionesRapidas = () => {
    setShowAccionesRapidas((prev) => !prev);
  };

  // Categorías para CategoryNavBar (solo una categoría para proveedores)
  const categories = [
    { type: "Proveedores", label: "Proveedores", icon: "🏢" }
  ];

  const headerActions = (
    <CategoryNavBar
      categories={categories}
      currentType="Proveedores"
      onTypeChange={() => {}} // No hay cambio de tipo para proveedores
      showEdit={showEdit}
      onToggleEdit={handleToggleShowEdit}
      showActions={showAccionesRapidas}
      onToggleActions={handleToggleAccionesRapidas}
    />
  );

  

  return (
    <PageLayout title="Gestión de Proveedores" actions={headerActions} loading={loading}>
      {/* Acciones Rápidas */}
      {showAccionesRapidas && (
        <ContentCard title="Acciones Rápidas">
          <AccionesRapidas currentType={PROVEE} />
        </ContentCard>
      )}

      {/* Contenido principal de proveedores */}
      <ContentCard 
        title={`Lista de Proveedores`}
        actions={
          <ViewToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode}
          />
        }
      >
        {viewMode === "cards" ? (
          // Vista de tarjetas (actual)
          <div className="p-4">
            <CardGridProveedores />
          </div>
        ) : (
          // Vista de tabla tipo Excel
          <TableViewProveedores
            products={proveedoresConPendientes}
          />
        )}
      </ContentCard>

      {/* Información de estado */}
      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>Total de proveedores: {proveedores.length}</span>
        <span>Modo edición: {showEdit ? 'Activado' : 'Desactivado'}</span>
      </div>
    </PageLayout>
  );
}

export default Proveedores;