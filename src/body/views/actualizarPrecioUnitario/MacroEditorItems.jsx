import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateItem } from '../../../redux/actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hammer } from "lucide-react";
import { ITEMS, PRODUCCION } from "../../../redux/actions-types";

// Properties available for editing
const EDITABLE_PROPERTIES = [
    { key: 'Merma', label: 'Merma', type: 'number', placeholder: '0.1' },
    { key: 'COSTO', label: 'Costo', type: 'number', placeholder: '1000' },
    { key: 'CANTIDAD', label: 'Cantidad', type: 'number', placeholder: '1' },
    { key: 'UNIDADES', label: 'Unidades', type: 'text', placeholder: 'kg' },
    { key: 'STOCK.minimo', label: 'Stock Mínimo', type: 'number', placeholder: '10' },
    { key: 'STOCK.maximo', label: 'Stock Máximo', type: 'number', placeholder: '100' },
    { key: 'GRUPO', label: 'Grupo', type: 'text', placeholder: 'General' },
    { key: 'Area', label: 'Área', type: 'text', placeholder: 'Cocina' },
    { key: 'ALMACENAMIENTO', label: 'Almacenamiento', type: 'text', placeholder: 'Nevera' },
];

const MacroEditorItems = ({ onClose, currentType }) => {
    const dispatch = useDispatch();

    // --- Redux Selection ---
    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);

    // Select the correct list based on currentType
    const inventoryList = currentType === ITEMS ? allItems : allProduccion;
    const source = currentType === ITEMS ? 'ItemsAlmacen' : 'ProduccionInterna';

    // --- Local State ---
    // Property to edit
    const [selectedProperty, setSelectedProperty] = useState('');
    const [newValue, setNewValue] = useState('');

    // Target Items selection
    const [itemSearch, setItemSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set());

    // UI State
    const [isApplying, setIsApplying] = useState(false);
    const [feedback, setFeedback] = useState('');

    // --- Derived State ---
    // Extract unique Groups for filters
    const availableGroups = useMemo(() => [...new Set(inventoryList.map(i => i.GRUPO))].filter(Boolean).sort(), [inventoryList]);

    const filteredItems = useMemo(() => {
        return inventoryList.filter(item => {
            const name = item.Nombre_del_producto || item.name || '';
            const matchesSearch = name.toLowerCase().includes(itemSearch.toLowerCase());
            const matchesGroup = selectedGroup ? item.GRUPO === selectedGroup : true;
            return matchesSearch && matchesGroup;
        });
    }, [inventoryList, itemSearch, selectedGroup]);

    // --- Handlers ---
    const toggleItem = (itemId) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
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
        setSelectedItems(new Set(inventoryList.map(i => i._id)));
    };

    // Deselect ALL (Global)
    const handleClearSelection = () => {
        setSelectedItems(new Set());
    };

    // Group Actions
    const handleAddGroup = (group) => {
        if (!group) return;
        const itemsInGroup = inventoryList.filter(i => i.GRUPO === group);
        const newSet = new Set(selectedItems);
        itemsInGroup.forEach(i => newSet.add(i._id));
        setSelectedItems(newSet);
    };

    const handleRemoveGroup = (group) => {
        if (!group) return;
        const itemsInGroup = inventoryList.filter(i => i.GRUPO === group);
        const newSet = new Set(selectedItems);
        itemsInGroup.forEach(i => newSet.delete(i._id));
        setSelectedItems(newSet);
    };

    const handleApply = async () => {
        if (!selectedProperty || selectedItems.size === 0) {
            alert("Por favor seleccione una propiedad y al menos un ítem.");
            return;
        }

        const propertyConfig = EDITABLE_PROPERTIES.find(p => p.key === selectedProperty);
        if (!confirm(`¿Estás seguro de actualizar '${propertyConfig.label}' a un valor de '${newValue}' en ${selectedItems.size} ítems?`)) {
            return;
        }

        setIsApplying(true);
        setFeedback('Iniciando actualización masiva...');

        let successCount = 0;
        let failCount = 0;

        try {
            const itemsToUpdate = inventoryList.filter(i => selectedItems.has(i._id));

            for (const item of itemsToUpdate) {
                let payload = {};

                // Handle nested properties like STOCK.minimo
                if (selectedProperty.includes('.')) {
                    const [parent, child] = selectedProperty.split('.');
                    if (parent === 'STOCK') {
                        // Need to preserve existing stock data if possible, or create new
                        // NOTE: The backend might handle partial updates, but safer to send full structure if we can. 
                        // However, updateItem action usually merges top lvl fields.
                        // For STOCK (JSON string or Object), we need to be careful.
                        // Let's assume we update the specific field in the database.

                        // If STOCK is a string stringify it, if object keep it.
                        // Usually in this app STOCK is an object in redux but might be stringified for DB.
                        let currentStock = {};
                        if (typeof item.STOCK === 'string') {
                            try { currentStock = JSON.parse(item.STOCK); } catch (e) { }
                        } else if (typeof item.STOCK === 'object') {
                            currentStock = { ...item.STOCK };
                        }

                        currentStock[child] = newValue;

                        // The action updateItem expects the payload to match the schema
                        // If schema expects STOCK as string property
                        payload = { STOCK: JSON.stringify(currentStock) };
                    }
                } else {
                    payload = { [selectedProperty]: newValue };
                }

                // Add modification date
                // payload.actualizacion = new Date().toISOString();

                // Dispatch Update
                // signature: updateItem(id, item, collection)
                await dispatch(updateItem(item._id, payload, source));
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

    const getPropertyPlaceholder = () => {
        const prop = EDITABLE_PROPERTIES.find(p => p.key === selectedProperty);
        return prop ? prop.placeholder : '';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b bg-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Hammer className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-800">Macro Editor de Inventario</h2>
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
                            <div className="p-4 bg-blue-100 rounded border border-blue-200">
                                <label className="text-sm font-medium text-blue-800 mb-1 block">
                                    Nuevo Valor para '{EDITABLE_PROPERTIES.find(p => p.key === selectedProperty)?.label}'
                                </label>
                                <Input
                                    type={EDITABLE_PROPERTIES.find(p => p.key === selectedProperty)?.type || 'text'}
                                    placeholder={getPropertyPlaceholder()}
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="bg-white"
                                />
                                <p className="text-xs text-blue-600 mt-2">
                                    Este valor reemplazará el contenido actual de la propiedad seleccionada en todos los ítems marcados.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Item Selection */}
                    <div className="w-2/3 p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-semibold text-lg">2. Seleccionar Ítems Destino</h3>
                            <div className='flex gap-2 items-center'>
                                <span className="text-sm text-gray-500 mr-2">Seleccionados: <span className='font-bold text-blue-600'>{selectedItems.size}</span></span>
                                <Button variant="ghost" size="sm" onClick={handleClearSelection} className="text-red-500 h-6 text-xs px-2" disabled={selectedItems.size === 0}>
                                    Borrar Selección
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleSelectAllGlobal} className="text-blue-600 h-6 text-xs px-2">
                                    Todos ({inventoryList.length})
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
                                    placeholder="Buscar por nombre..."
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
                                            if (e.target.value) {
                                                handleAddGroup(e.target.value);
                                                e.target.value = ""; // reset
                                            }
                                        }}
                                    >
                                        <option value="">+ Sumar...</option>
                                        {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>

                                    <select
                                        className='h-7 rounded border border-slate-300 text-xs px-1 w-32'
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleRemoveGroup(e.target.value);
                                                e.target.value = ""; // reset
                                            }
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
                                <p className="text-gray-400 text-center mt-10">No se encontraron ítems.</p>
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
                                                onChange={() => { }} // Handled by parent div
                                                className="w-4 h-4 text-green-600"
                                            />
                                            <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                                                <div className="font-medium">
                                                    {item.Nombre_del_producto || item.name}
                                                </div>
                                                <div className="text-[10px] text-gray-400 flex justify-between">
                                                    <span>{item.GRUPO}</span>
                                                    <span>Actual: {
                                                        // Try to show current value of selected property for reference
                                                        selectedProperty && !selectedProperty.includes('.') ? (item[selectedProperty] || '-') : ''
                                                    }</span>
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
                    <div className="text-sm font-semibold text-blue-600">
                        {feedback}
                    </div>
                    <Button
                        onClick={handleApply}
                        disabled={isApplying || !selectedProperty || selectedItems.size === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isApplying ? "Aplicando..." : "Aplicar Cambios Masivos"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MacroEditorItems;
