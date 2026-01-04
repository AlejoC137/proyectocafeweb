import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, ChefHat, Scale, DollarSign, Package } from 'lucide-react';

function GastosCalculados() {
    const location = useLocation();
    const navigate = useNavigate();
    const { productos, monthName, year } = location.state || {};

    // Redux data for recalculating recipe details if needed, 
    // though we expect 'productos' to have some data, we need the raw recipes to explode ingredients.
    const { allRecetasMenu, allItems, allProduccion } = useSelector((state) => ({
        allRecetasMenu: state.allRecetasMenu || [],
        allItems: state.allItems || [],
        allProduccion: state.allProduccion || [],
    }));

    const aggregatedIngredients = useMemo(() => {
        if (!productos || !allRecetasMenu.length) return [];

        const ingredientMap = {};
        const combinedInventory = [...allItems, ...allProduccion];

        productos.forEach(prod => {
            // prod should have: nombre, cantidad, recetaId
            if (!prod.recetaId || prod.recetaId === "N/A") return;

            const recipe = allRecetasMenu.find(r => r._id === prod.recetaId);
            if (!recipe) return;

            // Extract details like in Predict.jsx
            const addIngredientsFromSource = (prefix, limit) => {
                for (let i = 1; i <= limit; i++) {
                    const itemId = recipe[`${prefix}${i}_Id`];
                    const itemCuantityStr = recipe[`${prefix}${i}_Cuantity_Units`];

                    if (itemId) {
                        let inventoryItem = combinedInventory.find(inv => inv._id === itemId);
                        // Fallback name if inventory item not found directly
                        const name = inventoryItem?.Nombre_del_producto || `ID: ${itemId}`;
                        let baseQuantity = 0;
                        let units = "";

                        if (itemCuantityStr) {
                            try {
                                const parsed = JSON.parse(itemCuantityStr);
                                baseQuantity = parseFloat(parsed.metric?.cuantity) || 0;
                                units = parsed.metric?.units ?? "";
                            } catch (e) { }
                        }

                        const totalQtyForProduct = baseQuantity * prod.cantidad;
                        const unitCost = parseFloat(inventoryItem?.precioUnitario) || 0;
                        const totalCostForProduct = totalQtyForProduct * unitCost;

                        if (!ingredientMap[itemId]) {
                            ingredientMap[itemId] = {
                                id: itemId,
                                name: name,
                                units: units,
                                totalQty: 0,
                                totalCost: 0,
                                usedIn: [] // { productName, qtyUsed, costUsed, productTotalSold }
                            };
                        }

                        ingredientMap[itemId].totalQty += totalQtyForProduct;
                        ingredientMap[itemId].totalCost += totalCostForProduct;

                        // Check if product already listed in usedIn to aggregate (though usually unique per iteration)
                        ingredientMap[itemId].usedIn.push({
                            productName: prod.nombre,
                            productTotalSold: prod.cantidad,
                            qtyUsed: totalQtyForProduct,
                            costUsed: totalCostForProduct
                        });
                    }
                }
            };

            addIngredientsFromSource('item', 30);
            addIngredientsFromSource('producto_interno', 20);
        });

        return Object.values(ingredientMap).sort((a, b) => b.totalCost - a.totalCost);

    }, [productos, allRecetasMenu, allItems, allProduccion]);

    const totalCostOverall = aggregatedIngredients.reduce((acc, curr) => acc + curr.totalCost, 0);

    if (!location.state) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-700">No hay datos disponibles</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Volver</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* HEADER */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            title="Volver"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Package className="text-indigo-600" />
                                Explosión de Insumos
                            </h1>
                            <p className="text-sm text-gray-500">
                                Calculado para: <span className="font-semibold">{monthName} {year}</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 px-6 py-2 rounded-lg border border-indigo-100 flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Costo Teórico Total</div>
                            <div className="text-xl font-bold text-indigo-800">
                                {totalCostOverall.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div className="p-2 bg-indigo-200 rounded-full text-indigo-700">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-6">

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                    <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider py-4 px-6">
                        <div className="col-span-4">Ingrediente</div>
                        <div className="col-span-2 text-right">Cantidad Total</div>
                        <div className="col-span-2 text-right">Costo Total</div>
                        <div className="col-span-4 pl-4">Distribución de Uso</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {aggregatedIngredients.map((ing) => (
                            <div key={ing.id} className="grid grid-cols-12 py-4 px-6 hover:bg-gray-50/50 transition-colors group">
                                {/* NAME & UNIT */}
                                <div className="col-span-4 pr-4">
                                    <div className="font-bold text-gray-800 text-sm">{ing.name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Unidad: {ing.units}</div>
                                </div>

                                {/* TOTAL QTY */}
                                <div className="col-span-2 text-right font-medium text-gray-700 text-sm">
                                    {ing.totalQty.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                                </div>

                                {/* TOTAL COST */}
                                <div className="col-span-2 text-right font-bold text-slate-700 text-sm">
                                    {ing.totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                </div>

                                {/* DISTRIBUTION */}
                                <div className="col-span-4 pl-4 text-xs">
                                    <div className="space-y-1">
                                        {ing.usedIn.slice(0, 3).map((usage, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-gray-600">
                                                <span className="truncate w-32" title={usage.productName}>{usage.productName}</span>
                                                <span className="text-gray-400">({usage.qtyUsed.toFixed(1)})</span>
                                            </div>
                                        ))}
                                        {ing.usedIn.length > 3 && (
                                            <div className="text-gray-400 italic pl-1">
                                                + {ing.usedIn.length - 3} productos más...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {aggregatedIngredients.length === 0 && (
                            <div className="p-10 text-center text-gray-400 italic">
                                No se encontraron ingredientes para los productos seleccionados.
                            </div>
                        )}
                    </div>

                </div>

            </main>
        </div>
    );
}

export default GastosCalculados;
