import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem, getRecepie, insertarRecetas, crearItem, crearReceta, deleteItem } from "../../redux/actions";
import { 
  CATEGORIES, 
  SUB_CATEGORIES, 
  
  MenuItems } from "../../redux/actions-types";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";
import CuidadoVariations from "./CuidadoVariations";
import { useParams } from "react-router-dom";

export function CardInstanceInventarioMenu({ product, showEdit }) {

// como saber cual es la direccion del sitio actual es decir /Inventario o /MenuPrint

    const { section } = useParams(); // 'section' contendrá "Inventario" o "MenuPrint"

  const dispatch = useDispatch();
  const [editableProduct, setEditableProduct] = useState(product);
  const [receta, setReceta] = useState(null);
  const [showRecepie, setShowRecepie] = useState(false);
  const groupOptions = CATEGORIES;
  const sub_groupOptions = SUB_CATEGORIES;
  const [book, setBook] = useState("📕");
  // const [book, setBook] = useState("📖");
  const [info, setInfo] = useState("📥");
  const [deletet, setDeletet] = useState("❌");
  // const [info, setInfo] = useState("📤");
 
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
  const togglePrint = () => {
    const newPrint = editableProduct.PRINT === true ? false : true ;
    setEditableProduct({ ...editableProduct, PRINT: newPrint });
    dispatch(updateItem(editableProduct._id, { PRINT: newPrint }, "Menu"));
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
  const handleInfo = () => {
    setInfo((prev) => (prev === '📤' ? '📥' : '📤'));
  };
  const handleDelete = async () => {
    try {
      await dispatch(deleteItem(editableProduct._id, "Menu"));

  
      alert("Receta eliminada correctamente.");
  
      setDeletet((prev) => (prev === '❌' ? '💀' : '❌'));
    } catch (error) {
      console.error("Error al eliminar la receta:", error);
      alert("Hubo un error al eliminar la receta.");
    }
  };

  return (
    <div className="border p-4 rounded-md shadow-md">


<div className="flex">
      <h3 className="text-lg font-bold">{`${product.NombreES } -`}</h3>
      <h2 className="text-lg font-bold">- {product.Precio} </h2>
                
  </div>
<div className="flex">


                <button
            onClick={togglePrint}
            className={`p-2 rounded-md mt-2 ${editableProduct.PRINT === true ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {editableProduct.PRINT === true ? "No Print" : "Print"}
          </button>
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
          <button
            onClick={handleInfo}
            className="bg-yellow-500 text-white p-2 rounded-md mt-2 ml-2"
          >
            {info}
          </button>
          {/* <button
            onClick={handleDelete}
            className="bg-red-500 text-white p-2 rounded-md mt-2 ml-2"
          >
            {deletet}
          </button> */}


          </div>


      {showEdit && (info === '📤' )? (
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
              Tipo en Español:
              <input
                type="text"
                name="TipoES"
                value={editableProduct.TipoES || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1 font-bold">
              Tipo en Inglés:
              <input
                type="text"
                name="TipoEN"
                value={editableProduct.TipoEN || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label>
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
              Cuidado:
              <CuidadoVariations isEnglish={false} viewName={"Inventario"} product={product} />
              {/* <input
                type="text"
                name="CuidadoES"
                value={editableProduct.CuidadoES || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              /> */}
            </label>
            {/* <label className="text-sm text-gray-700 flex-1 font-bold">
              Cuidado en Inglés:
              <input
                type="text"
                name="CuidadoEN"
                value={editableProduct.CuidadoEN || ""}
                onChange={handleChange}
                className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
              />
            </label> */}
            <label className="text-sm text-gray-700 flex-1 font-bold">
              Order Menu Print:
              <input
                type="text"
                name="Order"
                value={editableProduct.Order || ""}
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
          <label className="text-sm text-gray-700 flex-1 font-bold">
            Sub Grupo:
            <select
              name="SUB_GRUPO"
              value={editableProduct.SUB_GRUPO || ""}
              onChange={handleChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            >
              <option value="" disabled>
                {product.SUB_GRUPO ? `Actual: ${product.SUB_GRUPO}` : "Selecciona un SUB_GRUPO"}
              </option>
              {sub_groupOptions.map((option) => (
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

