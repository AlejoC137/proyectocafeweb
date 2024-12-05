import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem } from "../../redux/actions";
import { CATEGORIES, ESTATUS } from "../../redux/actions-types";


export function CardInstanceInventario({ product }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    CANTIDAD: product.CANTIDAD || "",
    UNIDADES: product.UNIDADES || "",
    COSTO: product.COSTO || "",
    GRUPO: product.GRUPO || "",
    Estado: product.Estado || ESTATUS[0], // Inicializar con el primer valor de ESTATUS
  });

  const [buttonState, setButtonState] = useState("save"); // Estados: 'save', 'syncing', 'done'

  const groupOptions = CATEGORIES;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setButtonState("save");
  };

  const handleUpdate = async () => {
    setButtonState("syncing");
    try {
      const updatedFields = {
        CANTIDAD: formData.CANTIDAD,
        UNIDADES: formData.UNIDADES,
        COSTO: formData.COSTO,
        GRUPO: formData.GRUPO,
        Estado: formData.Estado,
        COOR: 1.05,
        FECHA_ACT: new Date().toISOString().split("T")[0],
      };

      await dispatch(updateItem(product._id, updatedFields));
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
        await dispatch(deleteItem(product._id)); // Llama a la acción para eliminar
        setButtonState("done");
        alert("Ítem eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el ítem:", error);
        alert("Hubo un error al eliminar el ítem.");
        setButtonState("save");
      }
    }
  };
  

  const handleStatusChange = (status) => {
    console.log(typeof status);
    
    setFormData((prev) => ({
      ...prev,
      Estado: status,
    }));
    setButtonState("save"); // Cambiar estado del botón de guardar
  };

  return (
    <Card className="w-full shadow-md rounded-lg overflow-hidden border border-gray-200">
      {/* Imagen del producto */}
      {product.bannerIMG && (
        <div className="relative h-[150px] w-full bg-gray-100">
          <img
            src={product.bannerIMG || "/default-image.jpg"}
            alt={product.Nombre_del_producto || "Producto sin nombre"}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Contenido del producto */}
      <CardContent className="p-4 flex flex-col gap-4">
        {/* Nombre del producto y botón de guardar en la misma fila */}
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-800 flex-1">
            {product.Nombre_del_producto || "Producto sin nombre"}
          </h3>
          {/* <Button
            className="bg-red-500 text-white hover:bg-blue-600"
            onClick={
              
              handleDelete
            }
          >
            {buttonState === "save" && "🧨"}
            {buttonState === "syncing" && "🔄"}
            {buttonState === "done" && "✅"}
          </Button> */}
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={
              handleUpdate
              
            }
          >
            {buttonState === "save" && "💾"}
            {buttonState === "syncing" && "🔄"}
            {buttonState === "done" && ""}
          </Button>
        </div>

        {/* Botones de Estado */}
        <div className="flex gap-2">
          {ESTATUS.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`flex-1 py-2 rounded text-white ${
                formData.Estado === status
                  ? "bg-green-500"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Precio por unidad y última actualización en la misma fila */}
        <div className="flex gap-4">
          <label className="text-sm text-gray-700 flex-1">
            Precio por unidad:
            <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
              {product.precioUnitario}
            </h3>
          </label>
          <label className="text-sm text-gray-700 flex-1">
            Última Actualización:
            <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
              {product.FECHA_ACT}
            </h3>
          </label>
        </div>

        {/* Cantidad y Unidades en la misma fila */}
        <div className="flex gap-4">
          <label className="text-sm text-gray-700 flex-1">
            Cantidad:
            <input
              type="text"
              name="CANTIDAD"
              value={formData.CANTIDAD}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>
          <label className="text-sm text-gray-700 flex-1">
            Unidades:
            <input
              type="text"
              name="UNIDADES"
              value={formData.UNIDADES}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>
        </div>

        {/* Costo y Grupo en la misma fila */}
        <div className="flex gap-4">
          <label className="text-sm text-gray-700 flex-1">
            Costo:
            <input
              type="text"
              name="COSTO"
              value={formData.COSTO}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>
          <label className="text-sm text-gray-700 flex-1">
            Grupo:
            <select
              name="GRUPO"
              value={formData.GRUPO}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            >
              <option value="" disabled>
                {product.GRUPO ? `Actual: ${product.GRUPO}` : "Selecciona un grupo"}
              </option>
              {groupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
