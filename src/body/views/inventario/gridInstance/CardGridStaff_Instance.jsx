import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem } from "../../../../redux/actions-Proveedores";
import { ESTATUS } from "../../../../redux/actions-types";

export function CardGridStaff_Instance({ staff }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  const AllStaff = useSelector((state) => state.AllStaff || []);
  console.log('allStaf' , {AllStaff});

  const [formData, setFormData] = useState({
    Propinas: staff.Propinas || "",
    Turno_State: staff.Turno_State || "",
    Turnos: staff.Turnos || "",
    Nombre: staff.Nombre || "",
    Apellido: staff.Apellido || "",
    Cargo: staff.Cargo || "",
    Cuenta: staff.Cuenta || "",
    Rate: staff.Rate || 0,
    Show: staff.Show || false,
    CC: staff.CC || 0,
    Estado: staff.Estado || ESTATUS[0],
    Contratacion: staff.Contratacion || false,
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

  const handleUpdate = async () => {
    setButtonState("syncing");
    try {
      const updatedFields = {
        Propinas: formData.Propinas,
        Turno_State: formData.Turno_State,
        Turnos: formData.Turnos,
        Nombre: formData.Nombre,
        Apellido: formData.Apellido,
        Cargo: formData.Cargo,
        Cuenta: formData.Cuenta,
        Rate: formData.Rate,
        Show: formData.Show,
        CC: formData.CC,
        Estado: formData.Estado,
        Contratacion: formData.Contratacion,
      };

      await dispatch(updateItem(staff._id, updatedFields, "Staff"));
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
        await dispatch(deleteItem(staff._id, "Staff"));
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

      await dispatch(updateItem(staff._id, updatedFields, "Staff"));
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
            {staff.Nombre} {staff.Apellido}
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
              Nombre:
              <input
                type="text"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Apellido:
              <input
                type="text"
                name="Apellido"
                value={formData.Apellido}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Cargo:
              <input
                type="text"
                name="Cargo"
                value={formData.Cargo}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Cuenta:
              <input
                type="text"
                name="Cuenta"
                value={formData.Cuenta}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Propinas:
              <input
                type="text"
                name="Propinas"
                value={formData.Propinas}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Turno State:
              <input
                type="text"
                name="Turno_State"
                value={formData.Turno_State}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Turnos:
              <input
                type="text"
                name="Turnos"
                value={formData.Turnos}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Rate:
              <input
                type="number"
                name="Rate"
                value={formData.Rate}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              CC:
              <input
                type="number"
                name="CC"
                value={formData.CC}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Show:
              <input
                type="checkbox"
                name="Show"
                checked={formData.Show}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Contratacion:
              <input
                type="checkbox"
                name="Contratacion"
                checked={formData.Contratacion}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Categoria:
              <input
                type="text"
                name="Categoria"
                value={formData.Categoria}
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
