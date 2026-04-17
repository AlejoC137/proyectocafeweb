import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateItem } from '../../redux/actions';

// Mix Premium: Phosphor Icons (Tendencia actual) + Game Icons (especializados)
import {
  PiCoffeeBeanBold,
  PiEggFill,
  PiPlantFill,
  PiWineFill,
  PiCubeFill,
  PiSnowflakeFill
} from 'react-icons/pi';
import {
  LuMilk,
  LuApple,
  LuPlus,
  LuTrash2,
  LuChevronLeft,
  LuChevronRight
} from 'react-icons/lu';
import {
  GiChocolateBar
} from 'react-icons/gi';

const OPCIONES_INGREDIENTES = [
  { id: 'cafe', icon: PiCoffeeBeanBold, color: '#6B4423', es: 'Café', en: 'Coffee' },
  { id: 'leche', icon: LuMilk, color: '#3498DB', es: 'Lácteo', en: 'Dairy' },
  { id: 'huevo', icon: PiEggFill, color: '#F1C40F', es: 'Huevo', en: 'Egg' },
  { id: 'harina', icon: PiPlantFill, color: '#D4AC0D', es: 'Harina', en: 'Flour' },
  { id: 'chocolate', icon: GiChocolateBar, color: '#3E2723', es: 'Chocolate', en: 'Chocolate' },
  { id: 'fruta', icon: LuApple, color: '#E74C3C', es: 'Fruta', en: 'Fruit' },
  { id: 'alcohol', icon: PiWineFill, color: '#8E44AD', es: 'Alcohol', en: 'Alcohol' },
  { id: 'azucar', icon: PiCubeFill, color: '#FF80AB', es: 'Azúcar', en: 'Sugar' },
  { id: 'frio', icon: PiSnowflakeFill, color: '#5DADE2', es: 'Hielo', en: 'Iced' },
];

