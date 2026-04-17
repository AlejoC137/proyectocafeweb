import React from 'react';
import { useDispatch } from 'react-redux';
import { updateItem } from '../../redux/actions';
import { MENU } from '../../redux/actions-types';

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

const IconPlus = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const IconTrash = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const IconChevronLeft = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>
);

const IconChevronRight = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
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

const formatPrice = (precio) => {
    if (precio >= 1000) {
        return `${precio / 1000} K`;
    }
    return precio;
};

function ProductSummaryRow({ product, isEnglish, editMode, activeSlot, setActiveSlot }) {
    const dispatch = useDispatch();
    const [localIngredients, setLocalIngredients] = React.useState(Array.isArray(product.IngredientesBasicos) ? product.IngredientesBasicos : []);

    React.useEffect(() => {
        if (JSON.stringify(product.IngredientesBasicos) !== JSON.stringify(localIngredients)) {
            setLocalIngredients(Array.isArray(product.IngredientesBasicos) ? product.IngredientesBasicos : []);
        }
    }, [product.IngredientesBasicos]);

    const syncWithRedux = (newList) => {
        setLocalIngredients(newList);
        dispatch(updateItem(product._id, { IngredientesBasicos: newList }, MENU));
    };

    const handleOrderChange = (newOrder) => {
        dispatch(updateItem(product._id, { Order: newOrder }, MENU));
    };

    const addIconSlot = () => {
        const next = [...localIngredients, 'cafe'];
        syncWithRedux(next);
        setActiveSlot({ productId: product._id, index: next.length - 1 });
    };

    const removeIconSlot = (index) => {
        const next = localIngredients.filter((_, i) => i !== index);
        syncWithRedux(next);
        setActiveSlot(null);
    };

    const moveIconSlot = (index, direction) => {
        const next = [...localIngredients];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= localIngredients.length) return;
        [next[index], next[newIndex]] = [next[newIndex], next[index]];
        syncWithRedux(next);
        setActiveSlot({ productId: product._id, index: newIndex });
    };

    const setIconForSlot = (iconId, index) => {
        const next = [...localIngredients];
        next[index] = iconId;
        syncWithRedux(next);
        setActiveSlot(null);
    };

    return (
        <div className="flex justify-between items-baseline border-b border-black/10 pb-0.5 group relative">
            <div className="flex items-center gap-1 overflow-visible flex-grow">
                {editMode && (
                    <div className="flex items-center gap-1 print:hidden ">
                        <input
                            type="number"
                            defaultValue={product.Order}
                            onBlur={(e) => handleOrderChange(e.target.value)}
                            className="w-7 h-5 text-[9px] border border-black px-0.5 font-bold focus:outline-none focus:ring-1 focus:ring-black bg-yellow-100"
                        />
                    </div>
                )}
                <span className="font-SpaceGrotesk font-bold uppercase text-[11px] leading-tight truncate mr-1">
                    {isEnglish ? product.NombreEN : product.NombreES}
                </span>

                <div className="flex gap-0 items-center">
                    {localIngredients.map((id, index) => {
                        const ing = OPCIONES_INGREDIENTES.find(i => i.id === id);
                        if (!ing) return null;
                        const isActive = activeSlot?.productId === product._id && activeSlot?.index === index;

                        return (
                            <div key={`${product._id}-${index}`} className="relative group/slot flex items-center">
                                <button
                                    disabled={!editMode}
                                    onClick={() => setActiveSlot(isActive ? null : { productId: product._id, index })}
                                    className={`p-0 transition-all flex items-center justify-center rounded-sm ${isActive ? 'bg-blue-100 scale-110 shadow-sm border border-blue-400' : 'hover:bg-black/5'}`}
                                >
                                    <img
                                        src={ing.icon}
                                        alt={ing.es}
                                        className="opacity-90 w-4 h-4 object-contain filter grayscale contrast-200 opacity-80"
                                    />
                                </button>

                                {editMode && isActive && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-[60] flex gap-0.5 bg-white border border-black p-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-sm">
                                        <button onClick={(e) => { e.stopPropagation(); moveIconSlot(index, -1); }} disabled={index === 0} className="hover:bg-slate-100 p-0.5 disabled:opacity-30">
                                            <IconChevronLeft size={10} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); moveIconSlot(index, 1); }} disabled={index === localIngredients.length - 1} className="hover:bg-slate-100 p-0.5 disabled:opacity-30">
                                            <IconChevronRight size={10} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); removeIconSlot(index); }} className="hover:bg-red-100 text-red-600 p-0.5">
                                            <IconTrash size={10} />
                                        </button>
                                    </div>
                                )}

                                {editMode && isActive && (
                                    <div className="absolute top-5 left-0 z-50 bg-white border-2 border-black p-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-1 animate-in fade-in zoom-in duration-200 w-32">
                                        {OPCIONES_INGREDIENTES.map(option => {
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => setIconForSlot(option.id, index)}
                                                    className={`p-1 hover:scale-125 transition-transform flex items-center justify-center ${id === option.id ? 'bg-black rounded-sm' : ''}`}
                                                    title={isEnglish ? option.en : option.es}
                                                >
                                                    <img
                                                        src={option.icon}
                                                        alt={option.es}
                                                        className={`w-5 h-5 object-contain ${id === option.id ? 'invert' : ''}`}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {editMode && (
                        <button
                            onClick={() => addIconSlot()}
                            className="w-4 h-4 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 rounded-sm border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all ml-1"
                            title={isEnglish ? "Add ingredient" : "Agregar ingrediente"}
                        >
                            <IconPlus size={10} />
                        </button>
                    )}
                </div>
            </div>
            <span className="font-SpaceGrotesk font-black text-[11px] whitespace-nowrap">
                ${formatPrice(product.Precio)}
            </span>
        </div>
    );
}

export function CardGridPrintMatrix({ products, isEnglish, GRUPO, SUB_GRUPO, TITTLE, columns = 2, editMode = false }) {
    const [activeSlot, setActiveSlot] = React.useState(null);

    const filteredProducts = products.filter((product) => {
        const groupMatch = Array.isArray(GRUPO) ? GRUPO.includes(product.GRUPO) : product.GRUPO === GRUPO;
        return groupMatch && (product.Estado === "Activo" || product.Estado === "OK") && (!SUB_GRUPO || product.SUB_GRUPO === SUB_GRUPO);
    });

    const activeProducts = filteredProducts.filter(p => p.PRINT === true).sort((a, b) => Number(a.Order) - Number(b.Order));

    if (activeProducts.length === 0) return null;

    const titleText = TITTLE ? TITTLE[isEnglish ? "EN" : "ES"] : String(GRUPO);
    const gridColsClass = columns === 3 ? "grid-cols-3" : columns === 2 ? "grid-cols-2" : "grid-cols-1";

    return (
        <div className="mb-4 break-inside-avoid">
            <div className="flex items-center mb-1.5 ">
                <span className="font-black text-xs uppercase tracking-widest bg-black text-white px-2 py-0.5 border-[2px] border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {titleText}
                </span>
                <div className="flex-grow border-b-[2px] border-black ml-2 h-0"></div>
            </div>

            <div className={`grid ${gridColsClass} gap-x-4 gap-y-1`}>
                {activeProducts.map((product) => (
                    <ProductSummaryRow
                        key={product._id}
                        product={product}
                        isEnglish={isEnglish}
                        editMode={editMode}
                        activeSlot={activeSlot}
                        setActiveSlot={setActiveSlot}
                    />
                ))}
            </div>
        </div>
    );
}