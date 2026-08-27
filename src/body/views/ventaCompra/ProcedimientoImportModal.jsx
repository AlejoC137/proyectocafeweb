import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateItem, createRecipeForProduct } from "../../../redux/actions";
import { crearProcedimiento } from "../../../redux/actions-Procedimientos";
import { PROCEDE, RECETAS_PROCEDIMIENTOS } from "../../../redux/actions-types";
import { copyPromptToClipboard } from '../../../utils/prompts';

// Sub-components
import Step1JsonInput from './ProcedimientoImportModalComponents/Step1JsonInput';
import Step2IngredientMapping from './ProcedimientoImportModalComponents/Step2IngredientMapping';
import Step2ProcessValidation from './ProcedimientoImportModalComponents/Step2ProcessValidation';

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
    const handleParse = (overrideJsonStr = null) => {
        setJsonError(null);
        try {
            const strToParse = typeof overrideJsonStr === 'string' ? overrideJsonStr : jsonInput;
            let parsed = typeof strToParse === 'object' ? strToParse : JSON.parse(strToParse);

            if (parsed.procedimiento && typeof parsed.procedimiento === 'object') parsed = parsed.procedimiento;
            else if (parsed.receta && typeof parsed.receta === 'object') parsed = parsed.receta;

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

            const legacyNameParsed = parsed.legacyName || parsed.name || parsed.nombre || parsed.procedimientoTittle || "";
            if (legacyNameParsed) setProcedimientoTittle(legacyNameParsed);
            if (parsed.categoria) setProcedimientoCategoria(parsed.categoria);

            setParsedData({
                name: legacyNameParsed,
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

    const handleCopyPrompt = async () => {
        await copyPromptToClipboard('PROCEDIMIENTOS', setPromptCopied);
    };

    const handleSave = async () => {
        if (!forcedRecipeId && (!procedimientoCategoria || !procedimientoTittle)) {
            alert("Por favor completa la Categoría y el Título del Procedimiento.");
            return;
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

            const legacyName = procedimientoTittle || parsedData.name || "Procedimiento Importado";

            if (forcedRecipeId) {
                await dispatch(updateItem(forcedRecipeId, {
                    ...payload,
                    legacyName,
                    actualizacion: new Date().toISOString()
                }, forcedRecipeSource || RECETAS_PROCEDIMIENTOS));
                alert("Procedimiento actualizado exitosamente.");
            } else {
                await dispatch(crearProcedimiento({
                    legacyName,
                    Categoria: procedimientoCategoria,
                    ...payload
                }));
                alert("Procedimiento creado exitosamente.");
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
                    <Step1JsonInput
                        jsonInput={jsonInput}
                        setJsonInput={setJsonInput}
                        jsonError={jsonError}
                        handleParse={handleParse}
                        handleCopyPrompt={handleCopyPrompt}
                        promptCopied={promptCopied}
                        allItems={allItems}
                        allProduccion={allProduccion}
                    />
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

                        <Step2IngredientMapping
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

                        <Step2ProcessValidation
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

export default ProcedimientoImportModal;
