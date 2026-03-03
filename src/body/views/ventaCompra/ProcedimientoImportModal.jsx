import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateItem, createRecipeForProduct } from "../../../redux/actions";
import { crearProcedimiento } from "../../../redux/actions-Procedimientos";
import { MENU, PRODUCCION, PROCEDE, RECETAS_PROCEDIMIENTOS } from "../../../redux/actions-types";
import { copyPromptToClipboard } from '../../../utils/prompts';
import { Copy, Check } from 'lucide-react';

const ProcedimientoImportModal = ({ onClose, onSuccess, forcedRecipeId, forcedRecipeSource }) => {
    const dispatch = useDispatch();
    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);

    const [jsonInput, setJsonInput] = useState("");
    const [jsonError, setJsonError] = useState(null);
    const [parsedData, setParsedData] = useState(null);

    const [procedimientoCategoria, setProcedimientoCategoria] = useState("");
    const [procedimientoTittle, setProcedimientoTittle] = useState("");

    // State for matches
    const [ingredientSelections, setIngredientSelections] = useState({});
    const [ingredientSearchTerms, setIngredientSearchTerms] = useState({});

    // UI States
    const [step, setStep] = useState(1); // 1: JSON Input, 2: Mapping & Confirmation
    const [isSaving, setIsSaving] = useState(false);
    const [promptCopied, setPromptCopied] = useState(false);

    // Helpers
    const getProductName = (product) => product?.Nombre_del_producto || product?.NombreES || product?.name || "(Sin nombre)";

    const possibleIngredients = useMemo(() => [
        ...allItems.map(item => ({ ...item, __type: "item" })),
        ...allProduccion.map(prod => ({ ...prod, __type: "producto_interno" })),
    ], [allItems, allProduccion]);

    // --- STEP 1: PARSE JSON ---
    const handleParse = () => {
        setJsonError(null);
        try {
            let parsed = JSON.parse(jsonInput);

            // 1. Normalize Root
            if (parsed.procedimiento && typeof parsed.procedimiento === 'object') parsed = parsed.procedimiento;
            else if (parsed.receta && typeof parsed.receta === 'object') parsed = parsed.receta;

            // 2. Find Ingredients Array
            let ingredientsRaw = parsed.ingredients || parsed.ingredientes || parsed.items;

            if (!ingredientsRaw || !Array.isArray(ingredientsRaw)) {
                const possibleKey = Object.keys(parsed).find(key =>
                    Array.isArray(parsed[key]) &&
                    parsed[key].length > 0 &&
                    (parsed[key][0].legacyName || parsed[key][0].nombre || parsed[key][0].name || parsed[key][0].cantidad || parsed[key][0].quantity)
                );
                if (possibleKey) ingredientsRaw = parsed[possibleKey];
            }

            if (!ingredientsRaw || !Array.isArray(ingredientsRaw)) {
                if (Array.isArray(parsed)) ingredientsRaw = parsed;
                else {
                    const flatIngredients = [];
                    for (let i = 1; i <= 30; i++) {
                        if (parsed[`item${i}_Cuantity_Units`]) {
                            try {
                                const rawVal = typeof parsed[`item${i}_Cuantity_Units`] === 'string'
                                    ? JSON.parse(parsed[`item${i}_Cuantity_Units`])
                                    : parsed[`item${i}_Cuantity_Units`];

                                if (rawVal && rawVal.metric) {
                                    flatIngredients.push({
                                        legacyName: rawVal.legacyName || `Item ${i}`,
                                        cantidad: rawVal.metric.cuantity,
                                        unidades: rawVal.metric.units,
                                        originalId: parsed[`item${i}_Id`]
                                    });
                                }
                            } catch (e) {
                                console.warn("Failed to parse flat item", i);
                            }
                        }
                    }
                    for (let i = 1; i <= 20; i++) {
                        if (parsed[`producto_interno${i}_Cuantity_Units`]) {
                            try {
                                const rawVal = typeof parsed[`producto_interno${i}_Cuantity_Units`] === 'string'
                                    ? JSON.parse(parsed[`producto_interno${i}_Cuantity_Units`])
                                    : parsed[`producto_interno${i}_Cuantity_Units`];

                                if (rawVal && rawVal.metric) {
                                    flatIngredients.push({
                                        legacyName: rawVal.legacyName || `Prod Interno ${i}`,
                                        cantidad: rawVal.metric.cuantity,
                                        unidades: rawVal.metric.units,
                                        originalId: parsed[`producto_interno${i}_Id`]
                                    });
                                }
                            } catch (e) {
                                console.warn("Failed to parse flat prod", i);
                            }
                        }
                    }

                    if (flatIngredients.length > 0) ingredientsRaw = flatIngredients;
                    else throw new Error("No se encontró una lista de ingredientes válida.");
                }
            }

            const normalizedIngredients = ingredientsRaw.map((ing, index) => {
                const legacyName = ing.legacyName || ing.nombre || ing.name || `Ingrediente ${index + 1}`;
                const quantity = Number(ing.cantidad || ing.quantity || ing.qty || ing.metric?.cuantity || 0);
                const units = ing.unidades || ing.units || ing.unit || ing.metric?.units || "";
                return { index, legacyName, quantity, units, raw: ing };
            });

            // Extract Process Steps
            const processSteps = {};
            for (let i = 1; i <= 20; i++) {
                if (parsed[`proces${i}`] !== undefined) {
                    processSteps[`proces${i}`] = parsed[`proces${i}`];
                }
            }

            // Extract Rendimiento
            let rendimiento = null;
            if (parsed.rendimiento) {
                if (typeof parsed.rendimiento === 'string') {
                    try {
                        rendimiento = JSON.parse(parsed.rendimiento);
                    } catch (e) {
                        console.warn('Rendimiento is string but not valid JSON', e);
                    }
                } else if (typeof parsed.rendimiento === 'object') {
                    rendimiento = parsed.rendimiento;
                }
            }

            setParsedData({
                name: parsed.name || parsed.nombre || parsed.legacyName || parsed.NombreES || parsed.Nombre_del_producto || "",
                ingredients: normalizedIngredients,
                processSteps: processSteps,
                rendimiento: rendimiento
            });

            setProcedimientoTittle(parsed.name || parsed.nombre || parsed.legacyName || parsed.NombreES || parsed.Nombre_del_producto || "");

            // Initialize Search Terms & Try Auto-match Ingredients
            const initialSelections = {};
            const initialSearchTerms = {};

            normalizedIngredients.forEach(ing => {
                initialSearchTerms[ing.index] = ing.legacyName;
                const exactMatch = possibleIngredients.find(p => getProductName(p).toLowerCase() === ing.legacyName.toLowerCase());
                if (exactMatch) {
                    initialSelections[ing.index] = exactMatch;
                } else {
                    const words = ing.legacyName.toLowerCase().split(' ');
                    const match = possibleIngredients.find(p => {
                        const pName = getProductName(p).toLowerCase();
                        return words.every(w => pName.includes(w));
                    });
                    if (match) initialSelections[ing.index] = match;
                }
            });

            setIngredientSelections(initialSelections);
            setIngredientSearchTerms(initialSearchTerms);

            setStep(2);
        } catch (err) {
            setJsonError("Error parsing JSON: " + err.message);
        }
    };

    // --- STEP 2: MAPPING HELPERS ---
    const handleSearchIngredient = (index, term) => {
        setIngredientSearchTerms(prev => ({ ...prev, [index]: term }));
    };

    const getMatches = (term) => {
        if (!term) return [];
        const lower = term.toLowerCase();
        return possibleIngredients
            .filter(p => getProductName(p).toLowerCase().includes(lower))
            .slice(0, 10);
    };

    const handleSelectIngredient = (index, item) => {
        setIngredientSelections(prev => ({ ...prev, [index]: item }));

        if (typeof index === 'string' && index.startsWith('manual-') && item?.UNIDADES) {
            setParsedData(prev => ({
                ...prev,
                ingredients: prev.ingredients.map(ing =>
                    ing.index === index ? { ...ing, units: item.UNIDADES } : ing
                )
            }));
        }
    };

    // --- MANUAL INGREDIENT HELPERS ---
    const handleAddManualIngredient = () => {
        const newIndex = `manual-${Date.now()}`;
        setParsedData(prev => ({
            ...prev,
            ingredients: [
                ...prev.ingredients,
                {
                    index: newIndex,
                    legacyName: "Ingrediente Manual",
                    quantity: 0,
                    units: "",
                    isManual: true,
                    raw: {}
                }
            ]
        }));
    };

    const handleManualChange = (index, field, value) => {
        setParsedData(prev => ({
            ...prev,
            ingredients: prev.ingredients.map(ing =>
                ing.index === index ? { ...ing, [field]: value } : ing
            )
        }));
    };

    const handleDeleteManual = (index) => {
        setParsedData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter(ing => ing.index !== index)
        }));
        setIngredientSelections(prev => {
            const next = { ...prev }; delete next[index]; return next;
        });
        setIngredientSearchTerms(prev => {
            const next = { ...prev }; delete next[index]; return next;
        });
    };

    const handleProcessChange = (key, value) => {
        setParsedData(prev => ({
            ...prev,
            processSteps: {
                ...prev.processSteps,
                [key]: value
            }
        }));
    };

    // --- COPY PROMPT HANDLER ---
    const handleCopyPrompt = async () => {
        await copyPromptToClipboard('PROCEDIMIENTOS', setPromptCopied);
    };

    // --- FINAL SAVE ---
    const handleSave = async () => {
        if (!forcedRecipeId && (!procedimientoCategoria || !procedimientoTittle.trim())) {
            alert("Por favor selecciona una categoría y un título para el nuevo procedimiento.");
            return;
        }

        setIsSaving(true);
        try {
            // Build Payload
            const payload = {};
            for (let i = 1; i <= 30; i++) { payload[`item${i}_Id`] = null; payload[`item${i}_Cuantity_Units`] = null; }
            for (let i = 1; i <= 20; i++) { payload[`producto_interno${i}_Id`] = null; payload[`producto_interno${i}_Cuantity_Units`] = null; }
            for (let i = 1; i <= 20; i++) { payload[`proces${i}`] = null; }

            if (parsedData.processSteps) {
                Object.keys(parsedData.processSteps).forEach(key => {
                    payload[key] = parsedData.processSteps[key];
                });
            }

            if (parsedData.rendimiento) {
                payload.rendimiento = typeof parsedData.rendimiento === 'string'
                    ? parsedData.rendimiento
                    : JSON.stringify(parsedData.rendimiento);
            }

            let iCounter = 1;
            let pCounter = 1;

            parsedData.ingredients.forEach(ing => {
                const selected = ingredientSelections[ing.index];
                if (!selected) return;

                const isProd = selected.__type === "producto_interno";
                const prefix = isProd ? "producto_interno" : "item";
                const counter = isProd ? pCounter++ : iCounter++;

                payload[`${prefix}${counter}_Id`] = selected._id;
                payload[`${prefix}${counter}_Cuantity_Units`] = JSON.stringify({
                    metric: { cuantity: ing.quantity, units: ing.units },
                    legacyName: ing.legacyName,
                    raw: ing.raw
                });
            });

            if (forcedRecipeId) {
                // For ProcedimientoModal we update directly the existing forcedRecipeId
                await dispatch(updateItem(forcedRecipeId, {
                    ...payload,
                    actualizacion: new Date().toISOString()
                }, forcedRecipeSource));

                alert("Procedimiento actualizado exitosamente.");
            } else {
                // Crear nuevo procedimiento
                const nuevoProcede = await dispatch(crearProcedimiento({
                    Categoria: procedimientoCategoria,
                    tittle: procedimientoTittle,
                    DescripcionGeneral: ""
                }));

                // Create the recipe linked to the newly created Procedimiento
                const legacyName = procedimientoTittle;
                await dispatch(createRecipeForProduct({
                    legacyName,
                    ...payload
                }, nuevoProcede._id, PROCEDE, RECETAS_PROCEDIMIENTOS));

                alert("Procedimiento importado y creado exitosamente.");
            }

            if (onSuccess) onSuccess();
            onClose();

        } catch (e) {
            console.error(e);
            alert("Error guardando procedimiento: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md border w-full flex flex-col mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* HEADER */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                <h2 className="text-xl font-bold text-gray-800">Importador de Procedimientos</h2>
                <Button variant="ghost" className="text-gray-500" onClick={onClose}>Ocultar ✕</Button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden p-6 max-h-[800px] overflow-y-auto">
                {step === 1 ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-blue-800 font-medium">
                                    Pega el objeto JSON de tu procedimiento aquí. El sistema procesará los insumos, producción interna y los pasos automáticamente.
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyPrompt}
                                    className="flex items-center gap-1 text-xs h-7 px-2 border-blue-300 hover:bg-blue-100 hover:border-blue-400 ml-3 flex-shrink-0"
                                    title="Copia instrucciones para IA que generan JSON de procedimientos"
                                >
                                    {promptCopied ? (
                                        <>
                                            <Check className="h-3 w-3 text-green-600" />
                                            <span className="text-green-600">Copiado</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" />
                                            <span>Copiar Prompt</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            className="flex-1 font-mono text-sm min-h-[300px]"
                            placeholder='{ "legacyName": "Procedimiento ABC", "ingredients": [...] }'
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                        />
                        {jsonError && <p className="text-red-500 font-bold">{jsonError}</p>}
                        <div className="flex justify-end">
                            <Button onClick={handleParse} disabled={!jsonInput.trim()}>Analizar JSON &rarr;</Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2 mb-2">
                            {forcedRecipeId ? (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                                    <span className="text-orange-800 font-bold mr-2">Modo Edición Directa:</span>
                                    <span className="text-sm text-orange-700">Actualizando procedimiento existente ({forcedRecipeId}).</span>
                                </div>
                            ) : (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-xs text-blue-800 font-bold uppercase block mb-1">Categoría</label>
                                        <select
                                            value={procedimientoCategoria}
                                            onChange={(e) => setProcedimientoCategoria(e.target.value)}
                                            className="w-48 border rounded p-1.5 text-sm bg-white"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="COCINA">COCINA</option>
                                            <option value="CAFE">CAFE</option>
                                            <option value="MESAS">MESAS</option>
                                            <option value="JARDINERIA">JARDINERIA</option>
                                            <option value="TIENDA">TIENDA</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-xs text-blue-800 font-bold uppercase block mb-1">Título del Procedimiento</label>
                                        <Input
                                            value={procedimientoTittle}
                                            onChange={(e) => setProcedimientoTittle(e.target.value)}
                                            className="bg-white h-8 text-sm"
                                            placeholder="Ej: Limpieza de Molino"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* LEFT: INGREDIENT MAPPING */}
                        <div className="lg:col-span-1 flex flex-col border-r pr-6">
                            <h3 className="font-bold text-lg border-b pb-2 mb-4">1. Validar Insumos ({parsedData?.ingredients?.length})</h3>
                            <div className="space-y-3 pr-2 overflow-y-auto max-h-[500px]">
                                {parsedData?.ingredients.map((ing) => {
                                    const selected = ingredientSelections[ing.index];
                                    const searchTerm = ingredientSearchTerms[ing.index] || "";
                                    const matches = getMatches(searchTerm);
                                    const isMapped = !!selected;
                                    const isManual = ing.isManual;

                                    return (
                                        <div key={ing.index} className={`p-3 rounded-md border ${isMapped ? "bg-white border-green-200 shadow-sm" : "bg-red-50 border-red-200"}`}>
                                            <div className="flex flex-col gap-2">
                                                <div>
                                                    {isManual ? (
                                                        <div className="flex gap-1 mb-1">
                                                            <Input
                                                                placeholder="Cant"
                                                                className="h-7 text-xs w-16"
                                                                type="number"
                                                                value={ing.quantity}
                                                                onChange={(e) => handleManualChange(ing.index, 'quantity', e.target.value)}
                                                            />
                                                            <Input
                                                                placeholder="Und"
                                                                className="h-7 text-xs flex-1"
                                                                value={ing.units}
                                                                onChange={(e) => handleManualChange(ing.index, 'units', e.target.value)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-bold text-gray-800 break-words">{ing.legacyName}</p>
                                                            <p className="text-xs text-gray-500">{ing.quantity} {ing.units}</p>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-gray-400 text-center">↓</div>
                                                <div className="relative">
                                                    {selected ? (
                                                        <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-300">
                                                            <div>
                                                                <p className="text-xs font-semibold text-green-900 break-words">{getProductName(selected)}</p>
                                                                <p className="text-[10px] text-green-600">{selected.__type === "producto_interno" ? "Producción" : "Insumo"}</p>
                                                            </div>
                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleSelectIngredient(ing.index, null)}>✕</Button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <Input
                                                                placeholder={isManual ? "Buscar prod. sistema..." : "Buscar..."}
                                                                value={searchTerm}
                                                                onChange={(e) => handleSearchIngredient(ing.index, e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                            {matches.length > 0 && (
                                                                <ul className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1 max-h-40 overflow-y-auto">
                                                                    {matches.map(m => (
                                                                        <li
                                                                            key={m._id}
                                                                            className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                                                            onClick={() => handleSelectIngredient(ing.index, m)}
                                                                        >
                                                                            {getProductName(m)}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {isManual && (
                                                    <div className="text-right mt-1">
                                                        <button onClick={() => handleDeleteManual(ing.index)} className="text-xs text-red-500 hover:text-red-700 underline">Quitar</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddManualIngredient}
                                    className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 text-gray-500 mt-2"
                                >
                                    + Agregar Insumo Manual
                                </Button>
                            </div>
                        </div>

                        {/* RIGHT: PROCESS PREVIEW */}
                        <div className="lg:col-span-1 flex flex-col">
                            <h3 className="font-bold text-lg border-b pb-2 mb-4">2. Validar Procesos ({Object.keys(parsedData?.processSteps || {}).length})</h3>
                            <div className="space-y-3 pr-2 overflow-y-auto max-h-[500px]">
                                {parsedData?.processSteps && Object.keys(parsedData.processSteps).length > 0 ? (
                                    Object.entries(parsedData.processSteps).sort((a, b) => {
                                        const numA = parseInt(a[0].replace('proces', ''));
                                        const numB = parseInt(b[0].replace('proces', ''));
                                        return numA - numB;
                                    }).map(([key, value]) => (
                                        <div key={key} className="p-3 rounded-md border bg-slate-50 border-slate-200">
                                            <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">{key}</span>
                                            <Textarea
                                                value={value}
                                                onChange={(e) => handleProcessChange(key, e.target.value)}
                                                className="text-sm text-slate-800 font-sans min-h-[80px] bg-white border-slate-300 focus:border-blue-500"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-400 italic border rounded-md border-dashed">
                                        No se detectaron pasos de proceso en el JSON.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t bg-gray-50 flex justify-between rounded-b-lg">
                {step === 2 && <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>}
                <div className="flex gap-2 ml-auto">
                    {step === 2 && (
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Guardando..." : "Confirmar e Importar"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcedimientoImportModal;
