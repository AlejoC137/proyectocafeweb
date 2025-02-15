import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups, toggleShowEdit } from "../../../redux/actions";
import { PROVEE } from "../../../redux/actions-types";
import { CardGridProveedores } from "@/components/ui/CardGridProveedores";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";

function Proveedores() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable(PROVEE));
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

  if (loading) {
    return <div className="text-center mt-10">Cargando...</div>;
  }

  return (
    <div className="flex flex-col w-screen h-screen">
      <button onClick={handleToggleShowEdit} className="self-end m-4 p-2 bg-blue-500 text-white rounded">
        Toggle Edit
      </button>
      <AccionesRapidas currentType={PROVEE} />
      <CardGridProveedores />
    </div>
  );
}

export default Proveedores;
