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

    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allMenu = useSelector((state) => state.allMenu || []);

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

    const [itemSearch, setItemSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set());
    
    const [promptCopied, setPromptCopied] = useState(false);
    const [jsonResponse, setJsonResponse] = useState('');
    const [suggestedChanges, setSuggestedChanges] = useState([]);
    
    const [isApplying, setIsApplying] = useState(false);
    const [feedback, setFeedback] = useState('');

    const availableGroups = useMemo(() => [...new Set(inventoryList.map(i => i.GRUPO))].filter(Boolean).sort(), [inventoryList]);

    const filteredItems = useMemo(() => {
        return inventoryList.filter(item => {
            const name = item.Nombre_del_producto || item.NombreES || item.name || '';
            const matchesSearch = name.toLowerCase().includes(itemSearch.toLowerCase());
            const matchesGroup = selectedGroup ? item.GRUPO === selectedGroup : true;
            return matchesSearch && matchesGroup;
        });
    }, [inventoryList, itemSearch, selectedGroup]);

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
                <div className="p-4 border-b bg-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <SpellCheck className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-800">Corrector Ortográfico (IA)</h2>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CorrectorOrtograficoModal;
