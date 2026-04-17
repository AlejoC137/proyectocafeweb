import React from 'react';
import { useDispatch } from 'react-redux';
import { updateItem } from '../../redux/actions';
import { MENU } from '../../redux/actions-types';

import adicionesIcon from '../../assets/icons/ADICIONES.svg';
import bebidasIcon from '../../assets/icons/BEBIDAS.svg';
import cafeIcon from '../../assets/icons/CAFÉ.svg';
import desayunoIcon from '../../assets/icons/DESAYUNO.svg';
import enlatadosIcon from '../../assets/icons/ENLATADOS.svg';
import llevarIcon from '../../assets/icons/LLEVAR.svg';
import panaderiaIcon from '../../assets/icons/PANADERIA.svg';
import reposteriaIcon from '../../assets/icons/REPOSTERÍA.svg';
import tardeoIcon from '../../assets/icons/TARDEO.svg';

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
    { id: 'adiciones', icon: adicionesIcon, es: 'Adiciones', en: 'Add-ons' },
    { id: 'bebidas', icon: bebidasIcon, es: 'Bebidas', en: 'Drinks' },
    { id: 'cafe', icon: cafeIcon, es: 'Café', en: 'Coffee' },
    { id: 'desayuno', icon: desayunoIcon, es: 'Desayuno', en: 'Breakfast' },
    { id: 'enlatados', icon: enlatadosIcon, es: 'Enlatados', en: 'Canned' },
    { id: 'llevar', icon: llevarIcon, es: 'Llevar', en: 'To Go' },
    { id: 'panaderia', icon: panaderiaIcon, es: 'Panadería', en: 'Bakery' },
    { id: 'reposteria', icon: reposteriaIcon, es: 'Repostería', en: 'Pastry' },
    { id: 'tardeo', icon: tardeoIcon, es: 'Tardeo', en: 'Afternoon' },
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

                <div className="flex gap-1 items-center">
                    {localIngredients.map((id, index) => {
                        const ing = OPCIONES_INGREDIENTES.find(i => i.id === id);
                        if (!ing) return null;
                        const isActive = activeSlot?.productId === product._id && activeSlot?.index === index;

                        return (
                            <div key={`${product._id}-${index}`} className="relative group/slot flex items-center">
                                <button
                                    disabled={!editMode}
                                    onClick={() => setActiveSlot(isActive ? null : { productId: product._id, index })}
                                    className={`p-0.5 transition-all flex items-center justify-center rounded-sm ${isActive ? 'bg-blue-100 scale-110 shadow-sm border border-blue-400' : 'hover:bg-black/5'}`}
                                >
                                    <img
                                        src={ing.icon}
                                        alt={ing.es}
                                        className="opacity-90 w-3 h-3 object-contain filter grayscale contrast-200 opacity-80"
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
                                                        className={`w-3.5 h-3.5 object-contain ${id === option.id ? 'invert' : ''}`} 
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