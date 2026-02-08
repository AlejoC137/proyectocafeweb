import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MacrocalculadorDeValorDeRecetas = ({ onClose }) => {
    // --- Redux Data ---
    const allMenu = useSelector((state) => state.allMenu || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []);
    const allItems = useSelector((state) => state.allItems || []); // Ingredients

    // --- Derived State: Unified Recipe List ---
    const productMap = useMemo(() => {
        const map = {};
        allMenu.forEach(item => map[item._id] = item);
        allProduccion.forEach(item => map[item._id] = item);
        return map;
    }, [allMenu, allProduccion]);

    const ingredientMap = useMemo(() => {
        const map = {};
        allItems.forEach(item => map[item._id] = item);
        allProduccion.forEach(item => map[item._id] = item);
        return map;
    }, [allItems, allProduccion]);

    // Helper to parse Cost JSON safely
    const parseCost = (costoRaw) => {
        if (!costoRaw) return {};
        if (typeof costoRaw === 'number') return { COSTO: costoRaw };
        if (typeof costoRaw === 'string') {
            const trimmed = costoRaw.trim();
            if (trimmed.startsWith('{')) {
                try {
                    return JSON.parse(trimmed);
                } catch (e) {
                    return {};
                }
            }
            // Logic for direct numbers appearing as strings
            if (!isNaN(trimmed)) {
                return { COSTO: Number(trimmed) };
            }
        }
        return {};
    };

    const allRecipes = useMemo(() => {
        const menuRecipes = allRecetasMenu.map(r => {
            const parent = productMap[r.forId];
            const costData = parseCost(r.costo);
            // For Menu: vCMP is usually the material cost. 
            // CalculatedCost Logic: vCMP -> COSTO -> Parent.COSTO -> 0
            const calculatedCost = Number(costData.vCMP) || Number(costData.COSTO) || Number(parent?.COSTO) || 0;

            return {
                ...r,
                sourceType: 'menu',
                name: r.legacyName || parent?.NombreES || "Sin Nombre",
                group: parent?.GRUPO || 'Sin Grupo',
                costData,
                calculatedCost
            };
        });

        const productionRecipes = allRecetasProduccion.map(r => {
            const parent = productMap[r.forId];
            const costData = parseCost(r.costo);
            // For Production: Check COSTO payload or fallback
            let val = Number(costData.COSTO) || Number(costData.vCMP) || 0;
            if (val === 0 && parent?.COSTO) val = Number(parent.COSTO);
            if (val === 0 && parent?.precioUnitario) val = Number(parent.precioUnitario);

            return {
                ...r,
                sourceType: 'produccion',
                name: r.legacyName || parent?.Nombre_del_producto || "Sin Nombre",
                group: parent?.GRUPO || 'Sin Grupo',
                costData,
                calculatedCost: val
            };
        });

        return { menu: menuRecipes, produccion: productionRecipes };
    }, [allRecetasMenu, allRecetasProduccion, productMap]);

    // --- Local State ---
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'produccion'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set()); // IDs
    const [expandedIngredients, setExpandedIngredients] = useState(true);

    // --- Filtering ---
    const currentList = allRecipes[activeTab];
    const availableGroups = useMemo(() => [...new Set(currentList.map(i => i.group))].filter(Boolean).sort(), [currentList]);

    const filteredRecipes = useMemo(() => {
        return currentList.filter(item => {
            const name = item.name || '';
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGroup = selectedGroup ? item.group === selectedGroup : true;
            return matchesSearch && matchesGroup;
        });
    }, [currentList, searchTerm, selectedGroup]);

    // --- Selection Handlers ---
    const toggleItem = (itemId) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) { newSet.delete(itemId); } else { newSet.add(itemId); }
        setSelectedItems(newSet);
    };

    const handleSelectVisible = () => {
        const newSet = new Set(selectedItems);
        filteredRecipes.forEach(i => newSet.add(i._id));
        setSelectedItems(newSet);
    };

    const handleDeselectVisible = () => {
        const newSet = new Set(selectedItems);
        filteredRecipes.forEach(i => newSet.delete(i._id));
        setSelectedItems(newSet);
    };

    const handleClearSelection = () => setSelectedItems(new Set());

    // --- Calculation Logic ---
    const calculationResult = useMemo(() => {
        let totalCost = 0;
        let aggregatedIngredients = {};

        // Search in BOTH/ALL lists to find the selected items correctly
        const allList = [...allRecipes.menu, ...allRecipes.produccion];
        const selectedRecipesList = allList.filter(r => selectedItems.has(r._id));

        selectedRecipesList.forEach(receta => {
            // 1. Add Recipe Cost
            totalCost += receta.calculatedCost;

            // 2. Extract Ingredients
            const extract = (prefix, max) => {
                for (let i = 1; i <= max; i++) {
                    const itemId = receta[`${prefix}${i}_Id`];
                    const cuantityUnitsRaw = receta[`${prefix}${i}_Cuantity_Units`];

                    if (itemId && cuantityUnitsRaw) {
                        try {
                            const qUnits = typeof cuantityUnitsRaw === 'string' ? JSON.parse(cuantityUnitsRaw) : cuantityUnitsRaw;
                            const amount = Number(qUnits?.metric?.cuantity) || 0;

                            // Retrieve master data for this item
                            const itemData = ingredientMap[itemId];

                            // Source of Truth: Master Data (ItemsAlmacen/ProduccionInterna)
                            // We look ideally for 'UNIDADES' or 'units' in the master record.
                            let masterUnitRaw = itemData?.UNIDADES || itemData?.units;

                            // Sanitize unit: Ensure it's a string and not "NaN"
                            let unit = '';
                            if (masterUnitRaw && masterUnitRaw !== 'NaN') {
                                unit = String(masterUnitRaw);
                            }

                            if (amount > 0) {
                                if (!aggregatedIngredients[itemId]) {
                                    aggregatedIngredients[itemId] = {
                                        id: itemId,
                                        name: itemData?.Nombre || itemData?.Nombre_del_producto || 'Desconocido',
                                        totalQuantity: 0,
                                        unit: unit,
                                        unitPrice: Number(itemData?.precioUnitario) || Number(itemData?.COSTO) || 0
                                    };
                                }
                                aggregatedIngredients[itemId].totalQuantity += amount;
                                // Update unit if we found a better one (though master should be constant)
                                if (!aggregatedIngredients[itemId].unit && unit) {
                                    aggregatedIngredients[itemId].unit = unit;
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing ingredient:", e);
                        }
                    }
                }
            };
            extract('item', 30);
            extract('producto_interno', 20);
        });

        const ingredientsList = Object.values(aggregatedIngredients).map(ing => ({
            ...ing,
            totalCost: ing.totalQuantity * ing.unitPrice
        })).sort((a, b) => b.totalCost - a.totalCost);

        return { totalCost, ingredientsList, count: selectedRecipesList.length, selectedRecipes: selectedRecipesList };
    }, [selectedItems, allRecipes, ingredientMap]);


    const handlePrint = () => {
        if (calculationResult.ingredientsList.length === 0) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("No se pudo abrir la ventana de impresión. Por favor, habilita las ventanas emergentes.");
            return;
        }

        const today = new Date().toLocaleDateString();

        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Lista de Ingredientes - ${today}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        h1, h2 { text-align: center; color: #333; }
                        h2 { font-size: 18px; margin-top: 30px; margin-bottom: 10px; text-align: left; border-bottom: 2px solid #eee; padding-bottom: 5px; }
                        .info { margin-bottom: 20px; font-size: 14px; text-align: center; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .text-right { text-align: right; }
                        @media print {
                            .no-print { display: none; }
                            table { page-break-inside: auto; }
                            tr { page-break-inside: avoid; page-break-after: auto; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Reporte Costos y Materiales</h1>
                    <div class="info">
                        <strong>Fecha de impresión:</strong> ${today}<br>
                        <strong>Total Recetas:</strong> ${calculationResult.count}
                    </div>

                    <h2>1. Resumen de Recetas Seleccionadas</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Receta</th>
                                <th>Origen</th>
                                <th class="text-right">Costo Calc.</th>
                            </tr>
                        </thead>
                        <tbody>
                             ${calculationResult.selectedRecipes.map(r => `
                                <tr>
                                    <td>${r.name}</td>
                                    <td>${r.sourceType === 'menu' ? 'Menú' : 'Producción'}</td>
                                    <td class="text-right">$${r.calculatedCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="2" class="text-right">Total Costo Recetas</th>
                                <th class="text-right">$${calculationResult.totalCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</th>
                            </tr>
                        </tfoot>
                    </table>

                    <h2>2. Lista Consolidad de Ingredientes</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Ingrediente</th>
                                <th class="text-right">Cant. Total</th>
                                <th class="text-right">Unidad</th>
                                <th class="text-right">Costo Est.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${calculationResult.ingredientsList.map(ing => `
                                <tr>
                                    <td>${ing.name}</td>
                                    <td class="text-right">${ing.totalQuantity.toLocaleString()}</td>
                                    <td class="text-right">${ing.unit || '-'}</td>
                                    <td class="text-right">$${ing.totalCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="3" class="text-right">Total Materiales</th>
                                <th class="text-right">$${calculationResult.totalCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</th>
                            </tr>
                        </tfoot>
                    </table>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b bg-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-800">Macro Calculador de Valor de Recetas</h2>
                    </div>
                    <Button variant="ghost" className="text-gray-500 hover:text-red-500 font-bold" onClick={onClose}>✕</Button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left Panel: Recipe Selection */}
                    <div className="w-full md:w-5/12 border-r-0 md:border-r border-b md:border-b-0 flex flex-col bg-gray-50 h-1/2 md:h-auto">
                        <div className="p-3 border-b bg-white">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-3">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="menu">Recetas de Menú</TabsTrigger>
                                    <TabsTrigger value="produccion">Recetas de Producción</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex gap-2 mb-2">
                                <Input
                                    placeholder={`Buscar receta de ${activeTab === 'menu' ? 'menú' : 'producción'}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="flex gap-2 items-center flex-wrap justify-between">
                                <select
                                    className="text-sm border rounded p-1 w-1/2"
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                >
                                    <option value="">Todos los grupos</option>
                                    {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <div className='flex gap-1'>
                                    <Button variant="outline" size="sm" onClick={handleSelectVisible} className="h-7 text-xs">+ Visibles</Button>
                                    <Button variant="outline" size="sm" onClick={handleDeselectVisible} className="h-7 text-xs">- Visibles</Button>
                                    <Button variant="outline" size="sm" onClick={handleClearSelection} className="h-7 text-xs text-red-600">Borrar</Button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                <span>{filteredRecipes.length} recetas visibles</span>
                                <span className='font-bold text-indigo-600'>{selectedItems.size} seleccionadas (Total)</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredRecipes.length === 0 ? (
                                <p className="text-gray-400 text-center mt-8">No se encontraron recetas en esta categoría.</p>
                            ) : (
                                <div className="space-y-1">
                                    {filteredRecipes.map(item => (
                                        <div
                                            key={item._id}
                                            className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${selectedItems.has(item._id) ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-gray-100'}`}
                                            onClick={() => toggleItem(item._id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item._id)}
                                                onChange={() => { }}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-medium text-sm truncate" title={item.name}>{item.name}</div>
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>{item.group}</span>
                                                    <span className={`font-mono font-semibold ${item.calculatedCost > 0 ? 'text-indigo-700' : 'text-red-400'}`}>
                                                        ${item.calculatedCost.toLocaleString()}
                                                    </span>
                                                </div>
                                                {/* Detailed cost breakdown */}
                                                {(item.costData && (item.costData.vIB || item.costData.vCMP)) && (
                                                    <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                                                        {item.costData.vIB && <span>vIB: ${Number(item.costData.vIB).toLocaleString()}</span>}
                                                        {item.costData.vCMP && <span>vCMP: ${Number(item.costData.vCMP).toLocaleString()}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Results */}
                    <div className="w-full md:w-7/12 flex flex-col bg-white h-1/2 md:h-auto">
                        <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                            <h3 className="text-lg font-bold text-indigo-900 mb-4">Resumen de {calculationResult.count} Recetas Seleccionadas</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                                    <div className="text-sm text-gray-500 uppercase tracking-wide font-bold">Costo Total</div>
                                    <div className="text-3xl font-bold text-indigo-600">
                                        ${calculationResult.totalCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">Suma de costos vCMP/Calculados</div>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                                    <div className="text-sm text-gray-500 uppercase tracking-wide font-bold">Ingredientes Total</div>
                                    <div className="text-3xl font-bold text-emerald-600">
                                        {calculationResult.ingredientsList.length}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">Items únicos requeridos</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col p-4 overflow-hidden">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-700">Desglose de Ingredientes Consolidados</h4>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrint}
                                        disabled={calculationResult.ingredientsList.length === 0}
                                        className="h-7 text-xs flex gap-1 items-center"
                                    >
                                        🖨️ Imprimir Lista
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedIngredients(!expandedIngredients)}
                                        className="text-indigo-600 text-xs"
                                    >
                                        {expandedIngredients ? "Contraer" : "Expandir"}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium text-gray-500">Ingrediente</th>
                                            <th className="px-4 py-2 text-right font-medium text-gray-500">Cant. Total</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-500">Und.</th>
                                            <th className="px-4 py-2 text-right font-medium text-gray-500">Costo Est.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {calculationResult.ingredientsList.length > 0 ? (
                                            calculationResult.ingredientsList.map((ing) => (
                                                <tr key={ing.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-800 font-medium">
                                                        {ing.name}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono text-indigo-700">
                                                        {ing.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 text-xs">{ing.unit}</td>
                                                    <td className="px-4 py-2 text-right text-gray-600 text-xs">
                                                        ${ing.totalCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-12 text-center text-gray-400 italic">
                                                    Selecciona recetas del menú izquierdo para ver el desglose de ingredientes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MacrocalculadorDeValorDeRecetas;
