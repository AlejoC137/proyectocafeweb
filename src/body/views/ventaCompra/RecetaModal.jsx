import React, { useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable, getRecepie } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE } from "../../../redux/actions-types";

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
    <div className={`mb-2 flex items-center gap-2 p-2 rounded-md ${item.isChecked ? "bg-green-100" : "bg-gray-50"}`}>
      <button
        onClick={() => onCheck(item.originalIndex)}
        className={`w-5 h-5 flex-shrink-0 border rounded-sm ${item.isChecked ? "bg-green-500 border-green-600 text-white" : "bg-white border-gray-400"}`}
        type="button"
      >
        {item.isChecked && "✔"}
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
        if (!result) {
          result = await getRecepie(id, "RecetasProduccion");
        }
        if (!result) throw new Error("Receta no encontrada");
        
        setReceta(result);
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

  // Manejadores de eventos
  const handleCheck = (setState, index) => {
    setState(prevItems => prevItems.map(item =>
      item.originalIndex === index ? { ...item, isChecked: !item.isChecked } : item
    ));
  };
  
  const handleSave = (setState, index, newValue) => {
    const numValue = Number(newValue);
    if (isNaN(numValue) || numValue <= 0) return;
  
    setState(prevItems => {
      const itemToUpdate = prevItems.find(item => item.originalIndex === index);
      if (itemToUpdate) {
        const newPercentage = (numValue / itemToUpdate.originalQuantity) * 100;
        setPorcentaje(newPercentage);
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
            <Button variant="outline" onClick={() => setEditShow(prev => !prev)}>
              {editShow ? "Ocultar Edición" : "Habilitar Edición"}
            </Button>
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
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Procesos y Notas</h3>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => receta[`proces${i}`] && <p key={i}><strong>Proceso {i}:</strong> {receta[`proces${i}`]}</p>)}
                {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => receta[`nota${i}`] && <p key={i}><strong>Nota {i}:</strong> {receta[`nota${i}`]}</p>)}
            </div>
             <div className="lg:col-span-1 space-y-4 text-sm">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Información Adicional</h3>
                {receta.autor && <p><strong>Autor:</strong> {receta.autor}</p>}
                {receta.emplatado && <p><strong>Emplatado:</strong> {receta.emplatado}</p>}
                {receta.rendimiento && <p><strong>Rendimiento:</strong> {JSON.parse(receta.rendimiento).cantidad} {JSON.parse(receta.rendimiento).unidades}</p>}
             </div>
             <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Imagen del Menú</h3>
                {foto && <img src={foto} alt="Imagen del Menú" className="w-full h-auto rounded-md shadow-md" />}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default RecetaModal;