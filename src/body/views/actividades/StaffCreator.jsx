import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crearItem, updateItem, deleteItem } from "../../../redux/actions-Proveedores";
import { ESTATUS } from "../../../redux/actions-types";

function StaffCreator() {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [formData, setFormData] = useState({
    Propinas: "",
    Turno_State: "",
    Turnos: "",
    Nombre: "",
    Apellido: "",
    Cargo: "",
    Cuenta: "",
    Rate: 0,
    Show: false,
    CC: 0,
    Estado: ESTATUS[0],
    Contratacion: false,
  });
  const [editing, setEditing] = useState(null);

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
      if (editing) {
        await dispatch(updateItem(editing, formData, "Staff"));
      } else {
        await dispatch(crearItem(formData, "Staff"));
      }
      setFormData({
        Propinas: "",
        Turno_State: "",
        Turnos: "",
        Nombre: "",
        Apellido: "",
        Cargo: "",
        Cuenta: "",
        Rate: 0,
        Show: false,
        CC: 0,
        Estado: ESTATUS[0],
        Contratacion: false,
      });
      setEditing(null);
      alert("Staff guardado correctamente");
    } catch (error) {
      console.error("Error al guardar el staff:", error);
      alert("Error al guardar el staff");
    }
  };

  const handleEdit = (staff) => {
    setFormData(staff);
    setEditing(staff._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este staff?")) {
      try {
        await dispatch(deleteItem(id, "Staff"));
        alert("Staff eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar el staff:", error);
        alert("Error al eliminar el staff");
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold">Crear Staff</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white">
            <label className="text-sm font-medium">Nombre:</label>
            <Input
              type="text"
              name="Nombre"
              value={formData.Nombre}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Apellido:</label>
            <Input
              type="text"
              name="Apellido"
              value={formData.Apellido}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Cargo:</label>
            <Input
              type="text"
              name="Cargo"
              value={formData.Cargo}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Cuenta:</label>
            <Input
              type="text"
              name="Cuenta"
              value={formData.Cuenta}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Propinas:</label>
            <Input
              type="text"
              name="Propinas"
              value={formData.Propinas}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Turno State:</label>
            <Input
              type="text"
              name="Turno_State"
              value={formData.Turno_State}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Turnos:</label>
            <Input
              type="text"
              name="Turnos"
              value={formData.Turnos}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Rate:</label>
            <Input
              type="number"
              name="Rate"
              value={formData.Rate}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">CC:</label>
            <Input
              type="number"
              name="CC"
              value={formData.CC}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Show:</label>
            <Input
              type="checkbox"
              name="Show"
              checked={formData.Show}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Contratacion:</label>
            <Input
              type="checkbox"
              name="Contratacion"
              checked={formData.Contratacion}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Estado:</label>
            <select
              name="Estado"
              value={formData.Estado}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            >
              {ESTATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" className="bg-blue-500 text-white text-sm mt-4">
          Guardar
        </Button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-4">
        {allStaff.map((staff) => (
          <div key={staff._id} className="p-4 bg-white rounded-lg shadow-md flex justify-between items-center">
            <div className="bg-white">
              <h3 className="text-lg font-semibold">{staff.Nombre} {staff.Apellido}</h3>
              <p className="text-sm">Cargo: {staff.Cargo}</p>
              <p className="text-sm">Cuenta: {staff.Cuenta}</p>
              <p className="text-sm">Propinas: {staff.Propinas}</p>
              <p className="text-sm">Turno State: {staff.Turno_State}</p>
              <p className="text-sm">Turnos: {staff.Turnos}</p>
              <p className="text-sm">Rate: {staff.Rate}</p>
              <p className="text-sm">CC: {staff.CC}</p>
              <p className="text-sm">Show: {staff.Show ? "Sí" : "No"}</p>
              <p className="text-sm">Contratacion: {staff.Contratacion ? "Sí" : "No"}</p>
              <p className="text-sm">Estado: {staff.Estado}</p>
            </div>
            <div className="flex gap-2 bg-white">
              <Button onClick={() => handleEdit(staff)} className="bg-yellow-500 text-white text-sm">
                ✏️
              </Button>
              <Button onClick={() => handleDelete(staff._id)} className="bg-red-500 text-white text-sm">
                ❌
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffCreator;
