import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRecipeForProduct, updateItem, getAllFromTable } from "../../../redux/actions";
import { MENU, PRODUCCION } from "../../../redux/actions-types";
import AccionesRapidas from '../actualizarPrecioUnitario/AccionesRapidas';

const RecipeImportModal = ({ onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allMenu = useSelector((state) => state.allMenu || []);
    const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []); // For checking existing recipes

    const [jsonInput, setJsonInput] = useState("");
    const [jsonError, setJsonError] = useState(null);
    const [parsedData, setParsedData] = useState(null); // { name: "", ingredients: [] }

    // State for matches
    const [ingredientSelections, setIngredientSelections] = useState({}); // { index: selectedItem }
    const [ingredientSearchTerms, setIngredientSearchTerms] = useState({}); // { index: searchTerm }

    // State for Target Product (The product this recipe belongs to)
    const [targetProduct, setTargetProduct] = useState(null);
    const [targetSearchTerm, setTargetSearchTerm] = useState("");
    const [targetSearchMatches, setTargetSearchMatches] = useState([]);

    // Extra Actions State
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [quickActionType, setQuickActionType] = useState(MENU); // Default to Menu

    // UI States
    const [step, setStep] = useState(1); // 1: JSON Input, 2: Mapping & Confirmation
    const [isSaving, setIsSaving] = useState(false);

    // Helpers
    const getProductName = (product) => product?.Nombre_del_producto || product?.NombreES || product?.name || "(Sin nombre)";

    const possibleIngredients = useMemo(() => [
        ...allItems.map(item => ({ ...item, __type: "item" })),
        ...allProduccion.map(prod => ({ ...prod, __type: "producto_interno" })),
    ], [allItems, allProduccion]);

    const possibleTargets = useMemo(() => [
        ...allMenu.map(m => ({ ...m, __type: "menu", _table: MENU })),
        ...allProduccion.map(p => ({ ...p, __type: "produccion", _table: PRODUCCION })),
    ], [allMenu, allProduccion]);

    // --- STEP 1: PARSE JSON ---
    const handleParse = () => {
        setJsonError(null);
        try {
            let parsed = JSON.parse(jsonInput);

            // 1. Normalize Root: Check if the user pasted { "receta": { ... } } or similar wrapper
            if (parsed.receta && typeof parsed.receta === 'object') parsed = parsed.receta;
            else if (parsed.recipe && typeof parsed.recipe === 'object') parsed = parsed.recipe;

            // 2. Find Ingredients Array: Look for standard keys, then perform a heuristic search
            let ingredientsRaw = parsed.ingredients || parsed.ingredientes || parsed.items;

            if (!ingredientsRaw || !Array.isArray(ingredientsRaw)) {
                // Heuristic: Find the first array prop that looks like it has ingredient-ish data
                const possibleKey = Object.keys(parsed).find(key =>
                    Array.isArray(parsed[key]) &&
                    parsed[key].length > 0 &&
                    (parsed[key][0].legacyName || parsed[key][0].nombre || parsed[key][0].name || parsed[key][0].cantidad || parsed[key][0].quantity)
                );
                if (possibleKey) ingredientsRaw = parsed[possibleKey];
            }

            if (!ingredientsRaw || !Array.isArray(ingredientsRaw)) {
                // Fallback: If still not found, check if the root itself is the array
                if (Array.isArray(parsed)) ingredientsRaw = parsed;
                // Fallback 2: Check for Flat Structure (item1_Id, item1_Cuantity_Units...)
                else {
                    const flatIngredients = [];
                    // check for item1...item30
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
                                        originalId: parsed[`item${i}_Id`] // Keep track if useful
                                    });
                                }
                            } catch (e) {
                                console.warn("Failed to parse flat item", i);
                            }
                        }
                    }
                    // check for producto_interno1...item20
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
                    else throw new Error("No se encontró una lista de ingredientes válida (buscando claves: ingredients, ingredientes, items, o estructura plana item1_...).");
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
                        // If it's a string but not JSON? Maybe just keep it if valid string? 
                        // But we expect JSON structure.
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

            // Initialize Search Terms & Try Auto-match Ingredients
            const initialSelections = {};
            const initialSearchTerms = {};

            normalizedIngredients.forEach(ing => {
                initialSearchTerms[ing.index] = ing.legacyName;
                // Simple exact match or contains match
                const exactMatch = possibleIngredients.find(p => getProductName(p).toLowerCase() === ing.legacyName.toLowerCase());
                if (exactMatch) {
                    initialSelections[ing.index] = exactMatch;
                } else {
                    // Try improved matching (fuzzy-ish)
                    const words = ing.legacyName.toLowerCase().split(' ');
                    // Find product that contains at least first 2 words if possible
                    const match = possibleIngredients.find(p => {
                        const pName = getProductName(p).toLowerCase();
                        return words.every(w => pName.includes(w));
                    });
                    if (match) initialSelections[ing.index] = match;
                }
            });

            setIngredientSelections(initialSelections);
            setIngredientSearchTerms(initialSearchTerms);

            // Try Auto-match Target Product
            const recipeName = parsed.name || parsed.nombre || parsed.legacyName;
            if (recipeName) {
                setTargetSearchTerm(recipeName);
                const exactTarget = possibleTargets.find(t => getProductName(t).toLowerCase() === recipeName.toLowerCase());
                if (exactTarget) setTargetProduct(exactTarget);
            }

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
            .slice(0, 10); // Limit results
    };

    const handleSelectIngredient = (index, item) => {
        setIngredientSelections(prev => ({ ...prev, [index]: item }));

        // If it's a manual ingredient, auto-fill the units from the selected item
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
        // Also cleanup selection and search term
        setIngredientSelections(prev => {
            const next = { ...prev }; delete next[index]; return next;
        });
        setIngredientSearchTerms(prev => {
            const next = { ...prev }; delete next[index]; return next;
        });
    };

    // --- TARGET PRODUCT LOGIC ---
    useEffect(() => {
        if (targetSearchTerm) {
            const lower = targetSearchTerm.toLowerCase();
            const matches = possibleTargets
                .filter(t => getProductName(t).toLowerCase().includes(lower))
                .slice(0, 10);
            setTargetSearchMatches(matches);
        } else {
            setTargetSearchMatches([]);
        }
    }, [targetSearchTerm, possibleTargets]);

    // --- FINAL SAVE ---
    const handleSave = async () => {
        if (!targetProduct) {
            if (!confirm("No has seleccionado un producto del menú/producción para enlazar esta receta. se creará como receta 'huérfana' con el nombre del JSON. ¿Continuar?")) return;
        }

        setIsSaving(true);
        try {
            // Build Payload
            const payload = {};
            // Initialize empty slots
            for (let i = 1; i <= 30; i++) { payload[`item${i}_Id`] = null; payload[`item${i}_Cuantity_Units`] = null; }
            for (let i = 1; i <= 20; i++) { payload[`producto_interno${i}_Id`] = null; payload[`producto_interno${i}_Cuantity_Units`] = null; }
            // Initialize process slots
            for (let i = 1; i <= 20; i++) { payload[`proces${i}`] = null; }

            // Add parsed process steps to payload
            if (parsedData.processSteps) {
                Object.keys(parsedData.processSteps).forEach(key => {
                    payload[key] = parsedData.processSteps[key];
                });
            }

            // Include Rendimiento if exists
            if (parsedData.rendimiento) {
                payload.rendimiento = typeof parsedData.rendimiento === 'string'
                    ? parsedData.rendimiento
                    : JSON.stringify(parsedData.rendimiento);
            }

            let iCounter = 1;
            let pCounter = 1;

            parsedData.ingredients.forEach(ing => {
                const selected = ingredientSelections[ing.index];
                if (!selected) return; // Skip unmatched? Or throw error? For now skip.

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

            const legacyName = parsedData.name || "Receta Importada";

            // Check if recipe exists for target
            let existingRecipeId = null;
            let targetTable = "Recetas"; // Default

            // If linked to a product, chek if it has a recipe
            if (targetProduct) {
                if (targetProduct.Receta) {
                    existingRecipeId = targetProduct.Receta;
                    // Determine table based on where the recipe usually lives? 
                    // Verify where the existing recipe is... likely we need to search for it.
                    const existingInMenu = allRecetasMenu.find(r => r._id === existingRecipeId);
                    if (existingInMenu) targetTable = "Recetas";
                    else targetTable = "RecetasProduccion";
                } else {
                    // New recipe for this product
                    targetTable = targetProduct._table === MENU ? "Recetas" : "RecetasProduccion";
                }
            }

            if (existingRecipeId) {
                // Update Existing
                await dispatch(updateItem(existingRecipeId, {
                    ...payload,
                    legacyName,
                    actualizacion: new Date().toISOString()
                }, targetTable));
                alert("Receta existente actualizada exitosamente.");
            } else {
                // Create New
                if (targetProduct) {
                    // Use the helper action to create and link
                    await dispatch(createRecipeForProduct({
                        legacyName,
                        ...payload
                    }, targetProduct._id, targetProduct._table, targetTable));
                } else {
                    // Orphan creation (fallback)
                    // We need a custom insert if not linked
                    // For now, let's force linking or just fail if logic is complex, but user requested 'assign'.
                    // Let's assume user WANTS validation.

                    // If really orphan, we put it in RecetasProduccion as safe default? Or Recetas? 
                    // Let's put in 'Recetas' by default if no parent. 
                    // BEWARE: createItem needs a type. 
                    // We'll skip orphan creation for now to ensure data integrity unless strictly needed.
                    // The user *should* pick a target.
                }
            }

            if (onSuccess) onSuccess();
            onClose();

        } catch (e) {
            console.error(e);
            alert("Error guardando receta: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md border w-full flex flex-col mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* HEADER */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                <h2 className="text-xl font-bold text-gray-800">Importador de Recetas Inteligente</h2>
                <Button variant="ghost" className="text-gray-500" onClick={onClose}>Ocultar ✕</Button>
            </div>

            <div className="bg-gray-50 border-b p-2 flex flex-col gap-2">
                <div className="flex justify-between items-center px-4">
                    <span className="text-sm font-semibold text-gray-600">¿Necesitas crear productos nuevos?</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                        {showQuickActions ? "Ocultar Herramientas" : "Mostrar Herramientas de Creación"}
                    </Button>
                </div>

                {showQuickActions && (
                    <div className="p-4 bg-white border-t animate-in slide-in-from-top-2 duration-200">
                        <div className="mb-4 flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700">Tipo de Producto a Gestionar:</label>
                            <select
                                value={quickActionType}
                                onChange={(e) => setQuickActionType(e.target.value)}
                                className="border rounded p-1 text-sm bg-gray-50"
                            >
                                <option value={MENU}>Menú (Venta)</option>
                                <option value={PRODUCCION}>Producción Interna</option>
                                <option value="ITEMS">Insumos (Almacén)</option>
                            </select>
                        </div>
                        <div className="border rounded-md p-2 bg-slate-50">
                            <AccionesRapidas currentType={quickActionType} />
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden p-6 max-h-[800px] overflow-y-auto">
                {step === 1 ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                            <p className="text-sm text-blue-800">
                                Pega el objeto JSON de tu receta aquí. El sistema intentará detectar automáticamente el nombre de la receta y relacionar los ingredientes con tu inventario.
                            </p>
                        </div>
                        <Textarea
                            className="flex-1 font-mono text-sm min-h-[300px]"
                            placeholder='{ "name": "Sopa de Tomate", "ingredients": [...] }'
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                        />
                        {jsonError && <p className="text-red-500 font-bold">{jsonError}</p>}
                        <div className="flex justify-end">
                            <Button onClick={handleParse} disabled={!jsonInput.trim()}>Analizar JSON &rarr;</Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT: TARGET PRODUCT SELECTION */}
                        <div className="lg:col-span-1 border-r pr-6 flex flex-col gap-4">
                            <h3 className="font-bold text-lg border-b pb-2">1. Validar Producto Destino</h3>
                            <p className="text-xs text-gray-500">¿A qué producto del sistema pertenece esta receta?</p>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Buscar Producto:</label>
                                <Input
                                    value={targetSearchTerm}
                                    onChange={(e) => { setTargetSearchTerm(e.target.value); setTargetProduct(null); }}
                                    placeholder="Ej: Hamburguesa Clásica"
                                    className={targetProduct ? "border-green-500 bg-green-50" : ""}
                                />
                                {targetProduct && (
                                    <div className="p-2 bg-green-100 text-green-800 rounded text-sm border border-green-300 flex justify-between items-center">
                                        <span>✓ {getProductName(targetProduct)}</span>
                                        <button onClick={() => { setTargetProduct(null); setTargetSearchTerm(""); }} className="text-xs text-red-500 hover:underline">Cambiar</button>
                                    </div>
                                )}

                                {!targetProduct && targetSearchMatches.length > 0 && (
                                    <ul className="border rounded-md shadow-sm max-h-40 overflow-y-auto bg-white divide-y">
                                        {targetSearchMatches.map(match => (
                                            <li
                                                key={match._id}
                                                className="p-2 hover:bg-blue-50 cursor-pointer text-sm flex flex-col"
                                                onClick={() => { setTargetProduct(match); setTargetSearchTerm(getProductName(match)); }}
                                            >
                                                <span className="font-semibold">{getProductName(match)}</span>
                                                <span className="text-xs text-gray-400">{match._table}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {parsedData?.name && (
                                <div className="mt-4 p-3 bg-gray-100 rounded border">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Nombre en JSON:</span>
                                    <p className="font-mono text-sm">{parsedData.name}</p>
                                </div>
                            )}
                        </div>


                        {/* MIDDLE: INGREDIENT MAPPING */}
                        <div className="lg:col-span-1 flex flex-col border-r pr-6">
                            <h3 className="font-bold text-lg border-b pb-2 mb-4">2. Validar Ingredientes ({parsedData?.ingredients?.length})</h3>
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
                                                {/* SOURCE (Editable if Manual) */}
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

                                                {/* ARROW */}
                                                <div className="text-gray-400 text-center">↓</div>

                                                {/* MAPPING */}
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
                                    + Agregar Ingrediente Manual
                                </Button>
                            </div>
                        </div>

                        {/* RIGHT: PROCESS PREVIEW */}
                        <div className="lg:col-span-1 flex flex-col">
                            <h3 className="font-bold text-lg border-b pb-2 mb-4">3. Validar Procesos ({Object.keys(parsedData?.processSteps || {}).length})</h3>
                            <div className="space-y-3 pr-2 overflow-y-auto max-h-[500px]">
                                {parsedData?.processSteps && Object.keys(parsedData.processSteps).length > 0 ? (
                                    Object.entries(parsedData.processSteps).sort((a, b) => {
                                        // Sort by proces1, proces2 etc
                                        const numA = parseInt(a[0].replace('proces', ''));
                                        const numB = parseInt(b[0].replace('proces', ''));
                                        return numA - numB;
                                    }).map(([key, value]) => (
                                        <div key={key} className="p-3 rounded-md border bg-slate-50 border-slate-200">
                                            <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">{key}</span>
                                            <p className="text-sm text-slate-800 whitespace-pre-wrap">{value}</p>
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

export default RecipeImportModal;
