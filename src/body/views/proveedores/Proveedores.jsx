import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, toggleShowEdit } from "../../../redux/actions";
import { PROVEE } from "../../../redux/actions-types";
import { CardGridProveedores } from "@/components/ui/CardGridProveedores";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import ActionButtonGroup from "../../../components/ui/action-button-group";
import { Button } from "@/components/ui/button";
import { Edit, Users, Plus, Zap } from "lucide-react";

function Proveedores() {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efecto para cargar los datos iniciales de los proveedores
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await dispatch(getAllFromTable(PROVEE));
      } catch (err) {
        console.error("Error al cargar los datos:", err);
        setError("No se pudieron cargar los proveedores. Por favor, intente de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  // Función para alternar el modo de edición
  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  // Botones de acción para el header
  const actionButtons = [
    {
      label: showEdit ? "Desactivar Edición" : "Activar Edición",
      icon: Edit,
      onClick: handleToggleShowEdit,
      variant: showEdit ? "destructive" : "outline"
    }
  ];

  return (
    <PageLayout 
      title="Gestión de Proveedores" 
      actions={<ActionButtonGroup buttons={actionButtons} />}
      loading={loading}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Acciones rápidas para agregar proveedores */}
      <ContentCard title="Acciones Rápidas" className="mb-6">
        <AccionesRapidas currentType={PROVEE} />
      </ContentCard>

      {/* Lista de proveedores */}
      <ContentCard 
        title="Lista de Proveedores" 
        actions={
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users size={16} />
            <span>Modo edición: {showEdit ? 'Activado' : 'Desactivado'}</span>
          </div>
        }
        noPadding
      >
        <div className="p-4">
          <CardGridProveedores />
        </div>
      </ContentCard>
    </PageLayout>
  );
}

export default Proveedores;