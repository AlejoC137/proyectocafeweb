import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { updateItem, getRecepie, deleteItem, crearReceta, insertarRecetas } from "../../redux/actions";
import { MenuItems } from "../../redux/actions-types";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";
import FormularioMenuAlmuerzo from "../../body/views/actualizarPrecioUnitario/FormularioMenuAlmuerzo";

// Botón reutilizable
const ActionButton = ({ onClick, children, className = '' }) => (
  <button onClick={onClick} className={`p-2 rounded-md text-white font-semibold transition-colors duration-200 ${className}`}>
    {children}
  </button>
);

export function ProductRow({ product }) {
  const dispatch = useDispatch();

  // --- ESTADO ---
  const [isEditing, setIsEditing] = useState(false);
  const [isRecipeVisible, setIsRecipeVisible] = useState(false);
  const [isLunchFormVisible, setIsLunchFormVisible] = useState(false); // Nuevo estado para el formulario
  const [editableProduct, setEditableProduct] = useState(product);
  const [receta, setReceta] = useState(null);

  // Sincroniza el estado editable si el producto original cambia.
  useEffect(() => {
    setEditableProduct(product);
  }, [product]);

  // Obtiene la receta asociada al producto.
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

  /**
   * Recibe datos del FormularioMenuAlmuerzo y los guarda en el estado editable.
   */
  const handleLunchDataChange = useCallback((lunchData) => {
    const lunchJsonString = JSON.stringify(lunchData, null, 2);
    setEditableProduct(prev => ({
      ...prev,
      Comp_Lunch: lunchJsonString,
    }));
  }, []);

  // Guarda todos los cambios del producto, incluyendo los del almuerzo.
  const handleSave = () => {
    dispatch(updateItem(product._id, editableProduct, "Menu"));
    setIsEditing(false);
    setIsLunchFormVisible(false); // Resetea la visibilidad del formulario
  };

  // Cancela la edición y restaura el estado original.
  const handleCancelEdit = () => {
    setEditableProduct(product);
    setIsEditing(false);
    setIsLunchFormVisible(false); // Resetea la visibilidad del formulario
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar "${product.NombreES}"?`)) {
      dispatch(deleteItem(product._id, "Menu"));
    }
  };

  // Parsea los datos del almuerzo para pasarlos al formulario hijo.
  const initialLunchData = React.useMemo(() => {
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
    <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col justify-between transition-shadow hover:shadow-xl">
      {/* Sección principal de datos del producto */}
      <div className="p-4 border-b">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              name="NombreES"
              value={editableProduct.NombreES}
              onChange={handleChange}
              className="p-2 border rounded-md w-full"
              placeholder="Nombre del Producto"
            />
            <input
              type="number"
              name="Precio"
              value={editableProduct.Precio}
              onChange={handleChange}
              className="p-2 border rounded-md w-full"
              placeholder="Precio"
            />
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">{product.NombreES}</h3>
            <p className="text-md font-semibold text-green-600">{`$${product.Precio}`}</p>
          </div>
        )}
      </div>

      {/* Formulario de Almuerzo (visible solo en modo edición Y si se activa) */}
      {isEditing && isLunchFormVisible && (
        <div className="p-4 bg-gray-50">
          <FormularioMenuAlmuerzo
            onMenuChange={handleLunchDataChange}
            initialData={initialLunchData}
          />
        </div>
      )}

      {/* Menú de Receta (visible condicionalmente) */}
      {isRecipeVisible && (
        <div className="p-4 bg-blue-50">
          <RecepieOptionsMenu
            product={product}
            Receta={receta}
            currentType={MenuItems}
          />
        </div>
      )}

      {/* Barra de Acciones */}
      <div className="p-4 bg-gray-100 rounded-b-lg">
        <div className="flex items-center justify-center space-x-2">
          {isEditing ? (
            <>
              <ActionButton onClick={() => setIsLunchFormVisible(!isLunchFormVisible)} className="bg-green-500 hover:bg-green-600">
                {isLunchFormVisible ? 'Ocultar Form' : 'Ver Form'}
              </ActionButton>
              <ActionButton onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 w-full">Guardar</ActionButton>
              <ActionButton onClick={handleCancelEdit} className="bg-gray-400 hover:bg-gray-500 w-full">Cancelar</ActionButton>
            </>
          ) : (
            <>
              <ActionButton onClick={() => setIsEditing(true)} className="bg-yellow-500 hover:bg-yellow-600">Editar</ActionButton>
              <ActionButton onClick={() => setIsRecipeVisible(!isRecipeVisible)} className="bg-purple-500 hover:bg-purple-600">Receta</ActionButton>
              <ActionButton onClick={handleDelete} className="bg-red-700 hover:bg-red-800">Eliminar</ActionButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
