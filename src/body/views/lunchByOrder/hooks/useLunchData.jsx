import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { parseDateYearAndMonth, getProteinType } from '../utils/lunchUtils';

export const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const useLunchData = (editableMenu) => {
    const allMenu = useSelector(state => state.allMenu || []);
    const allRecetasMenu = useSelector(state => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector(state => state.allRecetasProduccion || []);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState("mensual");
    
    // Search boxes
    const [searchTermMonthly, setSearchTermMonthly] = useState("");
    const [searchTermAnnual, setSearchTermAnnual] = useState("");
    const [searchTermCatalog, setSearchTermCatalog] = useState("");

    // Catalog sorting
    const [sortColumnCatalog, setSortColumnCatalog] = useState("NombreES");
    const [sortDirectionCatalog, setSortDirectionCatalog] = useState("asc");

    // Catalog expansion state
    const [expandedCatalogGroups, setExpandedCatalogGroups] = useState({});

    const handleSortCatalog = (column) => {
        if (sortColumnCatalog === column) {
            setSortDirectionCatalog(sortDirectionCatalog === "asc" ? "desc" : "asc");
        } else {
            setSortColumnCatalog(column);
            setSortDirectionCatalog("asc");
        }
    };

    const getSortIcon = (column) => {
        if (sortColumnCatalog !== column) return <ChevronDown className="w-3 h-3 opacity-30" />;
        return sortDirectionCatalog === "asc" ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />;
    };

    const toggleExpandGroup = (id) => {
        setExpandedCatalogGroups(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const isGroupExpanded = (id) => {
        if (searchTermCatalog.trim() !== "") return true;
        return !!expandedCatalogGroups[id];
    };

    const handleExpandAllCatalog = (groupedCatalogItems) => {
        const allExpanded = {};
        groupedCatalogItems.forEach(group => {
            if (group.variations.length > 0) {
                allExpanded[group.baseItem._id] = true;
            }
        });
        setExpandedCatalogGroups(allExpanded);
    };

    const handleCollapseAllCatalog = () => {
        setExpandedCatalogGroups({});
    };

    // --- CÁLCULO DE VISTA MENSUAL ---
    const almuerzosDelMes = useMemo(() => {
        return allMenu.filter(item => {
            if (item.SUB_GRUPO !== 'TARDEO_ALMUERZO') return false;
            try {
                const compLunch = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                const dates = compLunch?.fechasSeleccionadas || [];
                const singleDate = compLunch?.fecha?.fecha;

                const allDates = [...dates];
                if (singleDate) allDates.push(singleDate);

                return allDates.some(dateStr => {
                    const parsed = parseDateYearAndMonth(dateStr);
                    return parsed && parsed.month === selectedMonth && parsed.year === selectedYear;
                });
            } catch (e) {
                return false;
            }
        });
    }, [allMenu, selectedMonth, selectedYear]);

    const lunchStats = useMemo(() => {
        const stats = [];
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

        let totalVentasQty = 0;
        let totalSalesVal = 0;
        let totalCostVal = 0;
        const popularityMap = {};

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const almuerzoHoy = almuerzosDelMes.find(item => {
                try {
                    const compLunch = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                    const dates = compLunch?.fechasSeleccionadas || [];
                    const singleDate = compLunch?.fecha?.fecha;
                    return dates.includes(dateString) || singleDate === dateString;
                } catch (e) {
                    return false;
                }
            });

            if (!almuerzoHoy) continue;

            let cantidadVendida = 0;
            let totalIngreso = 0;
            let desgloseVersiones = {};

            try {
                const compLunchObj = typeof almuerzoHoy.Comp_Lunch === 'string' ? JSON.parse(almuerzoHoy.Comp_Lunch) : almuerzoHoy.Comp_Lunch;
                if (compLunchObj && Array.isArray(compLunchObj.lista)) {
                    compLunchObj.lista.forEach(version => {
                        if (version && Array.isArray(version.list)) {
                            const qty = version.list.length;
                            cantidadVendida += qty;
                            if (qty > 0) {
                                const vName = version.name || 'General';
                                desgloseVersiones[vName] = (desgloseVersiones[vName] || 0) + qty;
                            }
                        }
                    });
                }
            } catch (e) {}

            const precioVenta = parseFloat(almuerzoHoy.Precio || 22000);
            totalIngreso = cantidadVendida * precioVenta;

            let recetaValor = 0;
            if (almuerzoHoy.Receta) {
                const recetaData = allRecetasMenu.find(r => r._id === almuerzoHoy.Receta) || allRecetasProduccion.find(r => r._id === almuerzoHoy.Receta);
                if (recetaData && recetaData.costo) {
                    try {
                        const costData = typeof recetaData.costo === 'string' ? JSON.parse(recetaData.costo) : recetaData.costo;
                        if (typeof costData === 'number') {
                            recetaValor = costData;
                        } else if (costData) {
                            recetaValor = (Number(costData.vCMP) || 0) + (Number(costData.vCMO) || 0);
                        }
                    } catch (e) {}
                }
            }

            const costoTotal = recetaValor * cantidadVendida;
            const utilidad = totalIngreso - costoTotal;

            totalVentasQty += cantidadVendida;
            totalSalesVal += totalIngreso;
            totalCostVal += costoTotal;

            if (cantidadVendida > 0) {
                popularityMap[almuerzoHoy.NombreES] = (popularityMap[almuerzoHoy.NombreES] || 0) + cantidadVendida;
            }

            stats.push({
                fecha: dateString,
                dia: day,
                nombre: almuerzoHoy.NombreES,
                cantidad: cantidadVendida,
                desgloseVersiones: desgloseVersiones,
                ingreso: totalIngreso,
                costoUnitario: recetaValor,
                costoTotal: costoTotal,
                utilidad: utilidad,
                originalItem: almuerzoHoy
            });
        }

        let topLunchName = "N/A";
        let topLunchQty = 0;
        Object.entries(popularityMap).forEach(([name, qty]) => {
            if (qty > topLunchQty) {
                topLunchQty = qty;
                topLunchName = name;
            }
        });

        return {
            stats: stats.sort((a, b) => a.dia - b.dia),
            totalCantidad: totalVentasQty,
            totalIngreso: totalSalesVal,
            totalCosto: totalCostVal,
            utilidadNeta: totalSalesVal - totalCostVal,
            margenGeneral: totalSalesVal > 0 ? ((totalSalesVal - totalCostVal) / totalSalesVal) * 100 : 0,
            topLunch: `${topLunchName} (${topLunchQty} vendidos)`
        };
    }, [almuerzosDelMes, allRecetasMenu, allRecetasProduccion, selectedMonth, selectedYear]);

    const groupedStats = useMemo(() => {
        const groups = {};
        lunchStats.stats.forEach(item => {
            if (!groups[item.nombre]) {
                groups[item.nombre] = {
                    nombre: item.nombre,
                    diasServido: 0,
                    cantidad: 0,
                    ingreso: 0,
                    costoTotal: 0,
                    utilidad: 0,
                    desgloseVersiones: {},
                    originalItem: item.originalItem
                };
            }
            groups[item.nombre].diasServido += 1;
            groups[item.nombre].cantidad += item.cantidad;
            groups[item.nombre].ingreso += item.ingreso;
            groups[item.nombre].costoTotal += item.costoTotal;
            groups[item.nombre].utilidad += item.utilidad;

            if (item.desgloseVersiones) {
                Object.entries(item.desgloseVersiones).forEach(([vName, vQty]) => {
                    groups[item.nombre].desgloseVersiones[vName] = (groups[item.nombre].desgloseVersiones[vName] || 0) + vQty;
                });
            }
        });
        return Object.values(groups).sort((a, b) => b.cantidad - a.cantidad);
    }, [lunchStats.stats]);

    // Filtrar tablas mensuales por el buscador
    const filteredLunchStats = useMemo(() => {
        const lower = searchTermMonthly.toLowerCase();
        return lunchStats.stats.filter(item => 
            (item.nombre || "").toLowerCase().includes(lower)
        );
    }, [lunchStats.stats, searchTermMonthly]);

    const filteredGroupedStats = useMemo(() => {
        const lower = searchTermMonthly.toLowerCase();
        return groupedStats.filter(item => 
            (item.nombre || "").toLowerCase().includes(lower)
        );
    }, [groupedStats, searchTermMonthly]);


    // --- CÁLCULO DE VISTA ANUAL ---
    const annualStats = useMemo(() => {
        const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
            month: monthsNames[i].substring(0, 3),
            monthIndex: i,
            cantidad: 0,
            ingreso: 0,
            costo: 0,
            utilidad: 0
        }));

        const proteinSummary = {
            POLLO: { nombre: 'Pollo', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#0ea5e9' },
            CERDO: { nombre: 'Cerdo', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#f59e0b' },
            RES: { nombre: 'Res / Carne', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#ef4444' },
            PESCADO: { nombre: 'Pescado', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#8b5cf6' },
            VEGETARIANO: { nombre: 'Vegetariano', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#84cc16' },
            OTROS: { nombre: 'Otros', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#10b981' }
        };

        const topMenus = {};

        const almuerzosDelAnio = allMenu.filter(item => {
            if (item.SUB_GRUPO !== 'TARDEO_ALMUERZO') return false;
            try {
                const compLunch = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                const dates = compLunch?.fechasSeleccionadas || [];
                const singleDate = compLunch?.fecha?.fecha;
                const allDates = [...dates];
                if (singleDate) allDates.push(singleDate);

                return allDates.some(dateStr => {
                    const parsed = parseDateYearAndMonth(dateStr);
                    return parsed && parsed.year === selectedYear;
                });
            } catch (e) {
                return false;
            }
        });

        almuerzosDelAnio.forEach(item => {
            let cantidadVendida = 0;
            const precioVenta = parseFloat(item.Precio || 22000);
            
            let recetaValor = 0;
            if (item.Receta) {
                const recetaData = allRecetasMenu.find(r => r._id === item.Receta) || allRecetasProduccion.find(r => r._id === item.Receta);
                if (recetaData && recetaData.costo) {
                    try {
                        const costData = typeof recetaData.costo === 'string' ? JSON.parse(recetaData.costo) : recetaData.costo;
                        if (typeof costData === 'number') {
                            recetaValor = costData;
                        } else if (costData) {
                            recetaValor = (Number(costData.vCMP) || 0) + (Number(costData.vCMO) || 0);
                        }
                    } catch (e) {}
                }
            }

            let desgloseVersionesLocal = {};
            try {
                const compLunchObj = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                if (compLunchObj && Array.isArray(compLunchObj.lista)) {
                    compLunchObj.lista.forEach(version => {
                        if (version && Array.isArray(version.list)) {
                            // Usamos la fecha de la versión o fallback a la fecha del menú
                            const dateStr = version.date || compLunchObj.fecha?.fecha || compLunchObj.fechasSeleccionadas?.[0];
                            if (dateStr) {
                                const parsedDate = parseDateYearAndMonth(dateStr);
                                if (parsedDate && parsedDate.year === selectedYear) {
                                    const qty = version.list.length;
                                    cantidadVendida += qty;

                                    if (qty > 0) {
                                        const vName = version.name || 'General';
                                        desgloseVersionesLocal[vName] = (desgloseVersionesLocal[vName] || 0) + qty;
                                    }

                                    const val = qty * precioVenta;
                                    const cost = recetaValor * qty;
                                    const util = val - cost;

                                    const mIdx = parsedDate.month;
                                    if (mIdx >= 0 && mIdx < 12) {
                                        monthlyTrend[mIdx].cantidad += qty;
                                        monthlyTrend[mIdx].ingreso += val;
                                        monthlyTrend[mIdx].costo += cost;
                                        monthlyTrend[mIdx].utilidad += util;
                                    }
                                }
                            }
                        }
                    });
                }
            } catch (e) {}

            const protein = getProteinType(item);
            const ingresoVenta = cantidadVendida * precioVenta;
            const costoTotal = recetaValor * cantidadVendida;
            const utilidad = ingresoVenta - costoTotal;

            proteinSummary[protein].cantidad += cantidadVendida;
            proteinSummary[protein].ingreso += ingresoVenta;
            proteinSummary[protein].costo += costoTotal;
            proteinSummary[protein].utilidad += utilidad;

            if (!topMenus[item.NombreES]) {
                topMenus[item.NombreES] = {
                    nombre: item.NombreES,
                    cantidad: 0,
                    desgloseVersiones: {},
                    originalItem: item
                };
            }
            topMenus[item.NombreES].cantidad += cantidadVendida;
            Object.entries(desgloseVersionesLocal).forEach(([vName, vQty]) => {
                topMenus[item.NombreES].desgloseVersiones[vName] = (topMenus[item.NombreES].desgloseVersiones[vName] || 0) + vQty;
            });
        });

        // Retornamos todos los menús ordenados por venta sin limitar a 8
        const sortedTopMenus = Object.values(topMenus)
            .sort((a, b) => b.cantidad - a.cantidad);

        return {
            monthlyTrend,
            proteinSummary: Object.values(proteinSummary),
            topMenus: sortedTopMenus
        };
    }, [allMenu, allRecetasMenu, allRecetasProduccion, selectedYear]);

    // Filtrar ranking anual por el buscador
    const filteredAnnualTopMenus = useMemo(() => {
        const lower = searchTermAnnual.toLowerCase();
        return annualStats.topMenus.filter(item => 
            (item.nombre || "").toLowerCase().includes(lower)
        );
    }, [annualStats.topMenus, searchTermAnnual]);

    // --- CÁLCULO DE VISTA CATÁLOGO COMPLETO ---
    const catalogItems = useMemo(() => {
        return editableMenu
            .filter(item => item.SUB_GRUPO === 'TARDEO_ALMUERZO')
            .sort((a, b) => (a.NombreES || "").localeCompare(b.NombreES || ""));
    }, [editableMenu]);

    const getParentId = (item) => {
        try {
            if (!item?.Comp_Lunch) return null;
            const comp = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
            return comp?.parentId || null;
        } catch (e) {
            return null;
        }
    };

    const groupedCatalogItems = useMemo(() => {
        const lower = searchTermCatalog.toLowerCase();
        
        // 1. Separar platos base de variaciones
        const baseItems = [];
        const variations = [];

        catalogItems.forEach(item => {
            const pId = getParentId(item);
            if (pId) {
                const parentExists = catalogItems.some(b => b._id === pId);
                if (parentExists) {
                    variations.push(item);
                } else {
                    baseItems.push(item); // Huérfanos se tratan como base
                }
            } else {
                baseItems.push(item);
            }
        });

        // 2. Agrupar variaciones por parentId
        const variationsByParent = {};
        variations.forEach(v => {
            const pId = getParentId(v);
            if (!variationsByParent[pId]) variationsByParent[pId] = [];
            variationsByParent[pId].push(v);
        });

        // 3. Crear estructura de grupos
        let groups = baseItems.map(base => {
            const vars = variationsByParent[base._id] || [];
            return {
                baseItem: base,
                variations: vars
            };
        });

        // 4. Filtrar por término de búsqueda (aplica a base o variaciones)
        if (lower) {
            groups = groups.filter(g => {
                const baseMatches = (g.baseItem.NombreES || "").toLowerCase().includes(lower);
                const anyVarMatches = g.variations.some(v => (v.NombreES || "").toLowerCase().includes(lower));
                return baseMatches || anyVarMatches;
            });
            // Si hay término de búsqueda, filtramos las variaciones del grupo que no coincidan
            groups = groups.map(g => {
                const baseMatches = (g.baseItem.NombreES || "").toLowerCase().includes(lower);
                if (baseMatches) return g;
                return {
                    ...g,
                    variations: g.variations.filter(v => (v.NombreES || "").toLowerCase().includes(lower))
                };
            });
        }

        // 5. Ordenar grupos por la columna de ordenamiento del plato base
        groups.sort((a, b) => {
            let aVal, bVal;
            if (sortColumnCatalog === "protein") {
                aVal = getProteinType(a.baseItem);
                bVal = getProteinType(b.baseItem);
            } else if (sortColumnCatalog === "Precio") {
                aVal = parseFloat(a.baseItem.Precio || 22000);
                bVal = parseFloat(b.baseItem.Precio || 22000);
            } else if (sortColumnCatalog === "Receta") {
                aVal = a.baseItem.Receta ? 1 : 0;
                bVal = b.baseItem.Receta ? 1 : 0;
            } else {
                aVal = (a.baseItem.NombreES || "").toLowerCase();
                bVal = (b.baseItem.NombreES || "").toLowerCase();
            }

            if (aVal < bVal) return sortDirectionCatalog === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirectionCatalog === "asc" ? 1 : -1;
            return 0;
        });

        return groups;
    }, [catalogItems, searchTermCatalog, sortColumnCatalog, sortDirectionCatalog]);

    return {
        allMenu,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        activeTab, setActiveTab,
        searchTermMonthly, setSearchTermMonthly,
        searchTermAnnual, setSearchTermAnnual,
        searchTermCatalog, setSearchTermCatalog,
        sortColumnCatalog, sortDirectionCatalog, handleSortCatalog, getSortIcon,
        expandedCatalogGroups, toggleExpandGroup, isGroupExpanded, handleExpandAllCatalog, handleCollapseAllCatalog,
        lunchStats, groupedStats, filteredLunchStats, filteredGroupedStats,
        annualStats, filteredAnnualTopMenus,
        catalogItems, groupedCatalogItems
    };
};
