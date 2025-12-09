import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// --- CAMBIO: Importar la nueva acción ---
import { deleteItem, getAllFromTable, sincronizarRecetasYProductos } from "../../../redux/actions";
import { RECETAS_MENU, RECETAS_PRODUCCION, MENU, PRODUCCION, ITEMS } from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";
import RecipeImportModal from "./RecipeImportModal";

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

    const [sortConfig, setSortConfig] = useState({ key: 'legacyName', direction: 'ascending' });
    const [deletingReceta, setDeletingReceta] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [areCostColumnsVisible, setAreCostColumnsVisible] = useState(false);
    const [areYieldColumnsVisible, setAreYieldColumnsVisible] = useState(false);
    const [showImportSection, setShowImportSection] = useState(false);
    const [areRecetasVisible, setAreRecetasVisible] = useState(false); // Default collapsed

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
            if (associatedProduct) {
                const name = associatedProduct.NombreES || associatedProduct.Nombre_del_producto || 'Nombre no disponible';
                const value = associatedProduct.COSTO ? associatedProduct.COSTO : associatedProduct.Precio;
                const formattedValue = value && value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
                productInfo = `${name} (${formattedValue})`;
            }

            return {
                _id: receta._id,
                legacyName: receta.legacyName,
                productInfo: productInfo,
                porcion: rendimientoData.porcion,
                cantidad: Number(rendimientoData.cantidad) || null,
                unidades: rendimientoData.unidades,
                emplatado: receta.emplatado,
                vIB: costoData.COSTO ? costoData.COSTO : costoData.vIB,
                pIB: costoData.pIB,
                vCMP: costoData.vCMP,
                pCMPInicial: costoData.pCMPInicial,
                pCMPReal: costoData.pCMPReal,
                PPVii: costoData.PPVii,
                costoTiempo: costoData.costoTiempo,
                type: receta.type,
            };
        });
    }, [allRecetasMenu, allRecetasProduccion, allMenu, allProduccion]);

    const filteredAndSortedRecetas = useMemo(() => {
        let items = [...processedRecetas];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            items = items.filter(r =>
                (r.legacyName && r.legacyName.toLowerCase().includes(lowerTerm)) ||
                (r.productInfo && r.productInfo.toLowerCase().includes(lowerTerm))
            );
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
    }, [processedRecetas, searchTerm, sortConfig]);

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
            { key: 'legacyName', label: 'Nombre Receta', subtitle: 'Nombre legado de la receta' },
            { key: 'productInfo', label: 'Producto Asociado', subtitle: 'Producto del inventario/menú enlazado' },
            { key: 'porcion', label: 'Porción', sufix: '', subtitle: 'Tamaño de la porción' },
            { key: 'cantidad', label: 'Cant.', sufix: '', subtitle: 'Cantidad producida' },
            { key: 'unidades', label: 'Und.', sufix: '', subtitle: 'Unidad de medida' },
            { key: 'emplatado', label: 'Emplatado', sufix: '', subtitle: 'Instrucciones de emplatado' },
        ];

        if (areCostColumnsVisible) {
            cols = [
                ...cols,
                { key: 'vIB', label: 'Costo Ing.', sufix: '$', subtitle: 'Valor Insumos Base' },
                { key: 'pIB', label: '% Costo', sufix: '%', subtitle: 'Porcentaje Costo Insumos' },
                { key: 'vCMP', label: 'Costo MMP', sufix: '$', subtitle: 'Valor Costo Materia Prima' },
                { key: 'pCMPInicial', label: '% MMP Ini', sufix: '%', subtitle: 'Porcentaje MMP Inicial' },
                { key: 'pCMPReal', label: '% MMP Real', sufix: '%', subtitle: 'Porcentaje MMP Real' },
                { key: 'PPVii', label: 'Precio Sug.', sufix: '$', subtitle: 'Precio de Venta Sugerido' },
                { key: 'costoTiempo', label: 'Costo Tiempo', sufix: '$', subtitle: 'Costo del tiempo de producción' },
            ];
        }

        if (areYieldColumnsVisible) {
            // Add yield specific columns if available or desired
            // For now, keeping logical separation if user wants to expand
        }

        return cols;
    }, [areCostColumnsVisible, areYieldColumnsVisible]);

    return (
        <>
            <div className="p-4 md:p-8 bg-gray-100 min-h-screen w-full flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Análisis de Recetas</h1>

                <div className="flex flex-wrap gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre de receta o producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-md shadow-sm w-full md:w-1/3"
                    />
                    <Button onClick={() => setAreRecetasVisible(!areRecetasVisible)} variant="secondary">
                        {areRecetasVisible ? 'Ocultar Lista' : 'Mostrar Todas Las Recetas'}
                    </Button>
                    <Button onClick={() => setAreCostColumnsVisible(!areCostColumnsVisible)} variant="outline">
                        {areCostColumnsVisible ? 'Ocultar Costos' : 'Mostrar Costos'}
                    </Button>
                    <Button onClick={() => setAreYieldColumnsVisible(!areYieldColumnsVisible)} variant="outline">
                        {areYieldColumnsVisible ? 'Ocultar Rendimiento' : 'Mostrar Rendimiento'}
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
                                        <th key={col.key} scope="col" title={col.subtitle} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-200" onClick={() => requestSort(col.key)}>
                                            <div className="flex items-center">
                                                {col.label}
                                                <span className="ml-2">{sortConfig.key === col.key ? <SortIcon direction={sortConfig.direction} /> : <SortIcon direction={null} />}</span>
                                            </div>
                                        </th>
                                    ))}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
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