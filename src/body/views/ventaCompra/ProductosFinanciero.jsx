import React, { useMemo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, List, Pencil, Check, X, Filter } from 'lucide-react';
import { formatCurrency } from './ModelComponents';
import { getAllFromTable, updateItem } from '../../../redux/actions';
import { MENU, RECETAS_MENU, RECETAS_PRODUCCION } from '../../../redux/actions-types';

const ProductosFinanciero = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const allMenu = useSelector((state) => state.allMenu || []);
    const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []);

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [newPrice, setNewPrice] = useState("");

    // Filtering State
    const [filterGroup, setFilterGroup] = useState("");
    const [filterSubGroup, setFilterSubGroup] = useState("");
    const [excludeLunch, setExcludeLunch] = useState(true);

    // Determine if we need to fetch data
    useEffect(() => {
        if (!allMenu || allMenu.length === 0) dispatch(getAllFromTable(MENU));
        if (!allRecetasMenu || allRecetasMenu.length === 0) dispatch(getAllFromTable(RECETAS_MENU));
        if (!allRecetasProduccion || allRecetasProduccion.length === 0) dispatch(getAllFromTable(RECETAS_PRODUCCION));
    }, [dispatch, allMenu.length, allRecetasMenu.length, allRecetasProduccion.length]);

    // Calculate Costs and Margins on the fly
    const calculatedItems = useMemo(() => {
        if (!allMenu || allMenu.length === 0) return [];

        return allMenu
            .filter(item => item.Estado === 'Activo')
            .map(menuItem => {
                let consolidatedCost = 0;
                let recetaData = null;

                if (menuItem.Receta) {
                    // Try to find in RecetasMenu first, then RecetasProduccion
                    recetaData = allRecetasMenu.find(r => r._id === menuItem.Receta) ||
                        allRecetasProduccion.find(r => r._id === menuItem.Receta);

                    if (recetaData && recetaData.costo) {
                        try {
                            const costData = typeof recetaData.costo === 'string' ? JSON.parse(recetaData.costo) : recetaData.costo;

                            // Handle different cost formats
                            if (typeof costData === 'number') {
                                consolidatedCost = costData;
                            } else if (costData && (costData.vCMP || costData.vCMO)) {
                                // Prioritize vCMP (Costo Materia Prima)
                                consolidatedCost = (costData.vCMP || 0) + (costData.vCMO || 0);
                            }
                        } catch (e) {
                            console.warn(`Error parsing cost for ${menuItem.NombreES}`, e);
                        }
                    }
                }

                const precioVenta = parseFloat(menuItem.Precio || 0);
                const utilidad = precioVenta - consolidatedCost;

                return {
                    id: menuItem._id,
                    nombre: menuItem.NombreES,
                    grupo: menuItem.GRUPO,
                    subGrupo: menuItem.SUB_GRUPO,
                    costo: consolidatedCost,
                    precioVenta: precioVenta,
                    utilidad: utilidad,
                    recetaId: menuItem.Receta,
                    margin: precioVenta > 0 ? ((utilidad / precioVenta) * 100) : 0
                };
            });
    }, [allMenu, allRecetasMenu, allRecetasProduccion]);

    // Filter Items
    const filteredItems = useMemo(() => {
        return calculatedItems.filter(item => {
            // 1. Exclude Lunch logic (matches 'TARDEO_ALMUERZO')
            if (excludeLunch && (item.subGrupo === 'TARDEO_ALMUERZO' || item.grupo === 'ALMUERZO')) {
                return false;
            }

            // 2. Group Filter
            if (filterGroup && item.grupo !== filterGroup) return false;

            // 3. SubGroup Filter
            if (filterSubGroup && item.subGrupo !== filterSubGroup) return false;

            return true;
        });
    }, [calculatedItems, excludeLunch, filterGroup, filterSubGroup]);

    // Sort by Margin Ascending
    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => a.margin - b.margin);
    }, [filteredItems]);

    // Extract unique Groups and SubGroups for dropdowns
    const uniqueGroups = useMemo(() => [...new Set(calculatedItems.map(i => i.grupo).filter(Boolean))].sort(), [calculatedItems]);
    const uniqueSubGroups = useMemo(() => {
        let itemsToConsider = calculatedItems;
        if (filterGroup) {
            itemsToConsider = calculatedItems.filter(i => i.grupo === filterGroup);
        }
        return [...new Set(itemsToConsider.map(i => i.subGrupo).filter(Boolean))].sort();
    }, [calculatedItems, filterGroup]);


    // --- Handlers ---
    const handleStartEdit = (item) => {
        setEditingId(item.id);
        setNewPrice(item.precioVenta.toString());
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewPrice("");
    };

    const handleSavePrice = async (itemId) => {
        const priceValue = parseFloat(newPrice);
        if (isNaN(priceValue)) {
            alert("Por favor ingresa un número válido");
            return;
        }

        try {
            await dispatch(updateItem(itemId, { Precio: priceValue }, MENU));
            // Trigger refresh
            dispatch(getAllFromTable(MENU));

            setEditingId(null);
            setNewPrice("");
        } catch (error) {
            console.error("Error updating price", error);
            alert("Error al actualizar precio");
        }
    };

    const loading = !allMenu.length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-xl font-bold text-gray-800">Cargando Menú y Recetas...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-0 z-10 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <List className="text-blue-600" />
                                    Auditoría Financiera de Menú
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    Vista en tiempo real de productos activos, costos y márgenes.
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-600 font-bold uppercase">Items Visibles</p>
                            <p className="text-lg font-bold text-blue-800">{filteredItems.length} / {calculatedItems.length}</p>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Filter size={18} />
                            <span className="font-semibold text-sm">Filtros:</span>
                        </div>

                        <select
                            value={filterGroup}
                            onChange={(e) => { setFilterGroup(e.target.value); setFilterSubGroup(""); }}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        >
                            <option value="">Todos los Grupos</option>
                            {uniqueGroups.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>

                        <select
                            value={filterSubGroup}
                            onChange={(e) => setFilterSubGroup(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                            disabled={!uniqueSubGroups.length}
                        >
                            <option value="">Todos los Subgrupos</option>
                            {uniqueSubGroups.map(sg => (
                                <option key={sg} value={sg}>{sg}</option>
                            ))}
                        </select>

                        <label className="flex items-center gap-2 cursor-pointer ml-auto bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={excludeLunch}
                                onChange={(e) => setExcludeLunch(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Ocultar Almuerzo</span>
                        </label>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-600">Producto</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-600">Grupo</th>
                                    <th className="py-3 px-4 text-right font-semibold text-gray-600">Costo Unitario (Teórico)</th>
                                    <th className="py-3 px-4 text-right font-semibold text-gray-600">Valor Venta (Base)</th>
                                    <th className="py-3 px-4 text-right font-semibold text-gray-600">% Margen</th>
                                    <th className="py-3 px-4 text-center font-semibold text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedItems.map((producto) => {
                                    const isEditing = editingId === producto.id;

                                    return (
                                        <tr key={producto.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-blue-50' : ''}`}>
                                            <td className="py-3 px-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    {producto.recetaId && (
                                                        <button
                                                            onClick={() => window.open(`/receta/${producto.recetaId}`, '_blank')}
                                                            className="text-lg hover:scale-110 transition-transform"
                                                            title="Ver Receta"
                                                        >
                                                            📕
                                                        </button>
                                                    )}
                                                    {producto.nombre}
                                                </div>
                                                <div className="text-xs text-gray-400 font-normal md:hidden">{producto.grupo} - {producto.subGrupo}</div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 hidden md:table-cell">
                                                <span className="block text-xs uppercase font-bold">{producto.grupo}</span>
                                                <span className="block text-[10px] text-gray-400">{producto.subGrupo}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(producto.costo)}</td>

                                            {/* Editable Price Cell */}
                                            <td className="py-3 px-4 text-right text-green-600 font-medium">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={newPrice}
                                                        onChange={(e) => setNewPrice(e.target.value)}
                                                        className="w-24 px-2 py-1 text-right border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(producto.precioVenta)
                                                )}
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${producto.margin >= 30 ? 'bg-green-100 text-green-700' : (producto.margin > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}`}>
                                                    {producto.margin.toFixed(1)}%
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleSavePrice(producto.id)}
                                                            className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                                            title="Guardar"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                                            title="Cancelar"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStartEdit(producto)}
                                                        className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                                                        title="Editar Precio"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductosFinanciero;
