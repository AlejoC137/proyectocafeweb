import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { copyPromptToClipboard } from '../../../utils/prompts';
import { Copy, Check, X } from 'lucide-react';
import { crearItem } from "../../../redux/actions-Proveedores";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, TARDEO, TARDEO_ALMUERZO } from "../../../redux/actions-types";

const MenuLunchImportModal = ({ onClose, onSuccess }) => {
    const dispatch = useDispatch();

    const [jsonInput, setJsonInput] = useState("");
    const [jsonError, setJsonError] = useState(null);
    const [parsedData, setParsedData] = useState([]); // Ahora es un array

    // UI States
    const [step, setStep] = useState(1); // 1: JSON Input, 2: Review & Confirmation
    const [isSaving, setIsSaving] = useState(false);
    const [promptCopied, setPromptCopied] = useState(false);

    // --- STEP 1: PARSE JSON ---
    const handleParse = () => {
        setJsonError(null);
        try {
            let parsed = JSON.parse(jsonInput);

            // Garantizamos que siempre sea un array
            if (!Array.isArray(parsed)) {
                parsed = [parsed];
            }

            // Validations
            if (parsed.length === 0) {
                throw new Error("El JSON está vacío o no es válido.");
            }

            // Initialize local editing state
            const initialEditableData = parsed.map((item, index) => {
                if (!item.NombreES) throw new Error(`Falta el campo NombreES en el ítem #${index + 1}.`);
                if (!item.Comp_Lunch) throw new Error(`Falta el objeto Comp_Lunch en el ítem #${index + 1}.`);

                // Inicializar categorías vacías para que siempre se muestren los inputs
                const baseCategorias = ["entrada", "proteina", "proteina_opcion_2", "carbohidrato", "acompanante", "ensalada", "bebida"];
                const compLunch = item.Comp_Lunch || {};

                baseCategorias.forEach(cat => {
                    if (!compLunch[cat]) {
                        compLunch[cat] = { nombre: "", descripcion: "" };
                    }
                });

                // Formatear la fecha a YYYY-MM-DD si es necesario
                let fechaFormateada = compLunch?.fecha?.fecha || "";
                if (fechaFormateada && fechaFormateada.includes("/")) {
                    // Intenta arreglar DD/MM/YYYY a YYYY-MM-DD
                    const parts = fechaFormateada.split("/");
                    if (parts.length === 3) {
                        fechaFormateada = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }

                return {
                    ...item,
                    Precio: item.Precio || 22000,
                    DescripcionMenuES: item.DescripcionMenuES || "",
                    Comp_Lunch: {
                        ...compLunch,
                        fecha: {
                            ...item.Comp_Lunch?.fecha,
                            fecha: fechaFormateada
                        }
                    }
                };
            });

            setParsedData(initialEditableData);
            setStep(2);
        } catch (err) {
            setJsonError("Error parseando JSON: " + err.message);
        }
    };

    // --- COPY PROMPT HANDLER ---
    const handleCopyPrompt = async () => {
        await copyPromptToClipboard('MENU_LUNCH', setPromptCopied);
    };

    // --- FINAL SAVE MULTIPLE ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            for (const menu of parsedData) {
                const finalCompLunchData = typeof menu.Comp_Lunch === 'object'
                    ? JSON.stringify(menu.Comp_Lunch)
                    : menu.Comp_Lunch;

                const newProduct = {
                    NombreES: menu.NombreES,
                    DescripcionMenuES: menu.DescripcionMenuES || "",
                    SUB_GRUPO: TARDEO_ALMUERZO,
                    Comp_Lunch: finalCompLunchData,
                    Precio: menu.Precio ? parseInt(menu.Precio, 10) : 22000,
                    GRUPO: TARDEO,
                    Estado: "Activo",
                };

                await dispatch(crearItem(newProduct, MENU));
            }

            // Actualizamos la tabla
            await dispatch(getAllFromTable(MENU));

            alert(`✅ ¡${parsedData.length} Menú(s) importado(s) y creado(s) con éxito!`);
            if (onSuccess) onSuccess();
            onClose();

        } catch (e) {
            console.error(e);
            alert("Error guardando los menús: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const categoriasRender = [
        { key: "entrada", label: "Entrada" },
        { key: "proteina", label: "Proteína" },
        { key: "proteina_opcion_2", label: "Opción 2" },
        { key: "carbohidrato", label: "Carbohidrato" },
        { key: "acompanante", label: "Acompañante" },
        { key: "ensalada", label: "Ensalada" },
        { key: "bebida", label: "Bebida" },
    ];

    const handleFieldChange = (index, field, value) => {
        setParsedData(prevData => {
            const newData = [...prevData];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    const handleDateChange = (index, field, value) => {
        setParsedData(prevData => {
            const newData = [...prevData];
            newData[index] = {
                ...newData[index],
                Comp_Lunch: {
                    ...newData[index].Comp_Lunch,
                    fecha: {
                        ...newData[index].Comp_Lunch.fecha,
                        [field]: value
                    }
                }
            };
            return newData;
        });
    };

    const handleRemoveMenu = (indexToRemove) => {
        setParsedData(prevData => prevData.filter((_, idx) => idx !== indexToRemove));
        if (parsedData.length === 1) { // If it was the last one, go back to step 1
            setStep(1);
        }
    };

    const handleComponentChange = (menuIndex, categoryKey, field, value) => {
        setParsedData(prevData => {
            const newData = [...prevData];
            newData[menuIndex] = {
                ...newData[menuIndex],
                Comp_Lunch: {
                    ...newData[menuIndex].Comp_Lunch,
                    [categoryKey]: {
                        ...newData[menuIndex].Comp_Lunch[categoryKey],
                        [field]: value
                    }
                }
            };
            return newData;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-md border w-full max-w-4xl flex flex-col max-h-[95vh] animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* HEADER */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Importador Lote de Menús (JSON)</h2>
                    <Button variant="ghost" className="text-gray-500 hover:bg-gray-200" onClick={onClose}>Ocultar ✕</Button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-hidden p-6 overflow-y-auto bg-gray-50/50">
                    {step === 1 ? (
                        <div className="flex flex-col gap-4 h-full">
                            <div className="bg-purple-50 p-4 rounded-md border border-purple-100 shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-purple-800 font-medium">
                                        Pega el <strong className="font-bold">Array JSON</strong> con los menús de la semana aquí.
                                        El sistema procesará uno por uno y los guardará en lote.
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCopyPrompt}
                                        className="flex items-center gap-1 text-xs h-8 px-3 border-purple-300 hover:bg-purple-100 hover:border-purple-400 ml-3 flex-shrink-0 transition-colors bg-white shadow-sm"
                                        title="Copia instrucciones para IA que analizan fotos de menús semanales"
                                    >
                                        {promptCopied ? (
                                            <>
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span className="text-green-600 font-medium">Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 text-purple-700" />
                                                <span className="text-purple-700 font-medium text-xs">Copiar Prompt Lote</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                className="flex-1 font-mono text-sm min-h-[300px] bg-slate-50 border-slate-300 focus:border-purple-400 focus:ring-purple-400 p-4 shadow-inner"
                                placeholder='[\n  {\n    "NombreES": "Menú Lunes",\n    "Precio": 22000,\n    "Comp_Lunch": { ... }\n  },\n  {\n    "NombreES": "Menú Martes",\n    "Precio": 22000,\n    "Comp_Lunch": { ... }\n  }\n]'
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                            />
                            {jsonError && <p className="text-red-500 font-bold bg-red-50 p-3 rounded-md border border-red-200">{jsonError}</p>}
                            <div className="flex justify-end shrink-0 pt-2">
                                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold" onClick={handleParse} disabled={!jsonInput.trim()}>
                                    Analizar JSON Lote &rarr;
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Verificar Menús a Importar ({parsedData.length})</h3>

                            <div className="flex flex-col gap-8">
                                {parsedData.map((menu, index) => {
                                    const compLunchParams = menu.Comp_Lunch || {};
                                    return (
                                        <div key={index} className="bg-white border rounded-lg shadow-sm p-5 relative">
                                            <div className="absolute -top-3 -left-3 bg-purple-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                                                {index + 1}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMenu(index)}
                                                className="absolute -top-3 -right-3 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white transition-colors w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-red-200 cursor-pointer"
                                                title="Quitar este menú del lote"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                <div>
                                                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Nombre Principal (ID)</label>
                                                    <Input
                                                        className="font-bold text-gray-800 text-sm h-10 uppercase"
                                                        value={menu.NombreES}
                                                        onChange={(e) => handleFieldChange(index, "NombreES", e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Precio</label>
                                                    <Input
                                                        type="number"
                                                        className="font-semibold text-gray-800 text-sm h-10"
                                                        value={menu.Precio}
                                                        onChange={(e) => handleFieldChange(index, "Precio", parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Descripción Pública</label>
                                                    <Textarea
                                                        className="text-gray-700 text-sm resize-none h-16"
                                                        value={menu.DescripcionMenuES}
                                                        onChange={(e) => handleFieldChange(index, "DescripcionMenuES", e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Día de la semana</label>
                                                    <Input
                                                        className="font-semibold text-gray-800 text-sm h-10"
                                                        value={compLunchParams?.fecha?.dia || ''}
                                                        onChange={(e) => handleDateChange(index, "dia", e.target.value)}
                                                        placeholder="Lunes, Martes..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Fecha (YYYY-MM-DD)</label>
                                                    <Input
                                                        type="date"
                                                        className="font-semibold text-gray-800 text-sm h-10"
                                                        value={compLunchParams?.fecha?.fecha || ''}
                                                        onChange={(e) => handleDateChange(index, "fecha", e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-sm border-b pb-1 mb-3 text-purple-700 uppercase tracking-wider">Componentes</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-md border border-slate-100">
                                                {categoriasRender.map(({ key, label }) => {
                                                    const item = compLunchParams[key] || { nombre: "", descripcion: "" };

                                                    return (
                                                        <div key={key} className="p-3 rounded bg-white shadow-sm border border-gray-200 hover:border-purple-300 transition-colors flex flex-col gap-2">
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
                                                            <Input
                                                                placeholder="Nombre (ej. Arroz blanco)"
                                                                className="h-8 text-sm font-semibold border-gray-300 focus:border-purple-400 focus:ring-purple-400 w-full"
                                                                value={item.nombre || ''}
                                                                onChange={(e) => handleComponentChange(index, key, "nombre", e.target.value)}
                                                            />
                                                            <Input
                                                                placeholder="Descripción extra (opcional)"
                                                                className="h-7 text-xs italic text-gray-500 border-gray-200 focus:border-purple-400 focus:ring-purple-400 w-full"
                                                                value={item.descripcion || ''}
                                                                onChange={(e) => handleComponentChange(index, key, "descripcion", e.target.value)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t bg-gray-50 flex justify-between rounded-b-lg shrink-0">
                    {step === 2 ? (
                        <Button variant="outline" className="border-gray-300 font-medium" onClick={() => setStep(1)}>
                            &larr; Volver al JSON
                        </Button>
                    ) : (
                        <div />
                    )}

                    <div className="flex gap-2 ml-auto">
                        {step === 2 && (
                            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-sm" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Guardando Lote..." : `Confirmar y Crear ${parsedData.length} Menús`}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuLunchImportModal;
