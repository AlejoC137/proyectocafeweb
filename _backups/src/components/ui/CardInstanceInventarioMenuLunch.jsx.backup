import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from "react-redux";
import { updateItem, getRecepie, deleteItem } from "../../redux/actions";
import { MenuItems } from "../../redux/actions-types";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";
import FormularioMenuAlmuerzo from "../../body/views/actualizarPrecioUnitario/FormularioMenuAlmuerzo";

// Componente de Botón Reutilizable
const ActionButton = ({ onClick, children, className = '' }) => (
  <button onClick={onClick} className={`p-2 rounded-md text-white font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 ${className}`}>
    {children}
  </button>
);

// Componente de Tarjeta para cada Producto del Menú
export function CardInstanceInventarioMenuLunch({ product }) {
  const dispatch = useDispatch();

  // --- ESTADOS ---
  const [isEditing, setIsEditing] = useState(false);
  const [isRecipeVisible, setIsRecipeVisible] = useState(false);
  const [isLunchFormVisible, setIsLunchFormVisible] = useState(false);
  const [editableProduct, setEditableProduct] = useState(product);
  const [receta, setReceta] = useState(null);

  useEffect(() => {
    setEditableProduct(product);
  }, [product]);

  useEffect(() => {
    const fetchReceta = async () => {
      if (product.Receta) {
        const result = await getRecepie(product.Receta, "Recetas");
        setReceta(result);
      } else {
        setReceta(null);
      }
    };
    fetchReceta();
  }, [product.Receta]);

  // --- MANEJADORES DE EVENTOS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleLunchDataChange = useCallback((lunchData) => {
    const lunchJsonString = JSON.stringify(lunchData, null, 2);
    setEditableProduct(prev => ({ ...prev, Comp_Lunch: lunchJsonString }));
  }, []);

  // Manejador para la edición general (Nombre, Precio)
  const handleSave = () => {
    dispatch(updateItem(product._id, editableProduct, "Menu"));
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditableProduct(product);
    setIsEditing(false);
  };
  
  // --- NUEVO: Manejadores específicos para el formulario de almuerzo ---
  const handleSaveLunchForm = () => {
    dispatch(updateItem(product._id, editableProduct, "Menu"));
    setIsLunchFormVisible(false); // Cierra el formulario de almuerzo al guardar
  };

  const handleCancelLunchForm = () => {
    setEditableProduct(product); // Revierte cualquier cambio en el estado local
    setIsLunchFormVisible(false); // Cierra el formulario de almuerzo
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar "${product.NombreES}"?`)) {
      dispatch(deleteItem(product._id, "Menu"));
    }
  };

  const initialLunchData = useMemo(() => {
    try {
      if (product.Comp_Lunch && typeof product.Comp_Lunch === 'string') {
        return JSON.parse(product.Comp_Lunch);
      }
    } catch (e) {
      console.error("Error al parsear Comp_Lunch:", e);
    }
    return null;
  }, [product.Comp_Lunch]);

  return (
    <div className="w-full bg-white rounded-lg shadow-lg flex flex-col transition-shadow hover:shadow-xl">
      {/* Fila Principal Estática: Información y Acciones */}
      <div className="p-4 flex items-center justify-between border-b">
        {/* Lado Izquierdo: Nombre y Precio */}
        <div className="flex-grow min-w-0 pr-4">
            <h3 className="text-lg font-bold text-gray-800 truncate">{product.NombreES}</h3>
            <p className="text-md font-semibold text-green-600">{`$${product.Precio}`}</p>
        </div>

        {/* Lado Derecho: Botones de Acción (siempre visibles) */}
        <div className="flex items-center space-x-2 flex-shrink-0">
            <ActionButton onClick={() => setIsEditing(!isEditing)} className="bg-yellow-500 hover:bg-yellow-600"><span>✏️</span></ActionButton>
            <ActionButton onClick={() => setIsLunchFormVisible(!isLunchFormVisible)} className="bg-green-500 hover:bg-green-600"><span>📝</span></ActionButton>
            <ActionButton onClick={() => setIsRecipeVisible(!isRecipeVisible)} className="bg-purple-500 hover:bg-purple-600"><span>📖</span></ActionButton>
            <ActionButton onClick={handleDelete} className="bg-red-700 hover:bg-red-800"><span>🗑️</span></ActionButton>
        </div>
      </div>

      {/* --- CONTENIDO EXPANDIBLE DEBAJO --- */}

      {/* Sección de Edición General (aparece al hacer clic en ✏️) */}
      {isEditing && (
        <div className="p-4 bg-yellow-50 border-b space-y-4">
            <h4 className="font-bold text-yellow-800">Editando Producto</h4>
            <input type="text" name="NombreES" value={editableProduct.NombreES} onChange={handleChange} className="p-2 border rounded-md w-full" />
            <input type="number" name="Precio" value={editableProduct.Precio} onChange={handleChange} className="p-2 border rounded-md w-full" />
            <div className="flex space-x-2">
              <ActionButton onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 w-full"><span>✅</span><span>Guardar</span></ActionButton>
              <ActionButton onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600 w-full"><span>❌</span><span>Cancelar</span></ActionButton>
            </div>
        </div>
      )}

      {/* MODIFICADO: Sección del Formulario de Almuerzo con botones de acción */}
      {isLunchFormVisible && (
        <div className="p-4 bg-green-50 border-b space-y-4">
          <h4 className="font-bold text-green-800">Editando Componentes del Almuerzo</h4>
          <FormularioMenuAlmuerzo onMenuChange={handleLunchDataChange} initialData={initialLunchData}  product={ product}/>
          {/* NUEVO: Botones para guardar o cancelar los cambios del almuerzo */}
          <div className="flex space-x-2 pt-2">
            <ActionButton onClick={handleSaveLunchForm} className="bg-blue-500 hover:bg-blue-600 w-full">
              <span>💾</span>
              <span>Guardar Almuerzo</span>
            </ActionButton>
            <ActionButton onClick={handleCancelLunchForm} className="bg-gray-500 hover:bg-gray-600 w-full">
              <span>❌</span>
              <span>Cancelar</span>
            </ActionButton>
          </div>
        </div>
      )}

      {/* Sección de Receta (aparece al hacer clic en 📖) */}
      {isRecipeVisible && (
        <div className="p-4 bg-purple-50">
          <RecepieOptionsMenu product={product} Receta={receta} currentType={MenuItems} />
        </div>
      )}
    </div>
  );
}