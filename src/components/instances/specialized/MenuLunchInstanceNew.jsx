import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { MenuInstanceCard } from '../base/InstanceCard';
import { useMenuForm } from '../hooks/useInstanceForm';
import { useMenuActions } from '../hooks/useInstanceActions';
import { useJSONField } from '../hooks/useJSONField';
import { updateItem, getRecepie, deleteItem } from '../../../redux/actions';
import { MenuItems } from '../../../redux/actions-types';
import RecepieOptionsMenu from '../../../body/components/recepieOptions/RecepieOptionsMenu';
import FormularioMenuAlmuerzo from '../../../body/views/actualizarPrecioUnitario/FormularioMenuAlmuerzo';

/**
 * Componente ActionButton reutilizable para el menú lunch
 */
const ActionButton = ({ onClick, children, className = '' }) => (
  <button 
    onClick={onClick} 
    className={`p-2 rounded-md text-white font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 ${className}`}
  >
    {children}
  </button>
);

/**
 * Componente MenuLunchInstance refactorizado usando la nueva arquitectura
 * El más complejo: maneja menú de almuerzo con formulario expandible y múltiples estados
 */
export function MenuLunchInstanceNew({ product }) {
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
    showAlerts: false // Manejamos alertas manualmente
  });

  // Estados de UI expandibles
  const [isEditing, setIsEditing] = useState(false);
  const [isRecipeVisible, setIsRecipeVisible] = useState(false);
  const [isLunchFormVisible, setIsLunchFormVisible] = useState(false);
  const [receta, setReceta] = useState(null);

  // Hook para manejar Comp_Lunch JSON
  const lunchData = useJSONField(product.Comp_Lunch, {});

  // Cargar receta
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

  // Sincronizar datos de producto con estado local
  useEffect(() => {
    // El hook useMenuForm ya maneja esto, pero aquí podemos agregar lógica específica si es necesaria
  }, [product]);

  // Manejar cambios en datos de almuerzo
  const handleLunchDataChange = useCallback((newLunchData) => {
    lunchData.updateValue(newLunchData);
  }, [lunchData]);

  // Manejador para edición general (Nombre, Precio)
  const handleSaveGeneral = async () => {
    await handleUpdate(formData);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    // El hook ya maneja el reset
    setIsEditing(false);
  };
  
  // Manejadores específicos para el formulario de almuerzo
  const handleSaveLunchForm = async () => {
    const updatedData = {
      ...formData,
      Comp_Lunch: lunchData.stringifyValue
    };
    
    await handleUpdate(updatedData);
    setIsLunchFormVisible(false);
  };

  const handleCancelLunchForm = () => {
    // Revertir cambios en lunch data
    lunchData.updateValue(product.Comp_Lunch);
    setIsLunchFormVisible(false);
  };

  // Manejar eliminación con confirmación
  const handleDeleteWithConfirm = () => {
    if (window.confirm(`¿Estás seguro de eliminar "${product.NombreES}"?`)) {
      handleDelete();
    }
  };

  // Datos iniciales para el formulario de almuerzo
  const initialLunchData = useMemo(() => {
    return lunchData.value;
  }, [lunchData.value]);

  // Header principal con información básica
  const lunchHeader = (
    <div className="flex items-center gap-4">
      <div className="flex-grow min-w-0">
        <h3 className="text-lg font-bold text-gray-800 truncate">{product.NombreES}</h3>
        <p className="text-md font-semibold text-green-600">{`$${product.Precio}`}</p>
      </div>

      {/* Botones de acción principales */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <ActionButton 
          onClick={() => setIsEditing(!isEditing)} 
          className="bg-yellow-500 hover:bg-yellow-600"
        >
          <span>✏️</span>
        </ActionButton>
        <ActionButton 
          onClick={() => setIsLunchFormVisible(!isLunchFormVisible)} 
          className="bg-green-500 hover:bg-green-600"
        >
          <span>📝</span>
        </ActionButton>
        <ActionButton 
          onClick={() => setIsRecipeVisible(!isRecipeVisible)} 
          className="bg-purple-500 hover:bg-purple-600"
        >
          <span>📖</span>
        </ActionButton>
        <ActionButton 
          onClick={handleDeleteWithConfirm} 
          className="bg-red-700 hover:bg-red-800"
        >
          <span>🗑️</span>
        </ActionButton>
      </div>
    </div>
  );

  // Sección de edición general
  const editingSection = isEditing ? (
    <div className="p-4 bg-yellow-50 border-b space-y-4">
      <h4 className="font-bold text-yellow-800">Editando Producto</h4>
      <input 
        type="text" 
        name="NombreES" 
        value={formData.NombreES} 
        onChange={handleChange} 
        className="p-2 border rounded-md w-full" 
        placeholder="Nombre en español"
      />
      <input 
        type="number" 
        name="Precio" 
        value={formData.Precio} 
        onChange={handleChange} 
        className="p-2 border rounded-md w-full" 
        placeholder="Precio"
      />
      <div className="flex space-x-2">
        <ActionButton 
          onClick={handleSaveGeneral} 
          className="bg-blue-500 hover:bg-blue-600 w-full"
        >
          <span>✅</span><span>Guardar</span>
        </ActionButton>
        <ActionButton 
          onClick={handleCancelEdit} 
          className="bg-gray-500 hover:bg-gray-600 w-full"
        >
          <span>❌</span><span>Cancelar</span>
        </ActionButton>
      </div>
    </div>
  ) : null;

  // Sección del formulario de almuerzo
  const lunchFormSection = isLunchFormVisible ? (
    <div className="p-4 bg-green-50 border-b space-y-4">
      <h4 className="font-bold text-green-800">Editando Componentes del Almuerzo</h4>
      <FormularioMenuAlmuerzo 
        onMenuChange={handleLunchDataChange} 
        initialData={initialLunchData}  
        product={product}
      />
      
      {/* Botones de acción para el formulario de almuerzo */}
      <div className="flex space-x-2 pt-2">
        <ActionButton 
          onClick={handleSaveLunchForm} 
          className="bg-blue-500 hover:bg-blue-600 w-full"
        >
          <span>💾</span>
          <span>Guardar Almuerzo</span>
        </ActionButton>
        <ActionButton 
          onClick={handleCancelLunchForm} 
          className="bg-gray-500 hover:bg-gray-600 w-full"
        >
          <span>❌</span>
          <span>Cancelar</span>
        </ActionButton>
      </div>
    </div>
  ) : null;

  // Sección de receta
  const recipeSection = isRecipeVisible ? (
    <div className="p-4 bg-purple-50 border-b">
      <h4 className="font-bold text-purple-800 mb-4">Gestión de Receta</h4>
      <RecepieOptionsMenu 
        product={product} 
        Receta={receta} 
        currentType={MenuItems} 
      />
    </div>
  ) : null;

  return (
    <MenuInstanceCard
      title={null} // Título personalizado en headerSlot
      data={product}
      buttonState={buttonState}
      showActions={false} // Usamos headerSlot personalizado
      showStatusButtons={false}
      headerSlot={lunchHeader}
      className="w-full bg-white rounded-lg shadow-lg transition-shadow hover:shadow-xl"
      contentClassName="p-0" // Sin padding base, cada sección maneja el suyo
    >
      {/* Contenido expandible */}
      {editingSection}
      {lunchFormSection}
      {recipeSection}
    </MenuInstanceCard>
  );
}
