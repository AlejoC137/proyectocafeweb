import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateItem } from '../../../redux/actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, SpellCheck, Copy, Check, X, ArrowRight, Save, SlidersHorizontal, Package, CheckSquare, Square } from "lucide-react";
import { ITEMS, PRODUCCION, MENU, ItemsAlmacen, ProduccionInterna, MenuItems } from "../../../redux/actions-types";

const CorrectorOrtograficoModal = ({ onClose, currentType }) => {
    const dispatch = useDispatch();

    // --- Redux Selection ---
    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allMenu = useSelector((state) => state.allMenu || []);

    // Select the correct list based on currentType
    const inventoryList = useMemo(() => {
        if (currentType === ItemsAlmacen || currentType === ITEMS) return allItems;
        if (currentType === ProduccionInterna || currentType === PRODUCCION) return allProduccion;
        if (currentType === MenuItems || currentType === MENU) return allMenu;
        return [];
    }, [currentType, allItems, allProduccion, allMenu]);

    const source = useMemo(() => {
        if (currentType === ItemsAlmacen || currentType === ITEMS) return 'ItemsAlmacen';
        if (currentType === ProduccionInterna || currentType === PRODUCCION) return 'ProduccionInterna';
        if (currentType === MenuItems || currentType === MENU) return 'MenuItems';
        return 'ItemsAlmacen';
    }, [currentType]);

    // --- Local State ---
    const [itemSearch, setItemSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set());
    
    const [promptCopied, setPromptCopied] = useState(false);
    const [jsonResponse, setJsonResponse] = useState('');
    const [suggestedChanges, setSuggestedChanges] = useState([]);
    
    const [isApplying, setIsApplying] = useState(false);
    const [feedback, setFeedback] = useState('');

    // --- Derived State ---
    const availableGroups = useMemo(() => [...new Set(inventoryList.map(i => i.GRUPO))].filter(Boolean).sort(), [inventoryList]);

    const filteredItems = useMemo(() => {
        return inventoryList.filter(item => {
            const name = item.Nombre_del_producto || item.NombreES || item.name || '';
            const matchesSearch = name.toLowerCase().includes(itemSearch.toLowerCase());
            const matchesGroup = selectedGroup ? item.GRUPO === selectedGroup : true;
            return matchesSearch && matchesGroup;
        });
    }, [inventoryList, itemSearch, selectedGroup]);

    // --- Handlers ---
    const toggleItem = (itemId) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) newSet.delete(itemId);
        else newSet.add(itemId);
        setSelectedItems(newSet);
    };

    const handleSelectVisible = () => {
        const newSet = new Set(selectedItems);
        filteredItems.forEach(i => newSet.add(i._id));
        setSelectedItems(newSet);
    };

    const handleDeselectVisible = () => {
        const newSet = new Set(selectedItems);
        filteredItems.forEach(i => newSet.delete(i._id));
        setSelectedItems(newSet);
    };

    const handleGeneratePrompt = async () => {
        if (selectedItems.size === 0) return alert("Selecciona al menos un ítem.");
        
        const itemsToProcess = inventoryList.filter(i => selectedItems.has(i._id)).map(i => {
            if (currentType === MenuItems || currentType === MENU) {
                return {
                    _id: i._id,
                    NombreES: i.NombreES,
                    NombreEN: i.NombreEN,
                    DescripcionMenuES: i.DescripcionMenuES,
                    DescripcionMenuEN: i.DescripcionMenuEN
                };
            }
            return {
                _id: i._id,
                Nombre_del_producto: i.Nombre_del_producto,
                Area: i.Area,
                MARCA: Array.isArray(i.MARCA) ? i.MARCA.join(", ") : i.MARCA
            };
        });

        const promptText = `Revisa la ortografía y gramática (ES/EN) de estos elementos de inventario. Devuelve ÚNICAMENTE un array JSON con los objetos corregidos (manteniendo el _id y solo los campos que cambiaron).

Elementos:
${JSON.stringify(itemsToProcess, null, 2)}`;

        try {
            await navigator.clipboard.writeText(promptText);
            setPromptCopied(true);
            setTimeout(() => setPromptCopied(false), 2000);
            alert("Prompt copiado al portapapeles. Pégalo en ChatGPT/Claude.");
        } catch (err) {
            console.error(err);
        }
    };

    const handleProcessResponse = () => {
        try {
            const parsed = JSON.parse(jsonResponse);
            if (!Array.isArray(parsed)) throw new Error("Debe ser un array.");
            
            const enriched = parsed.map(suggestion => {
                const original = inventoryList.find(i => i._id === suggestion._id);
                if (!original) return null;
                
                const changes = [];
                Object.keys(suggestion).forEach(key => {
                    if (key !== '_id') {
                        changes.push({
                            field: key,
                            from: original[key],
                            to: suggestion[key]
                        });
                    }
                });
                
                return { ...suggestion, _original: original, _changes: changes, _applied: true };
            }).filter(Boolean);
            
            setSuggestedChanges(enriched);
            setFeedback(`Se detectaron ${enriched.length} sugerencias de corrección.`);
        } catch (e) {
            alert("Error al procesar JSON: " + e.message);
        }
    };

    const handleApplyCorrections = async () => {
        const activeChanges = suggestedChanges.filter(c => c._applied);
        if (activeChanges.length === 0) return;
        
        if (!confirm(`¿Aplicar correcciones a ${activeChanges.length} ítems?`)) return;

        setIsApplying(true);
        let success = 0;
        
        try {
            for (const change of activeChanges) {
                const { _id, _original, _changes, _applied, ...payload } = change;
                await dispatch(updateItem(_id, payload, source));
                success++;
                setFeedback(`Actualizando... ${success}/${activeChanges.length}`);
            }
            alert("Correcciones aplicadas correctamente.");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al aplicar correcciones.");
        } finally {
            setIsApplying(false);
        }
    };

    const toggleSuggestion = (index) => {
        const newSuggestions = [...suggestedChanges];
        newSuggestions[index]._applied = !newSuggestions[index]._applied;
        setSuggestedChanges(newSuggestions);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <SpellCheck className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-800">Corrector Ortográfico (IA)</h2>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Selection & Generator */}
                    <div className="w-1/2 border-r flex flex-col p-4 gap-4 bg-slate-50/50">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-600 uppercase">1. Selección de Ítems</h3>
                            <span className="text-xs text-indigo-600 font-bold">{selectedItems.size} seleccionados</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <Select onValueChange={setSelectedGroup} value={selectedGroup}>
                                <SelectTrigger className="bg-white h-9 flex-1">
                                    <SelectValue placeholder="Todos los grupos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos</SelectItem>
                                    {availableGroups.map(g => (
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    className="pl-8 h-9 bg-white" 
                                    placeholder="Buscar..." 
                                    value={itemSearch} 
                                    onChange={(e) => setItemSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded bg-white p-2">
                            <div className="grid grid-cols-1 gap-1">
                                {filteredItems.map(item => (
                                    <div 
                                        key={item._id}
                                        onClick={() => toggleItem(item._id)}
                                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${selectedItems.has(item._id) ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50 border-transparent'}`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedItems.has(item._id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                            {selectedItems.has(item._id) && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{item.Nombre_del_producto || item.NombreES || item.name}</div>
                                            <div className="text-[10px] text-slate-400">{item.GRUPO}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleSelectVisible} className="flex-1 text-[10px]">Sel. Visibles</Button>
                                <Button variant="outline" size="sm" onClick={handleDeselectVisible} className="flex-1 text-[10px]">Quitar Visibles</Button>
                            </div>
                            <Button 
                                onClick={handleGeneratePrompt} 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                disabled={selectedItems.size === 0}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                {promptCopied ? "Copiado!" : "Generar Prompt para IA"}
                            </Button>
                        </div>
                    </div>

                    {/* Right: Response & Review */}
                    <div className="w-1/2 flex flex-col p-4 gap-4">
                        <h3 className="font-bold text-sm text-slate-600 uppercase">2. Respuesta de la IA</h3>
                        
                        <div className="space-y-2">
                            <Textarea 
                                className="h-32 text-[10px] font-mono" 
                                placeholder='Pega aquí el JSON de respuesta...' 
                                value={jsonResponse}
                                onChange={(e) => setJsonResponse(e.target.value)}
                            />
                            <Button variant="secondary" className="w-full h-9" onClick={handleProcessResponse} disabled={!jsonResponse}>
                                Analizar Sugerencias
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded bg-slate-50 p-2">
                            {suggestedChanges.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                    <Package className="h-10 w-10 mb-2" />
                                    <p className="text-xs">No hay sugerencias para mostrar</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {suggestedChanges.map((item, idx) => (
                                        <div key={item._id} className={`bg-white border rounded shadow-sm overflow-hidden transition-all ${!item._applied ? 'opacity-50 grayscale' : ''}`}>
                                            <div className="bg-slate-100 p-2 flex justify-between items-center border-b">
                                                <span className="text-xs font-bold text-slate-700 truncate">{item._original.Nombre_del_producto || item._original.NombreES}</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => toggleSuggestion(idx)}
                                                    className={`h-6 w-6 p-0 rounded-full ${item._applied ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}
                                                >
                                                    {item._applied ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                {item._changes.map((c, cIdx) => (
                                                    <div key={cIdx} className="text-[10px] border-b border-dashed pb-1 last:border-0">
                                                        <div className="text-slate-400 font-bold uppercase mb-0.5">{c.field}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-red-400 line-through truncate flex-1">{c.from || '(vacío)'}</span>
                                                            <ArrowRight className="h-3 w-3 text-slate-300" />
                                                            <span className="text-green-600 font-bold flex-1">{c.to}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">{feedback}</span>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose} disabled={isApplying}>Cancelar</Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]" 
                            disabled={isApplying || suggestedChanges.filter(c => c._applied).length === 0}
                            onClick={handleApplyCorrections}
                        >
                            {isApplying ? <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Aplicar Cambios
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CorrectorOrtograficoModal;
