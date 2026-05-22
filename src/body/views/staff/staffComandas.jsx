import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StaffComandas_Instance from "./staffComandas_Instance";
import { PRODUCCION, PROCEDE } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";

function StaffComandas({ staffId }) {
  // Traer todos los Comandas de Redux
  const allComanda = useSelector((state) => state.allComanda || []);

  const dispatch = useDispatch();
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable(PRODUCCION));
        await dispatch(getAllFromTable(PROCEDE));
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  // Filtrar los issues que pertenecen a este staff y NO están terminados
  const staffIssues = allComanda.filter(
    (issue) => issue.Ejecutor === staffId && !issue.Terminado
  );

  return (
    <div>
      <h2 className="font-bold mb-2">Comandas</h2>
      {staffIssues.length === 0 ? (
        <div>No hay Comandas sin terminar.</div>
      ) : (
        <div className="space-y-4">
          {staffIssues.map((issue) => (
            <StaffComandas_Instance key={issue._id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

export default StaffComandas;