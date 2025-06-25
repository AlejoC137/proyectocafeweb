import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StaffWorkIssues_Instance from "./staffWorkIssues_Instance";
import { PRODUCCION, PROCEDE } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";

function StaffWorkIssues({ staffId }) {
  // Traer todos los work issues de Redux
  const allWorkIsue = useSelector((state) => state.allWorkIsue || []);

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
  const staffIssues = allWorkIsue.filter(
    (issue) => issue.Ejecutor === staffId && !issue.Terminado
  );

  return (
    <div>
      <h2 className="font-bold mb-2">Work Issues</h2>
      {staffIssues.length === 0 ? (
        <div>No hay work issues sin terminar.</div>
      ) : (
        <div className="space-y-4">
          {staffIssues.map((issue) => (
            <StaffWorkIssues_Instance key={issue._id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

export default StaffWorkIssues;