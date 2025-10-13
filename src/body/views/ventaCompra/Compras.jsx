import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// CORRECCIÓN: Asegúrate de que la acción `getAllProveedores` esté creada y
// exportada desde tu archivo `actions-VentasCompras.js`. Si la tienes en otro
// archivo, simplemente corrige la ruta de importación.
import {  } from "../../../redux/actions-VentasCompras.js";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import { Button } from "@/components/ui/button";
getAllFromTable
import { TableViewCompras } from "./TableViewCompras";

import { getAllFromTable, toggleShowEdit } from "../../../redux/actions";
import { COMPRAS, PROVEE } from "../../../redux/actions-types.js";

function Compras() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const compras = useSelector((state) => state.allCompras || []);
  const proveedores = useSelector((state) => state.allProveedores || []);
  const showEdit = useSelector((state) => state.showEdit);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(getAllFromTable(PROVEE)),
          dispatch(getAllFromTable(COMPRAS)) 
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  const headerActions = (
    <div>
      <Button onClick={handleToggleShowEdit}>
        {showEdit ? 'Desactivar Edición' : 'Activar Edición'}
      </Button>
    </div>
  );

  return (
    <PageLayout title="Gestión de Compras" actions={headerActions} loading={loading}>
      <ContentCard title="Listado de Compras">
        <TableViewCompras
          products={compras}
          proveedores={proveedores}
          currentType="Compras"
        />
      </ContentCard>
      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>Total de elementos: {compras.length}</span>
        <span>Modo edición: {showEdit ? 'Activado' : 'Desactivado'}</span>
      </div>
    </PageLayout>
  );
}

export default Compras;