export default function IngredientesBasicos({ product, showEdit, isEnglish, viewName }) {
  const dispatch = useDispatch();
  const [activeIndex, setActiveIndex] = useState(null);

  // Sync with Redux in real-time with debounce
  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Deep equality check to prevent redundant updates
    const currentData = product.IngredientesBasicos || [];
    if (JSON.stringify(currentData) === JSON.stringify(selected)) return;

    const timeoutId = setTimeout(() => {
      dispatch(updateItem(product._id, { IngredientesBasicos: selected }, "Menu"));
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [selected, product._id, dispatch, product.IngredientesBasicos]);

  useEffect(() => {
    const remoteData = product.IngredientesBasicos || [];
    // Only update local state if it's actually different from what we have
    // This prevents losing local changes while a sync is in progress
    if (JSON.stringify(remoteData) !== JSON.stringify(selected)) {
      setSelected(Array.isArray(remoteData) ? remoteData : []);
    }
  }, [product.IngredientesBasicos]);

  const addSlot = () => {
    if (!showEdit) return;
    const newSelected = [...selected, 'cafe']; // Default to coffee
    setSelected(newSelected);
    setActiveIndex(newSelected.length - 1); // Correct: Last index is length - 1
  };

  const selectIcon = (id) => {
    if (!showEdit) return;
    if (activeIndex !== null) {
      const newSelected = [...selected];
      newSelected[activeIndex] = id;
      setSelected(newSelected);
    } else {
      // If no slot active, just add it
      setSelected(prev => [...prev, id]);
    }
  };

  const removeIngredient = (e, index) => {
    e.stopPropagation();
    if (!showEdit) return;
    const newSelected = selected.filter((_, i) => i !== index);
    setSelected(newSelected);
    if (activeIndex === index) setActiveIndex(null);
    else if (activeIndex > index) setActiveIndex(activeIndex - 1);
  };

  const clearAll = () => {
    if (!showEdit) return;
    if (window.confirm(isEnglish ? 'Clear all ingredients?' : '¿Limpiar todos los ingredientes?')) {
      setSelected([]);
      setActiveIndex(null);
    }
  };

  const moveItem = (e, index, direction) => {
    e.stopPropagation();
    if (!showEdit) return;
    const newSelected = [...selected];
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= selected.length) return;
    
    // Swap
    [newSelected[index], newSelected[newIdx]] = [newSelected[newIdx], newSelected[index]];
    setSelected(newSelected);
    setActiveIndex(newIdx);
  };

  // VISTA PARA IMPRESIÓN (Iconos pequeños al lado del nombre)
  if (viewName === "MenuPrint") {
    if (!selected.length) return null;
    return (
      <div className="flex flex-wrap gap-x-1 items-center mr-1 print:mr-0.5">
        {selected.map((id, idx) => {
          const ing = OPCIONES_INGREDIENTES.find(i => i.id === id);
          if (!ing) return null;
          const Icon = ing.icon;
          return (
            <Icon
              key={`${id}-${idx}`}
              size={12}
              color={ing.color}
              className="opacity-90"
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="border p-2 rounded-lg bg-white mt-2 shadow-sm border-dashed border-slate-300">
      <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2 tracking-widest">
        {isEnglish ? 'Base Composition' : 'Composición Base'}
      </h4>

      {/* ÁREA DE COMPOSICIÓN DINÁMICA */}
      <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-inner flex flex-wrap gap-3 items-center min-h-[56px] relative group">
        {!selected.length && (
          <span className="text-[9px] text-slate-400 italic font-medium px-2">
            {isEnglish ? 'Add icons to start...' : 'Agrega iconos para comenzar...'}
          </span>
        )}
        
        {selected.map((id, index) => {
          const ing = OPCIONES_INGREDIENTES.find(i => i.id === id);
          if (!ing) return null;
          const Icon = ing.icon;
          const isActive = activeIndex === index;
          
          return (
            <div
              key={`${id}-${index}`}
              onClick={() => setActiveIndex(index)}
              className={`relative flex flex-col items-center gap-1 transition-all ${isActive ? 'z-20' : 'z-10'}`}
            >
              <div className={`cursor-pointer transition-all p-2 rounded-xl border-2 ${
                isActive 
                ? 'bg-blue-50 border-blue-500 scale-110 shadow-lg ring-4 ring-blue-100' 
                : 'bg-white border-transparent hover:border-slate-200'
              }`}>
                <Icon size={20} color={ing.color} />
                
                {showEdit && (
                  <button
                    onClick={(e) => removeIngredient(e, index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                  >
                    <span className="text-[10px] font-bold">×</span>
                  </button>
                )}
              </div>

              {/* CONTROLES DE MOVIMIENTO (Solo cuando está activo) */}
              {showEdit && isActive && (
                <div className="flex gap-1 absolute -bottom-6 bg-white shadow-md border border-slate-200 rounded-full px-1 py-0.5 animate-in fade-in zoom-in duration-200">
                  <button 
                    onClick={(e) => moveItem(e, index, -1)}
                    disabled={index === 0}
                    className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-20"
                  >
                    <LuChevronLeft size={12} />
                  </button>
                  <div className="w-[1px] bg-slate-100" />
                  <button 
                    onClick={(e) => moveItem(e, index, 1)}
                    disabled={index === selected.length - 1}
                    className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-20"
                  >
                    <LuChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {showEdit && (
          <button
            onClick={addSlot}
            className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:scale-90 transition-all shadow-md border-2 border-blue-400/20"
            title={isEnglish ? 'Add new slot' : 'Agregar nuevo icono'}
          >
            <LuPlus size={20} />
          </button>
        )}

        {showEdit && selected.length > 0 && (
          <button
            onClick={clearAll}
            className="absolute -right-1 -top-6 text-slate-300 hover:text-red-500 transition-colors bg-white p-1 rounded-full shadow-sm"
            title={isEnglish ? 'Clear all' : 'Limpiar todo'}
          >
            <LuTrash2 size={12} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {OPCIONES_INGREDIENTES.map(ing => {
          const Icon = ing.icon;
          return (
            <button
              key={ing.id}
              onClick={() => selectIcon(ing.id)}
              disabled={!showEdit}
              className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-all shadow-sm active:scale-95 ${
                activeIndex !== null 
                ? 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                : 'bg-slate-50 text-slate-500 border-slate-100 opacity-80'
              }`}
            >
              <Icon size={14} color={ing.color} />
              <span className="font-semibold">{isEnglish ? ing.en : ing.es}</span>
            </button>
          );
        })}
      </div>
      
      {showEdit && activeIndex === null && selected.length > 0 && (
        <p className="text-[8px] text-blue-500 mt-2 italic animate-pulse">
          {isEnglish ? 'Tip: Click an icon above to change its type' : 'Tip: Haz clic en un icono arriba para cambiar su tipo'}
        </p>
      )}
    </div>
  );
}