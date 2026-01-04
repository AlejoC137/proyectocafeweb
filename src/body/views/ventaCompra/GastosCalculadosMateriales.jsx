import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ChefHat } from 'lucide-react';

const GastosCalculadosMateriales = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve data from location state (if navigated normally) or localStorage (if opened in new tab)
    const { productos, monthName, year } = useMemo(() => {
        if (location.state) return location.state;

        try {
            const storedData = localStorage.getItem('tempGastosData');
            return storedData ? JSON.parse(storedData) : {};
        } catch (e) {
            console.error("Error reading from localStorage", e);
            return {};
        }
    }, [location.state]);

    const aggregatedIngredients = useMemo(() => {
        if (!productos) return [];

        const ingredientsMap = {};

        productos.forEach(producto => {
            if (producto.ingredientes && Array.isArray(producto.ingredientes)) {
                producto.ingredientes.forEach(ing => {
                    // Match properties from trimRecepie (name, cuantity, units, precioUnitario)
                    // Also keep fallbacks for legacy/other formats
                    const ingName = ing.name || ing.Ingrediente || ing.nombre || "Desconocido";
                    const key = ingName.trim().toLowerCase();

                    if (!ingredientsMap[key]) {
                        ingredientsMap[key] = {
                            name: ingName,
                            unit: ing.units || ing.Unidad || ing.unidad || '',
                            totalQuantity: 0,
                            totalCost: 0,
                            usedIn: []
                        };
                    }

                    // Calculate quantity used for this product sales
                    // 'cuantity' is the specific key from trimRecepie
                    const qtyPerUnit = parseFloat(ing.cuantity || ing.Cantidad || ing.cantidad || 0);
                    const costPerUnit = parseFloat(ing.precioUnitario || ing.Costo || ing.costoPromedio || 0);
                    const totalQtyForProduct = qtyPerUnit * (producto.cantidad || 0);
                    const totalCostForProduct = costPerUnit * qtyPerUnit * (producto.cantidad || 0);

                    ingredientsMap[key].totalQuantity += totalQtyForProduct;
                    ingredientsMap[key].totalCost += totalCostForProduct;
                    ingredientsMap[key].usedIn.push({
                        productName: producto.nombre,
                        productQuantity: producto.cantidad,
                        qtyPerUnit: qtyPerUnit,
                        totalQty: totalQtyForProduct
                    });
                });
            }
        });

        // Convert map to array and sort by total quantity (descending)
        return Object.values(ingredientsMap).sort((a, b) => b.totalCost - a.totalCost);
    }, [productos]);

    if (!productos) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">No hay datos disponibles</h2>
                    <p className="text-gray-500 mb-6">Por favor, regresa al Modelo de Proyecto y selecciona un mes valido.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const totalEstimatedCost = aggregatedIngredients.reduce((acc, curr) => acc + curr.totalCost, 0);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Gastos Calculados de Materiales</h1>
                                <p className="text-gray-500 text-sm">
                                    Explosión de insumos basada en ventas de <span className="font-semibold text-blue-600">{monthName} {year}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 bg-blue-50 px-6 py-3 rounded-lg border border-blue-100">
                            <div className="text-center">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Total Ingredientes</p>
                                <p className="text-2xl font-bold text-blue-800">{aggregatedIngredients.length}</p>
                            </div>
                            <div className="w-px h-8 bg-blue-200"></div>
                            <div className="text-center">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Costo Estimado Global</p>
                                <p className="text-2xl font-bold text-blue-800">
                                    {totalEstimatedCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 gap-6">
                    {aggregatedIngredients.map((ingrediente, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg border border-gray-200 text-orange-500">
                                        <ChefHat size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 capitalize">{ingrediente.name.toLowerCase()}</h3>
                                        <div className="text-xs text-gray-500 flex gap-2">
                                            <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-medium">
                                                {ingrediente.unit || 'Unidad'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cantidad Total Requerida</p>
                                        <p className="text-xl font-bold text-gray-700">
                                            {ingrediente.totalQuantity.toLocaleString('es-CO', { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-gray-400">{ingrediente.unit}</span>
                                        </p>
                                    </div>
                                    {ingrediente.totalCost > 0 && (
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Costo Estimado</p>
                                            <p className="text-xl font-bold text-orange-600">
                                                {ingrediente.totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Desglose por Preparación</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 border-b border-gray-100">
                                                <th className="pb-2 font-medium pl-2">Producto / Preparación</th>
                                                <th className="pb-2 font-medium text-center">Ventas</th>
                                                <th className="pb-2 font-medium text-right">Cant. x Unidad</th>
                                                <th className="pb-2 font-medium text-right pr-2">Subtotal Consumo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {ingrediente.usedIn.map((usage, idx) => (
                                                <tr key={idx} className="group hover:bg-blue-50/30 transition-colors">
                                                    <td className="py-2 pl-2 font-medium text-gray-700">{usage.productName}</td>
                                                    <td className="py-2 text-center text-gray-500">{usage.productQuantity}</td>
                                                    <td className="py-2 text-right text-gray-500">
                                                        {usage.qtyPerUnit.toLocaleString('es-CO', { maximumFractionDigits: 3 })} {ingrediente.unit}
                                                    </td>
                                                    <td className="py-2 text-right pr-2 font-bold text-gray-700 group-hover:text-blue-700">
                                                        {usage.totalQty.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {ingrediente.unit}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GastosCalculadosMateriales;
