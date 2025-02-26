import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem } from "../../../../redux/actions-Proveedores";
import { ESTATUS } from "../../../../redux/actions-types";

export function CardGridWorkIsue_Instance({ item, currentType }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);

  const [formData, setFormData] = useState({
    Dates: item.Dates || { isued: new Date().toISOString(), finished: "", date_asigmente: [] },
    Terminado: item.Terminado || false,
    Pagado: item.Pagado || { pagadoFull: false, adelanto: "NoAplica" },
    Categoria: item.Categoria || "",
    Ejecutor: item.Ejecutor || "",
    Procedimientos: item.Procedimientos || "",
  });

  const [buttonState, setButtonState] = useState("save");

  const handleInputChange = (e) => {
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
      const updatedFields = {
        Dates: formData.Dates,
        Terminado: formData.Terminado,
        Pagado: formData.Pagado,
        Categoria: formData.Categoria,
        Ejecutor: formData.Ejecutor,
        Procedimientos: formData.Procedimientos,
      };

      await dispatch(updateItem(item._id, updatedFields, currentType));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      setButtonState("save");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ítem?")) {
      try {
        setButtonState("syncing");
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

  const filteredEstatus = ESTATUS.filter((status) => status !== "PC");

  const handleStatusChange = async (status) => {
    setFormData((prev) => ({
      ...prev,
      Estado: status,
    }));
    setButtonState("save");

    try {
      const updatedFields = {
        Estado: status,
      };

      await dispatch(updateItem(item._id, updatedFields, currentType));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      setButtonState("save");
    }
  };

  return (
    <Card className="w-full shadow-md rounded-lg overflow-hidden border border-gray-200">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-800 flex-1">
            {item.Nombre} {item.Apellido}
          </h3>
          {showEdit && (
            <Button className="bg-red-500 text-white hover:bg-red-400" onClick={handleDelete}>
              {buttonState === "save" && "🧨"}
              {buttonState === "syncing" && "💢"}
              {buttonState === "done" && "💥"}
            </Button>
          )}
          <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={handleUpdate}>
            {buttonState === "save" && "💾"}
            {buttonState === "syncing" && "🔄"}
            {buttonState === "done" && "✅"}
          </Button>
        </div>

        <div className="flex gap-2">
          {filteredEstatus.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`flex-1 py-2 rounded text-white ${
                formData.Estado === status ? "bg-green-500" : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {showEdit && (
          <>
            <label className="text-sm text-gray-700 flex-1">
              Fecha de Creación:
              <input
                type="date"
                name="isued"
                value={formData.Dates.isued ? formData.Dates.isued.split('T')[0] : ""}
                onChange={handleDateChange}
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
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Terminado:
              <input
                type="checkbox"
                name="Terminado"
                checked={formData.Terminado}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Pagado:
              <select
                name="Pagado"
                value={formData.Pagado.pagadoFull}
                onChange={(e) => setFormData({ ...formData, Pagado: { ...formData.Pagado, pagadoFull: e.target.value === "true" } })}
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
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                />
              </label>
            )}
            <label className="text-sm text-gray-700 flex-1">
              Categoría:
              <select
                name="Categoria"
                value={formData.Categoria}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              >
                <option value="">Seleccionar Categoría</option>
                <option value="COCINA">COCINA</option>
                <option value="CAFE">CAFE</option>
                <option value="MESAS">MESAS</option>
                <option value="JARDINERIA">JARDINERIA</option>
                <option value="TIENDA">TIENDA</option>
              </select>
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Ejecutor:
              <input
                type="text"
                name="Ejecutor"
                value={formData.Ejecutor}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Procedimientos:
              <input
                type="text"
                name="Procedimientos"
                value={formData.Procedimientos}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
          </>
        )}
      </CardContent>
    </Card>
  );
}
