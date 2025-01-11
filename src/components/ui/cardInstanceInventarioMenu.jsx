import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem, getRecepie, insertarRecetas, crearItem, crearReceta } from "../../redux/actions";
import { CATEGORIES, MenuItems } from "../../redux/actions-types";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";

export function CardInstanceInventarioMenu({ product, showEdit }) {
  const dispatch = useDispatch();
  const [editableProduct, setEditableProduct] = useState(product);
  const [receta, setReceta] = useState(null);
  const [showRecepie, setShowRecepie] = useState(false);
  const groupOptions = CATEGORIES;
  const [book, setBook] = useState("📕");
console.log(product);

  useEffect(() => {
    const fetchReceta = async () => {
      // console.log(product.Receta);
      
      // if (product.Receta !== null && product.Receta !== undefined && /^[0-9a-fA-F]{24}$/.test(product.Receta)) {
      if (product.Receta !== null && product.Receta !== undefined ) {
        const result = await getRecepie(product.Receta, "Recetas");
        setReceta(result);
        // console.log(result);
        
      }
    };

    product.Receta === null ? setReceta(null)   : fetchReceta();
  }, [product.Receta]);

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

  const toggleRecepie = () => {
    setShowRecepie(!showRecepie);
  };

  const handleSaveReceta = async (recetaData) => {
    try {
      await dispatch(insertarRecetas([recetaData]));
      await dispatch(updateItem(editableProduct._id, { Receta: recetaData._id }, "Menu"));
      setReceta(recetaData);
      alert("Receta guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar la receta:", error);
      alert("Hubo un error al guardar la receta.");
    }
  };

  const handleCreateReceta = async (recetaData, productId) => {
    try {
      await dispatch(crearReceta(recetaData, productId));
      setReceta(recetaData);
      alert("Receta creada correctamente.");
    } catch (error) {
      console.error("Error al crear la receta:", error);
      alert("Hubo un error al crear la receta.");
    }
  };

  const handleRecepie = () => {
    setBook((prev) => (prev === '📕' ? '📖' : '📕'));
  };

  return (
    <div className="border p-4 rounded-md shadow-md">
<div className="flex">
      <h3 className="text-lg font-bold">{`${product.NombreEN } -`}</h3>
      <h2 className="text-lg font-bold">- {product.Precio} </h2>
                
  </div>
<div className="flex">

                <button
            onClick={toggleEstado}
            className={`p-2 rounded-md mt-2 ${editableProduct.Estado === "Activo" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {editableProduct.Estado === "Activo" ? "Inactivar" : "Activar"}
          </button>

          <button
            onClick={handleRecepie}
            className="bg-yellow-500 text-white p-2 rounded-md mt-2 ml-2"
          >
            {book}
          </button>


          </div>


      {showEdit ? (
        <>
        <br></br>
          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1 font-bold">
              Nombre en Español:
              <input
                type="text"
                name="NombreES"
                value={editableProduct.NombreES || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1 font-bold">
              Nombre en Inglés:
              <input
                type="text"
                name="NombreEN"
                value={editableProduct.NombreEN || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
          </div>

          <div className="flex gap-4  ">


          <label className="text-sm text-gray-700 flex-1 font-bold ">
            Descripción en Español:
            <textarea
              name="DescripcionMenuES"
              value={editableProduct.DescripcionMenuES || ""}
              onChange={handleChange}
              className="border p-2 rounded-md  w-full mb-2 bg-slate-100 font-light h-24"
            />
          </label>
          <label className="text-sm text-gray-700 flex-1 font-bold">
            Descripción en Inglés:
            <textarea
              name="DescripcionMenuEN"
              value={editableProduct.DescripcionMenuEN || ""}
              onChange={handleChange}
              className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light h-24"
            />
          </label>

          </div>



          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1 font-bold">
              SubTipo en Español:
              <input
                type="text"
                name="SubTipoES"
                value={editableProduct.SubTipoES || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1 font-bold">
              SubTipo en Inglés:
              <input
                type="text"
                name="SubTipoEN"
                value={editableProduct.SubTipoEN || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
          </div>
          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1 font-bold">
              Dieta en Español:
              <input
                type="text"
                name="DietaES"
                value={editableProduct.DietaES || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1 font-bold">
              Dieta en Inglés:
              <input
                type="text"
                name="DietaEN"
                value={editableProduct.DietaEN || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
          </div>
          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1 font-bold">
              Cuidado en Español:
              <input
                type="text"
                name="CuidadoES"
                value={editableProduct.CuidadoES || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1 font-bold">
              Cuidado en Inglés:
              <input
                type="text"
                name="CuidadoEN"
                value={editableProduct.CuidadoEN || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
          </div>
          <label className="text-sm text-gray-700 flex-1 font-bold">
            Grupo:
            <select
              name="GRUPO"
              value={editableProduct.GRUPO || ""}
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

          {/* Nuevo label para editar el Precio */}
          <label className="text-sm text-gray-700 flex-1 font-bold">
            Precio:
            <input
              type="number"
              name="Precio"
              value={editableProduct.Precio || ""}
              onChange={handleChange}
              className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
            />
          </label>

          <label className="text-sm text-gray-700 flex-1 font-bold flex ">
            Foto:
          </label>

          <label className="text-sm text-gray-700 flex-1 font-bold flex ">
           {editableProduct.Foto && <a href={editableProduct.Foto} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              
              <button
            onClick={handleSave}
            className="bg-blue-500 text-white pt-2  rounded-md"
          >
            🖼️
          </button>
            </a>}
            <input
              type="text"
              name="Foto"
              value={editableProduct.Foto || ""}
              onChange={handleChange}
              className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
            />
          </label>
          <br></br>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white pt-2  rounded-md"
          >
            Save
          </button>


        </>
      ) : (
        <>


     
        </>
      )}
 
        
    

{book === '📖' && (

<RecepieOptionsMenu
product={product}
Receta={receta}
currentType={MenuItems}
onSaveReceta={handleSaveReceta}
onCreateReceta={handleCreateReceta}
/>

)}
      
    </div>
  );
}

