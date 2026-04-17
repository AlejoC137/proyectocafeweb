import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateItem } from '../../redux/actions';

import adicionesIcon from '../../assets/icons/ADICIONES.svg';
import bebidasIcon from '../../assets/icons/BEBIDAS.svg';
import enlatadosIcon from '../../assets/icons/ENLATADOS.svg';

import appleIcon from '../../assets/icons/APPLE.svg';
import breadIcon from '../../assets/icons/BREAD.svg';
import cacaoIcon from '../../assets/icons/CACAO BEAN.svg';
import cheeseIcon from '../../assets/icons/CHEESE.svg';
import coffeeBeanIcon from '../../assets/icons/COFFEE BEAN.svg';
import eggIcon from '../../assets/icons/EGG.svg';
import honeyIcon from '../../assets/icons/HONEY.svg';
import milkIcon from '../../assets/icons/MILK.svg';
import cowIcon from '../../assets/icons/COW.svg';
import nutsIcon from '../../assets/icons/NUTS.svg';
import spiceIcon from '../../assets/icons/SPICE.svg';
import avocadoIcon from '../../assets/icons/AVOCADO.svg';
import baconIcon from '../../assets/icons/BACON.svg';
import iceIcon from '../../assets/icons/ICE.svg';
import lemonIcon from '../../assets/icons/LEMON.svg';
import berryIcon from '../../assets/icons/BERRY.svg';
import chickenIcon from '../../assets/icons/CHICKEN.svg';
import chorizoIcon from '../../assets/icons/CHORIZO.svg';
import waterIcon from '../../assets/icons/WATER.svg';
import chocBarIcon from '../../assets/icons/CHOCOLATE BAR.svg';
import hojaldreIcon from '../../assets/icons/HOJALDRE.svg';
import cafeCatIcon from '../../assets/icons/CAFÉ.svg';
import desayunoIcon from '../../assets/icons/DESAYUNO.svg';
import llevarIcon from '../../assets/icons/LLEVAR.svg';
import panaderiaIcon from '../../assets/icons/PANADERIA.svg';
import reposteriaIcon from '../../assets/icons/REPOSTERÍA.svg';
import tardeoIcon from '../../assets/icons/TARDEO.svg';
import carrotIcon from '../../assets/icons/CARROT.svg';
import onionIcon from '../../assets/icons/ONION.svg';
import bananaIcon from '../../assets/icons/BANANA.svg';
import iceCreamIcon from '../../assets/icons/ICE CREAM.svg';
import riceIcon from '../../assets/icons/RICE.svg';
import pepperIcon from '../../assets/icons/PEPPER.svg';
import tomatoIcon from '../../assets/icons/TOMATE.svg';
import cornIcon from '../../assets/icons/CORN.svg';
import pancakeIcon from '../../assets/icons/PANCAKES.svg';

const IconPlus = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const IconTrash = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const IconChevronLeft = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>
);

const IconChevronRight = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
);

