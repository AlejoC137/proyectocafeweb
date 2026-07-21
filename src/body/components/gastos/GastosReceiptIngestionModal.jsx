import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { copyPromptToClipboard } from '../../../utils/prompts';
import { Copy, Check, Search, Receipt, ArrowRight, Trash2, Package } from 'lucide-react';
import { updateItem } from "../../../redux/actions";
import { ItemsAlmacen } from "../../../redux/actions-types";

const GastosReceiptIngestionModal = ({ onClose, onApply }) => {
    const dispatch = useDispatch();
    const allItems = useSelector((state) => state.allItems || []);
    const proveedores = useSelector((state) => state.Proveedores || []);
    
    const [jsonInput, setJsonInput] = useState("");
    const [jsonError, setJsonError] = useState(null);
    const [parsedData, setParsedData] = useState([]); 
    const [step, setStep] = useState(1); 
    const [promptCopied, setPromptCopied] = useState(false);
    const [selectedForUpdate, setSelectedForUpdate] = useState({});

    const [itemSelections, setItemSelections] = useState({});
    const [itemSearchTerms, setItemSearchTerms] = useState({});
    const [itemSuggestions, setItemSuggestions] = useState({});
    const [adoptedProps, setAdoptedProps] = useState({}); // { index: { nombre: boolean, costo: boolean, proveedor: boolean, marca: boolean } }

    const getProductName = (product) => product?.Nombre_del_producto || product?.NombreES || product?.name || "(Sin nombre)";

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
                precio_unitario: Number(item.precio_unitario || item.precio || 0),
                proveedor: item.proveedor || null,
                marca: item.marca || null
            }));

            setParsedData(normalizedItems);

            const initialSelections = {};
            const initialSearchTerms = {};
            const initialSuggestions = {};
            const initialSelectedForUpdate = {};
            const initialAdoptedProps = {};

            normalizedItems.forEach(item => {
                initialSearchTerms[item.index] = item.nombre;
                initialAdoptedProps[item.index] = { nombre: false, costo: false, proveedor: false, marca: false };
                
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
            setAdoptedProps(initialAdoptedProps);
            setStep(2);
        } catch (err) {
            setJsonError("Error parseando JSON: " + err.message);
        }
    };

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

    const toggleAdopt = (index, prop) => {
        setAdoptedProps(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                [prop]: !prev[index]?.[prop]
            }
        }));
    };

    const handleCopyPrompt = async () => {
        await copyPromptToClipboard('RECIBO', setPromptCopied);
    };

    const handleApply = () => {
        const itemsToApply = [];

        Object.entries(itemSelections).forEach(([idxStr, selected]) => {
            const index = Number(idxStr);
            if (selected !== null && selectedForUpdate[index]) {
                const receiptItem = parsedData[index];
                const props = adoptedProps[index] || {};
                
                // 1. Prepare updates for Master Inventory if any adopted properties
                const updates = {};
                if (props.nombre) updates.Nombre_del_producto = receiptItem.nombre;
                if (props.costo) updates.COSTO = receiptItem.costo_total;
                if (props.marca && receiptItem.marca) updates.MARCA = [receiptItem.marca];
                if (props.proveedor && receiptItem.proveedor) {
                    const match = proveedores.find(p => p.Nombre_Proveedor.toLowerCase().includes(receiptItem.proveedor.toLowerCase()) || receiptItem.proveedor.toLowerCase().includes(p.Nombre_Proveedor.toLowerCase()));
                    if (match) updates.Proveedor = match._id;
                }

                if (Object.keys(updates).length > 0) {
                    updates.FECHA_ACT = new Date().toISOString().split('T')[0];
                    // Dispatch update for the master inventory item
                    dispatch(updateItem(selected._id, updates, ItemsAlmacen));
                }

                // 2. Prepare item for the Gastos Form
                itemsToApply.push({
                    id: selected._id || selected.Nombre_del_producto,
                    recipeId: selected.recipeId || selected._id,
                    // If name was adopted, use the new name for the expense form, else use inventory name
                    Nombre_del_producto: props.nombre ? receiptItem.nombre : getProductName(selected),
                    cantidadCompra: receiptItem.cantidad || selected.CANTIDAD || '',
                    unidadesCompra: receiptItem.unidades || selected.UNIDADES || '',
                    costoTotalItemPagado: receiptItem.costo_total || '',
                    matches: [],
                });
            }
        });

        if (itemsToApply.length === 0) {
            alert("No hay productos vinculados para agregar.");
            return;
        }

        onApply(itemsToApply);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl border w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-6 w-6" />
                        <h2 className="text-xl font-bold">Ingestión de Gastos IA</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                        <Trash2 className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                                <p className="text-sm text-blue-800">
                                    1. Toma una foto del recibo o factura.<br/>
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
                                    placeholder='[ { "nombre": "Tomate", "cantidad": 2, "costo_total": 5000, "proveedor": "Fruver" }, ... ]'
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
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">Vincular y Actualizar Productos</h3>
                                    <p className="text-xs text-gray-500">Selecciona las propiedades que deseas actualizar en el inventario base.</p>
                                </div>
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
                                    <p className="text-sm font-bold text-blue-600">{parsedData.length} detectados</p>
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
                                                    <div className="flex flex-col text-sm text-gray-600 gap-1">
                                                        <div>Cant: <strong className="text-blue-600">{item.cantidad} {item.unidades}</strong> | Total: <strong className="text-blue-600">${item.costo_total?.toLocaleString()}</strong></div>
                                                        {item.proveedor && <div className="text-xs">Proveedor: <strong className="text-amber-600">{item.proveedor}</strong></div>}
                                                        {item.marca && <div className="text-xs">Marca: <strong className="text-amber-600">{item.marca}</strong></div>}
                                                    </div>
                                                </div>

                                                {/* Inventory Matching Side */}
                                                <div className="relative flex flex-col h-full justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Vincular con Producto</p>
                                                        {selected ? (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300 shadow-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                                                            <Package className="h-5 w-5" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="text-sm font-bold text-gray-800">{getProductName(selected)}</p>
                                                                                <a
                                                                                    href={`/item/${selected.recipeId || selected._id}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="p-1 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 hover:text-blue-800 transition-colors text-xs flex items-center justify-center"
                                                                                    title="Ver Detalles / Editar Item"
                                                                                >
                                                                                    📦
                                                                                </a>
                                                                            </div>
                                                                            <p className="text-[10px] text-gray-500">{selected.GRUPO} | Stock: {selected.CANTIDAD} {selected.UNIDADES}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={() => handleSelectProduct(item.index, null)} className="text-red-400 hover:text-red-600 p-1" title="Quitar vinculación">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                                
                                                                {/* ADOPT PROPERTIES UI */}
                                                                <div className="mt-2 pt-2 border-t border-green-200/50">
                                                                    <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Actualizar Inventario Base:</p>
                                                                    <div className="flex flex-wrap gap-3 text-xs">
                                                                        {item.nombre && item.nombre !== getProductName(selected) && (
                                                                            <label className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                                                                <input type="checkbox" className="rounded text-blue-600" checked={adoptedProps[item.index]?.nombre} onChange={() => toggleAdopt(item.index, 'nombre')} />
                                                                                <span title="Reemplazar el nombre actual por el del recibo">Nombre</span>
                                                                            </label>
                                                                        )}
                                                                        {item.costo_total && item.costo_total !== selected.COSTO && (
                                                                            <label className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                                                                <input type="checkbox" className="rounded text-blue-600" checked={adoptedProps[item.index]?.costo} onChange={() => toggleAdopt(item.index, 'costo')} />
                                                                                <span>Costo</span>
                                                                            </label>
                                                                        )}
                                                                        {item.proveedor && (
                                                                            <label className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                                                                <input type="checkbox" className="rounded text-blue-600" checked={adoptedProps[item.index]?.proveedor} onChange={() => toggleAdopt(item.index, 'proveedor')} />
                                                                                <span>Proveedor</span>
                                                                            </label>
                                                                        )}
                                                                        {item.marca && (
                                                                            <label className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                                                                <input type="checkbox" className="rounded text-blue-600" checked={adoptedProps[item.index]?.marca} onChange={() => toggleAdopt(item.index, 'marca')} />
                                                                                <span>Marca</span>
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {itemSuggestions[item.index] && itemSuggestions[item.index].length > 1 && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
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
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center pt-6 mt-6 border-t">
                                <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700">
                                    Volver al JSON
                                </Button>
                                <Button 
                                    onClick={handleApply} 
                                    disabled={Object.values(itemSelections).every(v => v === null)}
                                    className="bg-green-600 hover:bg-green-700 text-white min-w-[200px] h-12 rounded-xl shadow-lg"
                                >
                                    Confirmar y Agregar al Gasto
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GastosReceiptIngestionModal;
