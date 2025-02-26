import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem } from "../../../../redux/actions-Proveedores";
import { ESTATUS } from "../../../../redux/actions-types";
import RecepieOptionsProcedimientos from "../../../components/recepieOptions/RecepieOptionsProcedimientos";

export function CardGridProcedimientos_Instance({ item, currentType, book, product, receta, handleSaveReceta, handleCreateReceta }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);

  const initialState = {
    Dates: item.Dates || { isued: new Date().toISOString(), finished: "", date_asigmente: [] },
    Terminado: item.Terminado || false,
    Pagado: item.Pagado || { pagadoFull: false, adelanto: "NoAplica" },
    Categoria: item.Categoria || "",
    Ejecutor: item.Ejecutor || "",
    Procedimientos: item.Procedimientos || "",
    Estado: item.Estado || ""
  };

  const [formData, setFormData] = useState(initialState);
  const [buttonState, setButtonState] = useState("save");

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
          <h3 className="text-base font-semibold text-gray-800 flex-1">
            {item.Nombre} {item.Apellido}
          </h3>
          {showEdit && (
            <Button className="bg-red-500 text-white hover:bg-red-400" onClick={handleDelete}>
              {buttonState === "save" ? "🧨" : buttonState === "syncing" ? "💢" : "💥"}
            </Button>
          )}
          <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={handleUpdate}>
            {buttonState === "save" ? "💾" : buttonState === "syncing" ? "🔄" : "✅"}
          </Button>
        </div>

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

        {book === "📖" && (
          <RecepieOptionsProcedimientos
            product={product}
            Receta={receta}
            currentType={currentType}
            onSaveReceta={handleSaveReceta}
            onCreateReceta={handleCreateReceta}
          />
        )}
      </CardContent>
    </Card>
  );
}
