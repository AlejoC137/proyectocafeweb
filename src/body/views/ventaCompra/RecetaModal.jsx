import React, { useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable, getRecepie, updateItem } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE } from "../../../redux/actions-types";
import EditableText from "../../../components/ui/EditableText";

// --- COMPONENTE REUTILIZABLE PARA CADA FILA DE INGREDIENTE/PRODUCCIÓN ---
const RecipeItemRow = ({ item, isEditing, onCheck, onSave }) => {
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
    <div className={`group mb-2 flex items-center gap-2 p-2 rounded-md transition-colors duration-200 ${item.isChecked ? "bg-green-100 hover:bg-green-200" : "bg-gray-50 hover:bg-gray-100"}`}>
      <button
        onClick={() => onCheck(item.originalIndex)}
        className={`
          w-6 h-6 flex-shrink-0 flex items-center justify-center
          rounded-lg border-2 transition-all duration-200 ease-in-out
          transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1
          ${
            item.isChecked 
              ? "bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white shadow-lg hover:shadow-xl focus:ring-green-300" 
              : "bg-white border-gray-300 text-gray-400 hover:border-green-400 hover:bg-green-50 focus:ring-green-200"
          }
        `}
        type="button"
      >
        {item.isChecked ? (
          <svg 
            className="w-4 h-4 font-bold" 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        ) : (
          <div className="w-3 h-3 rounded-full bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        )}
      </button>
      <span className="flex-grow text-sm">{item.nombre}</span>
      <span className="font-bold text-blue-600">{item.cantidad.toFixed(2)}</span>
      <span className="text-gray-500 text-sm">{item.unidades}</span>
      
      {isEditing && (
        <div className="flex items-center gap-1">
          {isInputActive ? (
            <>
              <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-20 h-8 text-sm" />
              <Button size="sm" className="h-8" onClick={handleSave}>OK</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={handleCancel}>X</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="h-8" onClick={handleEditClick}>Editar</Button>
          )}
        </div>
      )}
    </div>
  );
};


// --- COMPONENTE REUTILIZABLE PARA LAS SECCIONES DE LA RECETA ---
const RecipeSection = ({ title, items, isEditing, onCheck, onSave }) => (
  <div>
    <h3 className="text-lg font-semibold border-b pb-2 mb-3">{title}</h3>
    {items.length > 0 ? (
      items.map(item => (
        <RecipeItemRow
          key={item.key}
          item={item}
          isEditing={isEditing}
          onCheck={onCheck}
          onSave={onSave}
        />
      ))
    ) : (
      <p className="text-sm text-gray-500">No hay elementos en esta sección.</p>
    )}
  </div>
);


// --- COMPONENTE PRINCIPAL REFACTORIZADO ---
function RecetaModal({ item, onClose }) {
  const { id: paramId } = useParams();
  const id = item?.Receta || paramId;
  
  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  
  const [receta, setReceta] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [porcentaje, setPorcentaje] = useState(100);
  const [editShow, setEditShow] = useState(false);
  
  // Estados para modificación permanente
  const [permanentEditMode, setPermanentEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [recetaSource, setRecetaSource] = useState(null); // "Recetas" o "RecetasProduccion"
  const [pinCode, setPinCode] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  
  // Estados para campos adicionales editables
  const [rendimientoCantidad, setRendimientoCantidad] = useState('');
  const [rendimientoUnidades, setRendimientoUnidades] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  
  // Estado consolidado para ingredientes y producción
  const [ingredientes, setIngredientes] = useState([]);
  const [produccion, setProduccion] = useState([]);

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
        await Promise.all([
          dispatch(getAllFromTable(STAFF)), dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)), dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROVEE)),
        ]);
        
        // Buscar primero en "Recetas", luego en "RecetasProduccion" si no encuentra
        let result = await getRecepie(id, "Recetas");
        let source = "Recetas";
        if (!result) {
          result = await getRecepie(id, "RecetasProduccion");
          source = "RecetasProduccion";
        }
        if (!result) throw new Error("Receta no encontrada");
        
        setReceta(result);
        setRecetaSource(source); // Guardar la fuente de la receta
        const plato = await getRecepie(result.forId, "Menu");
        if (plato) setFoto(plato.Foto);
        
      } catch (err) {
        setError("Error al obtener la receta.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecetaData();
  }, [id, dispatch]);

  // Efecto para transformar los datos de la receta a un formato manejable
  useEffect(() => {
    if (!receta) return;

    const parseItems = (prefix, count) => {
      const parsedList = [];
      for (let i = 1; i <= count; i++) {
        const id = receta[`${prefix}${i}_Id`];
        const cuantityUnitsRaw = receta[`${prefix}${i}_Cuantity_Units`];
        if (id && cuantityUnitsRaw) {
          const itemData = buscarPorId(id);
          if (itemData) {
            const cuantityUnits = JSON.parse(cuantityUnitsRaw);
            parsedList.push({
              key: `${prefix}-${i}`,
              originalIndex: i,
              nombre: itemData.Nombre_del_producto,
              originalQuantity: cuantityUnits.metric.cuantity,
              unidades: cuantityUnits.metric.units,
              isChecked: false,
            });
          }
        }
      }
      return parsedList;
    };

    setIngredientes(parseItems("item", 30));
    setProduccion(parseItems("producto_interno", 20));
  }, [receta, allItems, allProduccion]);
  
  // Efecto para inicializar campos editables cuando se activa el modo permanente
  useEffect(() => {
    if (permanentEditMode && receta) {
      // Inicializar campos de rendimiento si existen
      if (receta.rendimiento) {
        try {
          const rendimientoData = JSON.parse(receta.rendimiento);
          setRendimientoCantidad(rendimientoData.cantidad?.toString() || '');
          setRendimientoUnidades(rendimientoData.unidades || '');
        } catch (e) {
          console.warn('Error al parsear rendimiento:', e);
        }
      }
      
      // Inicializar URL de imagen actual
      if (foto) {
        setImagenUrl(foto);
      }
    }
  }, [permanentEditMode, receta, foto]);


  // Calculamos las listas finales usando useMemo para optimizar el rendimiento
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
    setShowPinInput(true);
  };
  
  // Función para verificar el PIN y activar modo permanente
  const handlePinVerification = () => {
    // Verificar que el PIN tenga exactamente 4 dígitos y sea "1234"
    if (pinCode === '1234' && pinCode.length === 4) {
      setPermanentEditMode(true);
      setShowPinInput(false);
      setPinCode('');
      setEditShow(true); // Habilitar edición automáticamente
      // Removido: alert('Modo de modificación permanente habilitado');
    } else {
      // PIN incorrecto, limpiar el campo
      setPinCode('');
    }
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
        
        // Removido: alert('Cambios guardados permanentemente en la receta');
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
        
        // Removido: alert(`${type === 'process' ? 'Proceso' : 'Nota'} ${index} actualizado permanentemente`);
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
  
  // Función para actualizar campos de información (autor, emplatado)
  const updateInfoField = async (fieldName, newValue) => {
    if (!permanentEditMode || !receta || !recetaSource) return;
    
    setIsUpdating(true);
    try {
      const updatedFields = {
        [fieldName]: newValue,
        actualizacion: new Date().toISOString()
      };
      
      const result = await dispatch(updateItem(receta._id, updatedFields, recetaSource));
      
      if (result) {
        setReceta(prev => ({
          ...prev,
          ...updatedFields
        }));
      } else {
        throw new Error('Error al actualizar en la base de datos');
      }
      
    } catch (error) {
      console.error('Error al actualizar campo de información:', error);
      alert('Error al actualizar: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Función para actualizar el rendimiento
  const updateRendimiento = async () => {
    if (!permanentEditMode || !receta || !recetaSource) return;
    if (!rendimientoCantidad || !rendimientoUnidades) return;
    
    setIsUpdating(true);
    try {
      const rendimientoData = {
        porcion: receta.rendimiento ? JSON.parse(receta.rendimiento).porcion : 1,
        cantidad: Number(rendimientoCantidad),
        unidades: rendimientoUnidades
      };
      
      const updatedFields = {
        rendimiento: JSON.stringify(rendimientoData),
        actualizacion: new Date().toISOString()
      };
      
      const result = await dispatch(updateItem(receta._id, updatedFields, recetaSource));
      
      if (result) {
        setReceta(prev => ({
          ...prev,
          ...updatedFields
        }));
        setRendimientoCantidad('');
        setRendimientoUnidades('');
      } else {
        throw new Error('Error al actualizar en la base de datos');
      }
      
    } catch (error) {
      console.error('Error al actualizar rendimiento:', error);
      alert('Error al actualizar rendimiento: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Función para actualizar la URL de la imagen
  const updateImagenUrl = async () => {
    if (!permanentEditMode || !receta || !recetaSource || !imagenUrl) return;
    
    setIsUpdating(true);
    try {
      // Actualizar en la tabla Menu asociada a la receta
      if (receta.forId) {
        const updatedFields = {
          Foto: imagenUrl,
          actualizacion: new Date().toISOString()
        };
        
        const result = await dispatch(updateItem(receta.forId, updatedFields, "Menu"));
        
        if (result) {
          setFoto(imagenUrl);
          setImagenUrl('');
        } else {
          throw new Error('Error al actualizar en la base de datos');
        }
      }
      
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      alert('Error al actualizar imagen: ' + error.message);
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
      return prevItems; // El estado se actualizará a través del cambio de `porcentaje`
    });
  };

  if (loading) return <div className="p-8 text-center">Cargando receta...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!receta) return <div className="p-8 text-center">No se pudo cargar la receta.</div>;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-screen h-screen flex flex-col overflow-auto">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800">{receta.legacyName || "Receta"}</h2>
          <Button onClick={onClose} variant="ghost" className="h-9 w-9 p-0 text-xl">❌</Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 flex items-center gap-4 p-3 bg-gray-100 rounded-md">
            <div className="flex items-center gap-2">
              <label htmlFor="porcentaje" className="font-semibold">Porcentaje:</label>
              <Input id="porcentaje" type="number" min={1} value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value))} className="w-24 h-9" />
              <span className="font-semibold text-gray-700">%</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setEditShow(prev => !prev)}
              disabled={permanentEditMode}
              className={permanentEditMode ? "opacity-50 cursor-not-allowed" : ""}
            >
              {editShow ? "Ocultar Edición" : "Habilitar Edición"}
            </Button>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={handleEnablePermanentEdit}
                disabled={permanentEditMode || isUpdating || showPinInput}
                className={`${
                  permanentEditMode 
                    ? "bg-green-500 text-white border-green-600" 
                    : "border-orange-400 text-orange-600 hover:bg-orange-50"
                } ${
                  isUpdating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUpdating ? "Actualizando..." : permanentEditMode ? "✓ Modo Permanente Activo" : "🔒 Modificación Permanente"}
              </Button>
              
              {/* Campo PIN inline */}
              {showPinInput && !permanentEditMode && (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="PIN"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    maxLength={4}
                    className="w-20 h-9 text-center font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handlePinVerification();
                      } else if (e.key === 'Escape') {
                        setShowPinInput(false);
                        setPinCode('');
                      }
                    }}
                    autoFocus
                  />
                  <Button 
                    size="sm"
                    onClick={handlePinVerification}
                    disabled={pinCode.length !== 4}
                    className="h-9"
                  >
                    OK
                  </Button>
                  <Button 
                    size="sm"
                    variant="ghost" 
                    onClick={() => {
                      setShowPinInput(false);
                      setPinCode('');
                    }}
                    className="h-9"
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <RecipeSection
                title="Ingredientes"
                items={ingredientesAjustados}
                isEditing={editShow}
                onCheck={(index) => handleCheck(setIngredientes, index)}
                onSave={(index, value) => handleSave(setIngredientes, index, value)}
              />
              <RecipeSection
                title="Producción Interna"
                items={produccionAjustada}
                isEditing={editShow}
                onCheck={(index) => handleCheck(setProduccion, index)}
                onSave={(index, value) => handleSave(setProduccion, index, value)}
              />
            </div>
            <div className="lg:col-span-1 space-y-4 text-sm">
              <h3 className="text-lg font-semibold border-b pb-2 mb-3">
                Procesos y Notas
                {permanentEditMode && (
                  <span className="ml-2 text-xs text-green-600">
                    (Modo edición permanente activo)
                  </span>
                )}
              </h3>
              
              {/* Procesos */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Procesos:</h4>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => {
                  const hasProcess = receta[`proces${i}`];
                  const shouldShow = hasProcess || permanentEditMode;
                  
                  return shouldShow ? (
                    <div key={`process-${i}`} className="flex items-start gap-2">
                      <span className="font-semibold text-xs min-w-[60px] text-gray-500 mt-1">
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
              <div className="my-4 border-t border-gray-200"></div>
              
              {/* Notas */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Notas:</h4>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => {
                  const hasNote = receta[`nota${i}`];
                  const shouldShow = hasNote || permanentEditMode;
                  
                  return shouldShow ? (
                    <div key={`note-${i}`} className="flex items-start gap-2">
                      <span className="font-semibold text-xs min-w-[50px] text-gray-500 mt-1">
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
             <div className="lg:col-span-1 space-y-4 text-sm">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">
                  Información Adicional
                  {permanentEditMode && (
                    <span className="ml-2 text-xs text-green-600">
                      (Editable en modo permanente)
                    </span>
                  )}
                </h3>
                
                {/* Campo Autor */}
                <div className="space-y-2">
                  <label className="font-semibold text-sm text-gray-700">Autor:</label>
                  <EditableText
                    value={receta.autor || ''}
                    onSave={(value) => updateInfoField('autor', value)}
                    isEditable={permanentEditMode}
                    placeholder="Escribir autor..."
                    multiline={false}
                    disabled={isUpdating}
                  />
                </div>
                
                {/* Campo Emplatado */}
                <div className="space-y-2">
                  <label className="font-semibold text-sm text-gray-700">Emplatado:</label>
                  <EditableText
                    value={receta.emplatado || ''}
                    onSave={(value) => updateInfoField('emplatado', value)}
                    isEditable={permanentEditMode}
                    placeholder="Describir emplatado..."
                    multiline={true}
                    disabled={isUpdating}
                  />
                </div>
                
                {/* Campo Rendimiento */}
                <div className="space-y-2">
                  <label className="font-semibold text-sm text-gray-700">Rendimiento:</label>
                  {permanentEditMode ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          value={rendimientoCantidad}
                          onChange={(e) => setRendimientoCantidad(e.target.value)}
                          className="w-20 h-8 text-sm"
                          disabled={isUpdating}
                        />
                        <Input
                          type="text"
                          placeholder="Unidades"
                          value={rendimientoUnidades}
                          onChange={(e) => setRendimientoUnidades(e.target.value)}
                          className="w-24 h-8 text-sm"
                          disabled={isUpdating}
                        />
                        <Button 
                          size="sm" 
                          onClick={updateRendimiento}
                          disabled={isUpdating}
                          className="h-8"
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {receta.rendimiento ? 
                        `${JSON.parse(receta.rendimiento).cantidad} ${JSON.parse(receta.rendimiento).unidades}` : 
                        'No especificado'
                      }
                    </p>
                  )}
                </div>
             </div>
             <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">
                  Imagen del Menú
                  {permanentEditMode && (
                    <span className="ml-2 text-xs text-green-600">
                      (URL editable)
                    </span>
                  )}
                </h3>
                
                {permanentEditMode ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="url"
                        placeholder="URL de la imagen"
                        value={imagenUrl}
                        onChange={(e) => setImagenUrl(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        disabled={isUpdating}
                      />
                      <Button 
                        size="sm" 
                        onClick={updateImagenUrl}
                        disabled={isUpdating}
                        className="h-8"
                      >
                        Actualizar
                      </Button>
                    </div>
                    {(foto || imagenUrl) && (
                      <img 
                        src={imagenUrl || foto} 
                        alt="Preview" 
                        className="w-full h-auto rounded-md shadow-md" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                ) : (
                  foto && <img src={foto} alt="Imagen del Menú" className="w-full h-auto rounded-md shadow-md" />
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default RecetaModal;