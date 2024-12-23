import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem, getRecepie } from "../../redux/actions";
import { CATEGORIES } from "../../redux/actions-types";
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions";

export function CardInstanceInventarioMenu({ product, showEdit }) {
  const dispatch = useDispatch();
  const [editableProduct, setEditableProduct] = useState(product);
  const [receta, setReceta] = useState(null);
  const groupOptions = CATEGORIES;

  useEffect(() => {
    const fetchReceta = async () => {
      if (product.forId) {
        const result = await getRecepie(product.forId, "Recetas");
        setReceta(result);
      }
    };

    fetchReceta();
  }, [product.forId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableProduct({ ...editableProduct, [name]: value });
  };

  const handleSave = () => {
    dispatch(updateItem(editableProduct._id, editableProduct, "Menu"));
  };

  const toggleEstado = () => {
    const newEstado = editableProduct.Estado === "Activo" ? "Inactivo" : "Activo";
    setEditableProduct({ ...editableProduct, Estado: newEstado });
    dispatch(updateItem(editableProduct._id, { Estado: newEstado }, "Menu"));
  };

  return (
    <div className="border p-4 rounded-md shadow-md">
      {showEdit ? (
        <>
          <input
            type="text"
            name="NombreEN"
            value={editableProduct.NombreEN}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100"
          />
          <input
            type="text"
            name="NombreES"
            value={editableProduct.NombreES}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100"
          />
          <textarea
            name="DescripcionMenuEN"
            value={editableProduct.DescripcionMenuEN}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100"
          />
          <textarea
            name="DescripcionMenuES"
            value={editableProduct.DescripcionMenuES}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100"
          />
          <label className="text-sm text-gray-700 flex-1">
            Grupo:
            <select
              name="GRUPO"
              value={editableProduct.GRUPO}
              onChange={handleChange}
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
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white p-2 rounded-md"
          >
            Save
          </button>
          <button
            onClick={toggleEstado}
            className={`p-2 rounded-md mt-2 ${editableProduct.Estado === "Activo" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {editableProduct.Estado === "Activo" ? "Inactivar" : "Activar"}
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold">{product.NombreEN}</h3>
          <p>{product.DescripcionMenuEN}</p>
          <p>{product.Precio}</p>
          <p>{product.GRUPO}</p>
          <button
            onClick={toggleEstado}
            className={`p-2 rounded-md mt-2 ${editableProduct.Estado === "Activo" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {editableProduct.Estado === "Activo" ? "Inactivar" : "Activar"}
          </button>
        </>
      )}
      {receta && <RecepieOptions product={product} Receta={receta} currentType="Menu" />}
    </div>
  );
}