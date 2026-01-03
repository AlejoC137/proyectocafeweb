import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// --- CAMBIO: Importar la nueva acción ---
import { deleteItem, getAllFromTable, sincronizarRecetasYProductos, updateItem } from "../../../redux/actions";
import { RECETAS_MENU, RECETAS_PRODUCCION, MENU, PRODUCCION, ITEMS } from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";
import RecipeImportModal from "./RecipeImportModal";
import { recetaMariaPaula } from "../../../redux/calcularReceta";

// --- Componente para el Modal de Confirmación de Borrado ---
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-gray-900">Confirmar Eliminación</h3>
                <p className="mt-2 text-sm text-gray-600">
                    ¿Estás seguro de que deseas eliminar la receta "<strong>{itemName}</strong>"? Esta acción no se puede deshacer.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button onClick={onClose} variant="ghost">Cancelar</Button>
                    <Button onClick={onConfirm} variant="destructive">Eliminar</Button>
                </div>
            </div>
        </div>
    );
};

// --- Componente para el ícono de ordenamiento ---
const SortIcon = ({ direction }) => {
    if (!direction) return <span className="text-gray-400">↕</span>;
    return direction === 'ascending' ? <span>▲</span> : <span>▼</span>;
};

// --- Componente principal de la tabla de estadísticas ---
function RecetasStats() {
    const dispatch = useDispatch();
    const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
    const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion);
    const allMenu = useSelector((state) => state.allMenu);
    const allProduccion = useSelector((state) => state.allProduccion);
    const allItems = useSelector((state) => state.allItems);

    const [sortConfig, setSortConfig] = useState({ key: 'legacyName', direction: 'ascending' });
    const [deletingReceta, setDeletingReceta] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [areCostColumnsVisible, setAreCostColumnsVisible] = useState(false);
    const [areYieldColumnsVisible, setAreYieldColumnsVisible] = useState(false);
    const [showImportSection, setShowImportSection] = useState(false);
    const [areRecetasVisible, setAreRecetasVisible] = useState(false); // Default collapsed

    // Global Update State
    const [isGlobalUpdating, setIsGlobalUpdating] = useState(false);
    const [globalUpdateProgress, setGlobalUpdateProgress] = useState("");

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSubGroup, setSelectedSubGroup] = useState('');

    useEffect(() => {
        dispatch(getAllFromTable(RECETAS_MENU));
        dispatch(getAllFromTable(RECETAS_PRODUCCION));
        dispatch(getAllFromTable(MENU));
        dispatch(getAllFromTable(PRODUCCION));
        dispatch(getAllFromTable(ITEMS));
    }, [dispatch]);

    // Auto-expand if searching
    useEffect(() => {
        if (searchTerm.length > 0) {
            setAreRecetasVisible(true);
        }
    }, [searchTerm]);

    const handleDeleteClick = (receta) => {
        setDeletingReceta(receta);
    };

    const confirmDelete = () => {
        if (deletingReceta) {
            dispatch(deleteItem(deletingReceta._id, deletingReceta.type === 'menu' ? RECETAS_MENU : RECETAS_PRODUCCION));
            setDeletingReceta(null);
            // Refresh logic is already handled by dispatch(deleteItem) usually, but we might want to refresh the lists specifically if needed.
            // For now, let's assume redux state updates automatically or we trigger a fetch.
            setTimeout(() => {
                dispatch(getAllFromTable(RECETAS_MENU));
                dispatch(getAllFromTable(RECETAS_PRODUCCION));
            }, 500);
        }
    };

    const handleSync = async () => {
        if (!window.confirm("Esta acción sincronizará las recetas con los productos basándose en los enlaces existentes (forId). ¿Desea continuar?")) {
            return;
        }
        dispatch(sincronizarRecetasYProductos());
        // Reload all tables to reflect changes
        setTimeout(() => {
            dispatch(getAllFromTable(RECETAS_MENU));
            dispatch(getAllFromTable(RECETAS_PRODUCCION));
            dispatch(getAllFromTable(MENU));
            dispatch(getAllFromTable(PRODUCCION));
        }, 1000);
    };

    const updateAllCosts = async () => {
        if (!window.confirm("⚠️ ATENCIÓN: Esto recalculará el costo de TODAS las recetas basándose en los precios actuales de los ingredientes. Esta acción puede tardar unos segundos y sobreescribirá los valores de costo actuales. ¿Deseas continuar?")) {
            return;
        }

        setIsGlobalUpdating(true);
        setGlobalUpdateProgress("Iniciando...");

        const allOptions = [...allItems, ...allProduccion];
        const buscarPorId = (itemId) => allOptions.find((i) => i._id === itemId) || null;

        const processRecipeList = async (list, sourceTable, type) => {
            let processed = 0;
            for (const receta of list) {
                setGlobalUpdateProgress(`Procesando ${type}: ${processed + 1} / ${list.length}`);

                try {
                    // 1. Parse Items
                    const items = [];
                    // Helper to extract items (similar to RecetaModal)
                    const extract = (prefix, max) => {
                        for (let i = 1; i <= max; i++) {
                            const itemId = receta[`${prefix}${i}_Id`];
                            const cuantityUnitsRaw = receta[`${prefix}${i}_Cuantity_Units`];
                            if (itemId && cuantityUnitsRaw) {
                                const itemData = buscarPorId(itemId);
                                if (itemData) {
                                    try {
                                        const qUnits = JSON.parse(cuantityUnitsRaw);
                                        items.push({
                                            item_Id: itemId,
                                            cuantity: Number(qUnits.metric.cuantity) || 0,
                                            precioUnitario: Number(itemData.precioUnitario) || 0,
                                            field: `${prefix}${i}`
                                        });
                                    } catch (e) { }
                                }
                            }
                        }
                    }
                    extract('item', 30);
                    extract('producto_interno', 20);

                    // 2. Get Extra Info (Group, Time)
                    const parent = allMenu.find(m => m._id === receta.forId) || allProduccion.find(p => p._id === receta.forId);
                    const group = parent?.GRUPO || null;
                    const time = Number(receta.ProcessTime) || 0;

                    // 3. Calculate
                    let newCalculo = {};
                    let costToSave = null;

                    if (type === 'produccion') {
                        const resultado = recetaMariaPaula(items, null, null, time, null, null, 1, 0.08, 0.08, 0.05, true);
                        if (resultado) costToSave = resultado.COSTO; // Just the number
                    } else {
                        const resultado = recetaMariaPaula(items, group, null, time);
                        if (resultado) newCalculo = resultado.detalles; // The details object
                    }

                    // 4. Update if different (or always update to be safe)
                    const payload = {
                        actualizacion: new Date().toISOString()
                    };

                    if (type === 'produccion' && costToSave !== null) {
                        payload.costo = costToSave;
                        // Also update parent product cost if linked
                        if (receta.forId) { await dispatch(updateItem(receta.forId, { "COSTO": costToSave }, "ProduccionInterna")); }
                    } else if (newCalculo) {
                        payload.costo = JSON.stringify(newCalculo);
                    }

                    await dispatch(updateItem(receta._id, payload, sourceTable));

                } catch (e) {
                    console.error("Error updating recipe: ", receta.legacyName, e);
                }
                processed++;
            }
        };

        await processRecipeList(allRecetasMenu, RECETAS_MENU, 'menu');
        await processRecipeList(allRecetasProduccion, RECETAS_PRODUCCION, 'produccion');

        setIsGlobalUpdating(false);
        setGlobalUpdateProgress("");
        alert("Actualización global completada. Las recetas ahora reflejan los costos actuales de los ingredientes.");

        // Reload
        setTimeout(() => {
            dispatch(getAllFromTable(RECETAS_MENU));
            dispatch(getAllFromTable(RECETAS_PRODUCCION));
            dispatch(getAllFromTable(MENU));
            dispatch(getAllFromTable(PRODUCCION));
        }, 1000);
    };


    const processedRecetas = useMemo(() => {
        // ... (existing logic)
        const menuRecetasWithType = allRecetasMenu.map(r => ({ ...r, type: 'menu' }));
        const produccionRecetasWithType = allRecetasProduccion.map(r => ({ ...r, type: 'produccion' }));

        const combinedRecetas = [...menuRecetasWithType, ...produccionRecetasWithType];
        const allProducts = [...allMenu, ...allProduccion];

        return combinedRecetas.map(receta => {
            let rendimientoData = {};
            try { if (receta.rendimiento) rendimientoData = JSON.parse(receta.rendimiento); } catch { }
            let costoData = {};
            try { if (typeof receta.costo === 'string' && receta.costo.startsWith('{')) costoData = JSON.parse(receta.costo); } catch { }

            const associatedProduct = allProducts.find(p => p._id === receta.forId);
            let productInfo = 'N/A';
            let group = 'Sin Grupo';
            let subGroup = 'Sin Subgrupo';

            if (associatedProduct) {
                const name = associatedProduct.NombreES || associatedProduct.Nombre_del_producto || 'Nombre no disponible';
                const value = associatedProduct.COSTO ? associatedProduct.COSTO : associatedProduct.Precio;
                const formattedValue = value && value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
                productInfo = `${name} (${formattedValue})`;
                group = associatedProduct.GRUPO || 'Sin Grupo';
                subGroup = associatedProduct.SUBGRUPO || 'Sin Subgrupo';
            }

            return {
                _id: receta._id,
                legacyName: receta.legacyName,
                productInfo: productInfo,
                group: group,
                subGroup: subGroup,
                porcion: rendimientoData.porcion,
                cantidad: Number(rendimientoData.cantidad) || null,
                unidades: rendimientoData.unidades,
                emplatado: receta.emplatado,
                recipeCost: costoData.vCMP || 0, // Ensure this is mapped
                vIB: costoData.COSTO ? costoData.COSTO : costoData.vIB,
                pIB: costoData.pIB,
                vCMP: costoData.vCMP,
                vCMO: costoData.vCMO,
                pCMPInicial: costoData.pCMPInicial,
                pCMPReal: costoData.pCMPReal,
                PPVii: costoData.PPVii,
                costoTiempo: costoData.costoTiempo,
                type: receta.type,
            };
        });
    }, [allRecetasMenu, allRecetasProduccion, allMenu, allProduccion]);

    const availableGroups = useMemo(() => [...new Set(processedRecetas.map(r => r.group))].sort(), [processedRecetas]);
    const availableSubGroups = useMemo(() => {
        let recipes = processedRecetas;
        if (selectedGroup) {
            recipes = recipes.filter(r => r.group === selectedGroup);
        }
        return [...new Set(recipes.map(r => r.subGroup))].sort();
    }, [processedRecetas, selectedGroup]);

    const filteredAndSortedRecetas = useMemo(() => {
        let items = [...processedRecetas];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            items = items.filter(r =>
                (r.legacyName && r.legacyName.toLowerCase().includes(lowerTerm)) ||
                (r.productInfo && r.productInfo.toLowerCase().includes(lowerTerm))
            );
        }

        if (selectedGroup) {
            items = items.filter(r => r.group === selectedGroup);
        }
        if (selectedSubGroup) {
            items = items.filter(r => r.subGroup === selectedSubGroup);
        }

        if (sortConfig.key) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [processedRecetas, searchTerm, sortConfig, selectedGroup, selectedSubGroup]);

    const menuItems = useMemo(() => filteredAndSortedRecetas.filter(r => r.type === 'menu'), [filteredAndSortedRecetas]);
    const produccionItems = useMemo(() => filteredAndSortedRecetas.filter(r => r.type === 'produccion'), [filteredAndSortedRecetas]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const formatNumber = (num) => {
        if (num === undefined || num === null) return 'N/A';
        return num.toLocaleString('es-CO', { maximumFractionDigits: 2 });
    };

    const visibleColumns = useMemo(() => {
        let cols = [
            { key: 'legacyName', label: 'Nombre Receta', subtitle: 'Nombre legado de la receta', width: 'w-1/4' },
            { key: 'productInfo', label: 'Producto Asociado', subtitle: 'Producto del inventario/menú enlazado', width: 'w-1/4' },
            { key: 'recipeCost', label: 'Valor Receta', sufix: '$', subtitle: 'Costo calculado de la receta (Materia Prima)', width: 'w-32' }, // New Column
            { key: 'porcion', label: 'Porción', sufix: '', subtitle: 'Tamaño de la porción', width: 'w-24' },
            { key: 'cantidad', label: 'Cant.', sufix: '', subtitle: 'Cantidad producida', width: 'w-20' },
            { key: 'unidades', label: 'Und.', sufix: '', subtitle: 'Unidad de medida', width: 'w-20' },
        ];

        if (areCostColumnsVisible) {
            cols = [
                ...cols,
                // vIB, pIB etc...
                { key: 'vIB', label: 'Costo Ing.', sufix: '$', subtitle: 'Valor Insumos Base' },
                { key: 'pIB', label: '% Costo', sufix: '%', subtitle: 'Porcentaje Costo Insumos' },
                // vCMP is the same as recipeCost essentially, so maybe don't duplicate if showing costs?
                // But for now I'll append the rest.
                { key: 'pCMPInicial', label: '% MMP Ini', sufix: '%', subtitle: 'Porcentaje MMP Inicial' },
                { key: 'pCMPReal', label: '% MMP Real', sufix: '%', subtitle: 'Porcentaje MMP Real' },
                { key: 'PPVii', label: 'Precio Sug.', sufix: '$', subtitle: 'Precio de Venta Sugerido' },
                { key: 'costoTiempo', label: 'Costo Tiempo', sufix: '$', subtitle: 'Costo del tiempo de producción' },
            ];
        }

        return cols;
    }, [areCostColumnsVisible, areYieldColumnsVisible]);

    return (
        <>
            <div className="p-4 md:p-8 bg-gray-100 min-h-screen w-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Análisis de Recetas</h1>
                    {isGlobalUpdating && <span className="text-blue-600 font-bold animate-pulse">{globalUpdateProgress}</span>}
                </div>


                <div className="flex flex-wrap gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre de receta o producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-md shadow-sm w-full md:w-1/3"
                    />
                    <select
                        className="p-2 border rounded-md shadow-sm text-sm"
                        value={selectedGroup}
                        onChange={(e) => { setSelectedGroup(e.target.value); setSelectedSubGroup(''); }}
                    >
                        <option value="">Todos los Grupos</option>
                        {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select
                        className="p-2 border rounded-md shadow-sm text-sm"
                        value={selectedSubGroup}
                        onChange={(e) => setSelectedSubGroup(e.target.value)}
                        disabled={!selectedGroup}
                    >
                        <option value="">Todos los Subgrupos</option>
                        {availableSubGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                    </select>
                    <Button onClick={() => setAreRecetasVisible(!areRecetasVisible)} variant="secondary">
                        {areRecetasVisible ? 'Ocultar Lista' : 'Mostrar Todas Las Recetas'}
                    </Button>
                    <Button onClick={() => setAreCostColumnsVisible(!areCostColumnsVisible)} variant="outline">
                        {areCostColumnsVisible ? 'Ocultar Costos' : 'Mostrar Costos'}
                    </Button>
                    <Button onClick={() => setAreYieldColumnsVisible(!areYieldColumnsVisible)} variant="outline">
                        {areYieldColumnsVisible ? 'Ocultar Rendimiento' : 'Mostrar Rendimiento'}
                    </Button>

                    <Button onClick={updateAllCosts} disabled={isGlobalUpdating} className="bg-orange-500 hover:bg-orange-600 text-white">
                        {isGlobalUpdating ? "Actualizando..." : "Actualizar Costos Recetas"}
                    </Button>

                    <Button onClick={handleSync} variant="outline">
                        Sincronizar Relaciones
                    </Button>
                    <Button onClick={() => setShowImportSection(!showImportSection)} className={showImportSection ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700 text-white"}>
                        {showImportSection ? "Ocultar Importador" : "Importar JSON"}
                    </Button>
                </div>

                {showImportSection && (
                    <RecipeImportModal
                        onClose={() => setShowImportSection(false)}
                        onSuccess={() => {
                            dispatch(getAllFromTable(RECETAS_MENU));
                            dispatch(getAllFromTable(RECETAS_PRODUCCION));
                        }}
                    />
                )}

                {areRecetasVisible ? (
                    <div className="overflow-auto bg-white rounded-lg shadow-md max-h-[75vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr className="sticky top-0 z-10 bg-inherit">
                                    {visibleColumns.map((col) => (
                                        <th
                                            key={col.key}
                                            scope="col"
                                            title={col.subtitle}
                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-200 ${col.width || ''}`}
                                            onClick={() => requestSort(col.key)}
                                        >
                                            <div className="flex items-center">
                                                {col.label}
                                                <span className="ml-2">{sortConfig.key === col.key ? <SortIcon direction={sortConfig.direction} /> : <SortIcon direction={null} />}</span>
                                            </div>
                                        </th>
                                    ))}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAndSortedRecetas.length > 0 ? (
                                    <>
                                        {menuItems.length > 0 && (
                                            <tr className="bg-gray-100">
                                                <th colSpan={visibleColumns.length + 1} className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                                                    Recetas de Menú ({menuItems.length})
                                                </th>
                                            </tr>
                                        )}
                                        {menuItems.map((receta) => (
                                            <tr key={receta._id} className="hover:bg-gray-50 transition-colors duration-200">
                                                {visibleColumns.map(col => {
                                                    const value = receta[col.key];
                                                    let cellContent;
                                                    if (typeof value === 'number') {
                                                        const formattedValue = formatNumber(value);
                                                        if (formattedValue !== 'N/A' && col.sufix) {
                                                            cellContent = col.sufix === '$' ? `$ ${formattedValue}` : `${formattedValue} ${col.sufix}`;
                                                        } else {
                                                            cellContent = formattedValue;
                                                        }
                                                    } else {
                                                        cellContent = value || 'N/A';
                                                    }
                                                    return (<td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cellContent}</td>);
                                                })}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-4">
                                                    <Button
                                                        asChild
                                                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    >
                                                        <a href={`/receta/${receta._id}`} target="_blank" rel="noopener noreferrer" className=" w-8 font-medium text-blue-600 hover:text-blue-800">
                                                            📕
                                                        </a>


                                                    </Button>
                                                    <button onClick={() => handleDeleteClick(receta)} className="font-medium text-red-600 hover:text-red-800">
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {produccionItems.length > 0 && (
                                            <tr className="bg-gray-200">
                                                <th colSpan={visibleColumns.length + 1} className="px-6 py-2 text-left text-sm font-semibold text-gray-800">
                                                    Recetas de Producción ({produccionItems.length})
                                                </th>
                                            </tr>
                                        )}
                                        {produccionItems.map((receta) => (
                                            <tr key={receta._id} className="hover:bg-gray-50 transition-colors duration-200">
                                                {visibleColumns.map(col => {
                                                    const value = receta[col.key];
                                                    let cellContent;
                                                    if (typeof value === 'number') {
                                                        const formattedValue = formatNumber(value);
                                                        if (formattedValue !== 'N/A' && col.sufix) {
                                                            cellContent = col.sufix === '$' ? `$ ${formattedValue}` : `${formattedValue} ${col.sufix}`;
                                                        } else {
                                                            cellContent = formattedValue;
                                                        }
                                                    } else {
                                                        cellContent = value || 'N/A';
                                                    }
                                                    return (<td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cellContent}</td>);
                                                })}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-4">
                                                    <a href={`/receta/${receta._id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-800">
                                                        Ver Receta
                                                    </a>
                                                    <button onClick={() => handleDeleteClick(receta)} className="font-medium text-red-600 hover:text-red-800">
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : (
                                    <tr><td colSpan={visibleColumns.length + 1} className="px-6 py-10 text-center text-gray-500">No se encontraron recetas con ese nombre.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-400">
                        <p className="text-lg font-medium">Las recetas están ocultas.</p>
                        <p className="text-sm">Usa el buscador o el botón "Mostrar Todas" para verlas.</p>
                    </div>
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={!!deletingReceta}
                onClose={() => setDeletingReceta(null)}
                onConfirm={confirmDelete}
                itemName={deletingReceta?.legacyName}
            />
        </>
    );
}

export default RecetasStats;