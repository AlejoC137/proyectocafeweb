import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateItem } from '../../../redux/actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MacroAgregador = ({ onClose }) => {
    const dispatch = useDispatch();

    // --- Redux Selection ---
    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allMenuRecetas = useSelector((state) => state.allRecetasMenu || []);
    const allProduccionRecetas = useSelector((state) => state.allRecetasProduccion || []);

    const allMenu = useSelector((state) => state.allMenu || []);
    // allProduccion is already selected above

    // --- Local State ---
    // Single selected ingredient to add
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [quantity, setQuantity] = useState('');
    const [units, setUnits] = useState('');

    // Target Recipes selection
    const [recipeSearch, setRecipeSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSubGroup, setSelectedSubGroup] = useState('');
    const [selectedRecipes, setSelectedRecipes] = useState(new Set());

    // UI State
    const [isApplying, setIsApplying] = useState(false);
    const [feedback, setFeedback] = useState('');

    // --- Derived State ---
    const allIngredients = useMemo(() => [
        ...allItems.map(i => ({ ...i, type: 'item' })),
        ...allProduccion.map(p => ({ ...p, type: 'produccion' }))
    ], [allItems, allProduccion]);

    // Create a map of ID -> Product/Menu Item to easily find parent data (Group/Subgroup)
    const productMap = useMemo(() => {
        const map = {};
        allMenu.forEach(item => map[item._id] = item);
        allProduccion.forEach(item => map[item._id] = item);
        return map;
    }, [allMenu, allProduccion]);

    const allRecipes = useMemo(() => [
        ...allMenuRecetas.map(r => {
            const parent = productMap[r.forId];
            let costo = 0;
            try {
                if (typeof r.costo === 'string' && r.costo.startsWith('{')) {
                    const parsed = JSON.parse(r.costo);
                    costo = parsed.vCMP || 0;
                } else {
                    costo = Number(r.costo) || 0;
                }
            } catch (e) { costo = 0; }

            return {
                ...r,
                source: 'Recetas',
                name: r.legacyName || parent?.NombreES || "Sin Nombre",
                group: parent?.GRUPO || 'Sin Grupo',
                subGroup: parent?.SUBGRUPO || 'Sin Subgrupo',
                productPrice: parent?.Precio || 0,
                recipeCost: costo
            };
        }),
        ...allProduccionRecetas.map(r => {
            const parent = productMap[r.forId];
            let costo = 0;
            try {
                if (typeof r.costo === 'string' && r.costo.startsWith('{')) {
                    const parsed = JSON.parse(r.costo);
                    costo = parsed.vCMP || 0;
                } else {
                    costo = Number(r.costo) || 0;
                }
            } catch (e) { costo = 0; }

            return {
                ...r,
                source: 'RecetasProduccion',
                name: r.legacyName || parent?.Nombre_del_producto || "Sin Nombre",
                group: parent?.GRUPO || 'Sin Grupo',
                subGroup: parent?.SUBGRUPO || 'Sin Subgrupo',
                productPrice: parent?.COSTO || parent?.Precio || 0,
                recipeCost: costo
            };
        })
    ], [allMenuRecetas, allProduccionRecetas, productMap]);

    // Extract unique Groups and Subgroups for filters
    const availableGroups = useMemo(() => [...new Set(allRecipes.map(r => r.group))].sort(), [allRecipes]);
    const availableSubGroups = useMemo(() => {
        let recipes = allRecipes;
        if (selectedGroup) {
            recipes = recipes.filter(r => r.group === selectedGroup);
        }
        return [...new Set(recipes.map(r => r.subGroup))].sort();
    }, [allRecipes, selectedGroup]);


    const filteredIngredients = useMemo(() => {
        if (!ingredientSearch) return [];
        return allIngredients.filter(i =>
            (i.Nombre_del_producto || i.NombreES || '').toLowerCase().includes(ingredientSearch.toLowerCase())
        ).slice(0, 20);
    }, [allIngredients, ingredientSearch]);

    const filteredRecipes = useMemo(() => {
        return allRecipes.filter(r => {
            const matchesSearch = (r.name).toLowerCase().includes(recipeSearch.toLowerCase());
            const matchesGroup = selectedGroup ? r.group === selectedGroup : true;
            const matchesSubGroup = selectedSubGroup ? r.subGroup === selectedSubGroup : true;
            return matchesSearch && matchesGroup && matchesSubGroup;
        });
    }, [allRecipes, recipeSearch, selectedGroup, selectedSubGroup]);

    // --- Handlers ---
    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);

    const handleIngredientSelect = (ing) => {
        setSelectedIngredient(ing);
        setIngredientSearch(ing.Nombre_del_producto || ing.NombreES);
        setUnits(ing.UNIDADES || ''); // Default to item's units
    };

    const toggleRecipe = (recipeId) => {
        const newSet = new Set(selectedRecipes);
        if (newSet.has(recipeId)) {
            newSet.delete(recipeId);
        } else {
            newSet.add(recipeId);
        }
        setSelectedRecipes(newSet);
    };

    const handleSelectAllRecipes = () => {
        if (selectedRecipes.size === filteredRecipes.length) {
            setSelectedRecipes(new Set());
        } else {
            setSelectedRecipes(new Set(filteredRecipes.map(r => r._id)));
        }
    };

    const handleApply = async () => {
        if (!selectedIngredient || selectedRecipes.size === 0 || !quantity) {
            alert("Por favor seleccione un ingrediente, una cantidad y al menos una receta.");
            return;
        }
        if (!confirm(`¿Estás seguro de agregar '${selectedIngredient.Nombre_del_producto}' a ${selectedRecipes.size} recetas?`)) {
            return;
        }

        setIsApplying(true);
        setFeedback('Iniciando actualización masiva...');

        let successCount = 0;
        let failCount = 0;

        try {
            const recipesToUpdate = allRecipes.filter(r => selectedRecipes.has(r._id));

            for (const recipe of recipesToUpdate) {
                // Determine prefix and max count based on ingredient type
                const isProdIngredient = selectedIngredient.type === 'produccion';
                const prefix = isProdIngredient ? 'producto_interno' : 'item';
                const limit = isProdIngredient ? 20 : 30;

                // Find first empty slot
                let emptySlotIndex = -1;
                for (let i = 1; i <= limit; i++) {
                    // Check if BOTH ID and Cuantity_Units are null/empty to avoid overwriting legacy text-only items
                    const idExists = recipe[`${prefix}${i}_Id`];
                    const unitsExists = recipe[`${prefix}${i}_Cuantity_Units`];

                    if (!idExists && !unitsExists) {
                        emptySlotIndex = i;
                        break;
                    }
                }

                if (emptySlotIndex === -1) {
                    console.warn(`Receta ${recipe.name} no tiene espacio para mas ingredientes de tipo ${selectedIngredient.type}`);
                    failCount++;
                    continue;
                }

                // Prepare Payload
                const payload = {
                    [`${prefix}${emptySlotIndex}_Id`]: selectedIngredient._id,
                    [`${prefix}${emptySlotIndex}_Cuantity_Units`]: JSON.stringify({
                        metric: {
                            cuantity: Number(quantity),
                            units: units
                        }
                    }),
                    actualizacion: new Date().toISOString()
                };

                // Dispatch Update
                await dispatch(updateItem(recipe._id, payload, recipe.source));
                successCount++;
                setFeedback(`Actualizado ${successCount} / ${recipesToUpdate.length}...`);
            }

            setFeedback(`Proceso finalizado. Éxitos: ${successCount}, Fallos/Llenos: ${failCount}`);
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            console.error(error);
            setFeedback("Error critico durante la actualización.");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Macroagregador de Ingredientes</h2>
                    <Button variant="ghost" className="text-gray-500 hover:text-red-500 font-bold" onClick={onClose}>✕</Button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left Column: Ingredient Selection */}
                    <div className="w-full md:w-1/3 border-r-0 md:border-r border-b md:border-b-0 p-4 flex flex-col gap-4 bg-gray-50 h-1/2 md:h-auto overflow-y-auto">
                        <h3 className="font-semibold text-lg border-b pb-2">1. Seleccionar Ingrediente</h3>

                        <div className="relative">
                            <Input
                                placeholder="Buscar ingrediente..."
                                value={ingredientSearch}
                                onChange={(e) => setIngredientSearch(e.target.value)}
                            />
                            {ingredientSearch && !selectedIngredient && (
                                <ul className="absolute z-10 w-full bg-white border rounded shadow-md max-h-60 overflow-y-auto mt-1">
                                    {filteredIngredients.map(ing => (
                                        <li
                                            key={ing._id}
                                            className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                                            onClick={() => handleIngredientSelect(ing)}
                                        >
                                            {ing.Nombre_del_producto || ing.NombreES} <span className='text-xs text-gray-400'>({ing.type})</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {selectedIngredient && (
                            <div className="p-4 bg-blue-100 rounded border border-blue-200">
                                <p className="font-bold text-blue-800 mb-2">{selectedIngredient.Nombre_del_producto || selectedIngredient.NombreES}</p>
                                <div className="flex gap-2 mb-2">
                                    <div className='flex-1'>
                                        <label className="text-xs font-semibold text-gray-600">Cantidad</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                        />
                                    </div>
                                    <div className='w-24'>
                                        <label className="text-xs font-semibold text-gray-600">Unidades</label>
                                        <Input
                                            type="text"
                                            placeholder="kg, gr..."
                                            value={units}
                                            onChange={(e) => setUnits(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIngredient(null)} className="text-red-500 w-full text-xs">Cambiar Ingrediente</Button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Recipe Selection */}
                    <div className="w-full md:w-2/3 p-4 flex flex-col gap-4 h-1/2 md:h-auto overflow-hidden">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-semibold text-lg">2. Seleccionar Recetas Destino</h3>
                            <span className="text-sm text-gray-500">Seleccionadas: {selectedRecipes.size}</span>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                className="border rounded p-2 text-sm max-w-[150px]"
                                value={selectedGroup}
                                onChange={(e) => { setSelectedGroup(e.target.value); setSelectedSubGroup(''); }}
                            >
                                <option value="">Todos los Grupos</option>
                                {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <select
                                className="border rounded p-2 text-sm max-w-[150px]"
                                value={selectedSubGroup}
                                onChange={(e) => setSelectedSubGroup(e.target.value)}
                                disabled={!selectedGroup}
                            >
                                <option value="">Todos los Subgrupos</option>
                                {availableSubGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                            </select>
                            <Input
                                className="flex-1"
                                placeholder="Filtrar recetas..."
                                value={recipeSearch}
                                onChange={(e) => setRecipeSearch(e.target.value)}
                            />
                        </div>

                        <div className='flex justify-end'>
                            <Button variant="outline" size="sm" onClick={handleSelectAllRecipes}>
                                {selectedRecipes.size === filteredRecipes.length && filteredRecipes.length > 0 ? "Deseleccionar Todas" : "Seleccionar Todas Fil."}
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded bg-white p-2">
                            {filteredRecipes.length === 0 ? (
                                <p className="text-gray-400 text-center mt-10">No se encontraron recetas.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {filteredRecipes.map(recipe => (
                                        <div
                                            key={recipe._id}
                                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${selectedRecipes.has(recipe._id) ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50'}`}
                                            onClick={() => toggleRecipe(recipe._id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedRecipes.has(recipe._id)}
                                                onChange={() => { }} // Handled by parent div
                                                className="w-4 h-4 text-green-600"
                                            />
                                            <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                                                <div className="font-medium flex justify-between">
                                                    <span>{recipe.name}</span>
                                                    <span className="text-xs text-blue-600">{formatCurrency(recipe.productPrice)}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 flex justify-between">
                                                    <span>{recipe.group} {recipe.subGroup !== 'Sin Subgrupo' && `> ${recipe.subGroup}`}</span>
                                                    <span className="text-green-600 font-semibold" title="Costo Receta">{formatCurrency(recipe.recipeCost)}</span>
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
                        disabled={isApplying || !selectedIngredient || selectedRecipes.size === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isApplying ? "Aplicando..." : "Aplicar Cambios a las Recetas"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MacroAgregador;
