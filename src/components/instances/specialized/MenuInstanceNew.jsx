import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { MenuInstanceCard } from '../base/InstanceCard';
import { useMenuForm } from '../hooks/useInstanceForm';
import { useMenuActions } from '../hooks/useInstanceActions';
import { updateItem, getRecepie, insertarRecetas, crearReceta, deleteItem } from '../../../redux/actions';
import { CATEGORIES, SUB_CATEGORIES, MenuItems } from '../../../redux/actions-types';
import RecepieOptionsMenu from '../../../body/components/recepieOptions/RecepieOptionsMenu';

/**
 * Componente MenuInstance refactorizado usando la nueva arquitectura
 * CRUD completo para gestión de menú con campos bilingües y recetas
 */
export function MenuInstanceNew({ product, showEdit: propShowEdit = true }) {
  const dispatch = useDispatch();

  // Usar hooks de la nueva arquitectura
  const { formData, handleChange, isDirty, markAsSaved } = useMenuForm(product);
  const { 
    handleUpdate, 
    handleDelete, 
    buttonState,
    canSave 
  } = useMenuActions(product._id, {
    onSuccess: () => markAsSaved(),
    reloadOnSuccess: false,
    showAlerts: true
  });

  // Estados locales específicos del menú
  const [receta, setReceta] = useState(null);
  const [showRecepie, setShowRecepie] = useState(false);
  const [book, setBook] = useState("📕");
  const [info, setInfo] = useState("📥");
  const [showEdit, setShowEdit] = useState(propShowEdit);

  // Cargar receta si existe
  useEffect(() => {
    const fetchReceta = async () => {
      if (product.Receta !== null && product.Receta !== undefined) {
        const result = await getRecepie(product.Receta, "Recetas");
        setReceta(result);
      }
    };

    product.Receta === null ? setReceta(null) : fetchReceta();
  }, [product.Receta]);

  // Función para guardar cambios del menú
  const onSave = async () => {
    await handleUpdate(formData);
  };

  // Función para toggle de estado activo/inactivo
  const toggleEstado = () => {
    const newEstado = formData.Estado === "Activo" ? "Inactivo" : "Activo";
    const updatedData = { ...formData, Estado: newEstado };
    handleChange({ target: { name: 'Estado', value: newEstado } });
    dispatch(updateItem(formData._id, { Estado: newEstado }, "Menu"));
  };

  // Función para toggle de PRINT
  const togglePrint = () => {
    const newPrint = formData.PRINT === true ? false : true;
    const updatedData = { ...formData, PRINT: newPrint };
    handleChange({ target: { name: 'PRINT', value: newPrint } });
    dispatch(updateItem(formData._id, { PRINT: newPrint }, "Menu"));
  };

  // Función para manejo de recetas
  const handleSaveReceta = async (recetaData) => {
    try {
      await dispatch(insertarRecetas([recetaData]));
      await dispatch(updateItem(formData._id, { Receta: recetaData._id }, "Menu"));
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

  // Toggles para UI
  const handleRecepie = () => {
    setBook(prev => prev === '📕' ? '📖' : '📕');
  };

  const handleInfo = () => {
    setInfo(prev => prev === '📤' ? '📥' : '📤');
    setShowEdit(prev => !prev);
  };

  // Header con controles principales
  const menuHeader = (
    <div className="flex items-center gap-2">
      {/* Precio */}
      <h2 className="text-lg font-bold text-gray-900">
        ${formData.Precio}
      </h2>
      
      {/* Controles principales */}
      <div className="flex gap-1">
        <button
          onClick={togglePrint}
          className={`p-2 rounded-md text-white text-sm transition-colors ${
            formData.PRINT === true ? "bg-red-500 hover:bg-red-400" : "bg-green-500 hover:bg-green-600"
          }`}
          title={formData.PRINT === true ? "Desactivar impresión" : "Activar impresión"}
        >
          {formData.PRINT === true ? "No Print" : "Print"}
        </button>
        
        <button
          onClick={toggleEstado}
          className={`p-2 rounded-md text-white text-sm transition-colors ${
            formData.Estado === "Activo" ? "bg-red-500 hover:bg-red-400" : "bg-green-500 hover:bg-green-600"
          }`}
          title={formData.Estado === "Activo" ? "Desactivar" : "Activar"}
        >
          {formData.Estado === "Activo" ? "Inactivar" : "Activar"}
        </button>
        
        <button
          onClick={handleRecepie}
          className="bg-yellow-500 text-white p-2 rounded-md text-sm hover:bg-yellow-600 transition-colors"
          title="Ver/Editar receta"
        >
          {book}
        </button>
        
        <button
          onClick={handleInfo}
          className="bg-blue-500 text-white p-2 rounded-md text-sm hover:bg-blue-600 transition-colors"
          title="Mostrar/Ocultar campos de edición"
        >
          {info}
        </button>
      </div>
    </div>
  );

  // Formulario completo de edición
  const menuEditForm = showEdit && info === '📤' ? (
    <div className="space-y-4 border-t pt-4">
      {/* Nombres bilingües */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Nombre en Español:
          <input
            type="text"
            name="NombreES"
            value={formData.NombreES || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Nombre en Inglés:
          <input
            type="text"
            name="NombreEN"
            value={formData.NombreEN || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
      </div>

      {/* Descripciones bilingües */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Descripción en Español:
          <textarea
            name="DescripcionMenuES"
            value={formData.DescripcionMenuES || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light h-24"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Descripción en Inglés:
          <textarea
            name="DescripcionMenuEN"
            value={formData.DescripcionMenuEN || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light h-24"
          />
        </label>
      </div>

      {/* Tipos bilingües */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Tipo en Español:
          <input
            type="text"
            name="TipoES"
            value={formData.TipoES || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Tipo en Inglés:
          <input
            type="text"
            name="TipoEN"
            value={formData.TipoEN || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          SubTipo en Español:
          <input
            type="text"
            name="SubTipoES"
            value={formData.SubTipoES || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          SubTipo en Inglés:
          <input
            type="text"
            name="SubTipoEN"
            value={formData.SubTipoEN || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
      </div>

      {/* Dieta y cuidado bilingües */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Dieta en Español:
          <input
            type="text"
            name="DietaES"
            value={formData.DietaES || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Dieta en Inglés:
          <input
            type="text"
            name="DietaEN"
            value={formData.DietaEN || ""}
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
            value={formData.CuidadoES || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Cuidado en Inglés:
          <input
            type="text"
            name="CuidadoEN"
            value={formData.CuidadoEN || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Order Menu Print:
          <input
            type="text"
            name="Order"
            value={formData.Order || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
      </div>

      {/* Categorización y precio */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Grupo:
          <select
            name="GRUPO"
            value={formData.GRUPO || ""}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          >
            <option value="" disabled>
              {product.GRUPO ? `Actual: ${product.GRUPO}` : "Selecciona un grupo"}
            </option>
            {CATEGORIES.map(option => (
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
            value={formData.SUB_GRUPO || ""}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          >
            <option value="" disabled>
              {product.SUB_GRUPO ? `Actual: ${product.SUB_GRUPO}` : "Selecciona un SUB_GRUPO"}
            </option>
            {SUB_CATEGORIES.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Precio:
          <input
            type="number"
            name="Precio"
            value={formData.Precio || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
      </div>

      {/* Foto */}
      <div className="flex gap-2 items-end">
        <label className="text-sm text-gray-700 flex-1 font-bold">
          Foto:
          <input
            type="text"
            name="Foto"
            value={formData.Foto || ""}
            onChange={handleChange}
            className="border p-2 rounded-md w-full mb-2 bg-slate-100 font-light"
          />
        </label>
        {formData.Foto && (
          <a 
            href={formData.Foto} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 underline mb-2"
          >
            <button className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors">
              🖼️
            </button>
          </a>
        )}
        <button
          onClick={onSave}
          disabled={!canSave}
          className="bg-blue-500 text-white px-4 py-2 rounded-md mb-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  ) : null;

  // Sección de receta
  const recipeSection = book === '📖' ? (
    <div className="border-t pt-4">
      <RecepieOptionsMenu
        product={product}
        Receta={receta}
        currentType={MenuItems}
        onSaveReceta={handleSaveReceta}
        onCreateReceta={handleCreateReceta}
      />
    </div>
  ) : null;

  return (
    <MenuInstanceCard
      title={`${formData.NombreES || product.NombreES}`}
      data={product}
      buttonState={buttonState}
      onSave={onSave}
      onDelete={() => handleDelete("Menu")}
      showActions={true}
      showStatusButtons={false} // Los estados se manejan con los toggles personalizados
      headerSlot={menuHeader}
      className="border p-4 rounded-md shadow-md"
    >
      {menuEditForm}
      {recipeSection}
    </MenuInstanceCard>
  );
}
