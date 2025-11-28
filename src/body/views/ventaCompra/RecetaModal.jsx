import React, { useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getAllFromTable, getOtherExpenses, getRecepie, updateItem } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MENU, ITEMS, PRODUCCION } from "../../../redux/actions-types";
import EditableText from "../../../components/ui/EditableText";
import { recetaMariaPaula } from "../../../redux/calcularReceta.jsx";

// --- Componente para la fila de edición de un ingrediente ---
const EditableIngredientRow = ({ item, index, source, onNameChange, onSelect, onQuantityChange, onRemove }) => {
    const subtotal = (Number(item.originalQuantity) || 0) * (Number(item.precioUnitario) || 0);
    return (
        <div className="flex flex-col mb-3 p-2 border rounded-md bg-white shadow-sm">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Buscar ingrediente..."
                    value={item.nombre || ''}
                    onChange={(e) => onNameChange(index, e.target.value, source)}
                    className="p-2 border rounded flex-1 text-sm h-9"
                />
                <button
                    onClick={() => onRemove(index, source)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-bold h-9 w-9"
                >
                    ✕
                </button>
            </div>
            {item.matches && item.matches.length > 0 && (
                <ul className="border rounded bg-white max-h-40 overflow-y-auto mt-1 z-10">
                    {item.matches.map((match) => (
                        <li key={match._id} onClick={() => onSelect(index, match, source)} className="p-2 hover:bg-gray-200 cursor-pointer text-sm">
                            {match.Nombre_del_producto}
                        </li>
                    ))}
                </ul>
            )}
            <div className="grid grid-cols-4 gap-2 mt-2 items-center">
                <Input
                    type="number"
                    placeholder="Cant."
                    value={item.originalQuantity || ""}
                    onChange={(e) => onQuantityChange(index, e.target.value, source)}
                    className="p-2 border rounded text-sm h-9"
                />
                <Input
                    type="text"
                    placeholder="Unidades"
                    value={item.unidades || ""}
                    readOnly
                    className="p-2 border rounded bg-gray-100 text-sm h-9"
                />
                <Input
                    type="text"
                    placeholder="P. Unit."
                    value={Number(item.precioUnitario || 0).toFixed(2)}
                    readOnly
                    className="p-2 border rounded bg-gray-100 text-sm h-9 text-right"
                />
                <Input
                    type="text"
                    placeholder="Subtotal"
                    value={subtotal.toFixed(2)}
                    readOnly
                    className="p-2 border rounded bg-gray-100 text-sm h-9 text-right font-bold"
                />
            </div>
        </div>
    );
};

// --- Componente para la fila de ingrediente en modo VISTA SIMPLE ---
const RecipeItemRow = ({ item, isEditing, onCheck, onSave }) => {
    const [editValue, setEditValue] = useState(item.cantidad.toString());
    const [isInputActive, setIsInputActive] = useState(false);
    const handleSave = () => { onSave(item.originalIndex, editValue); setIsInputActive(false); };
    const handleEditClick = () => { setEditValue(item.cantidad.toFixed(2)); setIsInputActive(true); };
    const handleCancel = () => { setIsInputActive(false); setEditValue(item.cantidad.toString()); };

    return (
        <div className={`group mb-2 flex items-center gap-2 p-2 rounded-md transition-colors duration-200 ${item.isChecked ? "bg-green-100 hover:bg-green-200" : "bg-gray-50 hover:bg-gray-100"}`}>
            <button onClick={() => onCheck(item.originalIndex)} className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg border-2 transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 ${item.isChecked ? "bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white shadow-lg" : "bg-white border-gray-300 text-gray-400 hover:border-green-400"}`} type="button">
                {item.isChecked && (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>)}
            </button>
            <span className="flex-grow text-sm">{item.nombre}</span>
            <span className="font-bold text-blue-600">{item.cantidad.toFixed(2)}</span>
            <span className="text-gray-500 text-sm">{item.unidades}</span>
            {isEditing && (
                <div className="flex items-center gap-1">
                    {isInputActive ? (
                        <><Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-20 h-8 text-sm" /><Button size="sm" className="h-8" onClick={handleSave}>OK</Button><Button size="sm" variant="ghost" className="h-8" onClick={handleCancel}>X</Button></>
                    ) : (<Button size="sm" variant="outline" className="h-8" onClick={handleEditClick}>Editar</Button>)}
                </div>
            )}
        </div>
    );
};

// --- Componente para la sección de receta en modo VISTA SIMPLE ---
const RecipeSection = ({ title, items, isEditing, onCheck, onSave }) => (
    <div>
        <h3 className="text-lg font-semibold border-b pb-2 mb-3">{title}</h3>
        {items.length > 0 ? (
            items.map(item => <RecipeItemRow key={item.key} item={item} isEditing={isEditing} onCheck={onCheck} onSave={onSave} />)
        ) : (
            <p className="text-sm text-gray-500">No hay elementos en esta sección.</p>
        )}
    </div>
);

// --- COMPONENTE PRINCIPAL UNIFICADO ---
function RecetaModal({ item, onClose }) {
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    const id = item?.Receta || paramId;
    
    const dispatch = useDispatch();
    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allOptions = useMemo(() => [...allItems, ...allProduccion], [allItems, allProduccion]);

    const searchableProducts = useMemo(
        () => [
            ...allItems.map(item => ({ ...item, __type: "item" })),
            ...allProduccion.map(prod => ({ ...prod, __type: "producto_interno" })),
        ],
        [allItems, allProduccion]
    );

    const getProductName = (product) =>
        product?.Nombre_del_producto || product?.NombreES || product?.name || "(Sin nombre)";

    const shortenLegacyTerm = (term) => {
        const words = term.trim().split(/\s+/);
        if (words.length <= 1) {
            return term.trim().slice(0, Math.ceil(term.length / 2));
        }
        const half = Math.ceil(words.length / 2);
        return words.slice(0, half).join(" ");
    };

    const findMatchesForIngredient = (term) => {
        const normalizedTerm = term.trim().toLowerCase();
        if (!normalizedTerm) return { matches: [], usedFallback: false, fallbackTerm: "" };

        const matches = searchableProducts.filter((product) =>
            getProductName(product).toLowerCase().includes(normalizedTerm)
        );

        if (matches.length > 0) {
            return { matches, usedFallback: false, fallbackTerm: normalizedTerm };
        }

        const shortened = shortenLegacyTerm(normalizedTerm);
        if (!shortened || shortened === normalizedTerm) {
            return { matches: [], usedFallback: false, fallbackTerm: normalizedTerm };
        }

        const fallbackMatches = searchableProducts.filter((product) =>
            getProductName(product).toLowerCase().includes(shortened)
        );

        return { matches: fallbackMatches, usedFallback: true, fallbackTerm: shortened };
    };
    
    const [receta, setReceta] = useState(null);
    const [menuItem, setMenuItem] = useState(null);
    const [foto, setFoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [porcentaje, setPorcentaje] = useState(100);
    const [editShow, setEditShow] = useState(false);

    // Estados para importación vía JSON
    const [showJsonImporter, setShowJsonImporter] = useState(false);
    const [jsonInput, setJsonInput] = useState("");
    const [jsonError, setJsonError] = useState(null);
    const [legacyIngredients, setLegacyIngredients] = useState([]);
    const [ingredientSelections, setIngredientSelections] = useState({});
    const [ingredientSearchTerms, setIngredientSearchTerms] = useState({});
    const [isSavingImport, setIsSavingImport] = useState(false);
    const [importedRecipeName, setImportedRecipeName] = useState("");
    
    const [permanentEditMode, setPermanentEditMode] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [recetaSource, setRecetaSource] = useState(null);
    const [pinCode, setPinCode] = useState('');
    const [showPinInput, setShowPinInput] = useState(false);
    
    const [rendimientoCantidad, setRendimientoCantidad] = useState('');
    const [rendimientoUnidades, setRendimientoUnidades] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    
    const [ingredientes, setIngredientes] = useState([]);
    const [produccion, setProduccion] = useState([]);

    const [editableIngredientes, setEditableIngredientes] = useState([]);
    const [editableProduccion, setEditableProduccion] = useState([]);

    const [calculoDetalles, setCalculoDetalles] = useState(null);
    const [precioVentaFinal, setPrecioVentaFinal] = useState(0);
    const [costoManualCMP, setCostoManualCMP] = useState('');
    const [tiempoProceso, setTiempoProceso] = useState(0);
    
    // Nuevo estado para mostrar el costo de producción calculado en tiempo real
    const [costoProduccion, setCostoProduccion] = useState(0);

    const buscarPorId = (itemId) => allOptions.find((i) => i._id === itemId) || null;
const handleCancelEdir = () => {setPermanentEditMode(false)}

    useEffect(() => {
        const fetchRecetaData = async () => {
            if (!id) { setError("El ítem no tiene una receta asociada."); setLoading(false); return; }
            setLoading(true);
            try {
                await Promise.all([ dispatch(getAllFromTable(ITEMS)), dispatch(getAllFromTable(PRODUCCION)), dispatch(getAllFromTable(MENU)), ]);
                let result = await getRecepie(id, "Recetas");
                let source = "Recetas";
                if (!result) { result = await getRecepie(id, "RecetasProduccion"); source = "RecetasProduccion"; }
                if (!result) throw new Error("Receta no encontrada");
                
                setReceta(result);
                setRecetaSource(source);
                setTiempoProceso(result.ProcessTime || 0);

                if (result.forId) {
                    const plato = await getRecepie(result.forId, "Menu");
                    if (plato) {
                        setFoto(plato.Foto);
                        setMenuItem(plato);
                        console.log(plato);
                        
                    }
                }
            } catch (err) { setError("Error al obtener la receta."); console.error(err); } finally { setLoading(false); }
        };
        fetchRecetaData();
    }, [id, dispatch]);

    const parseRecipeJson = () => {
        setJsonError(null);
        try {
            const parsed = JSON.parse(jsonInput);
            const ingredients = parsed.ingredients || parsed.ingredientes || parsed.items || [];
            const normalized = ingredients.map((ing, index) => {
                const legacyName = ing.legacyName || ing.nombre || ing.name || `Ingrediente ${index + 1}`;
                const quantity = Number(ing.cantidad || ing.quantity || ing.qty || ing.metric?.cuantity || 0);
                const units = ing.unidades || ing.units || ing.unit || ing.metric?.units || "";

                return {
                    index,
                    legacyName,
                    quantity,
                    units,
                    raw: ing,
                };
            });

            setLegacyIngredients(normalized);
            setIngredientSelections({});
            setIngredientSearchTerms(
                Object.fromEntries(normalized.map((ing) => [ing.index, ing.legacyName || ""]))
            );
            setImportedRecipeName(parsed.name || parsed.nombre || parsed.legacyName || "");
        } catch (err) {
            setLegacyIngredients([]);
            setIngredientSelections({});
            setIngredientSearchTerms({});
            setImportedRecipeName("");
            setJsonError("No se pudo leer el JSON: " + err.message);
        }
    };
    
    const parseItemsFromRecetaObject = (recetaData) => {
        const parseItems = (prefix, count) => {
         const parsedList = [];
         for (let i = 1; i <= count; i++) {
           const itemId = recetaData[`${prefix}${i}_Id`];
           const cuantityUnitsRaw = recetaData[`${prefix}${i}_Cuantity_Units`];
           if (itemId && cuantityUnitsRaw) {
             const itemData = buscarPorId(itemId);
             if (itemData) {
               try {
                 const cuantityUnits = JSON.parse(cuantityUnitsRaw);
                 parsedList.push({
                   key: `${prefix}-${i}`,
                   originalIndex: i,
                   item_Id: itemId,
                   nombre: itemData.Nombre_del_producto,
                   originalQuantity: cuantityUnits.metric.cuantity,
                   unidades: cuantityUnits.metric.units,
                   precioUnitario: Number(itemData.precioUnitario) || 0,
                   isChecked: false,
                 });
               } catch (e) { console.warn(`Error parseando JSON: `, cuantityUnitsRaw); }
             }
           }
         }
         return parsedList;
        };
        return {
         ingredientes: parseItems("item", 30),
         produccion: parseItems("producto_interno", 20),
        };
    };

    const allIngredientsMapped = legacyIngredients.length > 0 &&
        legacyIngredients.every((ing) => ingredientSelections[ing.index]);

    const buildPayloadFromImport = () => {
        const payload = {};
        for (let i = 1; i <= 30; i++) {
            payload[`item${i}_Id`] = null;
            payload[`item${i}_Cuantity_Units`] = null;
        }
        for (let i = 1; i <= 20; i++) {
            payload[`producto_interno${i}_Id`] = null;
            payload[`producto_interno${i}_Cuantity_Units`] = null;
        }

        let ingredientCounter = 1;
        let productionCounter = 1;

        legacyIngredients.forEach((legacy) => {
            const selection = ingredientSelections[legacy.index];
            if (!selection?._id) return;

            const prefix = selection.__type === "producto_interno" ? "producto_interno" : "item";
            const counter = prefix === "item" ? ingredientCounter++ : productionCounter++;

            payload[`${prefix}${counter}_Id`] = selection._id;
            payload[`${prefix}${counter}_Cuantity_Units`] = JSON.stringify({
                metric: {
                    cuantity: Number(legacy.quantity) || null,
                    units: legacy.units || null,
                },
                legacyName: legacy.legacyName,
                raw: legacy.raw,
            });
        });

        return payload;
    };

    const handleSaveImportedRecipe = async () => {
        if (!receta || !recetaSource || legacyIngredients.length === 0) return;

        const payload = buildPayloadFromImport();
        const legacyName = importedRecipeName || receta.legacyName;

        setIsSavingImport(true);
        try {
            const result = await dispatch(updateItem(receta._id, {
                ...payload,
                legacyName,
                actualizacion: new Date().toISOString(),
            }, recetaSource));

            if (!result) throw new Error("No se pudo guardar la receta importada");

            setReceta((prev) => ({
                ...prev,
                ...payload,
                legacyName,
            }));
            alert("Receta actualizada con los ingredientes importados");
        } catch (err) {
            console.error(err);
            alert(err.message || "Error al guardar la receta importada");
        } finally {
            setIsSavingImport(false);
        }
    };

    useEffect(() => {
        if (!receta || allOptions.length === 0) return;
        const { ingredientes: parsedIng, produccion: parsedProd } = parseItemsFromRecetaObject(receta);
        setIngredientes(parsedIng); setProduccion(parsedProd);
        setEditableIngredientes(parsedIng); setEditableProduccion(parsedProd);
    }, [receta, allOptions]);

    useEffect(() => {
        if (permanentEditMode && receta) {
         if (receta.rendimiento) { try { const d = JSON.parse(receta.rendimiento); setRendimientoCantidad(d.cantidad?.toString()||''); setRendimientoUnidades(d.unidades||'');} catch (e) {console.warn(e);} }
         if (foto) setImagenUrl(foto);
        }
    }, [permanentEditMode, receta, foto]);

    // useEffect para calcular el PRECIO DE VENTA (Recetas normales)
    useEffect(() => {
        if (recetaSource !== "Recetas" || !menuItem || (!editableIngredientes.length && !editableProduccion.length)) { 
            setCalculoDetalles(null); 
            setPrecioVentaFinal(0); 
            return; 
        };
        const itemsParaCalcular = [...editableIngredientes, ...editableProduccion].filter(i => i.item_Id && i.originalQuantity > 0).map(i => ({ ...i, cuantity: i.originalQuantity, precioUnitario: buscarPorId(i.item_Id)?.precioUnitario || 0 }));
        const resultado = recetaMariaPaula(itemsParaCalcular, menuItem.GRUPO, costoManualCMP ? `.${costoManualCMP}` : null, tiempoProceso);
        setCalculoDetalles(resultado.detalles); 
        setPrecioVentaFinal(resultado.consolidado);
    }, [editableIngredientes, editableProduccion, costoManualCMP, tiempoProceso, menuItem, recetaSource, allOptions]);

    // useEffect para calcular el COSTO DE PRODUCCIÓN (Recetas de producción)
    useEffect(() => {
        if (recetaSource !== "RecetasProduccion") {
            setCostoProduccion(0);
            return;
        }
        const itemsParaCalcular = [...editableIngredientes, ...editableProduccion]
            .filter(i => i.item_Id && i.originalQuantity > 0)
            .map(i => ({
                cuantity: i.originalQuantity,
                precioUnitario: buscarPorId(i.item_Id)?.precioUnitario || 0
            }));
        
        const resultado = recetaMariaPaula(itemsParaCalcular, null, null, tiempoProceso, null, null, 1, 0, 0, 0, true);
        
        if (resultado && typeof resultado.COSTO === 'number') {
            setCostoProduccion(resultado.COSTO);
        }
    }, [editableIngredientes, editableProduccion, tiempoProceso, recetaSource, allOptions]);


    const ingredientesAjustados = useMemo(() => ingredientes.map(ing => ({ ...ing, cantidad: (ing.originalQuantity * porcentaje) / 100 })), [ingredientes, porcentaje]);
    const produccionAjustada = useMemo(() => produccion.map(prod => ({ ...prod, cantidad: (prod.originalQuantity * porcentaje) / 100 })), [produccion, porcentaje]);
    
    const handleEnablePermanentEdit = () => setShowPinInput(true);
    const handlePinVerification = () => { if (pinCode === '1234') { setPermanentEditMode(true); setShowPinInput(false); setPinCode(''); setEditShow(true); } else { setPinCode(''); } };
    const handleCheck = (setState, index) => setState(prevItems => prevItems.map(item => item.originalIndex === index ? { ...item, isChecked: !item.isChecked } : item));
    const handleSave = (setState, index, newValue) => { const numValue = Number(newValue); if (isNaN(numValue) || numValue <= 0) return; const itemToUpdate = (setState === setIngredientes ? ingredientes : produccion).find(item => item.originalIndex === index); if (itemToUpdate && !permanentEditMode) { const newPercentage = (numValue / itemToUpdate.originalQuantity) * 100; setPorcentaje(newPercentage); } };
    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);

    const updateField = async (fieldsToUpdate) => { if (!permanentEditMode || !receta || !recetaSource) return; setIsUpdating(true); try { const payload = { ...fieldsToUpdate, actualizacion: new Date().toISOString() }; const result = await dispatch(updateItem(receta._id, payload, recetaSource)); if (result) setReceta(prev => ({ ...prev, ...payload })); else throw new Error('DB Error'); } catch (error) { alert('Error: ' + error.message); } finally { setIsUpdating(false); } };
    const updateProcessOrNote = (type, index, newValue) => updateField({ [type === 'process' ? `proces${index}` : `nota${index}`]: newValue });
    const updateInfoField = (fieldName, newValue) => updateField({ [fieldName]: newValue });
    const updateRendimiento = async () => { const rendimientoData = { porcion: receta.rendimiento ? JSON.parse(receta.rendimiento).porcion : 1, cantidad: Number(rendimientoCantidad), unidades: rendimientoUnidades }; await updateField({ rendimiento: JSON.stringify(rendimientoData) }); };
    const updateImagenUrl = async () => { if (!receta.forId) return; setIsUpdating(true); try { const result = await dispatch(updateItem(receta.forId, { Foto: imagenUrl }, "Menu")); if(result) setFoto(imagenUrl); } catch (error) { alert('Error: ' + error.message); } finally { setIsUpdating(false); } };
    const addIngredient = (source) => { const newItem = { key: `new-${Date.now()}`, item_Id: "", nombre: "", originalQuantity: "", unidades: "", precioUnitario: 0, source, matches: [] }; if (source === 'Items') setEditableIngredientes(prev => [...prev, newItem]); else setEditableProduccion(prev => [...prev, newItem]); };
    
    const handleIngredientNameChange = (index, value, source) => { 
        const list = source === 'Items' ? editableIngredientes : editableProduccion; 
        const setList = source === 'Items' ? setEditableIngredientes : setEditableProduccion; 
        const updatedItems = [...list]; 
        updatedItems[index].nombre = value; 
        updatedItems[index].matches = value ? allOptions.filter(opt => opt.Nombre_del_producto.toLowerCase().includes(value.toLowerCase())) : []; 
        setList(updatedItems); 
    };
    
    const handleIngredientSelect = (index, selectedOption, source) => {
        const list = source === 'Items' ? editableIngredientes : editableProduccion;
        const setList = source === 'Items' ? setEditableIngredientes : setEditableProduccion;
        const updatedItems = [...list];
        updatedItems[index].nombre = selectedOption.Nombre_del_producto;
        updatedItems[index].item_Id = selectedOption._id;
        updatedItems[index].unidades = selectedOption.UNIDADES || "";
        updatedItems[index].precioUnitario = Number(selectedOption.precioUnitario) || 0;
        updatedItems[index].matches = [];
        setList(updatedItems);
    };

    const handleRemoveIngredient = (index, source) => { if (window.confirm("¿Seguro?")) { const list = source === 'Items' ? editableIngredientes : editableProduccion; const setList = source === 'Items' ? setEditableIngredientes : setEditableProduccion; const updatedItems = list.filter((_, i) => i !== index); setList(updatedItems); } };
    const handleQuantityChange = (index, value, source) => { const list = source === 'Items' ? editableIngredientes : editableProduccion; const setList = source === 'Items' ? setEditableIngredientes : setEditableProduccion; const updatedItems = [...list]; updatedItems[index].originalQuantity = value; setList(updatedItems); };
    
    const handleSaveFullRecipe = async () => {
        if (!permanentEditMode || !receta || !recetaSource) return;
        
        const mapItemsToPayload = (items) => {
            const payload = {}; let iCounter = 1; let pCounter = 1;
            for (let i = 1; i <= 30; i++) { payload[`item${i}_Id`] = null; payload[`item${i}_Cuantity_Units`] = null; }
            for (let i = 1; i <= 20; i++) { payload[`producto_interno${i}_Id`] = null; payload[`producto_interno${i}_Cuantity_Units`] = null; }
            
            items.forEach((item) => {
                const isProd = allProduccion.some(p => p._id === item.item_Id);
                const prefix = isProd ? 'producto_interno' : 'item';
                const idx = isProd ? pCounter++ : iCounter++;
                payload[`${prefix}${idx}_Id`] = item.item_Id || null;
                payload[`${prefix}${idx}_Cuantity_Units`] = item.item_Id ? JSON.stringify({ metric: { cuantity: Number(item.originalQuantity) || null, units: item.unidades || null }}) : null;
            });
            return payload;
        };
        
        setIsUpdating(true);
        
        try {
            const fullPayload = {
                ...receta,
                ...mapItemsToPayload([...editableIngredientes, ...editableProduccion]),
                costo: JSON.stringify(calculoDetalles),
                ProcessTime: tiempoProceso,
                actualizacion: new Date().toISOString()
            };

            if (recetaSource === "RecetasProduccion") {
                // El costo ya está calculado y actualizado en el estado 'costoProduccion'
                // Lo usamos directamente para asegurar consistencia con lo que ve el usuario
                fullPayload.costo = costoProduccion;
                console.log(receta.forId);
               const result = await dispatch(updateItem(receta.forId,{"COSTO" : costoProduccion}, "ProduccionInterna"));
            //    console.log(result);
               
            }
            
            const result = await dispatch(updateItem(receta._id, fullPayload, recetaSource));
      
           
            if (result) {
                setReceta(fullPayload);
                alert("Cambios guardados.");
            } else {
                throw new Error('Falló la actualización.');
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al guardar.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando receta...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!receta) return <div className="p-8 text-center">No se pudo cargar la receta.</div>;

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl w-screen h-screen flex flex-col overflow-auto">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-gray-800">{receta.legacyName || "Receta"}</h2>
             
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="mb-6 flex items-center gap-4 p-3 bg-gray-100 rounded-md">
                        <div className="flex items-center gap-2">
                            <label className="font-semibold">Porcentaje:</label>
                            <Input type="number" min={1} value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value))} className="w-24 h-9" /><span>%</span>
                        </div>
                        <Button variant="outline" onClick={() => setEditShow(p => !p)} disabled={permanentEditMode} className={permanentEditMode ? "opacity-50" : ""}>{editShow ? "Ocultar Edición Simple" : "Edición Simple"}</Button>
                        <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleEnablePermanentEdit} disabled={permanentEditMode || isUpdating || showPinInput} className={`${permanentEditMode ? "bg-green-500 text-white" : "border-orange-400 text-orange-600"} ${isUpdating ? "opacity-50" : ""}`}>{isUpdating ? "..." : permanentEditMode ? "✓ Edición Avanzada" : "🔒 Edición Avanzada"}</Button>
                    {showPinInput && !permanentEditMode && ( <div className="flex items-center gap-2"><Input type="password" placeholder="PIN" value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').substring(0, 4))} maxLength={4} className="w-20 h-9" onKeyDown={e => { if (e.key === 'Enter') handlePinVerification(); }} autoFocus/><Button size="sm" onClick={handlePinVerification} disabled={pinCode.length !== 4} className="h-9">OK</Button></div> )}
                </div>
            </div>
            <div className="mb-6 flex flex-col gap-3 p-3 rounded-md border bg-gray-50">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Importar receta desde JSON</h3>
                        <p className="text-sm text-gray-600">Pega el JSON, reemplaza los nombres legacy y guarda la receta.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowJsonImporter((prev) => !prev)}>
                            {showJsonImporter ? "Ocultar importador" : "Abrir importador"}
                        </Button>
                        <Button
                            onClick={handleSaveImportedRecipe}
                            disabled={!allIngredientsMapped || legacyIngredients.length === 0 || isSavingImport}
                            className={`${allIngredientsMapped ? "bg-green-600" : "bg-gray-200"}`}
                        >
                            {isSavingImport ? "Guardando..." : "Guardar receta importada"}
                        </Button>
                    </div>
                </div>

                {showJsonImporter && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Pega aquí el JSON de la receta</label>
                            <Textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder="{ \"ingredients\": [ { \"legacyName\": \"Jugo de naranja\", \"cantidad\": 20, \"unidades\": \"ml\" } ] }"
                                className="w-full min-h-[220px]"
                            />
                            <div className="flex gap-2">
                                <Button onClick={parseRecipeJson} className="bg-blue-600 text-white">Leer JSON</Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setJsonInput("");
                                        setLegacyIngredients([]);
                                        setIngredientSelections({});
                                        setIngredientSearchTerms({});
                                        setJsonError(null);
                                        setImportedRecipeName("");
                                    }}
                                >
                                    Limpiar
                                </Button>
                            </div>
                            {jsonError && <p className="text-sm text-red-500">{jsonError}</p>}
                        </div>

                        <div className="space-y-3 p-3 rounded-md border bg-white">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h4 className="font-semibold text-gray-800">Vista previa de ingredientes</h4>
                                    <p className="text-xs text-gray-500">Reemplaza cada nombre legacy por un producto existente. Si no hay coincidencias, se acorta la búsqueda.</p>
                                </div>
                                {importedRecipeName && (
                                    <span className="text-xs px-2 py-1 rounded bg-slate-200 text-blue-800">Nombre detectado: {importedRecipeName}</span>
                                )}
                            </div>

                            {legacyIngredients.length === 0 ? (
                                <p className="text-sm text-gray-500">Aún no hay ingredientes cargados desde el JSON.</p>
                            ) : (
                                <div className="space-y-4 max-h-[420px] overflow-auto pr-1">
                                    {legacyIngredients.map((ing) => {
                                        const searchValue = ingredientSearchTerms[ing.index] ?? ing.legacyName;
                                        const { matches, usedFallback, fallbackTerm } = findMatchesForIngredient(searchValue || ing.legacyName);
                                        const selection = ingredientSelections[ing.index];

                                        return (
                                            <div key={`legacy-${ing.index}`} className="p-3 rounded-md border" style={{ borderColor: '#e5e7eb', backgroundColor: '#f8fafc' }}>
                                                <div className="flex flex-wrap justify-between gap-2 items-start">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{ing.legacyName}</p>
                                                        <p className="text-xs text-gray-500">{ing.quantity || 0} {ing.units || ''} • Nombre legacy a reemplazar</p>
                                                    </div>
                                                    {selection ? (
                                                        <span className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-green-600">Seleccionado: {getProductName(selection)}</span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-500">Falta reemplazar</span>
                                                    )}
                                                </div>

                                                <div className="mt-3 space-y-2">
                                                    <label className="text-xs font-medium text-gray-600">Ajusta el texto de búsqueda si es necesario</label>
                                                    <Input
                                                        value={searchValue}
                                                        onChange={(e) => setIngredientSearchTerms((prev) => ({ ...prev, [ing.index]: e.target.value }))}
                                                        className="w-full h-8"
                                                    />

                                                    {usedFallback && <p className="text-xs text-blue-500">Sin resultados exactos. Buscando con: "{fallbackTerm}"</p>}

                                                    <div className="flex flex-wrap gap-2">
                                                        {matches.map((match) => (
                                                            <button
                                                                key={match._id}
                                                                onClick={() => setIngredientSelections((prev) => ({ ...prev, [ing.index]: match }))}
                                                                className={`px-2 py-1 text-xs rounded border ${selection?._id === match._id ? "bg-blue-600 text-white" : "bg-white"}`}
                                                            >
                                                                {getProductName(match)}
                                                            </button>
                                                        ))}
                                                        {matches.length === 0 && <span className="text-xs text-gray-500">Sin coincidencias.</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            {permanentEditMode ? (
                                <>
                                    <div>
                                        <h3 className="text-lg font-semibold border-b pb-2 mb-3">Editar Ingredientes</h3>
                                               <div className="flex items-center gap-2">
                        {permanentEditMode && <Button onClick={handleSaveFullRecipe} disabled={isUpdating} className="bg-green-600 hover:bg-green-700 text-white">{isUpdating ? "..." : "✓ Guardar Ingredientes"}</Button>}
                        <Button onClick={handleCancelEdir} variant="ghost" className="h-9 w-9 p-0 text-xl">❌</Button>
                    </div>
                                        {editableIngredientes.map((item, index) => <EditableIngredientRow key={item.key || index} item={item} index={index} source="Items" onNameChange={handleIngredientNameChange} onSelect={handleIngredientSelect} onQuantityChange={handleQuantityChange} onRemove={handleRemoveIngredient} />)}
                                        <Button onClick={() => addIngredient('Items')} size="sm" className="mt-2 w-full">+ Añadir Ingrediente</Button>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold border-b pb-2 mb-3">Editar Producción Interna</h3>
                                        {editableProduccion.map((item, index) => <EditableIngredientRow key={item.key || index} item={item} index={index} source="Produccion" onNameChange={handleIngredientNameChange} onSelect={handleIngredientSelect} onQuantityChange={handleQuantityChange} onRemove={handleRemoveIngredient} />)}
                                        <Button onClick={() => addIngredient('Produccion')} size="sm" className="mt-2 w-full">+ Añadir Prod. Interna</Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <RecipeSection title="Ingredientes" items={ingredientesAjustados} isEditing={editShow} onCheck={(index) => handleCheck(setIngredientes, index)} onSave={(index, value) => handleSave(setIngredientes, index, value)} />
                                    <RecipeSection title="Producción Interna" items={produccionAjustada} isEditing={editShow} onCheck={(index) => handleCheck(setProduccion, index)} onSave={(index, value) => handleSave(setProduccion, index, value)} />
                                </>
                            )}
                            <div className="mt-6 p-3 border rounded-md bg-gray-50">
                                <h3 className="text-lg font-semibold mb-3">Cálculo de Costos</h3>
                                {permanentEditMode && (
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div>
                                            <label className="text-xs font-medium">Tiempo (min)</label>
                                            <Input type="number" value={tiempoProceso} onChange={e => setTiempoProceso(Number(e.target.value))} className="h-8"/>
                                        </div>
                                        {recetaSource !== "RecetasProduccion" && (
                                            <div>
                                                <label className="text-xs font-medium">%CMP Manual</label>
                                                <Input type="number" value={costoManualCMP} onChange={e => setCostoManualCMP(e.target.value)} className="h-8" placeholder="Ej: 35"/>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {recetaSource === "RecetasProduccion" ? (
                                    <div className="flex justify-between p-2 mt-2 bg-blue-100 rounded border">
                                        <span className="font-bold">Costo de Producción</span>
                                        <span className="font-bold text-lg">{formatCurrency(costoProduccion)}</span>
                                    </div>
                                ) : (
                                    calculoDetalles ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between p-1 bg-blue-50 rounded"><span>%CMP Estab.</span><span className="font-bold">{calculoDetalles.pCMPInicial}%</span></div>
                                            <div className="flex justify-between p-1 bg-blue-50 rounded"><span>%CMP Real</span><span className="font-bold">{calculoDetalles.pCMPReal}%</span></div>
                                            <div className="flex justify-between p-1 bg-green-50 rounded"><span>Valor CMP</span><span className="font-bold">{formatCurrency(calculoDetalles.vCMP)}</span></div>
                                            <div className="flex justify-between p-1 bg-green-50 rounded"><span>Utilidad Bruta</span><span className="font-bold">{formatCurrency(calculoDetalles.vIB)}</span></div>
                                            <div className="flex justify-between p-1 bg-green-50 rounded"><span>% Utilidad Bruta</span><span className="font-bold">{calculoDetalles.pIB}%</span></div>
                                            <div className="flex justify-between p-2 mt-2 bg-yellow-100 rounded border">
                                                <span className="font-bold">Precio Venta Final</span>
                                                <span className="font-bold text-lg">{formatCurrency(precioVentaFinal)}</span>
                                            </div>
                                        </div>
                                    ) : <p className="text-xs text-gray-500">Modifica ingredientes para ver resultados.</p>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-1 space-y-4 text-sm">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Procesos y Notas</h3>
                            <div className="space-y-3"><h4 className="font-medium text-sm text-gray-700">Procesos:</h4>{Array.from({ length: 20 }, (_, i) => i + 1).map((i) => (receta[`proces${i}`] || permanentEditMode) && (<div key={`process-${i}`} className="flex items-start gap-2"><span className="font-semibold text-xs min-w-[60px] text-gray-500 mt-1">Proceso {i}:</span><EditableText value={receta[`proces${i}`] || ''} onSave={(value) => updateProcessOrNote('process', i, value)} isEditable={permanentEditMode} placeholder={`Escribir proceso ${i}...`} multiline={true} disabled={isUpdating} /></div>))}</div>
                            <div className="my-4 border-t"></div>
                            <div className="space-y-3"><h4 className="font-medium text-sm text-gray-700">Notas:</h4>{Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (receta[`nota${i}`] || permanentEditMode) && (<div key={`note-${i}`} className="flex items-start gap-2"><span className="font-semibold text-xs min-w-[50px] text-gray-500 mt-1">Nota {i}:</span><EditableText value={receta[`nota${i}`] || ''} onSave={(value) => updateProcessOrNote('note', i, value)} isEditable={permanentEditMode} placeholder={`Escribir nota ${i}...`} multiline={true} disabled={isUpdating}/></div>))}</div>
                        </div>
                        <div className="lg:col-span-1 space-y-4 text-sm">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Información Adicional</h3>
                            <div className="space-y-2"><label className="font-semibold text-sm text-gray-700">Autor:</label><EditableText value={receta.autor || ''} onSave={(value) => updateInfoField('autor', value)} isEditable={permanentEditMode} placeholder="Escribir autor..." multiline={false} disabled={isUpdating}/></div>
                            <div className="space-y-2"><label className="font-semibold text-sm text-gray-700">Emplatado:</label><EditableText value={receta.emplatado || ''} onSave={(value) => updateInfoField('emplatado', value)} isEditable={permanentEditMode} placeholder="Describir emplatado..." multiline={true} disabled={isUpdating} /></div>
                            <div className="space-y-2"><label className="font-semibold text-sm text-gray-700">Rendimiento:</label>{permanentEditMode ? (<div className="flex items-center gap-2"><Input type="number" placeholder="Cantidad" value={rendimientoCantidad} onChange={(e) => setRendimientoCantidad(e.target.value)} className="w-20 h-8 text-sm" disabled={isUpdating}/><Input type="text" placeholder="Unidades" value={rendimientoUnidades} onChange={(e) => setRendimientoUnidades(e.target.value)} className="w-24 h-8 text-sm" disabled={isUpdating}/><Button size="sm" onClick={updateRendimiento} disabled={isUpdating} className="h-8">Guardar</Button></div>) : (<p className="text-sm text-gray-600">{receta.rendimiento ? `${JSON.parse(receta.rendimiento).cantidad} ${JSON.parse(receta.rendimiento).unidades}` : 'No especificado'}</p>)}</div>
                        </div>
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Imagen del Menú</h3>
                            {permanentEditMode ? (<div className="space-y-3"><div className="flex items-center gap-2"><Input type="url" placeholder="URL de la imagen" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} className="flex-1 h-8 text-sm" disabled={isUpdating} /><Button size="sm" onClick={updateImagenUrl} disabled={isUpdating} className="h-8">Actualizar</Button></div>{(foto || imagenUrl) && <img src={imagenUrl || foto} alt="Preview" className="w-full h-auto rounded-md shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />}</div>) : (foto && <img src={foto} alt="Imagen del Menú" className="w-full h-auto rounded-md shadow-md" />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}

export default RecetaModal;
