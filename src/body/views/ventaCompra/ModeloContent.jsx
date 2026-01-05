import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateModelAction, createModelAction, getAllFromTable, trimRecepie } from '../../../redux/actions';
import { STAFF, MENU, ITEMS, PRODUCCION, RECETAS_MENU, RECETAS_PRODUCCION } from '../../../redux/actions-types';
import supabase from "../../../config/supabaseClient";
import MesResumenStats from './MesResumenStats';
import ProductosVendidosRentabilidad from './ProductosVendidosRentabilidad';
import { Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
    formatNumber,
    formatCurrency,
    parseFormattedNumber,
    formatDate,
    LoadingOverlay,
    RowContainer,
    PurchasesModal,
    ImpuestoRow,
    EmployeeRow,
    SimpleCostRow
} from './ModelComponents';

// --- UTILS ---
// (Utils now imported from ModelComponents)

// --- UI COMPONENTS ---
// (Components now imported from ModelComponents)
function ModeloContent({ targetMonth, targetYear }) {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const allVentas = useSelector(state => state.allVentas);
    const allCompras = useSelector(state => state.allCompras);
    const models = useSelector(state => state.models);
    const allStaff = useSelector(state => state.allStaff);
    const allMenu = useSelector(state => state.allMenu); // Added for new logic
    const allItems = useSelector(state => state.allItems); // Added for new logic
    const allRecetasMenu = useSelector(state => state.allRecetasMenu); // Added for new logic
    const allRecetasProduccion = useSelector(state => state.allRecetasProduccion);
    const allProduccion = useSelector(state => state.allProduccion);

    // --- LOGICA TRAIDA DE MesResumen.jsx ---
    const [ventas, setVentas] = useState([]);
    const [productosVendidosConReceta, setProductosVendidosConReceta] = useState([]);
    const [showFinancials, setShowFinancials] = useState(true);
    const [loadingVentas, setLoadingVentas] = useState(false);

    // 0. Cargar Tablas Maestras (Para calcular recetas y costos)
    useEffect(() => {
        const fetchMasters = async () => {
            // Fetch all necessary data for calculations
            // We use Promise.all to fetch concurrently
            await Promise.all([
                dispatch(getAllFromTable(MENU)),
                dispatch(getAllFromTable(ITEMS)),
                dispatch(getAllFromTable(PRODUCCION)),
                dispatch(getAllFromTable(RECETAS_MENU)),
                dispatch(getAllFromTable(RECETAS_PRODUCCION)),
                dispatch(getAllFromTable(STAFF))
            ]);
        };
        fetchMasters();
    }, [dispatch]);

    // 1. Cargar Ventas con Paginación (Igual que MesResumen)
    useEffect(() => {
        const fetchAllVentas = async () => {
            setLoadingVentas(true);
            try {
                let allVentas = [];
                let page = 0;
                const pageSize = 1000;

                while (true) {
                    const from = page * pageSize;
                    const to = from + pageSize - 1;
                    const { data, error } = await supabase
                        .from('Ventas')
                        .select('*')
                        .order('Date', { ascending: false })
                        .range(from, to);

                    if (error) throw error;
                    if (data) allVentas = [...allVentas, ...data];
                    if (!data || data.length < pageSize) break;
                    page++;
                }

                // Filtrar por Target Month/Year
                const ventasDelMes = allVentas.filter((venta) => {
                    const ventaDate = new Date(venta.Date);
                    return ventaDate.getMonth() === targetMonth && ventaDate.getFullYear() === targetYear;
                });

                ventasDelMes.sort((a, b) => new Date(a.Date) - new Date(b.Date));
                setVentas(ventasDelMes);
            } catch (error) {
                console.error("Error al cargar ventas en ModeloContent:", error);
            } finally {
                setLoadingVentas(false);
            }
        };

        if (allMenu.length > 0) { // Only fetch/process if masters are likely loading or loaded
            fetchAllVentas();
        }
    }, [targetMonth, targetYear, allMenu.length]); // Depend on allMenu to retry if empty initially

    // 2. Calcular Datos del Mes (Igual que MesResumen)
    const datosCalculadosDelMes = useMemo(() => {
        let total = 0;
        let tipTotal = 0;
        let tarjeta = 0;
        let efectivo = 0;
        let transferencia = 0;
        const productosMap = {};

        ventas.forEach((venta) => {
            if (venta.Pagado) {
                const ingresoVenta = parseFloat(venta.Total_Ingreso || 0);
                total += ingresoVenta;
                tipTotal += parseFloat(venta.Tip || 0);

                if (venta.Pago_Info) {
                    try {
                        const pagos = JSON.parse(venta.Pago_Info);
                        if (pagos.metodo === "Tarjeta") tarjeta += ingresoVenta;
                        if (pagos.metodo === "Efectivo") efectivo += ingresoVenta;
                        if (pagos.metodo === "Transferencia") transferencia += ingresoVenta;
                    } catch (e) {
                        // Ignorar errores de parseo
                    }
                }
            }

            if (venta.Productos) {
                try {
                    const productos = JSON.parse(venta.Productos);
                    productos.forEach((producto) => {
                        if (!producto.NombreES) return;
                        const cantidad = parseFloat(producto.quantity || 0);

                        // Price calculation logic from MesResumen.jsx
                        let price = parseFloat(producto.price || producto.valor || producto.precio || 0);
                        if (price === 0) {
                            const menuProduct = allMenu.find(m => m.NombreES === producto.NombreES);
                            if (menuProduct) {
                                price = parseFloat(menuProduct.Precio || 0);
                            }
                        }

                        if (productosMap[producto.NombreES]) {
                            productosMap[producto.NombreES].cantidad += cantidad;
                            productosMap[producto.NombreES].totalIngreso += (price * cantidad);
                        } else {
                            let recetaIdDefinitiva = producto.Receta || allMenu.find(menu => menu.NombreES === producto.NombreES)?.Receta || "N/A";

                            productosMap[producto.NombreES] = {
                                nombre: producto.NombreES,
                                cantidad: cantidad,
                                totalIngreso: (price * cantidad),
                                recetaId: recetaIdDefinitiva,
                                recetaValor: 0,
                                ingredientes: [],
                            };
                        }
                    });
                } catch (e) { }
            }
        });

        const productosVendidos = Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad);

        // Calcular Compras Reales del mes (Usando la logica previa o reutilizando allCompras)
        const totalCompras = allCompras
            .filter((compra) => {
                const compraDate = new Date(compra.Date);
                const dLocal = new Date(compraDate.valueOf() + compraDate.getTimezoneOffset() * 60000); // Ajuste timezone local si es necesario
                return dLocal.getMonth() === targetMonth && dLocal.getFullYear() === targetYear;
            })
            .reduce((acc, compra) => acc + parseFloat(compra.Valor || compra.Total || 0), 0);

        return {
            totalIngreso: total,
            totalTip: tipTotal,
            totalTarjeta: tarjeta,
            totalEfectivo: efectivo,
            totalTransferencia: transferencia,
            totalProductosVendidos: productosVendidos.reduce((acc, p) => acc + p.cantidad, 0),
            productosVendidos,
            totalCompras,
        };
    }, [ventas, allCompras, allMenu, targetMonth, targetYear]);

    // 3. Obtener/Calcular Rentabilidad de Productos (Igual que MesResumen.jsx)
    const [recetaDetailsMap, setRecetaDetailsMap] = useState({});

    // Efecto para calcular detalles de recetas solo si 'productosVendidos' cambia
    useEffect(() => {
        if (datosCalculadosDelMes.productosVendidos.length === 0 || !allItems.length || !allMenu.length) {
            setProductosVendidosConReceta([]);
            return;
        }

        const calculateRecipeValues = () => {
            const updatedProductos = datosCalculadosDelMes.productosVendidos.map((producto) => {
                let recetaData = null;
                let consolidatedCost = 0;
                let ingredients = [];
                let vCMP = 0;
                let vCMO = 0;

                if (producto.recetaId !== "N/A") {
                    try {
                        const menuItem = allMenu.find((item) => item.Receta === producto.recetaId);
                        if (menuItem) {
                            // Try to find the recipe in the Redux store (Menu or Produccion)
                            recetaData = allRecetasMenu.find(r => r._id === menuItem.Receta) || allRecetasProduccion.find(r => r._id === menuItem.Receta);

                            if (recetaData) {
                                // Use stored cost instead of recalculating
                                if (recetaData.costo) {
                                    try {
                                        const costData = typeof recetaData.costo === 'string' ? JSON.parse(recetaData.costo) : recetaData.costo;

                                        if (typeof costData === 'number') {
                                            // Case for pure production recipes sometimes stored as number
                                            consolidatedCost = costData;
                                        } else if (costData && (costData.vCMP || costData.vCMO)) {
                                            // Case for detailed object cost (vCMP + vCMO)
                                            vCMP = costData.vCMP || 0;
                                            vCMO = costData.vCMO || 0;
                                            consolidatedCost = vCMP + vCMO;
                                        }
                                    } catch (e) {
                                        console.warn("Could not parse cost for recipe:", recetaData.legacyName);
                                    }
                                }

                                // Still trim ingredients for the "Predict" modal usage if needed
                                ingredients = trimRecepie([...allItems, ...allProduccion], recetaData);
                            }
                        }
                    } catch (error) {
                        console.error(`Error procesando receta para ${producto.nombre}:`, error);
                    }
                }

                const totalCosto = consolidatedCost * producto.cantidad;
                const totalUtilidad = producto.totalIngreso - totalCosto;

                return {
                    ...producto,
                    recetaValor: consolidatedCost,
                    vCMP,
                    vCMO,
                    ingredientes: ingredients,
                    totalCosto: totalCosto,
                    totalUtilidad: totalUtilidad
                };
            });

            setProductosVendidosConReceta(updatedProductos);
        };

        calculateRecipeValues();
    }, [datosCalculadosDelMes.productosVendidos, allMenu, allItems, allProduccion, allRecetasMenu, allRecetasProduccion]);

    // --- LOGICA DE MODELO (State management) ---
    const [modelId, setModelId] = useState(null);
    const [currentCosts, setCurrentCosts] = useState({ compras: [], personal: [], fijos: [], impuestos: [], otros: [] });
    const [hasChanges, setHasChanges] = useState(false);
    const [purchasesList, setPurchasesList] = useState([]); // List for modal
    const [showPurchasesModal, setShowPurchasesModal] = useState(false);
    const [realPurchases, setRealPurchases] = useState(0);

    // Initial Load of Model
    useEffect(() => {
        // Find model looking into 'costs' object for linkedMonth/Year
        // Also fallback to top-level properties just in case
        const foundModel = models.find(m => {
            const mMonth = m.costs?.linkedMonth !== undefined ? m.costs.linkedMonth : m.month;
            const mYear = m.costs?.linkedYear !== undefined ? m.costs.linkedYear : m.year;

            // Primary check: numeric columns
            if (mMonth == targetMonth && mYear == targetYear) return true;

            // Fallback check: exact name match
            if (m.name === `Contabilidad ${monthsNames[targetMonth]} ${targetYear}`) return true;

            return false;
        });

        if (foundModel) {
            setModelId(foundModel._id); // Use _id from the log

            const costsData = foundModel.costs || {};

            // Parse impuestos if it's a string inside costs
            let parsedImpuestos = [];
            if (costsData.impuesto) {
                try {
                    const impJson = typeof costsData.impuesto === 'string' ? JSON.parse(costsData.impuesto) : costsData.impuesto;
                    parsedImpuestos = impJson.impuestos || [];
                } catch (e) {
                    console.warn("Error parsing impuestos:", e);
                }
            } else if (costsData.impuestos) {
                parsedImpuestos = costsData.impuestos;
            }

            setCurrentCosts({
                compras: costsData.compras || [],
                personal: costsData.personal || [],
                fijos: costsData.fijos || [],
                otros: costsData.otros || [],
                impuestos: parsedImpuestos
            });

            setHasChanges(false);
        } else {
            setModelId(null);
            setCurrentCosts({ compras: [], personal: [], fijos: [], impuestos: [], otros: [] });
            setHasChanges(false);
        }
    }, [models, targetMonth, targetYear]);

    // Totales
    const calculateTotal = (items, type) => {
        if (!items) return 0;
        if (type === 'impuestos') {
            return items.reduce((acc, item) => {
                const val = item.type === 'percentage' ? (datosCalculadosDelMes.totalIngreso * (item.rate || 0) / 100) : (item.isAnnual ? (item.value || 0) / 12 : (item.value || 0));
                return acc + val;
            }, 0);
        }
        if (type === 'personal') {
            return items.reduce((acc, item) => {
                const val = item.totalValue !== undefined ? item.totalValue : ((item.weeklyHours || 0) * (item.hourlyRate || 0) * 4.33);
                return acc + val;
            }, 0);
        }
        return items.reduce((acc, item) => acc + Number(item.value || 0), 0);
    };

    const totals = useMemo(() => ({
        compras: calculateTotal(currentCosts.compras),
        personal: calculateTotal(currentCosts.personal, 'personal'),
        fijos: calculateTotal(currentCosts.fijos),
        impuestos: calculateTotal(currentCosts.impuestos, 'impuestos'),
        otros: calculateTotal(currentCosts.otros),
    }), [currentCosts, datosCalculadosDelMes.totalIngreso]);

    // Sync Handlers
    const handleSyncRealPurchases = () => {
        const total = datosCalculadosDelMes.totalCompras;
        setRealPurchases(total);
        // Also get the list
        const list = allCompras.filter((compra) => {
            const compraDate = new Date(compra.Date);
            const dLocal = new Date(compraDate.valueOf() + compraDate.getTimezoneOffset() * 60000);
            return dLocal.getMonth() === targetMonth && dLocal.getFullYear() === targetYear;
        });
        setPurchasesList(list);

        const newRow = { id: 'auto-compras', name: 'Compras Reales (Sinc)', value: total };
        updateItem('compras', newRow);
    };

    const handleSyncTheoretical = () => {
        // Calcular el costo teórico total basado en los productos vendidos y sus recetas
        const totalTeorico = productosVendidosConReceta.reduce((acc, curr) => acc + (curr.totalCosto || 0), 0);

        const newRow = { id: 'auto-teorico', name: 'Costo Teórico Recetas', value: totalTeorico };
        updateItem('compras', newRow);
    };

    const handleSyncPayroll = () => {
        if (!allStaff || allStaff.length === 0) {
            alert("No hay datos de allStaff disponibles.");
            return;
        }

        // Calcular rango del mes
        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

        const newPersonalRows = allStaff.map(persona => {
            // Lógica similar a CalculoNomina
            let turnos = [];
            if (Array.isArray(persona.Turnos)) {
                turnos = persona.Turnos;
            } else if (typeof persona.Turnos === "string" && persona.Turnos.trim()) {
                try {
                    const parsed = JSON.parse(persona.Turnos);
                    turnos = Array.isArray(parsed) ? parsed : [parsed];
                } catch { turnos = []; }
            }

            // Filtrar turnos del mes (Timezone & Format Safe)
            const turnosMes = turnos.filter(t => {
                const rawDate = t.turnoDate || t.date || t.fecha;
                if (!rawDate) return false;

                let tYear, tMonth;

                if (typeof rawDate === 'string') {
                    // Soporta YYYY-MM-DD
                    if (rawDate.includes('-')) {
                        const parts = rawDate.split('T')[0].split('-');
                        if (parts.length >= 2) {
                            tYear = parseInt(parts[0], 10);
                            tMonth = parseInt(parts[1], 10) - 1;
                        }
                    }
                    // Soporta DD/MM/YYYY (Formato LatAm)
                    else if (rawDate.includes('/')) {
                        const parts = rawDate.split('/');
                        if (parts.length === 3) {
                            // Asumimos DD/MM/YYYY
                            tYear = parseInt(parts[2], 10);
                            tMonth = parseInt(parts[1], 10) - 1;
                        }
                    }
                }

                if (tYear !== undefined && tMonth !== undefined && !isNaN(tYear) && !isNaN(tMonth)) {
                    return tYear === targetYear && tMonth === targetMonth;
                }

                // Fallback fecha objeto estándar
                const f = new Date(rawDate);
                // Validate if date is valid
                if (isNaN(f.getTime())) return false;

                return f.getFullYear() === targetYear && f.getMonth() === targetMonth;
            });

            // Calcular horas
            const totalHoras = turnosMes.reduce((acc, t) => {
                const horaSalida = t.horaSalida || t.horaCierre;
                // Basic validation: ensure strings exist and are not "false"
                if (!t.horaInicio || !horaSalida || horaSalida === 'false' || t.horaInicio === 'false') return acc;

                const [h1, m1] = t.horaInicio.split(':').map(Number);
                const [h2, m2] = horaSalida.split(':').map(Number);

                if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return acc;

                const horas = (h2 - h1) + (m2 - m1) / 60;
                return acc + (horas > 0 ? horas : 0);
            }, 0);

            if (totalHoras === 0) return null;

            const rate = Number(persona.Rate) || 0;
            const base = totalHoras * rate;
            const seguridadSocial = base * 0.10; // 10% Seguridad estimada
            const totalValue = base + seguridadSocial;

            // Retornar objeto compatible con EmployeeRow
            return {
                id: persona._id,
                role: `${persona.Nombre || persona.nombre} ${persona.Apellido || persona.apellido || ''} (${persona.Cargo || persona.cargo || 'Staff'})`,
                weeklyHours: 0,
                hourlyRate: 0,
                totalValue: totalValue,
                isSynced: true
            };
        }).filter(Boolean);

        if (newPersonalRows.length === 0) {
            alert("No hay allStaff para importar.");
            return;
        }

        if (window.confirm(`Se importarán ${newPersonalRows.length} empleados activos. ¿Desea reemplazar la lista actual de personal?`)) {
            setCurrentCosts(prev => ({ ...prev, personal: newPersonalRows }));
            setHasChanges(true);
        }
    };



    // CRUD
    const addItem = (category, item) => {
        const newCosts = { ...currentCosts, [category]: [...(currentCosts[category] || []), item] };
        setCurrentCosts(newCosts);
        setHasChanges(true);
    };
    const updateItem = (category, updatedItem) => {
        const list = currentCosts[category] || [];
        const index = list.findIndex(i => i.id === updatedItem.id);
        let newList;
        if (index >= 0) {
            newList = [...list];
            newList[index] = updatedItem;
        } else {
            newList = [...list, updatedItem];
        }
        const newCosts = { ...currentCosts, [category]: newList };
        setCurrentCosts(newCosts);
        setHasChanges(true);
    };
    const removeItem = (category, id) => {
        const newCosts = { ...currentCosts, [category]: currentCosts[category].filter(i => i.id !== id) };
        setCurrentCosts(newCosts);
        setHasChanges(true);
    };

    const handleSave = () => {
        const dataStr = JSON.stringify(currentCosts);

        if (modelId) {
            dispatch(updateModelAction(modelId, { costs: dataStr }));
            console.log("Updating model:", dataStr);

        } else {
            const modelName = `Contabilidad ${monthsNames[targetMonth]} ${targetYear}`;
            dispatch(createModelAction({
                month: targetMonth,
                year: targetYear,
                name: modelName,
                costs: dataStr
            }));
        }
        setHasChanges(false);
    };

    const realIncome = datosCalculadosDelMes.totalIngreso;
    const totalCostos = totals.compras + totals.personal + totals.fijos + totals.impuestos + totals.otros;
    const utilidadNeta = realIncome - totalCostos;
    const margen = realIncome > 0 ? (utilidadNeta / realIncome) * 100 : 0;
    const countVentas = ventas.length;

    const handleOpenGastos = () => {
        const dataToSave = {
            productos: productosVendidosConReceta,
            monthName: monthsNames[targetMonth],
            year: targetYear
        };
        localStorage.setItem('tempGastosData', JSON.stringify(dataToSave));
        window.open('/gastos-calculados', '_blank');
    };

    const handleOpenMenuAudit = () => {
        if (!allMenu || allMenu.length === 0) {
            alert("No hay datos de menú disponibles.");
            return;
        }

        const menuAuditData = allMenu.map(menuItem => {
            let consolidatedCost = 0;
            let recetaData = null;

            if (menuItem.Receta) {
                try {
                    recetaData = allRecetasMenu.find(r => r._id === menuItem.Receta) || allRecetasProduccion.find(r => r._id === menuItem.Receta);

                    if (recetaData && recetaData.costo) {
                        const costData = typeof recetaData.costo === 'string' ? JSON.parse(recetaData.costo) : recetaData.costo;
                        if (typeof costData === 'number') {
                            consolidatedCost = costData;
                        } else if (costData && (costData.vCMP || costData.vCMO)) {
                            consolidatedCost = (costData.vCMP || 0) + (costData.vCMO || 0);
                        }
                    }
                } catch (e) { }
            }

            const precioVenta = parseFloat(menuItem.Precio || 0);

            return {
                nombre: menuItem.NombreES,
                costo: consolidatedCost,
                precioVenta: precioVenta,
                utilidad: precioVenta - consolidatedCost
            };
        });

        const dataToSave = {
            menuItems: menuAuditData,
            timestamp: Date.now()
        };
        localStorage.setItem('tempMenuAuditData', JSON.stringify(dataToSave));
        window.open('/productos-financiero', '_blank');
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden relative bg-gray-50 max-w-full">
            {loadingVentas && <LoadingOverlay />}

            {/* HEADER COMPACTO Y UNIFICADO */}
            <header className="bg-white border-b shadow-sm sticky top-0 z-20 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                        {monthsNames[targetMonth]} <span className="text-gray-400 font-normal">{targetYear}</span>
                    </h1>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${modelId ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {modelId ? 'Hoja activa' : 'Borrador'}
                    </span>
                </div>

                <div className="flex items-center gap-6 divide-x divide-gray-200">
                    <div className="px-4 text-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Ventas ({countVentas})</div>
                        <div className="text-xl font-bold text-gray-800">{formatCurrency(realIncome)}</div>
                    </div>

                    <div className="px-4 text-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Utilidad Neta</div>
                        <div className={`text-xl font-bold ${utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(utilidadNeta)}
                        </div>
                    </div>

                    <div className="px-4 text-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Margen</div>
                        <div className={`text-xl font-bold ${margen >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {margen.toFixed(1)}%
                        </div>
                    </div>

                    <div className="pl-4 flex items-center gap-2">
                        <button
                            onClick={handleOpenMenuAudit}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 transition-all"
                            title="Ver Costos Teóricos de todo el Menú"
                        >
                            📊 Auditoría Menú
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={!hasChanges && modelId}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all ${hasChanges || !modelId ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' : 'bg-gray-100 text-gray-400 cursor-default'}`}
                        >
                            {modelId ? (hasChanges ? 'Guardar Cambios' : 'Guardado') : 'Crear Hoja'}
                        </button>
                    </div>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL FULL WIDTH */}
            <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar p-6">
                <div className="w-full max-w-[1920px] mx-auto space-y-6">

                    {ventas && ventas.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                            <div className="h-[420px]">
                                <MesResumenStats
                                    ventasRecepies={productosVendidosConReceta}
                                    totalIngreso={datosCalculadosDelMes.totalIngreso}
                                    totalTip={datosCalculadosDelMes.totalTip}
                                    totalProductosVendidos={datosCalculadosDelMes.totalProductosVendidos}
                                    totalTarjeta={datosCalculadosDelMes.totalTarjeta}
                                    totalEfectivo={datosCalculadosDelMes.totalEfectivo}
                                    totalTransferencia={datosCalculadosDelMes.totalTransferencia}
                                    totalCompras={datosCalculadosDelMes.totalCompras}
                                    cantidadDeDias={ventas}
                                />
                            </div>

                            {/* Productos Vendidos Table */}
                            <div className="h-[420px]">
                                <ProductosVendidosRentabilidad
                                    productos={productosVendidosConReceta}
                                    ventas={ventas}
                                    targetMonth={targetMonth}
                                    targetYear={targetYear}
                                    onOpenGastos={handleOpenGastos}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <section className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[300px]">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700 text-xs">Compras / Insumos</h3>
                                <div className="flex gap-1">
                                    <button onClick={handleSyncRealPurchases} className="p-1 hover:bg-blue-50 text-blue-600 rounded" title="Sincronizar Compras">🔄</button>
                                    <button onClick={handleSyncTheoretical} className="p-1 hover:bg-purple-50 text-purple-600 rounded" title="Sincronizar Teórico">📋</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xl font-bold text-gray-800">{formatCurrency(totals.compras)}</div>
                                <button onClick={() => addItem('compras', { id: Date.now(), name: '', value: 0 })} className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-lg leading-none" title="Agregar Item">+</button>
                            </div>
                            <div className="flex-grow space-y-1 overflow-y-auto custom-scrollbar border rounded-md">
                                {(currentCosts.compras || []).map(i => (
                                    <div key={i.id} className="relative group">
                                        <SimpleCostRow cost={i} label="Descripción" onUpdate={(it) => updateItem('compras', it)} onRemove={() => removeItem('compras', i.id)} />
                                        {i.id === 'auto-compras' && (
                                            <button onClick={() => setShowPurchasesModal(true)} className="absolute right-2 top-0 text-[9px] text-blue-500 hover:underline">Ver</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[300px]">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700 text-xs">Personal</h3>
                                <button onClick={handleSyncPayroll} className="p-1 hover:bg-green-50 text-green-600 rounded" title="Sincronizar Nómina">🔄</button>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xl font-bold text-gray-800">{formatCurrency(totals.personal)}</div>
                                <button onClick={() => addItem('personal', { id: Date.now(), role: '', weeklyHours: 48, hourlyRate: 0 })} className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-lg leading-none" title="Agregar Empleado">+</button>

                            </div>
                            <div className="flex-grow space-y-1 overflow-y-auto custom-scrollbar border rounded-md">
                                {(currentCosts.personal || []).map(i => <EmployeeRow key={i.id} employee={i} onUpdate={(it) => updateItem('personal', it)} onRemove={() => removeItem('personal', i.id)} />)}
                            </div>
                        </section>

                        <section className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[300px]">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700 text-xs">Costos Fijos</h3>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xl font-bold text-gray-800">{formatCurrency(totals.fijos)}</div>
                                <button onClick={() => addItem('fijos', { id: Date.now(), name: '', value: 0 })} className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-lg leading-none" title="Agregar Fijo">+</button>
                            </div>
                            <div className="flex-grow space-y-1 overflow-y-auto custom-scrollbar border rounded-md">
                                {(currentCosts.fijos || []).map(i => <SimpleCostRow key={i.id} cost={i} label="Concepto" onUpdate={(it) => updateItem('fijos', it)} onRemove={() => removeItem('fijos', i.id)} />)}
                            </div>
                        </section>

                        <section className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[300px]">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700 text-xs">Impuestos</h3>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xl font-bold text-gray-800">{formatCurrency(totals.impuestos)}</div>
                                <button onClick={() => addItem('impuestos', { id: Date.now(), name: '', value: 0, type: 'percentage', rate: 0 })} className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-lg leading-none" title="Agregar Impuesto">+</button>
                            </div>
                            <div className="flex-grow space-y-1 overflow-y-auto custom-scrollbar border rounded-md">
                                {(currentCosts.impuestos || []).map(i => <ImpuestoRow key={i.id} impuesto={i} totalRevenue={realIncome} onUpdate={(it) => updateItem('impuestos', it)} onRemove={() => removeItem('impuestos', i.id)} />)}
                            </div>
                        </section>

                        <section className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[300px]">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-700 text-xs">Otros Gastos</h3>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xl font-bold text-gray-800">{formatCurrency(totals.otros)}</div>
                                <button onClick={() => addItem('otros', { id: Date.now(), name: '', value: 0 })} className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-lg leading-none" title="Agregar Otro">+</button>
                            </div>
                            <div className="flex-grow space-y-1 overflow-y-auto custom-scrollbar border rounded-md">
                                {(currentCosts.otros || []).map(i => <SimpleCostRow key={i.id} cost={i} label="Descripción" onUpdate={(it) => updateItem('otros', it)} onRemove={() => removeItem('otros', i.id)} />)}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <PurchasesModal
                isOpen={showPurchasesModal}
                onClose={() => setShowPurchasesModal(false)}
                purchases={purchasesList}
                total={realPurchases}
            />
        </div>
    );
}

const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default ModeloContent;