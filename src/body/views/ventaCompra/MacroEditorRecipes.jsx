import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateItem } from '../../../redux/actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { MENU, PRODUCCION } from "../../../redux/actions-types";

// Properties available for editing
const EDITABLE_PROPERTIES = [
    { key: 'ProcessTime', label: 'Tiempo (min)', type: 'number', placeholder: '15' },
    // Can add more here later if needed (e.g. Percentage, etc)
];

const MacroEditorRecipes = ({ onClose }) => {
    const dispatch = useDispatch();

    // --- Redux Selection ---
    const allMenu = useSelector((state) => state.allMenu || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []);

    // --- Derived State ---
    // Create a map of ID -> Product/Menu Item to easily find parent data (Group/Name)
    const productMap = useMemo(() => {
        const map = {};
        allMenu.forEach(item => map[item._id] = item);
        allProduccion.forEach(item => map[item._id] = item);
        return map;
    }, [allMenu, allProduccion]);

    // Unified Recipe List with Metadata
    const allRecipes = useMemo(() => [
        ...allRecetasMenu.map(r => {
            const parent = productMap[r.forId];
            return {
                ...r,
                source: 'Recetas', // Collection Name
                name: r.legacyName || parent?.NombreES || "Sin Nombre",
                group: parent?.GRUPO || 'Sin Grupo',
            };
        }),
        ...allRecetasProduccion.map(r => {
            const parent = productMap[r.forId];
            return {
                ...r,
                source: 'RecetasProduccion', // Collection Name
                name: r.legacyName || parent?.Nombre_del_producto || "Sin Nombre",
                group: parent?.GRUPO || 'Sin Grupo',
            };
        })
    ], [allRecetasMenu, allRecetasProduccion, productMap]);


    // --- Local State ---
    // Property to edit
    const [selectedProperty, setSelectedProperty] = useState('ProcessTime');
    const [newValue, setNewValue] = useState('');

    // Target Selection
    const [itemSearch, setItemSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set());

    // UI State
    const [isApplying, setIsApplying] = useState(false);
    const [feedback, setFeedback] = useState('');

    // --- Filter Logic ---
    const availableGroups = useMemo(() => [...new Set(allRecipes.map(i => i.group))].filter(Boolean).sort(), [allRecipes]);

    const filteredItems = useMemo(() => {
        return allRecipes.filter(item => {
            const name = item.name || '';
            const matchesSearch = name.toLowerCase().includes(itemSearch.toLowerCase());
            const matchesGroup = selectedGroup ? item.group === selectedGroup : true;
            return matchesSearch && matchesGroup;
        });
    }, [allRecipes, itemSearch, selectedGroup]);

    // --- Handlers ---
    const toggleItem = (itemId) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) { newSet.delete(itemId); } else { newSet.add(itemId); }
        setSelectedItems(newSet);
    };

    // Add currently filtered items to selection
    const handleSelectVisible = () => {
        const newSet = new Set(selectedItems);
        filteredItems.forEach(i => newSet.add(i._id));
        setSelectedItems(newSet);
    };

    // Remove currently filtered items from selection
    const handleDeselectVisible = () => {
        const newSet = new Set(selectedItems);
        filteredItems.forEach(i => newSet.delete(i._id));
        setSelectedItems(newSet);
    };

    // Select ALL items (Global)
    const handleSelectAllGlobal = () => {
        setSelectedItems(new Set(allRecipes.map(i => i._id)));
    };

    // Deselect ALL (Global)
    const handleClearSelection = () => {
        setSelectedItems(new Set());
    };

    // Group Actions
    const handleAddGroup = (group) => {
        if (!group) return;
        const itemsInGroup = allRecipes.filter(i => i.group === group);
        const newSet = new Set(selectedItems);
        itemsInGroup.forEach(i => newSet.add(i._id));
        setSelectedItems(newSet);
    };

    const handleRemoveGroup = (group) => {
        if (!group) return;
        const itemsInGroup = allRecipes.filter(i => i.group === group);
        const newSet = new Set(selectedItems);
        itemsInGroup.forEach(i => newSet.delete(i._id));
        setSelectedItems(newSet);
    };

    const handleApply = async () => {
        if (!selectedProperty || selectedItems.size === 0) {
            alert("Por favor seleccione una propiedad y al menos una receta.");
            return;
        }

        const propertyConfig = EDITABLE_PROPERTIES.find(p => p.key === selectedProperty);
        if (!confirm(`¿Estás seguro de actualizar '${propertyConfig.label}' a un valor de '${newValue}' en ${selectedItems.size} recetas?`)) {
            return;
        }

        setIsApplying(true);
        setFeedback('Iniciando actualización masiva...');

        let successCount = 0;

        try {
            const itemsToUpdate = allRecipes.filter(i => selectedItems.has(i._id));

            for (const item of itemsToUpdate) {
                let payload = {
                    [selectedProperty]: Number(newValue), // Ensure it's a number for ProcessTime
                    actualizacion: new Date().toISOString()
                };

                // Dispatch Update
                await dispatch(updateItem(item._id, payload, item.source));

                // If this is a RecetasProduccion (Internal Production), we might need to update the parent product's COSTO if we were editing cost, 
                // but for Time we just update the recipe.

                successCount++;
                setFeedback(`Actualizado ${successCount} / ${itemsToUpdate.length}...`);
            }

            setFeedback(`Proceso finalizado. Éxitos: ${successCount}`);
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            console.error(error);
            setFeedback("Error crítico durante la actualización.");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b bg-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-800">Macro Editor de Recetas</h2>
                    </div>
                    <Button variant="ghost" className="text-gray-500 hover:text-red-500 font-bold" onClick={onClose}>✕</Button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column: Property Selection */}
                    <div className="w-1/3 border-r p-4 flex flex-col gap-4 bg-gray-50">
                        <h3 className="font-semibold text-lg border-b pb-2">1. Configurar Cambio</h3>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Propiedad a Editar</label>
                            <Select onValueChange={setSelectedProperty} value={selectedProperty}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Seleccionar propiedad..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {EDITABLE_PROPERTIES.map(prop => (
                                        <SelectItem key={prop.key} value={prop.key}>{prop.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedProperty && (
                            <div className="p-4 bg-indigo-100 rounded border border-indigo-200">
                                <label className="text-sm font-medium text-indigo-800 mb-1 block">
                                    Nuevo Valor para '{EDITABLE_PROPERTIES.find(p => p.key === selectedProperty)?.label}'
                                </label>
                                <Input
                                    type="number"
                                    placeholder={EDITABLE_PROPERTIES.find(p => p.key === selectedProperty)?.placeholder}
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="bg-white"
                                />
                                <p className="text-xs text-indigo-600 mt-2">
                                    Este valor reemplazará el contenido actual de la propiedad seleccionada en todas las recetas marcadas.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Item Selection */}
                    <div className="w-2/3 p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-semibold text-lg">2. Seleccionar Recetas Destino</h3>
                            <div className='flex gap-2 items-center'>
                                <span className="text-sm text-gray-500 mr-2">Seleccionadas: <span className='font-bold text-indigo-600'>{selectedItems.size}</span></span>
                                <Button variant="ghost" size="sm" onClick={handleClearSelection} className="text-red-500 h-6 text-xs px-2" disabled={selectedItems.size === 0}>
                                    Borrar Selección
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleSelectAllGlobal} className="text-indigo-600 h-6 text-xs px-2">
                                    Todas ({allRecipes.length})
                                </Button>
                            </div>
                        </div>

                        {/* Advanced Filters & Selection Tools */}
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
                            {/* Row 1: Search & Filter */}
                            <div className="flex gap-2">
                                <select
                                    className="border rounded p-2 text-sm max-w-[200px]"
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                >
                                    <option value="">-- Filtrar por Grupo --</option>
                                    {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <Input
                                    className="flex-1 bg-white"
                                    placeholder="Buscar por nombre de receta..."
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                />
                            </div>

                            {/* Row 2: Bulk Actions based on current view/group */}
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones Rápidas:</span>

                                {/* Visible Selection */}
                                <Button variant="outline" size="sm" onClick={handleSelectVisible} className="h-7 text-xs bg-white text-green-700 border-green-200 hover:bg-green-50">
                                    + Agregar Visibles ({filteredItems.length})
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDeselectVisible} className="h-7 text-xs bg-white text-red-700 border-red-200 hover:bg-red-50">
                                    - Quitar Visibles
                                </Button>

                                <div className="h-4 w-px bg-slate-300 mx-2"></div>

                                {/* Group Selection (Independent of search) */}
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-500">Grupo:</span>
                                    <select
                                        className='h-7 rounded border border-slate-300 text-xs px-1 w-32'
                                        onChange={(e) => {
                                            if (e.target.value) { handleAddGroup(e.target.value); e.target.value = ""; }
                                        }}
                                    >
                                        <option value="">+ Sumar...</option>
                                        {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>

                                    <select
                                        className='h-7 rounded border border-slate-300 text-xs px-1 w-32'
                                        onChange={(e) => {
                                            if (e.target.value) { handleRemoveGroup(e.target.value); e.target.value = ""; }
                                        }}
                                    >
                                        <option value="">- Restar...</option>
                                        {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto border rounded bg-white p-2">
                            {filteredItems.length === 0 ? (
                                <p className="text-gray-400 text-center mt-10">No se encontraron recetas.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {filteredItems.map(item => (
                                        <div
                                            key={item._id}
                                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${selectedItems.has(item._id) ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50'}`}
                                            onClick={() => toggleItem(item._id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item._id)}
                                                onChange={() => { }}
                                                className="w-4 h-4 text-green-600"
                                            />
                                            <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                                                <div className="font-medium">
                                                    {item.name}
                                                </div>
                                                <div className="text-[10px] text-gray-400 flex justify-between">
                                                    <span>{item.group}</span>
                                                    <span>Actual: {item[selectedProperty] || '-'} min</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-100 flex justify-between items-center">
                    <div className="text-sm font-semibold text-indigo-600">
                        {feedback}
                    </div>
                    <Button
                        onClick={handleApply}
                        disabled={isApplying || !selectedProperty || selectedItems.size === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isApplying ? "Aplicando..." : "Aplicar Cambios a Recetas"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MacroEditorRecipes;
