import React, { useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable, getRecepie, updateItem } from "../redux/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE } from "../redux/actions-types";
import PinCodeModal from "./ui/PinCodeModal";
import EditableText from "./ui/EditableText";

// --- COMPONENTE REUTILIZABLE PARA CADA FILA DE INGREDIENTE/PRODUCCIÓN ---
const RecipeItemRow = ({ item, isEditing, onCheck, onSave, showCheckboxes = false, showEdit = false }) => {
  const [editValue, setEditValue] = useState(item.cantidad.toString());
  const [isInputActive, setIsInputActive] = useState(false);

  const handleSave = () => {
    onSave(item.originalIndex, editValue);
    setIsInputActive(false);
  };

  const handleEditClick = () => {
    setEditValue(item.cantidad.toFixed(2));
    setIsInputActive(true);
  };

  const handleCancel = () => {
    setIsInputActive(false);
    setEditValue(item.cantidad.toString());
  };

  return (
    <div 
      className={`mb-2 flex items-center gap-2 p-2 rounded-md transition-colors ${
        showCheckboxes && item.isChecked ? "bg-green-100" : "bg-gray-50"
      }`}
      style={{
        backgroundColor: showCheckboxes && item.isChecked 
          ? 'rgb(220, 252, 231)' // green-100 forzado
          : 'rgb(249, 250, 251)', // gray-50 forzado
        border: '1px solid rgb(209, 213, 219)', // gray-300 forzado
        color: 'rgb(0, 0, 0)' // text negro forzado
      }}
    >
      {showCheckboxes && (
        <button
          onClick={() => onCheck(item.originalIndex)}
          className="w-5 h-5 flex-shrink-0 border rounded-sm"
          style={{
            backgroundColor: item.isChecked ? 'rgb(34, 197, 94)' : 'rgb(255, 255, 255)', // green-500 / white forzado
            borderColor: item.isChecked ? 'rgb(22, 163, 74)' : 'rgb(156, 163, 175)', // green-600 / gray-400 forzado
            color: 'rgb(255, 255, 255)' // white forzado para el checkmark
          }}
          type="button"
        >
          {item.isChecked && "✔"}
        </button>
      )}
      
      <span className="flex-grow text-sm" style={{ color: 'rgb(0, 0, 0)' }}>
        {item.nombre}
      </span>
      
      <span className="font-bold text-blue-600" style={{ color: 'rgb(37, 99, 235)' }}>
        {item.cantidad.toFixed(2)}
      </span>
      
      <span className="text-gray-500 text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
        {item.unidades}
      </span>
      
      {showEdit && isEditing && (
        <div className="flex items-center gap-1">
          {isInputActive ? (
            <>
              <Input 
                type="number" 
                value={editValue} 
                onChange={(e) => setEditValue(e.target.value)} 
                className="w-20 h-8 text-sm"
                style={{
                  backgroundColor: 'rgb(255, 255, 255)',
                  borderColor: 'rgb(209, 213, 219)',
                  color: 'rgb(0, 0, 0)'
                }}
              />
              <Button 
                size="sm" 
                className="h-8" 
                onClick={handleSave}
                style={{
                  backgroundColor: 'rgb(34, 197, 94)',
                  color: 'rgb(255, 255, 255)'
                }}
              >
                OK
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8" 
                onClick={handleCancel}
                style={{
                  backgroundColor: 'transparent',
                  color: 'rgb(107, 114, 128)'
                }}
              >
                X
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8" 
              onClick={handleEditClick}
              style={{
                backgroundColor: 'rgb(255, 255, 255)',
                borderColor: 'rgb(209, 213, 219)',
                color: 'rgb(0, 0, 0)'
              }}
            >
              Editar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE REUTILIZABLE PARA LAS SECCIONES DE LA RECETA ---
const RecipeSection = ({ title, items, isEditing, onCheck, onSave, showCheckboxes, showEdit }) => (
  <div style={{ backgroundColor: 'rgb(255, 255, 255)', padding: '16px', borderRadius: '8px' }}>
    <h3 
      className="text-lg font-semibold border-b pb-2 mb-3"
      style={{ 
        color: 'rgb(0, 0, 0)',
        borderBottomColor: 'rgb(209, 213, 219)'
      }}
    >
      {title}
    </h3>
    {items.length > 0 ? (
      items.map(item => (
        <RecipeItemRow
          key={item.key}
          item={item}
          isEditing={isEditing}
          onCheck={onCheck}
          onSave={onSave}
          showCheckboxes={showCheckboxes}
          showEdit={showEdit}
        />
      ))
    ) : (
      <p className="text-sm text-gray-500" style={{ color: 'rgb(107, 114, 128)' }}>
        No hay elementos en esta sección.
      </p>
    )}
  </div>
);

// --- COMPONENTE PRINCIPAL UNIVERSAL ---
function RecetaModalUniversal({ 
  item, 
  onClose, 
  context = "venta", // "venta", "inventario", "produccion", "actividades"
  showPercentageControl = false,
  showCheckboxes = false,
  showEditControls = false,
  isModal = true,
  title = "Receta"
}) {
  const { id: paramId } = useParams();
  const id = item?.Receta || paramId;
  
  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allMenu = useSelector((state) => state.allMenu || []);
  
  const [receta, setReceta] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [porcentaje, setPorcentaje] = useState(100);
  const [editShow, setEditShow] = useState(false);
  
  // Estados para modificación permanente
  const [showPinModal, setShowPinModal] = useState(false);
  const [permanentEditMode, setPermanentEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [recetaSource, setRecetaSource] = useState(null); // "Recetas", "RecetasProduccion", etc.
  
  // Estado consolidado para ingredientes y producción
  const [ingredientes, setIngredientes] = useState([]);
  const [produccion, setProduccion] = useState([]);

  // Configuraciones por contexto
  const contextConfig = useMemo(() => {
    switch (context) {
      case "venta":
        return {
          showPercentage: true,
          showCheckboxes: true,
          showEdit: true,
          showFullModal: true,
          title: "Receta del Plato"
        };
      case "inventario":
        return {
          showPercentage: false,
          showCheckboxes: false,
          showEdit: false,
          showFullModal: true,
          title: "Información de Receta"
        };
      case "produccion":
        return {
          showPercentage: true,
          showCheckboxes: true,
          showEdit: true,
          showFullModal: true,
          title: "Receta de Producción"
        };
      case "actividades":
        return {
          showPercentage: false,
          showCheckboxes: false,
          showEdit: false,
          showFullModal: false,
          title: "Detalle de Receta"
        };
      default:
        return {
          showPercentage: false,
          showCheckboxes: false,
          showEdit: false,
          showFullModal: true,
          title: "Receta"
        };
    }
  }, [context]);

  // Hook para buscar datos en los stores de Redux
  const buscarPorId = (itemId) => allItems.find((i) => i._id === itemId) || allProduccion.find((p) => p._id === itemId) || null;

  // Efecto para la carga inicial de datos
  useEffect(() => {
    const fetchRecetaData = async () => {
      if (!id) {
        setError("El ítem no tiene una receta asociada.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Cargar datos base si no están disponibles
        await Promise.all([
          dispatch(getAllFromTable(STAFF)), dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)), dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROVEE)),
        ]);
        
        // Intentar cargar desde diferentes fuentes de receta según el contexto
        let result;
        const sources = context === "produccion" 
          ? ["RecetasProcedimientos", "RecetasProduccion", "Recetas"]
          : ["Recetas", "RecetasProduccion"];
          
        for (const source of sources) {
          try {
            result = await getRecepie(id, source);
            if (result) {
              setRecetaSource(source); // Guardar la fuente de la receta
              break;
            }
          } catch (err) {
            continue;
          }
        }
        
        if (!result) throw new Error("Receta no encontrada");

        setReceta(result);
        
        // Buscar foto del plato en el menú
        if (result.forId) {
          const plato = await getRecepie(result.forId, "Menu");
          if (plato?.Foto) setFoto(plato.Foto);
        }
        
      } catch (err) {
        setError("Error al obtener la receta.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecetaData();
  }, [id, dispatch, context]);

  // Efecto para transformar los datos de la receta
  useEffect(() => {
    if (!receta) return;

    const parseItems = (prefix, count) => {
      const parsedList = [];
      for (let i = 1; i <= count; i++) {
        const itemId = receta[`${prefix}${i}_Id`];
        const cuantityUnitsRaw = receta[`${prefix}${i}_Cuantity_Units`];
        if (itemId && cuantityUnitsRaw) {
          const itemData = buscarPorId(itemId);
          if (itemData) {
            try {
              const cuantityUnits = JSON.parse(cuantityUnitsRaw);
              parsedList.push({
                key: `${prefix}-${i}`,
                originalIndex: i,
                nombre: itemData.Nombre_del_producto,
                originalQuantity: cuantityUnits.metric.cuantity,
                unidades: cuantityUnits.metric.units,
                isChecked: false,
              });
            } catch (e) {
              console.warn(`Error parsing quantity units for ${prefix}${i}:`, e);
            }
          }
        }
      }
      return parsedList;
    };

    setIngredientes(parseItems("item", 30));
    setProduccion(parseItems("producto_interno", 20));
  }, [receta, allItems, allProduccion]);

  // Calcular listas ajustadas por porcentaje
  const ingredientesAjustados = useMemo(() => 
    ingredientes.map(ing => ({
      ...ing,
      cantidad: (ing.originalQuantity * porcentaje) / 100
    })), [ingredientes, porcentaje]);

  const produccionAjustada = useMemo(() => 
    produccion.map(prod => ({
      ...prod,
      cantidad: (prod.originalQuantity * porcentaje) / 100
    })), [produccion, porcentaje]);

  // === FUNCIONES DE MODIFICACIÓN PERMANENTE ===
  
  // Función para habilitar modo de edición permanente
  const handleEnablePermanentEdit = () => {
    setShowPinModal(true);
  };
  
  // Callback cuando el PIN es correcto
  const handlePinSuccess = () => {
    setPermanentEditMode(true);
    setShowPinModal(false);
    setEditShow(true); // Habilitar edición automáticamente
    alert('Modo de modificación permanente habilitado');
  };
  
  // Función para guardar cambios permanentes en la receta
  const savePermanentChanges = async (itemType, index, newQuantity) => {
    if (!permanentEditMode || !receta || !recetaSource) return;
    
    setIsUpdating(true);
    try {
      const prefix = itemType === 'ingredient' ? 'item' : 'producto_interno';
      const cuantityKey = `${prefix}${index}_Cuantity_Units`;
      
      // Obtener la estructura actual de cantidad y unidades
      const currentCuantityUnitsRaw = receta[cuantityKey];
      if (!currentCuantityUnitsRaw) {
        throw new Error('No se encontró la estructura de cantidad y unidades');
      }
      
      let currentCuantityUnits;
      try {
        currentCuantityUnits = JSON.parse(currentCuantityUnitsRaw);
      } catch (e) {
        throw new Error('Error al parsear la estructura actual');
      }
      
      // Crear la nueva estructura con la cantidad actualizada
      const updatedCuantityUnits = {
        ...currentCuantityUnits,
        metric: {
          ...currentCuantityUnits.metric,
          cuantity: Number(newQuantity)
        }
      };
      
      // Crear el objeto de actualización
      const updatedFields = {
        [cuantityKey]: JSON.stringify(updatedCuantityUnits),
        actualizacion: new Date().toISOString()
      };
      
      // Actualizar en la base de datos
      const result = await dispatch(updateItem(receta._id, updatedFields, recetaSource));
      
      if (result) {
        // Actualizar el estado local de la receta
        setReceta(prev => ({
          ...prev,
          ...updatedFields
        }));
        
        alert('Cambios guardados permanentemente en la receta');
      } else {
        throw new Error('Error al actualizar en la base de datos');
      }
      
    } catch (error) {
      console.error('Error al guardar cambios permanentes:', error);
      alert('Error al guardar los cambios: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Función para actualizar procesos y notas
  const updateProcessOrNote = async (type, index, newValue) => {
    if (!permanentEditMode || !receta || !recetaSource) return;
    
    setIsUpdating(true);
    try {
      const fieldKey = type === 'process' ? `proces${index}` : `nota${index}`;
      
      const updatedFields = {
        [fieldKey]: newValue,
        actualizacion: new Date().toISOString()
      };
      
      const result = await dispatch(updateItem(receta._id, updatedFields, recetaSource));
      
      if (result) {
        setReceta(prev => ({
          ...prev,
          ...updatedFields
        }));
        
        alert(`${type === 'process' ? 'Proceso' : 'Nota'} ${index} actualizado permanentemente`);
      } else {
        throw new Error('Error al actualizar en la base de datos');
      }
      
    } catch (error) {
      console.error('Error al actualizar proceso/nota:', error);
      alert('Error al actualizar: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Manejadores de eventos
  const handleCheck = (setState, index) => {
    setState(prevItems => prevItems.map(item =>
      item.originalIndex === index ? { ...item, isChecked: !item.isChecked } : item
    ));
  };
  
  const handleSave = (setState, index, newValue) => {
    const numValue = Number(newValue);
    if (isNaN(numValue) || numValue <= 0) return;
  
    // Si está en modo de edición permanente, guardar cambios en la base de datos
    if (permanentEditMode) {
      const itemType = setState === setIngredientes ? 'ingredient' : 'production';
      savePermanentChanges(itemType, index, numValue);
    }
    
    setState(prevItems => {
      const itemToUpdate = prevItems.find(item => item.originalIndex === index);
      if (itemToUpdate) {
        if (!permanentEditMode) {
          // Solo cambiar porcentaje si no está en modo permanente
          const newPercentage = (numValue / itemToUpdate.originalQuantity) * 100;
          setPorcentaje(newPercentage);
        }
      }
      return prevItems;
    });
  };

  // Renderizar información adicional
  const renderAdditionalInfo = () => (
    <div style={{ backgroundColor: 'rgb(255, 255, 255)', padding: '16px', borderRadius: '8px' }}>
      <h3 
        className="text-lg font-semibold border-b pb-2 mb-3"
        style={{ 
          color: 'rgb(0, 0, 0)',
          borderBottomColor: 'rgb(209, 213, 219)'
        }}
      >
        Información Adicional
      </h3>
      <div className="space-y-2 text-sm">
        {receta.autor && (
          <p style={{ color: 'rgb(0, 0, 0)' }}>
            <strong>Autor:</strong> {receta.autor}
          </p>
        )}
        {receta.emplatado && (
          <p style={{ color: 'rgb(0, 0, 0)' }}>
            <strong>Emplatado:</strong> {receta.emplatado}
          </p>
        )}
        {receta.rendimiento && (
          <p style={{ color: 'rgb(0, 0, 0)' }}>
            <strong>Rendimiento:</strong> {JSON.parse(receta.rendimiento).cantidad} {JSON.parse(receta.rendimiento).unidades}
          </p>
        )}
        {receta.ProcessTime && (
          <p style={{ color: 'rgb(0, 0, 0)' }}>
            <strong>Tiempo de proceso:</strong> {receta.ProcessTime}
          </p>
        )}
      </div>
    </div>
  );

  // Renderizar procesos y notas
  const renderProcesses = () => (
    <div style={{ backgroundColor: 'rgb(255, 255, 255)', padding: '16px', borderRadius: '8px' }}>
      <h3 
        className="text-lg font-semibold border-b pb-2 mb-3"
        style={{ 
          color: 'rgb(0, 0, 0)',
          borderBottomColor: 'rgb(209, 213, 219)'
        }}
      >
        Procesos y Notas
        {permanentEditMode && (
          <span className="ml-2 text-xs" style={{ color: 'rgb(34, 197, 94)' }}>
            (Modo edición permanente activo)
          </span>
        )}
      </h3>
      
      {/* Procesos */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm" style={{ color: 'rgb(55, 65, 81)' }}>Procesos:</h4>
        {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => {
          const hasProcess = receta[`proces${i}`];
          const shouldShow = hasProcess || permanentEditMode;
          
          return shouldShow ? (
            <div key={`process-${i}`} className="flex items-start gap-2">
              <span className="font-semibold text-xs min-w-[60px]" style={{ color: 'rgb(107, 114, 128)' }}>
                Proceso {i}:
              </span>
              <div className="flex-1">
                <EditableText
                  value={receta[`proces${i}`] || ''}
                  onSave={(value) => updateProcessOrNote('process', i, value)}
                  isEditable={permanentEditMode}
                  placeholder={`Escribir proceso ${i}...`}
                  multiline={true}
                  disabled={isUpdating}
                />
              </div>
            </div>
          ) : null;
        })}
      </div>
      
      {/* Separador */}
      <div className="my-4 border-t" style={{ borderColor: 'rgb(229, 231, 235)' }}></div>
      
      {/* Notas */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm" style={{ color: 'rgb(55, 65, 81)' }}>Notas:</h4>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => {
          const hasNote = receta[`nota${i}`];
          const shouldShow = hasNote || permanentEditMode;
          
          return shouldShow ? (
            <div key={`note-${i}`} className="flex items-start gap-2">
              <span className="font-semibold text-xs min-w-[50px]" style={{ color: 'rgb(107, 114, 128)' }}>
                Nota {i}:
              </span>
              <div className="flex-1">
                <EditableText
                  value={receta[`nota${i}`] || ''}
                  onSave={(value) => updateProcessOrNote('note', i, value)}
                  isEditable={permanentEditMode}
                  placeholder={`Escribir nota ${i}...`}
                  multiline={true}
                  disabled={isUpdating}
                />
              </div>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );

  // States de carga y error
  if (loading) return (
    <div 
      className="p-8 text-center"
      style={{ 
        backgroundColor: 'rgb(255, 255, 255)',
        color: 'rgb(0, 0, 0)'
      }}
    >
      Cargando receta...
    </div>
  );
  
  if (error) return (
    <div 
      className="p-8 text-center text-red-500"
      style={{ color: 'rgb(239, 68, 68)' }}
    >
      {error}
    </div>
  );
  
  if (!receta) return (
    <div 
      className="p-8 text-center"
      style={{ 
        backgroundColor: 'rgb(255, 255, 255)',
        color: 'rgb(0, 0, 0)'
      }}
    >
      No se pudo cargar la receta.
    </div>
  );

  // Contenido principal
  const mainContent = (
    <div 
      className={contextConfig.showFullModal ? "fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" : ""}
      style={contextConfig.showFullModal ? { backgroundColor: 'rgba(0, 0, 0, 0.6)' } : {}}
    >
      <div 
        className={contextConfig.showFullModal ? "bg-white rounded-lg shadow-2xl w-screen h-screen flex flex-col overflow-auto" : ""}
        style={{
          backgroundColor: 'rgb(255, 255, 255)',
          color: 'rgb(0, 0, 0)'
        }}
      >
        {/* Header */}
        {contextConfig.showFullModal && (
          <div 
            className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0 z-10"
            style={{
              backgroundColor: 'rgb(249, 250, 251)',
              borderBottomColor: 'rgb(209, 213, 219)',
              borderBottomWidth: '1px',
              color: 'rgb(0, 0, 0)'
            }}
          >
            <h2 className="text-2xl font-bold" style={{ color: 'rgb(31, 41, 55)' }}>
              {contextConfig.title}: {receta.legacyName || "Sin nombre"}
            </h2>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              className="h-9 w-9 p-0 text-xl"
              style={{
                backgroundColor: 'transparent',
                color: 'rgb(239, 68, 68)'
              }}
            >
              ❌
            </Button>
          </div>
        )}

        {/* Contenido principal */}
        <div 
          className={contextConfig.showFullModal ? "p-6 overflow-y-auto" : "space-y-4"}
          style={{ backgroundColor: 'rgb(255, 255, 255)' }}
        >
          {/* Control de porcentaje (solo para contextos que lo necesiten) */}
          {contextConfig.showPercentage && (
            <div 
              className="mb-6 flex items-center gap-4 p-3 rounded-md"
              style={{
                backgroundColor: 'rgb(243, 244, 246)',
                border: '1px solid rgb(209, 213, 219)'
              }}
            >
              <div className="flex items-center gap-2">
                <label 
                  htmlFor="porcentaje" 
                  className="font-semibold"
                  style={{ color: 'rgb(0, 0, 0)' }}
                >
                  Porcentaje:
                </label>
                <Input 
                  id="porcentaje" 
                  type="number" 
                  min={1} 
                  value={porcentaje} 
                  onChange={e => setPorcentaje(Number(e.target.value))} 
                  className="w-24 h-9"
                  style={{
                    backgroundColor: 'rgb(255, 255, 255)',
                    borderColor: 'rgb(209, 213, 219)',
                    color: 'rgb(0, 0, 0)'
                  }}
                />
                <span 
                  className="font-semibold"
                  style={{ color: 'rgb(55, 65, 81)' }}
                >
                  %
                </span>
              </div>
              {contextConfig.showEdit && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditShow(prev => !prev)}
                    disabled={permanentEditMode}
                    style={{
                      backgroundColor: permanentEditMode ? 'rgb(243, 244, 246)' : 'rgb(255, 255, 255)',
                      borderColor: 'rgb(209, 213, 219)',
                      color: permanentEditMode ? 'rgb(156, 163, 175)' : 'rgb(0, 0, 0)'
                    }}
                  >
                    {editShow ? "Ocultar Edición" : "Habilitar Edición"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleEnablePermanentEdit}
                    disabled={permanentEditMode || isUpdating}
                    style={{
                      backgroundColor: permanentEditMode ? 'rgb(34, 197, 94)' : 'rgb(255, 255, 255)',
                      borderColor: permanentEditMode ? 'rgb(22, 163, 74)' : 'rgb(251, 146, 60)',
                      color: permanentEditMode ? 'rgb(255, 255, 255)' : 'rgb(234, 88, 12)'
                    }}
                  >
                    {isUpdating ? "Actualizando..." : permanentEditMode ? "✓ Modo Permanente Activo" : "🔒 Modificación Permanente"}
                  </Button>
                </>
              )}
            </div>
          )}
          
          {/* Layout responsive del contenido */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Ingredientes y Producción */}
            <div className="lg:col-span-1 space-y-6">
              <RecipeSection
                title="Ingredientes"
                items={contextConfig.showPercentage ? ingredientesAjustados : ingredientes}
                isEditing={editShow}
                onCheck={(index) => handleCheck(setIngredientes, index)}
                onSave={(index, value) => handleSave(setIngredientes, index, value)}
                showCheckboxes={contextConfig.showCheckboxes}
                showEdit={contextConfig.showEdit}
              />
              
              {(contextConfig.showPercentage ? produccionAjustada : produccion).length > 0 && (
                <RecipeSection
                  title="Producción Interna"
                  items={contextConfig.showPercentage ? produccionAjustada : produccion}
                  isEditing={editShow}
                  onCheck={(index) => handleCheck(setProduccion, index)}
                  onSave={(index, value) => handleSave(setProduccion, index, value)}
                  showCheckboxes={contextConfig.showCheckboxes}
                  showEdit={contextConfig.showEdit}
                />
              )}
            </div>
            
            {/* Procesos */}
            <div className="lg:col-span-1">
              {renderProcesses()}
            </div>
            
            {/* Información adicional */}
            <div className="lg:col-span-1">
              {renderAdditionalInfo()}
            </div>
            
            {/* Imagen */}
            <div className="lg:col-span-1">
              {foto && (
                <div style={{ backgroundColor: 'rgb(255, 255, 255)', padding: '16px', borderRadius: '8px' }}>
                  <h3 
                    className="text-lg font-semibold border-b pb-2 mb-3"
                    style={{ 
                      color: 'rgb(0, 0, 0)',
                      borderBottomColor: 'rgb(209, 213, 219)'
                    }}
                  >
                    Imagen del Plato
                  </h3>
                  <img 
                    src={foto} 
                    alt="Imagen del Menú" 
                    className="w-full h-auto rounded-md shadow-md" 
                    style={{
                      border: '1px solid rgb(209, 213, 219)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Retornar según el contexto
  if (contextConfig.showFullModal && onClose) {
    return (
      <>
        {ReactDOM.createPortal(mainContent, document.body)}
        <PinCodeModal 
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={handlePinSuccess}
          title="Autorización para Modificación Permanente"
        />
      </>
    );
  }
  
  return (
    <>
      {mainContent}
      <PinCodeModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        title="Autorización para Modificación Permanente"
      />
    </>
  );
}

export default RecetaModalUniversal;