const OPCIONES_INGREDIENTES = [
  { id: 'cafe', icon: coffeeBeanIcon, es: 'Café', en: 'Coffee' },
  { id: 'leche', icon: milkIcon, es: 'Lácteo', en: 'Dairy' },
  { id: 'huevo', icon: eggIcon, es: 'Huevo', en: 'Egg' },
  { id: 'pan', icon: breadIcon, es: 'Pan/Harina', en: 'Bread' },
  { id: 'queso', icon: cheeseIcon, es: 'Queso', en: 'Cheese' },
  { id: 'chocolate', icon: cacaoIcon, es: 'Chocolate', en: 'Chocolate' },
  { id: 'fruta', icon: appleIcon, es: 'Fruta', en: 'Fruit' },
  { id: 'miel', icon: honeyIcon, es: 'Miel/Dulce', en: 'Honey' },
  { id: 'nueces', icon: nutsIcon, es: 'Nueces', en: 'Nuts' },
  { id: 'especias', icon: spiceIcon, es: 'Especias', en: 'Spice' },
  { id: 'aguacate', icon: avocadoIcon, es: 'Aguacate', en: 'Avocado' },
  { id: 'tocineta', icon: baconIcon, es: 'Tocineta', en: 'Bacon' },
  { id: 'hielo', icon: iceIcon, es: 'Hielo', en: 'Ice' },
  { id: 'limon', icon: lemonIcon, es: 'Limón', en: 'Lemon' },
  { id: 'mora', icon: berryIcon, es: 'Mora/Fresa', en: 'Berry' },
  { id: 'carne', icon: cowIcon, es: 'Res/Lácteo', en: 'Dairy/Meat' },
  { id: 'pollo', icon: chickenIcon, es: 'Pollo', en: 'Chicken' },
  { id: 'chorizo', icon: chorizoIcon, es: 'Embutido', en: 'Sausage' },
  { id: 'bebidas', icon: bebidasIcon, es: 'Líquidos', en: 'Liquids' },
  { id: 'agua', icon: waterIcon, es: 'Agua', en: 'Water' },
  { id: 'barra_choco', icon: chocBarIcon, es: 'Choco Barra', en: 'Choc Bar' },
  { id: 'hojaldre', icon: hojaldreIcon, es: 'Hojaldre', en: 'Puff Pastry' },
  { id: 'cafe_bolsa', icon: cafeCatIcon, es: 'Café (Paquete)', en: 'Coffee (Bag)' },
  { id: 'desayuno', icon: desayunoIcon, es: 'Desayuno', en: 'Breakfast' },
  { id: 'llevar', icon: llevarIcon, es: 'Para llevar', en: 'To Go' },
  { id: 'panaderia_cat', icon: panaderiaIcon, es: 'Panadería', en: 'Bakery' },
  { id: 'reposteria', icon: reposteriaIcon, es: 'Repostería', en: 'Pastry' },
  { id: 'tardeo', icon: tardeoIcon, es: 'Tardeo', en: 'Afternoon' },
  { id: 'zanahoria', icon: carrotIcon, es: 'Zanahoria', en: 'Carrot' },
  { id: 'cebolla', icon: onionIcon, es: 'Cebolla', en: 'Onion' },
  { id: 'banano', icon: bananaIcon, es: 'Banano', en: 'Banana' },
  { id: 'helado', icon: iceCreamIcon, es: 'Helado', en: 'Ice Cream' },
  { id: 'arroz', icon: riceIcon, es: 'Bowl de Arroz', en: 'Rice Bowl' },
  { id: 'pimienton', icon: pepperIcon, es: 'Pimentón', en: 'Bell Pepper' },
  { id: 'tomate', icon: tomatoIcon, es: 'Tomate', en: 'Tomato' },
  { id: 'maiz', icon: cornIcon, es: 'Maíz', en: 'Corn' },
  { id: 'pancakes', icon: pancakeIcon, es: 'Pancakes', en: 'Pancakes' },
  { id: 'adiciones', icon: adicionesIcon, es: 'Adiciones', en: 'Add-ons' },
  { id: 'enlatados', icon: enlatadosIcon, es: 'Fríos', en: 'Canned/Cold' },
];

