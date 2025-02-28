import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem } from "../../../../redux/actions-Proveedores";
import { ESTATUS } from "../../../../redux/actions-types";
import RecepieOptionsProcedimientos from "../../../components/recepieOptions/RecepieOptionsProcedimientos";

export function CardGridProcedimientos_Instance({ item, currentType, book, product, receta, handleSaveReceta, handleCreateReceta }) {

  console.log(currentType);
  
  
  
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);

  const initialState = {
    Dates: item.Dates || { isued: new Date().toISOString(), finished: "", date_asigmente: [] },
    Terminado: item.Terminado || false,
    Pagado: item.Pagado || { pagadoFull: false, adelanto: "NoAplica" },
    Categoria: item.Categoria || "",
    Ejecutor: item.Ejecutor || "",
    Procedimientos: item.Procedimientos || "",
    Estado: item.Estado || "",
    tittle: item.tittle || "",
  };

  const [formData, setFormData] = useState(initialState);
  const [buttonState, setButtonState] = useState("save");
  const [showGeneralInfo, setShowGeneralInfo] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setButtonState("save");
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      Dates: { ...prev.Dates, [name]: value },
    }));
  };

  const handleUpdate = async () => {
    setButtonState("syncing");
    try {
      await dispatch(updateItem(item._id, formData, currentType));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      setButtonState("save");
    }
  };
console.log(item._id , currentType);

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ítem?")) {
      setButtonState("syncing");
      try {
        await dispatch(deleteItem(item._id, currentType));
        setButtonState("done");
        alert("Ítem eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el ítem:", error);
        alert("Hubo un error al eliminar el ítem.");
        setButtonState("save");
      }
    }
  };

  const handleStatusChange = async (status) => {
    setFormData((prev) => ({ ...prev, Estado: status }));
    setButtonState("save");
    try {
      await dispatch(updateItem(item._id, { Estado: status }, currentType));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      setButtonState("save");
    }
  };

  return (
    <Card className="w-full shadow-md rounded-lg border border-gray-200">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
        <label className="text-sm text-gray-700 flex-1">
              Título:
              <input
                type="text"
                name="tittle"
                value={formData.tittle}
                onChange={handleChange}
                disabled={!showEdit}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
          {showEdit && (
            <Button className="bg-red-500 text-white hover:bg-red-400" onClick={handleDelete}>
              {buttonState === "save" ? "🧨" : buttonState === "syncing" ? "💢" : "💥"}
            </Button>
          )}
          <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={handleUpdate}>
            {buttonState === "save" ? "💾" : buttonState === "syncing" ? "🔄" : "✅"}
          </Button>






        </div>
        {/* {book === "📖" && ( */}
        <RecepieOptionsProcedimientos
            product={item}
            receta={item.Receta}
            currentType={currentType}
            onSaveReceta={handleSaveReceta}
            onCreateReceta={handleCreateReceta}
          />
        {/* )} */}

        <div className="flex gap-2">
          {ESTATUS.filter((status) => status !== "PC").map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`flex-1 py-2 rounded text-white ${formData.Estado === status ? "bg-green-500" : "bg-gray-300 hover:bg-gray-400"}`}
            >
              {status}
            </button>
          ))}
        </div>

        <Button className="bg-gray-500 text-white hover:bg-gray-600" onClick={() => setShowGeneralInfo(!showGeneralInfo)}>
          {showGeneralInfo ? "Ocultar Información General" : "Mostrar Información General"}
        </Button>

            
        {showGeneralInfo && (
          <>
            <label className="text-sm text-gray-700 flex-1">
              Categoría:
              <input
                type="text"
                name="Categoria"
                value={formData.Categoria}
                onChange={handleChange}
                disabled={!showEdit}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Ejecutor:
              <input
                type="text"
                name="Ejecutor"
                value={formData.Ejecutor}
                onChange={handleChange}
                disabled={!showEdit}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Terminado:
              <input
                type="checkbox"
                name="Terminado"
                checked={formData.Terminado}
                onChange={handleChange}
                disabled={!showEdit}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Pagado:
              <select
                name="Pagado"
                value={formData.Pagado.pagadoFull}
                onChange={(e) => setFormData({ ...formData, Pagado: { ...formData.Pagado, pagadoFull: e.target.value === "true" } })}
                disabled={!showEdit}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </label>
            {formData.Pagado.pagadoFull === false && (
              <label className="text-sm text-gray-700 flex-1">
                Adelanto:
                <input
                  type="text"
                  name="adelanto"
                  value={formData.Pagado.adelanto}
                  onChange={(e) => setFormData({ ...formData, Pagado: { ...formData.Pagado, adelanto: e.target.value } })}
                  disabled={!showEdit}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                />
              </label>
            )}
            <label className="text-sm text-gray-700 flex-1">
              Fecha de Creación:
              <input
                type="date"
                name="isued"
                value={formData.Dates.isued ? formData.Dates.isued.split('T')[0] : ""}
                onChange={handleDateChange}
                disabled={!showEdit}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Fecha de Finalización:
              <input
                type="date"
                name="finished"
                value={formData.Dates.finished ? formData.Dates.finished.split('T')[0] : ""}
                onChange={handleDateChange}
                disabled={!showEdit}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
          </>
        )}


      </CardContent>
    </Card>
  );
}
