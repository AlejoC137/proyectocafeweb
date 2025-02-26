import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable, getRecepie } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE, ItemsAlmacen, ProduccionInterna, MenuItems } from "../../../redux/actions-types";
import { Input } from "@/components/ui/input";
import { crearProcedimiento, actualizarProcedimiento, eliminarProcedimiento, getAllFromTable as getAllFromTableProcedimientos } from "../../../redux/actions-Procedimientos";
import { PROCEDE } from "../../../redux/actions-types";

function WorkIsueCreator() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [receta, setReceta] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allMenu = useSelector((state) => state.allMenu || []);
  const allProcedimientos = useSelector((state) => state.allProcedimientos || []);
  const allStaff = useSelector((state) => state.allStaff || []);
  const [formData, setFormData] = useState({
    Dates: { isued: new Date().toISOString(), finished: "", date_asigmente: [] },
    Terminado: false,
    Pagado: { pagadoFull: false, adelanto: "NoAplica" },
    Categoria: "",
    Ejecutor: "",
    Receta: "",
    tittle: "",
    Menu: "",
  });
  const [editing, setEditing] = useState(null);
  const [hoy, setHoy] = useState(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }).split(",")[0]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, Dates: { ...formData.Dates, [name]: value } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await dispatch(actualizarProcedimiento(editing, formData));
      } else {
        await dispatch(crearProcedimiento(formData));
      }
      setFormData({
        Dates: { isued: new Date().toISOString(), finished: "", date_asigmente: [] },
        Terminado: false,
        Pagado: { pagadoFull: false, adelanto: "NoAplica" },
        Categoria: "",
        Ejecutor: "",
        Receta: "",
        tittle: "",
        Menu: "",
      });
      setEditing(null);
      alert("Procedimiento guardado correctamente");
    } catch (error) {
      console.error("Error al guardar el procedimiento:", error);
      alert("Error al guardar el procedimiento");
    }
  };

  const handleEdit = (procedimiento) => {
    setFormData(procedimiento);
    setEditing(procedimiento._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este procedimiento?")) {
      try {
        await dispatch(eliminarProcedimiento(id));
        alert("Procedimiento eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar el procedimiento:", error);
        alert("Error al eliminar el procedimiento");
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold">Crear WorkIsue</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="isued" className="block bg-white text-sm font-medium text-gray-700">Fecha de Creación:</label>
            <input
              type="date"
              id="isued"
              name="isued"
              className="bg-gray-500 mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.Dates.isued.split('T')[0]}
              onChange={handleDateChange}
            />
            <p>Selected Date: {formData.Dates.isued.split('T')[0]}</p>
          </div>
          <div>
            <label htmlFor="finished" className="block bg-white text-sm font-medium text-gray-700">Fecha de Finalización:</label>
            <input
              type="date"
              id="finished"
              name="finished"
              className="bg-gray-500 mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.Dates.finished.split('T')[0]}
              onChange={handleDateChange}
            />
            <p>Selected Date: {formData.Dates.finished.split('T')[0]}</p>
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Categoría:</label>
            <Input
              type="text"
              name="Categoria"
              value={formData.Categoria}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Ejecutor:</label>
            <select
              name="Ejecutor"
              value={formData.Ejecutor}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            >
              <option className="bg-white" value="">Seleccionar Ejecutor</option>
              {allStaff.map((staff) => (
                <option className="bg-white" key={staff._id} value={staff._id}>
                  {staff.Nombre} {staff.Apellido}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Receta:</label>
            <Input
              type="text"
              name="Receta"
              value={formData.Receta}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
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
          <div className="bg-white">
            <label className="text-sm font-medium">Menú:</label>
            <select
              name="Menu"
              value={formData.Menu}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            >
              <option className="bg-white" value="">Seleccionar Menú</option>
              {allMenu.map((menu) => (
                <option className="bg-white" key={menu._id} value={menu._id}>
                  {menu.Nombre}
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
        {allProcedimientos.map((procedimiento) => (
          <div key={procedimiento._id} className="p-4 bg-white rounded-lg shadow-md flex justify-between items-center">
            <div className="bg-white">
              <h3 className="text-lg font-semibold">{procedimiento.tittle}</h3>
              <p className="text-sm">Fecha de Creación: {procedimiento.Dates.isued}</p>
              <p className="text-sm">Fecha de Finalización: {procedimiento.Dates.finished}</p>
              <p className="text-sm">Terminado: {procedimiento.Terminado ? "Sí" : "No"}</p>
              <p className="text-sm">Pagado: {procedimiento.Pagado.pagadoFull ? "Sí" : "No"}</p>
              <p className="text-sm">Adelanto: {procedimiento.Pagado.adelanto}</p>
              <p className="text-sm">Categoría: {procedimiento.Categoria}</p>
              <p className="text-sm">Ejecutor: {procedimiento.Ejecutor}</p>
              <p className="text-sm">Receta: {procedimiento.Receta}</p>
              <p className="text-sm">Menú: {procedimiento.Menu}</p>
            </div>
            <div className="flex gap-2 bg-white">
              <Button onClick={() => handleEdit(procedimiento)} className="bg-yellow-500 text-white text-sm">
                ✏️
              </Button>
              <Button onClick={() => handleDelete(procedimiento._id)} className="bg-red-500 text-white text-sm">
                ❌
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkIsueCreator;
