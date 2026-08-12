import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { createRecipeForProduct, updateItem } from "../../../redux/actions";
import { MENU, PRODUCCION } from "../../../redux/actions-types";
import { copyPromptToClipboard } from '../../../utils/prompts';

// Sub-components
import RecipeImportHeaderTools from './RecipeImportModalComponents/RecipeImportHeaderTools';
import Step1RecipeJsonInput from './RecipeImportModalComponents/Step1RecipeJsonInput';
import Step2TargetProductSelection from './RecipeImportModalComponents/Step2TargetProductSelection';
import Step2RecipeIngredientMapping from './RecipeImportModalComponents/Step2RecipeIngredientMapping';
import Step2RecipeProcessValidation from './RecipeImportModalComponents/Step2RecipeProcessValidation';

const RecipeImportModal = ({ onClose, onSuccess, initialTargetProduct, forcedRecipeId, forcedRecipeSource }) => {
    const dispatch = useDispatch();
    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allMenu = useSelector((state) => state.allMenu || []);
    const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);

    const [jsonInput, setJsonInput] = useState("");
    const [jsonError, setJsonError] = useState(null);
    const [parsedData, setParsedData] = useState(null);

    const [ingredientSelections, setIngredientSelections] = useState({});
    const [ingredientSearchTerms, setIngredientSearchTerms] = useState({});

    const [targetProduct, setTargetProduct] = useState(null);
    const [targetSearchTerm, setTargetSearchTerm] = useState("");
    const [targetSearchMatches, setTargetSearchMatches] = useState([]);

    const [showQuickActions, setShowQuickActions] = useState(false);
    const [quickActionType, setQuickActionType] = useState(MENU);

    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [promptCopied, setPromptCopied] = useState(false);

    const getProductName = (product) => product?.Nombre_del_producto || product?.NombreES || product?.name || "(Sin nombre)";

    const possibleIngredients = useMemo(() => [
        ...allItems.map(item => ({ ...item, __type: "item" })),
        ...allProduccion.map(prod => ({ ...prod, __type: "producto_interno" })),
    ], [allItems, allProduccion]);

    const possibleTargets = useMemo(() => [
        ...allMenu.map(m => ({ ...m, __type: "menu", _table: MENU })),
        ...allProduccion.map(p => ({ ...p, __type: "produccion", _table: PRODUCCION })),
    ], [allMenu, allProduccion]);

    useEffect(() => {
        if (initialTargetProduct && !targetProduct) {
            setTargetProduct(initialTargetProduct);
            setTargetSearchTerm(getProductName(initialTargetProduct));
        }
    }, [initialTargetProduct]);

    // --- STEP 1: PARSE JSON ---
    const handleParse = () => {
        setJsonError(null);
        try {
            let parsed = JSON.parse(jsonInput);

            if (parsed.receta && typeof parsed.receta === 'object') parsed = parsed.receta;
            else if (parsed.recipe && typeof parsed.recipe === 'object') parsed = parsed.recipe;

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

            const processSteps = {};
            for (let i = 1; i <= 20; i++) {
                if (parsed[`proces${i}`] !== undefined) {
                    processSteps[`proces${i}`] = parsed[`proces${i}`];
                }
            }

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

    const handleCopyPrompt = async () => {
        await copyPromptToClipboard('RECETAS', setPromptCopied);
    };

    const handleSave = async () => {
        if (!targetProduct) {
            if (!confirm("No has seleccionado un producto del menú/producción para enlazar esta receta. se creará como receta 'huérfana' con el nombre del JSON. ¿Continuar?")) return;
        }

        setIsSaving(true);
        try {
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

            const legacyName = parsedData.name || "Receta Importada";

            let existingRecipeId = null;
            let targetTable = "Recetas";

            if (forcedRecipeId) {
                await dispatch(updateItem(forcedRecipeId, {
                    ...payload,
                    legacyName,
                    actualizacion: new Date().toISOString()
                }, forcedRecipeSource));
                alert("Receta actual actualizada exitosamente.");
            } else {
                if (targetProduct) {
                    if (targetProduct.Receta) {
                        existingRecipeId = targetProduct.Receta;
                        const existingInMenu = allRecetasMenu.find(r => r._id === existingRecipeId);
                        if (existingInMenu) targetTable = "Recetas";
                        else targetTable = "RecetasProduccion";
                    } else {
                        targetTable = targetProduct._table === MENU ? "Recetas" : "RecetasProduccion";
                    }
                }

                if (existingRecipeId) {
                    await dispatch(updateItem(existingRecipeId, {
                        ...payload,
                        legacyName,
                        actualizacion: new Date().toISOString()
                    }, targetTable));
                    alert("Receta existente actualizada exitosamente.");
                } else {
                    if (targetProduct) {
                        await dispatch(createRecipeForProduct({
                            legacyName,
                            ...payload
                        }, targetProduct._id, targetProduct._table, targetTable));
                    }
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

            <RecipeImportHeaderTools
                showQuickActions={showQuickActions}
                setShowQuickActions={setShowQuickActions}
                quickActionType={quickActionType}
                setQuickActionType={setQuickActionType}
            />

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden p-6 max-h-[800px] overflow-y-auto">
                {step === 1 ? (
                    <Step1RecipeJsonInput
                        jsonInput={jsonInput}
                        setJsonInput={setJsonInput}
                        jsonError={jsonError}
                        handleParse={handleParse}
                        handleCopyPrompt={handleCopyPrompt}
                        promptCopied={promptCopied}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Step2TargetProductSelection
                            forcedRecipeId={forcedRecipeId}
                            targetSearchTerm={targetSearchTerm}
                            setTargetSearchTerm={setTargetSearchTerm}
                            targetProduct={targetProduct}
                            setTargetProduct={setTargetProduct}
                            targetSearchMatches={targetSearchMatches}
                            getProductName={getProductName}
                            parsedData={parsedData}
                            setParsedData={setParsedData}
                        />

                        <Step2RecipeIngredientMapping
                            parsedData={parsedData}
                            ingredientSelections={ingredientSelections}
                            ingredientSearchTerms={ingredientSearchTerms}
                            getMatches={getMatches}
                            getProductName={getProductName}
                            handleSearchIngredient={handleSearchIngredient}
                            handleSelectIngredient={handleSelectIngredient}
                            handleManualChange={handleManualChange}
                            handleDeleteManual={handleDeleteManual}
                            handleAddManualIngredient={handleAddManualIngredient}
                        />

                        <Step2RecipeProcessValidation
                            parsedData={parsedData}
                            handleProcessChange={handleProcessChange}
                        />
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
