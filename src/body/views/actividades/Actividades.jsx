import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { STAFF, WORKISUE, Procedimientos, PROCEDE } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";

// Componentes a renderizar en las columnas
import WorkIsueStaff from "./WorkE/WorkIsueStaff";
import Notas from "./WorkE/Notas";
import { CardGridProcedimientos } from "../../views/inventario/gridInstance/CardGridProcedimientos";

function Actividades() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  // Cargar datos necesarios
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(WORKISUE)),
          dispatch(getAllFromTable(PROCEDE))
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  return (
    <PageLayout loading={loading}>
      {/* Contenedor principal FLEX que organiza las 3 columnas */}
      <div className="flex flex-col lg:flex-row gap-4 pb-20 lg:pb-0 h-[calc(100vh-8rem)]">

        {/* --- COLUMNA 1 (a): Tareas y Work Issues --- */}
        <div className="w-full lg:w-1/3 flex flex-col h-full"> {/* h-full and flex flex-col to match Notas */}
          <WorkIsueStaff />
        </div>

        {/* --- COLUMNA 2 (b): Procedimientos --- */}
        <div className="w-full lg:w-1/3 flex flex-col h-full overflow-y-auto">
          <ContentCard title="Procedimientos" className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto min-h-0 relative">
              <div className="absolute inset-0">
                <CardGridProcedimientos currentType={Procedimientos} />
              </div>
            </div>
          </ContentCard>
        </div>

        {/* --- COLUMNA 3 (c): Notas (Mirror) --- */}
        <div className="w-full lg:w-1/3 flex flex-col h-full"> {/* Match StaffPortal Notas wrapper roughly */}
          <Notas />
        </div>

      </div>
    </PageLayout>
  );
}

export default Actividades;

