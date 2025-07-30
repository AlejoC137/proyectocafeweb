import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem } from "../../../../redux/actions-Proveedores";
import { ESTATUS } from "../../../../redux/actions-types";

// Utilidades para convertir objetos a string y viceversa
const formatObjectToString = (obj) => {
  if (!obj || Object.values(obj).every((v) => v === "")) return "";
  const content = Object.entries(obj)
    .map(([key, value]) => `    ${key}: "${value}"`)
    .join(",\n");
  return `{\n${content}\n  }`;
};
const parseObjectFromString = (text) => {
  if (typeof text !== "string" || !text.trim().startsWith("{")) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const obj = {};
      const propertyRegex = /(\w+):\s*"([^"]*)"/g;
      let match;
      while ((match = propertyRegex.exec(text)) !== null) {
        obj[match[1]] = match[2];
      }
      return obj;
    } catch {
      return {};
    }
  }
};

export function CardGridStaff_Instance({ staff }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);

  // Inicializa con objetos anidados
  const [formData, setFormData] = useState({
    Nombre: staff.Nombre || "",
    Apellido: staff.Apellido || "",
    Cargo: staff.Cargo || "",
    Categoria: staff.Categoria || "",
    Cuenta:
      typeof staff.Cuenta === "string"
        ? { banco: "", tipo: "", numero: "", ...parseObjectFromString(staff.Cuenta) }
        : staff.Cuenta || { banco: "", tipo: "", numero: "" },
    infoContacto:
      typeof staff.infoContacto === "string"
        ? { nombreDeContacto: "", numeroDeContacto: "", ...parseObjectFromString(staff.infoContacto) }
        : staff.infoContacto || { nombreDeContacto: "", numeroDeContacto: "" },
    CC: staff.CC || 0,
    Celular: staff.Celular || "",
    Direccion: staff.Direccion || "",
    Rate: staff.Rate || 0,
    Show: staff.Show || false,
    Contratacion: staff.Contratacion || false,
    isAdmin: staff.isAdmin || false,
    Turno_State: staff.Turno_State || false,
    // Puedes agregar Propinas y Turnos si los necesitas aquí
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

  // Para campos anidados
  const handleNestedChange = (objectName, e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [objectName]: {
        ...prev[objectName],
        [name]: value,
      },
    }));
    setButtonState("save");
  };

  const handleUpdate = async () => {
    setButtonState("syncing");
    try {
      const updatedFields = {
        ...formData,
        Cuenta: formatObjectToString(formData.Cuenta),
        infoContacto: formatObjectToString(formData.infoContacto),
      };
      await dispatch(updateItem(staff._id, updatedFields, "Staff"));
      setButtonState("done");
    } catch (error) {
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
      await dispatch(updateItem(staff._id, { Estado: status }, "Staff"));
      setButtonState("done");
    } catch {
      setButtonState("save");
    }
  };

  return (
    <Card className="w-full shadow-md rounded-lg overflow-hidden border border-gray-200">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-800 flex-1">
            {formData.Nombre} {formData.Apellido}
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

  

        {showEdit && (
          <>
            <div className="flex gap-4">
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
            </div>
            <div className="flex gap-4">
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
                Categoría:
                <input
                  type="text"
                  name="Categoria"
                  value={formData.Categoria}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                />
              </label>
            </div>
            <div className="flex gap-4">
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
                Celular:
                <input
                  type="text"
                  name="Celular"
                  value={formData.Celular}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                />
              </label>
            </div>
            <div className="flex gap-4">
              <label className="text-sm text-gray-700 flex-1">
                Dirección:
                <input
                  type="text"
                  name="Direccion"
                  value={formData.Direccion}
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
            </div>
            <div className="flex gap-4">
              <label className="text-sm text-gray-700 flex-1 flex items-center gap-2">
                Show:
                <input
                  type="checkbox"
                  name="Show"
                  checked={formData.Show}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1"
                />
              </label>
              <label className="text-sm text-gray-700 flex-1 flex items-center gap-2">
                Contratacion:
                <input
                  type="checkbox"
                  name="Contratacion"
                  checked={formData.Contratacion}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1"
                />
              </label>
              <label className="text-sm text-gray-700 flex-1 flex items-center gap-2">
                Es Admin:
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1"
                />
              </label>
            </div>
            {/* Cuenta bancaria anidada */}
            <div>
              <span className="text-xs text-gray-600">Cuenta Bancaria:</span>
              <div className="flex gap-4">
 
                <input
                  type="text"
                  name="tipo"
                  placeholder="Tipo"
                  value={formData.Cuenta.tipo}
                  onChange={(e) => handleNestedChange("Cuenta", e)}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1 flex-1"
                />
                <input
                  type="text"
                  name="numero"
                  placeholder="Número"
                  value={formData.Cuenta.numero}
                  onChange={(e) => handleNestedChange("Cuenta", e)}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1 flex-1"
                />
              </div>
              <div className="flex gap-4">
 
               <input
                  type="text"
                  name="banco"
                  placeholder="Banco"
                  value={formData.Cuenta.banco}
                  onChange={(e) => handleNestedChange("Cuenta", e)}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1 flex-1"
                />
              </div>
            </div>
            {/* Contacto de emergencia anidado */}
            <div>
              <span className="text-xs text-gray-600">Contacto Emergencia:</span>
              <div className="flex gap-4">
                <input
                  type="text"
                  name="nombreDeContacto"
                  placeholder="Nombre"
                  value={formData.infoContacto.nombreDeContacto}
                  onChange={(e) => handleNestedChange("infoContacto", e)}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1 flex-1"
                />
                <input
                  type="text"
                  name="numeroDeContacto"
                  placeholder="Número"
                  value={formData.infoContacto.numeroDeContacto}
                  onChange={(e) => handleNestedChange("infoContacto", e)}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 mt-1 flex-1"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