export default function IngredientesBasicos({ product, showEdit, isEnglish, viewName }) {
  const dispatch = useDispatch();
  const [activeIndex, setActiveIndex] = useState(null);

  // Sync with Redux in real-time with debounce
  const isFirstRender = React.useRef(true);
  const selected = Array.isArray(product.IngredientesBasicos) ? product.IngredientesBasicos : [];

  const addSlot = () => {
    if (!showEdit) return;
    const newSelected = [...selected, 'cafe']; // Default slot
    dispatch(updateItem(product._id, { IngredientesBasicos: newSelected }, "Menu"));
    setActiveIndex(newSelected.length - 1);
  };

  const selectIcon = (id) => {
    if (!showEdit) return;
    if (activeIndex !== null) {
      const newSelected = [...selected];
      newSelected[activeIndex] = id;
      dispatch(updateItem(product._id, { IngredientesBasicos: newSelected }, "Menu"));
      setActiveIndex(null); // Deselect after choosing
    } else {
      const newSelected = [...selected, id];
      dispatch(updateItem(product._id, { IngredientesBasicos: newSelected }, "Menu"));
    }
  };

  const removeIngredient = (e, index) => {
    e.stopPropagation();
    if (!showEdit) return;
    const newSelected = selected.filter((_, i) => i !== index);
    dispatch(updateItem(product._id, { IngredientesBasicos: newSelected }, "Menu"));
    if (activeIndex === index) setActiveIndex(null);
    else if (activeIndex > index) setActiveIndex(activeIndex - 1);
  };

  const clearAll = () => {
    if (!showEdit) return;
    if (window.confirm(isEnglish ? 'Clear all ingredients?' : '¿Limpiar todos los ingredientes?')) {
      dispatch(updateItem(product._id, { IngredientesBasicos: [] }, "Menu"));
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
    dispatch(updateItem(product._id, { IngredientesBasicos: newSelected }, "Menu"));
    setActiveIndex(newIdx);
  };

  // VISTA PARA IMPRESIÓN (Iconos pequeños al lado del nombre)
  if (viewName === "MenuPrint") {
    if (!selected.length) return null;
    return (
      <div className="flex flex-wrap gap-0 items-center mr-0 print:mr-0.5">
        {selected.map((id, idx) => {
          const ing = OPCIONES_INGREDIENTES.find(i => i.id === id);
          if (!ing) return null;
          return (
            <img
              key={`${id}-${idx}`}
              src={ing.icon}
              alt={ing.es}
              className="opacity-90  w-5 h-5 object-contain filter grayscale contrast-200"
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
      <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-inner flex flex-wrap gap-0 items-center min-h-[56px] relative group">
        {!selected.length && (
          <span className="text-[9px] text-slate-400 italic font-medium px-2">
            {isEnglish ? 'Add icons to start...' : 'Agrega iconos para comenzar...'}
          </span>
        )}

        {selected.map((id, index) => {
          const ing = OPCIONES_INGREDIENTES.find(i => i.id === id);
          if (!ing) return null;
          const isActive = activeIndex === index;

          return (
            <div
              key={`${id}-${index}`}
              onClick={() => setActiveIndex(isActive ? null : index)}
              className={`relative flex flex-col items-center gap-0 transition-all ${isActive ? 'z-20' : 'z-10'}`}
            >
              <div className={`cursor-pointer transition-all p-1 rounded-xl border-1 ${isActive
                ? 'bg-blue-50 border-blue-500 scale-110 shadow-lg ring-4 ring-blue-100'
                : 'bg-white border-transparent hover:border-slate-200'
                }`}>
                <img
                  src={ing.icon}
                  alt={ing.es}
                  className="w-6 h-6 object-contain "
                  style={{ filter: isActive ? 'none' : 'grayscale(100%) contrast(500%) opacity(80%)' }}
                />

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
                    <IconChevronLeft size={12} />
                  </button>
                  <div className="w-[1px] bg-slate-100" />
                  <button
                    onClick={(e) => moveItem(e, index, 1)}
                    disabled={index === selected.length - 1}
                    className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-20"
                  >
                    <IconChevronRight size={12} />
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
            <IconPlus size={20} />
          </button>
        )}

        {showEdit && selected.length > 0 && (
          <button
            onClick={clearAll}
            className="absolute -right-1 -top-6 text-slate-300 hover:text-red-500 transition-colors bg-white p-1 rounded-full shadow-sm"
            title={isEnglish ? 'Clear all' : 'Limpiar todo'}
          >
            <IconTrash size={12} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {OPCIONES_INGREDIENTES.map(ing => {
          return (
            <button
              key={ing.id}
              onClick={() => selectIcon(ing.id)}
              disabled={!showEdit}
              className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-all shadow-sm active:scale-95 ${activeIndex !== null
                ? 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                : 'bg-slate-50 text-slate-500 border-slate-100 opacity-80'
                }`}
            >
              <img
                src={ing.icon}
                alt={ing.es}
                className="w-5 h-5 object-contain filter grayscale contrast-200"
              />
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