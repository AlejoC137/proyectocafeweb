import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ITEMS, MENU, RECETAS_MENU, PRODUCCION, RECETAS_PRODUCCION } from "../../../redux/actions-types";
import { getAllFromTable} from "../../../redux/actions";
import DiaResumentStats from "./DiaResumentStats";
import RecetasStats from "./RecetasStats";

function Recetas() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  
  // --- Estados para el modal Predict ---

      

useEffect(() => {


  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Carga los datos de Redux en paralelo
      await Promise.all([
        dispatch(getAllFromTable(MENU)),
        dispatch(getAllFromTable(PRODUCCION)),
        dispatch(getAllFromTable(RECETAS_PRODUCCION)),
        dispatch(getAllFromTable(RECETAS_MENU)),
      ]);

   
    } catch (error) {
      console.error("Error al cargar todos los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchAllData();
}, []);




  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
<RecetasStats></RecetasStats>
    </div>
  );
}

export default Recetas;