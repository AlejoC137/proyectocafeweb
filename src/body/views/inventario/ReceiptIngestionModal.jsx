import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateItem, getAllFromTable } from "../../../redux/actions";
import { ITEMS, ItemsAlmacen } from "../../../redux/actions-types";
import { copyPromptToClipboard } from '../../../utils/prompts';
import { Copy, Check, Search, Receipt, ArrowRight, Trash2, Package } from 'lucide-react';

const ReceiptIngestionModal = ({ onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const allItems = useSelector((state) => state.allItems || []);
    const [jsonInput, setJsonInput] = useState("");
    const [jsonError, setJsonError] = useState(null);
    const [parsedData, setParsedData] = useState([]); 
    const [step, setStep] = useState(1); // 1: JSON Input, 2: Mapping & Confirmation
    const [isSaving, setIsSaving] = useState(false);
    const [promptCopied, setPromptCopied] = useState(false);
    const [selectedForUpdate, setSelectedForUpdate] = useState({}); // { index: boolean }

    // State for matches
    const [itemSelections, setItemSelections] = useState({}); // { index: selectedItem }
    const [itemSearchTerms, setItemSearchTerms] = useState({}); // { index: searchTerm }

    const getProductName = (product) => product?.Nombre_del_producto || product?.NombreES || product?.name || "(Sin nombre)";

    // --- STEP 1: PARSE JSON ---
    const handleParse = () => {
        setJsonError(null);
        try {
            let parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed)) {
                if (parsed.items && Array.isArray(parsed.items)) parsed = parsed.items;
                else if (parsed.productos && Array.isArray(parsed.productos)) parsed = parsed.productos;
                else throw new Error("El JSON debe ser un array de productos comprados.");
            }

            const normalizedItems = parsed.map((item, index) => ({
                index,
                nombre: item.nombre || item.producto || item.item || `Producto ${index + 1}`,
                cantidad: Number(item.cantidad || 0),
                unidades: item.unidades || "",
                costo_total: Number(item.costo_total || item.total || 0),
                precio_unitario: Number(item.precio_unitario || item.precio || 0)
            }));

            setParsedData(normalizedItems);

            // Auto-matching logic
            const initialSelections = {};
            const initialSearchTerms = {};
            const initialSuggestions = {};
            const initialSelectedForUpdate = {};

            normalizedItems.forEach(item => {
                initialSearchTerms[item.index] = item.nombre;
                
                // Fuzzy matching to find top 3 suggestions
                const words = item.nombre.toLowerCase().split(' ').filter(w => w.length > 2);
                const matches = allItems.map(p => {
                    const pName = getProductName(p).toLowerCase();
                    const matchCount = words.filter(w => pName.includes(w)).length;
                    return { product: p, count: matchCount };
                })
                .filter(m => m.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

                if (matches.length > 0) {
                    initialSuggestions[item.index] = matches.map(m => m.product);
                    // Pre-select the best one
                    initialSelections[item.index] = matches[0].product;
                    initialSelectedForUpdate[item.index] = true;
                } else {
                    initialSelectedForUpdate[item.index] = false;
                }
            });

            setItemSelections(initialSelections);
            setItemSearchTerms(initialSearchTerms);
            setItemSuggestions(initialSuggestions);
            setSelectedForUpdate(initialSelectedForUpdate);
            setStep(2);
        } catch (err) {
            setJsonError("Error parseando JSON: " + err.message);
        }
    };

    const [itemSuggestions, setItemSuggestions] = useState({}); // { index: [products] }

    const getMatches = (term) => {
        if (!term) return [];
        const lower = term.toLowerCase();
        return allItems
            .filter(p => getProductName(p).toLowerCase().includes(lower))
            .slice(0, 10);
    };

    const handleSelectProduct = (index, product) => {
        setItemSelections(prev => ({ ...prev, [index]: product }));
    };

    const handleCopyPrompt = async () => {
        await copyPromptToClipboard('RECIBO', setPromptCopied);
    };

    const handleSave = async () => {
        const updates = Object.entries(itemSelections)
            .filter(([index, selected]) => selected !== null && selectedForUpdate[index])
            .map(([index, selected]) => {
                const receiptItem = parsedData[index];
                return {
                    _id: selected._id,
                    COSTO: receiptItem.costo_total,
                    CANTIDAD: receiptItem.cantidad,
                    precioUnitario: receiptItem.precio_unitario || (receiptItem.costo_total / receiptItem.cantidad),
                    _originalName: getProductName(selected),
                    _receiptName: receiptItem.nombre
                };
            });

        if (updates.length === 0) {
            alert("No hay productos vinculados para actualizar.");
            return;
        }

        if (!confirm(`Se actualizarán ${updates.length} productos en el inventario. ¿Continuar?`)) return;

        setIsSaving(true);
        try {
            const promises = updates.map(update => {
                const payload = {
                    COSTO: update.COSTO,
                    CANTIDAD: update.CANTIDAD,
                    precioUnitario: update.precioUnitario,
                    FECHA_ACT: new Date().toISOString().split('T')[0]
                };
                return dispatch(updateItem(update._id, payload, ItemsAlmacen));
            });

            await Promise.all(promises);
            alert("Inventario actualizado exitosamente.");
            if (onSuccess) onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error al actualizar inventario.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl border w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Receipt className="h-6 w-6" />
                    <h2 className="text-xl font-bold">Ingestión de Recibos IA</h2>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                    <Trash2 className="h-6 w-6" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
                {step === 1 ? (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                            <p className="text-sm text-blue-800">
                                1. Toma una foto del recibo.<br/>
                                2. Copia el prompt y llévalo a una IA junto con la foto.<br/>
                                3. Pega el JSON resultante aquí.
                            </p>
                            <Button
                                onClick={handleCopyPrompt}
                                variant="outline"
                                className="bg-white border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                                {promptCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                {promptCopied ? "Copiado" : "Copiar Prompt Recibo"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">JSON del Recibo</label>
                            <Textarea
                                className="font-mono text-sm min-h-[300px] border-2 focus:border-blue-500"
                                placeholder='[ { "nombre": "Tomate", "cantidad": 2, "costo_total": 5000 }, ... ]'
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                            />
                            {jsonError && <p className="text-red-500 text-sm font-bold">{jsonError}</p>}
                        </div>

                        <div className="flex justify-end">
                            <Button 
                                onClick={handleParse} 
                                disabled={!jsonInput.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                            >
                                Analizar Recibo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h3 className="font-bold text-lg text-gray-800">Vincular Productos del Recibo</h3>
                            <div className="flex items-center gap-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                        const allSelected = Object.values(selectedForUpdate).every(v => v);
                                        const next = {};
                                        parsedData.forEach(d => next[d.index] = !allSelected);
                                        setSelectedForUpdate(next);
                                    }}
                                    className="text-xs"
                                >
                                    {Object.values(selectedForUpdate).every(v => v) ? "Deseleccionar todos" : "Seleccionar todos"}
                                </Button>
                                <p className="text-sm text-gray-500">{parsedData.length} productos detectados</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {parsedData.map((item) => {
                                const selected = itemSelections[item.index];
                                const searchTerm = itemSearchTerms[item.index] || "";
                                const matches = getMatches(searchTerm);
                                const isIncluded = selectedForUpdate[item.index];

                                return (
                                    <div key={item.index} className={`relative p-4 rounded-xl border-2 transition-all ${isIncluded ? (selected ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30') : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                                        <div 
                                            className="absolute top-4 left-4 z-10 cursor-pointer"
                                            onClick={() => setSelectedForUpdate(prev => ({ ...prev, [item.index]: !prev[item.index] }))}
                                        >
                                            <div className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${isIncluded ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                                {isIncluded && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                                            {/* Receipt Side */}
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-400 uppercase">En el Recibo</p>
                                                <p className="font-bold text-gray-800 text-lg">{item.nombre}</p>
                                                <div className="flex gap-4 text-sm text-gray-600">
                                                    <span>Cant: <strong className="text-blue-600">{item.cantidad} {item.unidades}</strong></span>
                                                    <span>Total: <strong className="text-blue-600">${item.costo_total.toLocaleString()}</strong></span>
                                                </div>
                                            </div>

                                            {/* Inventory Matching Side */}
                                            <div className="relative">
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Vincular con Inventario</p>
                                                {selected ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                                                    <Package className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-800">{getProductName(selected)}</p>
                                                                    <p className="text-[10px] text-gray-500">{selected.GRUPO} | Stock: {selected.CANTIDAD} {selected.UNIDADES}</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleSelectProduct(item.index, null)} className="text-red-400 hover:text-red-600 p-1">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        {itemSuggestions[item.index] && itemSuggestions[item.index].length > 1 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className="text-[9px] text-gray-400 w-full">Otras coincidencias:</span>
                                                                {itemSuggestions[item.index]
                                                                    .filter(s => s._id !== selected._id)
                                                                    .map(s => (
                                                                        <button 
                                                                            key={s._id}
                                                                            onClick={() => handleSelectProduct(item.index, s)}
                                                                            className="text-[9px] bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 text-gray-600"
                                                                        >
                                                                            {getProductName(s)}
                                                                        </button>
                                                                    ))
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Buscar en el inventario..."
                                                                className="pl-9 h-11 border-amber-300"
                                                                value={searchTerm}
                                                                onChange={(e) => setItemSearchTerms(prev => ({ ...prev, [item.index]: e.target.value }))}
                                                            />
                                                        </div>
                                                        {itemSuggestions[item.index] && itemSuggestions[item.index].length > 0 && !searchTerm && (
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className="text-[9px] text-gray-400 w-full">Sugerencias:</span>
                                                                {itemSuggestions[item.index].map(s => (
                                                                    <button 
                                                                        key={s._id}
                                                                        onClick={() => handleSelectProduct(item.index, s)}
                                                                        className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 text-gray-700 font-medium transition-all shadow-sm"
                                                                    >
                                                                        {getProductName(s)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {matches.length > 0 && searchTerm && (
                                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y">
                                                                {matches.map(m => (
                                                                    <div 
                                                                        key={m._id}
                                                                        onClick={() => handleSelectProduct(item.index, m)}
                                                                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                                                                    >
                                                                        <div>
                                                                            <p className="text-sm font-bold text-gray-800">{getProductName(m)}</p>
                                                                            <p className="text-[10px] text-gray-500">{m.GRUPO}</p>
                                                                        </div>
                                                                        <ArrowRight className="h-4 w-4 text-gray-300" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center pt-6 mt-6 border-t">
                            <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700">
                                Volver al JSON
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving || Object.values(itemSelections).every(v => v === null)}
                                className="bg-green-600 hover:bg-green-700 text-white min-w-[200px] h-12 rounded-xl shadow-lg"
                            >
                                {isSaving ? "Guardando..." : "Confirmar y Actualizar"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceiptIngestionModal;
