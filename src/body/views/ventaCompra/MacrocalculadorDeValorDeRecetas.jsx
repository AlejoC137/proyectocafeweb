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
    const [selectedItems, setSelectedItems] = useState(new Map()); // ID -> batches (quantity)
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
        const newMap = new Map(selectedItems);
        if (newMap.has(itemId)) { newMap.delete(itemId); } else { newMap.set(itemId, 1); }
        setSelectedItems(newMap);
    };

    const setItemBatches = (itemId, value) => {
        const parsed = Math.max(1, parseInt(value) || 1);
        const newMap = new Map(selectedItems);
        newMap.set(itemId, parsed);
        setSelectedItems(newMap);
    };

    const handleSelectVisible = () => {
        const newMap = new Map(selectedItems);
        filteredRecipes.forEach(i => { if (!newMap.has(i._id)) newMap.set(i._id, 1); });
        setSelectedItems(newMap);
    };

    const handleDeselectVisible = () => {
        const newMap = new Map(selectedItems);
        filteredRecipes.forEach(i => newMap.delete(i._id));
        setSelectedItems(newMap);
    };

    const handleClearSelection = () => setSelectedItems(new Map());

    // --- Calculation Logic ---
    const calculationResult = useMemo(() => {
        let totalCost = 0;
        let aggregatedIngredients = {};

        // Search in BOTH/ALL lists to find the selected items correctly
        const allList = [...allRecipes.menu, ...allRecipes.produccion];
        const selectedRecipesList = allList
            .filter(r => selectedItems.has(r._id))
            .map(r => ({ ...r, batches: selectedItems.get(r._id) || 1 }));

        selectedRecipesList.forEach(receta => {
            const batches = receta.batches;

            // 1. Add Recipe Cost × batches
            totalCost += receta.calculatedCost * batches;

            // 2. Extract Ingredients × batches
            const extract = (prefix, max) => {
                for (let i = 1; i <= max; i++) {
                    const itemId = receta[`${prefix}${i}_Id`];
                    const cuantityUnitsRaw = receta[`${prefix}${i}_Cuantity_Units`];

                    if (itemId && cuantityUnitsRaw) {
                        try {
                            const qUnits = typeof cuantityUnitsRaw === 'string' ? JSON.parse(cuantityUnitsRaw) : cuantityUnitsRaw;
                            const baseAmount = Number(qUnits?.metric?.cuantity) || 0;
                            const amount = baseAmount * batches;

                            const itemData = ingredientMap[itemId];
                            let masterUnitRaw = itemData?.UNIDADES || itemData?.units;
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
                                        unitPrice: Number(itemData?.precioUnitario) || Number(itemData?.COSTO) || 0,
                                        breakdown: []
                                    };
                                }
                                aggregatedIngredients[itemId].totalQuantity += amount;
                                aggregatedIngredients[itemId].breakdown.push({
                                    recipeName: receta.name,
                                    quantity: amount,
                                    batches
                                });
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

        const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
        const formatCurrencyPrint = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value || 0);

        const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Reporte: Macro Calculador de Valor de Recetas</title>
<style>
  @page{size:letter;margin:1.5cm 2cm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Georgia',serif;font-size:10.5px;color:#1a1a1a;line-height:1.6}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:16px}
  .header-left h1{font-size:20px;color:#1d4ed8;font-weight:700;letter-spacing:-0.3px}
  .badges{display:flex;gap:5px;margin-top:5px;flex-wrap:wrap}
  .badge{display:inline-block;padding:1px 8px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
  .badge-blue{background:#dbeafe;color:#1d4ed8}
  .badge-gray{background:#f1f5f9;color:#475569}
  .badge-emerald{background:#d1fae5;color:#059669}
  h2{font-size:9px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin:18px 0 6px}
  table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:12px}
  thead th{background:#f0f4f8;padding:5px 6px;text-align:left;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;color:#475569}
  thead th.num{text-align:right}
  td{padding:4px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top}
  td.num{text-align:right;font-family:monospace}
  .total-row{background:#eff6ff;font-weight:700}
  .total-row td{border-top:1.5px solid #bfdbfe;color:#1d4ed8;font-size:11px}
  .breakdown{font-size:8.5px;color:#64748b;margin-top:2px;font-style:italic}
  .footer{margin-top:20px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:8.5px;color:#94a3b8;display:flex;justify-content:space-between}
  .summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:10px}
  .summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px}
  .summary-label{font-size:8px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:2px}
  .summary-value{font-size:16px;font-weight:700;color:#1d4ed8}
</style></head><body>
<div class="header">
  <div class="header-left">
    <h1>Reporte de Costos y Materiales</h1>
    <div class="badges">
      <span class="badge badge-blue">📊 ${calculationResult.count} Receta(s) Seleccionada(s)</span>
      <span class="badge badge-gray">📅 ${today}</span>
      <span class="badge badge-emerald">📦 ${calculationResult.ingredientsList.length} Items Únicos</span>
    </div>
  </div>
</div>

<div class="summary-grid">
  <div class="summary-card">
    <div class="summary-label">Costo Total de Recetas</div>
    <div class="summary-value">${formatCurrencyPrint(calculationResult.totalCost)}</div>
  </div>
  <div class="summary-card">
    <div class="summary-label">Total Materiales</div>
    <div class="summary-value">${formatCurrencyPrint(calculationResult.totalCost)}</div>
  </div>
</div>

<h2>1. Desglose de Recetas Seleccionadas</h2>
<table>
  <thead>
    <tr>
      <th>Nombre de la Receta</th>
      <th>Origen</th>
      <th class="num">Tandas</th>
      <th class="num">Costo Total</th>
    </tr>
  </thead>
  <tbody>
    ${calculationResult.selectedRecipes.map(r => `
      <tr>
        <td style="font-weight:600">${r.name}</td>
        <td><span style="font-size:9px; color:#64748b">${r.sourceType === 'menu' ? 'MENÚ' : 'PRODUCCIÓN'}</span></td>
        <td class="num">${r.batches}x</td>
        <td class="num">${formatCurrencyPrint(r.calculatedCost * r.batches)}</td>
      </tr>
    `).join('')}
    <tr class="total-row">
      <td colspan="3" class="num">TOTAL COSTO RECETAS</td>
      <td class="num">${formatCurrencyPrint(calculationResult.totalCost)}</td>
    </tr>
  </tbody>
</table>

<h2>2. Lista Consolidada de Ingredientes e Insumos</h2>
<table>
  <thead>
    <tr>
      <th style="width:50%">Ingrediente / Insumo</th>
      <th class="num">Cant. Total</th>
      <th>Unidad</th>
      <th class="num">Costo Est.</th>
    </tr>
  </thead>
  <tbody>
    ${calculationResult.ingredientsList.map(ing => {
            const breakdownStr = ing.breakdown
                .map(b => `${b.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} para ${b.recipeName}${b.batches > 1 ? ` (x${b.batches})` : ''}`)
                .join(', ');
            return `
        <tr>
          <td>
            <div style="font-weight:600">${ing.name}</div>
            <div class="breakdown">${breakdownStr}</div>
          </td>
          <td class="num" style="font-weight:600; color:#1d4ed8">${ing.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
          <td><span style="font-size:9px; color:#64748b">${ing.unit || '-'}</span></td>
          <td class="num">${formatCurrencyPrint(ing.totalCost)}</td>
        </tr>
      `;
        }).join('')}
    <tr class="total-row">
      <td colspan="3" class="num">TOTAL ESTIMADO MATERIALES</td>
      <td class="num">${formatCurrencyPrint(calculationResult.totalCost)}</td>
    </tr>
  </tbody>
</table>

<div class="footer">
  <span>Generado por Macro Calculador de Valor de Recetas</span>
  <span>Página 1</span>
</div>

<script>
  window.onload = function() {
    window.focus();
    window.print();
    setTimeout(() => { window.close(); }, 500);
  }
</script>
</body></html>`;

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
                                    {filteredRecipes.map(item => {
                                        const isSelected = selectedItems.has(item._id);
                                        const batches = selectedItems.get(item._id) || 1;
                                        return (
                                        <div
                                            key={item._id}
                                            className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-gray-100'}`}
                                            onClick={() => toggleItem(item._id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-medium text-sm truncate" title={item.name}>{item.name}</div>
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>{item.group}</span>
                                                    <span className={`font-mono font-semibold ${item.calculatedCost > 0 ? 'text-indigo-700' : 'text-red-400'}`}>
                                                        ${(item.calculatedCost * (isSelected ? batches : 1)).toLocaleString()}
                                                    </span>
                                                </div>
                                                {(item.costData && (item.costData.vIB || item.costData.vCMP)) && (
                                                    <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                                                        {item.costData.vIB && <span>vIB: ${Number(item.costData.vIB).toLocaleString()}</span>}
                                                        {item.costData.vCMP && <span>vCMP: ${Number(item.costData.vCMP).toLocaleString()}</span>}
                                                    </div>
                                                )}
                                                {isSelected && (
                                                    <div
                                                        className="flex items-center gap-1.5 mt-1.5"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="text-[10px] text-indigo-500 font-semibold">Tandas:</span>
                                                        <button
                                                            className="w-5 h-5 text-xs rounded border border-indigo-300 bg-white hover:bg-indigo-100 flex items-center justify-center leading-none"
                                                            onClick={() => setItemBatches(item._id, batches - 1)}
                                                        >−</button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={batches}
                                                            onChange={(e) => setItemBatches(item._id, e.target.value)}
                                                            className="w-10 text-xs border border-indigo-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                        />
                                                        <button
                                                            className="w-5 h-5 text-xs rounded border border-indigo-300 bg-white hover:bg-indigo-100 flex items-center justify-center leading-none"
                                                            onClick={() => setItemBatches(item._id, batches + 1)}
                                                        >+</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
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
                                                        <div className="text-xs text-gray-400 font-normal mt-1">
                                                            ({ing.breakdown.map(b => `${b.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} para ${b.recipeName}${b.batches > 1 ? ` ×${b.batches}` : ''}`).join(', ')})
                                                        </div>
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
