import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { STAFF, RECETAS_PROCEDIMIENTOS, PROCEDE } from "../../../redux/actions-types";
import { Input } from "@/components/ui/input";
import { crearProcedimiento } from "../../../redux/actions-Procedimientos";

function ProcedimientosCreator() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [formData, setFormData] = useState({
    Categoria: "",
    tittle: "",
    DescripcionGeneral: "", // Default value
  });

  useEffect(() => {
    dispatch(getAllFromTable(PROCEDE));
    dispatch(getAllFromTable(RECETAS_PROCEDIMIENTOS));
    dispatch(getAllFromTable(STAFF));
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(crearProcedimiento(formData));
      setFormData({
        Categoria: "",
        tittle: "",
        DescripcionGeneral: "",
      });
      alert("Procedimiento guardado correctamente");
    } catch (error) {
      console.error("Error al guardar el procedimiento:", error);
      alert("Error al guardar el procedimiento: " + error.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold">Crear Procedimientos</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white">
            <label className="text-sm font-medium">Categoría:</label>
            <select
              name="Categoria"
              value={formData.Categoria}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            >
              <option className="bg-white" value="">Seleccionar Categoría</option>
              <option className="bg-white" value="COCINA">COCINA</option>
              <option className="bg-white" value="CAFE">CAFE</option>
              <option className="bg-white" value="MESAS">MESAS</option>
              <option className="bg-white" value="JARDINERIA">JARDINERIA</option>
              <option className="bg-white" value="TIENDA">TIENDA</option>
            </select>
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Título:</label>
            <Input
              type="text"
              name="tittle"
              value={formData.tittle}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white col-span-2">
            <label className="text-sm font-medium">Descripción General:</label>
            <textarea
              name="DescripcionGeneral"
              value={formData.DescripcionGeneral}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
              rows="4"
            />
          </div>
        </div>
        <Button type="submit" className="bg-blue-500 text-white text-sm mt-4">
          Guardar
        </Button>
      </form>
    </div>
  );
}

export default ProcedimientosCreator;
