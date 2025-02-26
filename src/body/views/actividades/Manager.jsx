import WorkIsueCreator from "./WorkIsueCreator";


import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable, getRecepie } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE, ItemsAlmacen, ProduccionInterna, MenuItems, RECETAS_PROCEDIMIENTOS } from "../../../redux/actions-types";
import { Input } from "@/components/ui/input";
import { crearProcedimiento, actualizarProcedimiento, eliminarProcedimiento, getAllFromTable as getAllFromTableProcedimientos } from "../../../redux/actions-Procedimientos";
import { PROCEDE } from "../../../redux/actions-types";
import ProcedimientosCreator from "./ProcedimientosCreator";
import RecepieOptionsProcedimientos from "../../components/recepieOptions/RecepieOptionsProcedimientos";

function Manager() {
  const dispatch = useDispatch();
 
ProcedimientosCreator



  useEffect(() => {
    dispatch(getAllFromTable(PROCEDE));
    dispatch(getAllFromTable(ITEMS));
    dispatch(getAllFromTable(RECETAS_PROCEDIMIENTOS));
    // dispatch(getAllFromTable(MENU));
  }, [dispatch]);




  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">

          <RecepieOptionsProcedimientos />
          <WorkIsueCreator />
          <ProcedimientosCreator />
 
    </div>
  );
}

export default Manager;
