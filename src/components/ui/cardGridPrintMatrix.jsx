import React from 'react';
import { useDispatch } from 'react-redux';
import { updateItem, getAllFromTable } from '../../redux/actions';
import { MENU } from '../../redux/actions-types';
import { Eye, EyeOff } from 'lucide-react';

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

function ProductSummaryRow({ product, isEnglish, editMode, activeSlot, setActiveSlot, showIcons, colors, showItemDescriptions = true, blockId, groupDescriptions = {}, saveGroupDescriptions }) {
    const dispatch = useDispatch();
    const [localIngredients, setLocalIngredients] = React.useState(Array.isArray(product.IngredientesBasicos) ? product.IngredientesBasicos : []);

    React.useEffect(() => {
        if (JSON.stringify(product.IngredientesBasicos) !== JSON.stringify(localIngredients)) {
            setLocalIngredients(Array.isArray(product.IngredientesBasicos) ? product.IngredientesBasicos : []);
        }
    }, [product.IngredientesBasicos]);

    const itemKey = blockId ? `${blockId}_excluded_item_${product._id}` : `excluded_item_${product._id}`;

    const isDeactivated = groupDescriptions?.[itemKey] !== undefined
        ? groupDescriptions[itemKey] === true
        : (groupDescriptions?.[`excluded_item_${product._id}`] === true ||
           product.PrintConst === false || product.PrintConst === "No" || product.PrintConst === "NO" || product.PrintConst === "false");

    const handleToggleItemDeactivation = (e) => {
        e.stopPropagation();
        const nextState = !isDeactivated;

        if (saveGroupDescriptions) {
            saveGroupDescriptions({
                ...(groupDescriptions || {}),
                [itemKey]: nextState
            });
        }
    };

    const syncWithRedux = (newList) => {
        setLocalIngredients(newList);
        dispatch(updateItem(product._id, { IngredientesBasicos: newList }, MENU));
    };

    const handleOrderChange = (newOrder) => {
        console.log("Guardando Order:", newOrder, "para el producto:", product.NombreES, product._id);
        dispatch(updateItem(product._id, { Order: newOrder }, MENU)).then(() => {
            dispatch(getAllFromTable(MENU));
        });
    };

    const handleComentsChange = (newComents) => {
        const fieldName = isEnglish ? "MenuComentsEN" : "MenuComentsES";
        console.log("Guardando " + fieldName + ":", newComents, "para el producto:", product.NombreES, product._id);
        dispatch(updateItem(product._id, { [fieldName]: newComents }, MENU)).then(() => {
            dispatch(getAllFromTable(MENU));
        });
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

    const showLine = colors?.showItemLines !== false;
    const lineStyle = colors?.itemLineStyle || 'solid';
    const lineWidth = colors?.itemLineWidth || 1;
    const borderBottomStyle = showLine ? `${lineWidth}px ${lineStyle} ${colors?.gridBorder || 'rgba(0,0,0,0.1)'}` : 'none';

    const priceAlign = groupDescriptions?.[`${blockId}_priceAlign`] || colors?.priceAlign || 'right';
    const priceGap = groupDescriptions?.[`${blockId}_priceGap`] ?? colors?.priceGap ?? 5;
    const containerClass = priceAlign === 'left' ? 'flex justify-start items-baseline' : 'flex justify-between items-baseline gap-2';
    const containerStyle = priceAlign === 'left' ? { gap: `${priceGap}px` } : {};

    return (
        <div className={`pb-0.5 group relative flex flex-col transition-opacity ${isDeactivated && editMode ? 'opacity-40 bg-red-50/40 rounded-sm px-0.5' : ''}`} style={{ borderBottom: borderBottomStyle }}>
            <div className={containerClass} style={containerStyle}>
                <div className={`flex items-start gap-1 min-w-0 ${priceAlign === 'right' ? 'flex-grow' : ''}`}>
                    {editMode && (
                        <div className="flex items-center gap-1 print:hidden pt-0.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleToggleItemDeactivation}
                                className={`h-5 px-1.5 rounded border text-[9px] font-black uppercase flex items-center gap-0.5 transition-colors cursor-pointer shadow-sm ${
                                    isDeactivated 
                                        ? 'bg-red-100 border-red-500 text-red-600 hover:bg-red-200' 
                                        : 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200'
                                }`}
                                title={isDeactivated ? (isEnglish ? "Item Disabled (Click to Enable)" : "Ítem Desactivado (Clic para Activar)") : (isEnglish ? "Item Enabled (Click to Disable)" : "Ítem Activado (Clic para Desactivar)")}
                            >
                                {isDeactivated ? <EyeOff size={10} /> : <Eye size={10} />}
                                <span className="text-[8px]">{isDeactivated ? "OFF" : "ON"}</span>
                            </button>

                            <input
                                type="number"
                                defaultValue={product.Order || ''}
                                onBlur={(e) => handleOrderChange(e.target.value)}
                                className="w-7 h-5 text-[9px] border border-black px-0.5 font-bold focus:outline-none focus:ring-1 focus:ring-black bg-yellow-100"
                                title={isEnglish ? "Position order" : "Orden de posición"}
                            />
                        </div>
                    )}
                    <div className="flex flex-col flex-1 min-w-0 mr-1">
                        <div className={`font-bold leading-tight break-words whitespace-normal uppercase ${isDeactivated && editMode ? 'line-through text-red-600' : ''}`} style={{ color: isDeactivated && editMode ? '#dc2626' : colors?.itemName, fontFamily: colors?.fontItem || 'Space Grotesk', fontSize: `${colors?.sizeItem || 11}${colors?.fontSizeUnit || 'px'}` }}>
                            {isEnglish ? product.NombreEN : product.NombreES}
                        </div>
                    </div>

                    <div className={`flex gap-0 items-center flex-shrink-0 pt-[2px] ${!showIcons ? 'hidden' : ''}`}>
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
                <span className="font-black whitespace-nowrap" style={{ color: colors?.itemPrice, fontFamily: colors?.fontItem || 'Space Grotesk', fontSize: `${colors?.sizePrice || 11}${colors?.fontSizeUnit || 'px'}` }}>
                    ${formatPrice(product.Precio)}
                </span>
            </div>

            {/* Comentario en una nueva línea de ancho completo que ocupa exactamente los mismos renglones en Vista Previa y Editar */}
            {showItemDescriptions && (
                editMode ? (
                    <textarea
                        defaultValue={(isEnglish ? product.MenuComentsEN : product.MenuComentsES) || ''}
                        placeholder={isEnglish ? "Añadir comentario..." : "Añadir comentario..."}
                        onBlur={(e) => handleComentsChange(e.target.value)}
                        rows={1}
                        ref={(el) => {
                            if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${el.scrollHeight}px`;
                            }
                        }}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        className="italic font-normal normal-case tracking-normal leading-tight w-full bg-transparent border-b border-dashed border-gray-300 focus:border-black outline-none resize-none p-0 m-0 overflow-hidden print:hidden"
                        style={{
                            color: colors?.itemComment || '#6b7280',
                            fontFamily: colors?.fontBody || 'serif',
                            fontSize: `${colors?.sizeComment || 9.2}${colors?.fontSizeUnit || 'px'}`
                        }}
                    />
                ) : (
                    (isEnglish ? product.MenuComentsEN : product.MenuComentsES) ? (
                        <div className="italic font-normal normal-case tracking-normal leading-tight w-full break-words" style={{ color: colors?.itemComment || '#6b7280', fontFamily: colors?.fontBody || 'serif', fontSize: `${colors?.sizeComment || 9.2}${colors?.fontSizeUnit || 'px'}` }}>
                            {isEnglish ? product.MenuComentsEN : product.MenuComentsES}
                        </div>
                    ) : null
                )
            )}
        </div>
    );
}

export function CardGridPrintMatrix({
    products,
    isEnglish,
    GRUPO,
    SUB_GRUPO,
    excludeSubgrupos,
    TITTLE,
    columns = 2,
    editMode = false,
    showIcons = true,
    showItemDescriptions = true,
    colors,
    groupDescriptions,
    saveGroupDescriptions,
    excludeKey,
    blockId
}) {
    const [activeSlot, setActiveSlot] = React.useState(null);

    const isExcluded = excludeKey && groupDescriptions?.[excludeKey] === true;

    const filteredProducts = products.filter((product) => {
        if (product.Estado === "Inactivo" || product.Estado === "INACTIVO") return false;
        
        let groupMatch = false;
        if (Array.isArray(GRUPO)) {
          groupMatch = GRUPO.some(g => (product.GRUPO || "").toUpperCase().startsWith(g.toUpperCase()));
        } else if (GRUPO) {
          groupMatch = (product.GRUPO || "").toUpperCase().startsWith(GRUPO.toUpperCase()) || 
                       (GRUPO.toUpperCase().startsWith((product.GRUPO || "").toUpperCase()) && product.GRUPO);
        }

        if (!groupMatch) return false;

        const prodSub = String(product.SUB_GRUPO || "").toUpperCase();

        if (Array.isArray(excludeSubgrupos) && excludeSubgrupos.length > 0) {
          const isExcludedSub = excludeSubgrupos.some(ex => ex && prodSub.includes(String(ex).toUpperCase()));
          if (isExcludedSub) return false;
        }

        const subGrupoMatch = !SUB_GRUPO || prodSub.includes(String(SUB_GRUPO).toUpperCase());
        
        return subGrupoMatch;
    });

    const getOrder = (val) => {
        const num = Number(val);
        return (!isNaN(num) && val !== '' && val !== null && val !== undefined) ? num : 9999;
    };

    const isItemDeactivated = (p) => {
        const itemKey = blockId ? `${blockId}_excluded_item_${p._id}` : `excluded_item_${p._id}`;
        if (groupDescriptions?.[itemKey] !== undefined) {
            return groupDescriptions[itemKey] === true;
        }
        if (groupDescriptions?.[`excluded_item_${p._id}`] === true) return true;
        if (p.PrintConst === false || p.PrintConst === "No" || p.PrintConst === "NO" || p.PrintConst === "false") return true;
        return false;
    };

    const isPrintable = (p) => {
        if (editMode) return true;
        return !isItemDeactivated(p);
    };

    const activeProducts = filteredProducts
        .filter(isPrintable)
        .sort((a, b) => getOrder(a.Order) - getOrder(b.Order));

    if (activeProducts.length === 0) return null;
    if (isExcluded && !editMode) return null;

    const titleText = TITTLE ? TITTLE[isEnglish ? "EN" : "ES"] : String(GRUPO);
    const gridColsClass = 
        columns === 5 ? "grid-cols-5" :
        columns === 4 ? "grid-cols-4" :
        columns === 3 ? "grid-cols-3" :
        columns === 2 ? "grid-cols-2" :
        "grid-cols-1";

    const dispatch = useDispatch();

    const handleToggleAllItemsInSubgroup = (enableAll) => {
        if (!saveGroupDescriptions) return;
        const updates = { ...(groupDescriptions || {}) };

        filteredProducts.forEach(p => {
            const itemKey = blockId ? `${blockId}_excluded_item_${p._id}` : `excluded_item_${p._id}`;
            updates[itemKey] = !enableAll;
        });

        saveGroupDescriptions(updates);
    };

    const handleToggleExclude = () => {
        if (!saveGroupDescriptions || !excludeKey) return;
        const newDescriptions = {
            ...groupDescriptions,
            [excludeKey]: !isExcluded
        };
        saveGroupDescriptions(newDescriptions);
    };

    return (
        <div className="mb-0 break-inside-avoid">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <span className={`font-black uppercase tracking-widest px-2 py-0.5 border-[2px] inline-block shadow-[2px_2px_0px_0px] ${isExcluded ? 'opacity-50 bg-zinc-100 border-zinc-400 text-zinc-400' : ''}`} style={{ 
                    backgroundColor: isExcluded ? '#f4f4f5' : (colors?.categoryTitle === colors?.categoryBg ? '#000' : colors?.categoryBg), 
                    color: isExcluded ? '#a1a1aa' : colors?.categoryTitle, 
                    borderColor: isExcluded ? '#a1a1aa' : colors?.categoryBorder, 
                    boxShadow: isExcluded ? '2px 2px 0px 0px #a1a1aa' : `2px 2px 0px 0px ${colors?.categoryBorder}`, 
                    fontFamily: colors?.fontCategory || 'Space Grotesk', 
                    fontSize: `${colors?.sizeCategory * 0.6 || 12}${colors?.fontSizeUnit || 'px'}` 
                }}>
                    {titleText} {isExcluded && (isEnglish ? " (HIDDEN)" : " (OCULTO)")}
                </span>

                {editMode && (
                    <div className="ml-auto flex items-center gap-2 print:hidden">
                        {excludeKey && (
                            <button
                                onClick={handleToggleExclude}
                                className="flex items-center gap-1.5 focus:outline-none cursor-pointer bg-transparent border-none p-0"
                                title={isExcluded ? "Mostrar subcategoría" : "Ocultar subcategoría"}
                            >
                                <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out border-2 border-black flex items-center ${
                                    isExcluded ? 'bg-zinc-300' : 'bg-green-500'
                                }`}>
                                    <div className="w-2.5 h-2.5 bg-white rounded-full border border-black transition-transform duration-200 ease-in-out" style={{ transform: isExcluded ? 'translateX(0px)' : 'translateX(10px)' }} />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-600">
                                    {isExcluded ? "OFF" : "ON"}
                                </span>
                            </button>
                        )}

                        {!isExcluded && filteredProducts.length > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-50 p-0.5 rounded border border-black text-[9px] font-SpaceGrotesk">
                                <span className="font-black text-amber-900 text-[8px] uppercase">ÍTEMS:</span>
                                <button
                                    type="button"
                                    onClick={() => handleToggleAllItemsInSubgroup(true)}
                                    className="text-[8px] font-black px-1.5 py-0.5 rounded bg-green-200 text-green-900 hover:bg-green-300 border border-green-600 cursor-pointer"
                                    title={isEnglish ? "Enable ALL items in this subcategory" : "Activar TODOS los productos de esta subcategoría"}
                                >
                                    ON ALL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggleAllItemsInSubgroup(false)}
                                    className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-200 text-red-900 hover:bg-red-300 border border-red-600 cursor-pointer"
                                    title={isEnglish ? "Disable ALL items in this subcategory" : "Desactivar TODOS los productos de esta subcategoría"}
                                >
                                    OFF ALL
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!isExcluded && (
                <div className={`grid ${gridColsClass} gap-x-4 gap-y-1`}>
                    {activeProducts.map((product) => (
                        <ProductSummaryRow
                            key={product._id}
                            product={product}
                            isEnglish={isEnglish}
                            editMode={editMode}
                            activeSlot={activeSlot}
                            setActiveSlot={setActiveSlot}
                            showIcons={showIcons}
                            colors={colors}
                            showItemDescriptions={showItemDescriptions}
                            blockId={blockId}
                            groupDescriptions={groupDescriptions}
                            saveGroupDescriptions={saveGroupDescriptions}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}