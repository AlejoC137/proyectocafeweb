import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateItem } from "../../redux/actions";
import { CATEGORIES } from "../../redux/actions-types";

export function CardInstanceInventario({ product }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    CANTIDAD: product.CANTIDAD || "",
    UNIDADES: product.UNIDADES || "",
    COSTO: product.COSTO || "",
    GRUPO: "", // Inicializar como vacío para que el placeholder se muestre
  });

  // Opciones disponibles para el campo GRUPO
  const groupOptions = CATEGORIES;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    try {
      const updatedFields = {
        CANTIDAD: formData.CANTIDAD,
        UNIDADES: formData.UNIDADES,
        COSTO: formData.COSTO,
        GRUPO: formData.GRUPO || product.GRUPO, // Mantener el valor original si no se cambia
      };

      await dispatch(updateItem(product._id, updatedFields));
      alert("Ítem actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      alert("Hubo un error al actualizar el ítem.");
    }
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
      <CardContent className="p-4 flex flex-col gap-2">
        {/* Nombre del producto */}
        <h3 className="text-base font-semibold text-gray-800">
          {product.Nombre_del_producto || "Producto sin nombre"}
        </h3>

        {/* Campos Editables */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-700">
            Cantidad:
            <input
              type="text"
              name="CANTIDAD"
              value={formData.CANTIDAD}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>
          <label className="text-sm text-gray-700">
            Unidades:
            <input
              type="text"
              name="UNIDADES"
              value={formData.UNIDADES}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>
          <label className="text-sm text-gray-700">
            Costo:
            <input
              type="text"
              name="COSTO"
              value={formData.COSTO}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>
          <label className="text-sm text-gray-700">
            Grupo: {formData.GRUPO }
            <select
              name="GRUPO"
              value={formData.GRUPO}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            >
              {/* Placeholder dinámico */}
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

        {/* Botón para Guardar Cambios */}
        <Button
          className="mt-4 bg-blue-500 text-white hover:bg-blue-600"
          onClick={handleUpdate}
        >
          Guardar Cambios
        </Button>
      </CardContent>
    </Card>
  );
}
