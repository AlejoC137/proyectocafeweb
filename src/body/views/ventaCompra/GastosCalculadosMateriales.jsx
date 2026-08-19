import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ArrowLeft,
  Package,
  ChefHat,
  Factory,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Layers,
  ShoppingBag,
  Info,
  Sliders,
  DollarSign,
  TrendingUp,
  Activity,
  FileText,
  X,
  GitCommit,
  PieChart
} from 'lucide-react';
import { formatCurrency } from './ModelComponents';
import ReportCopyButton from '../../components/ReportCopyButton';
import { getAllFromTable } from '@/redux/actions/tableActions';
import { trimRecepie } from '@/redux/actions/recipeActions';
import {
  VENTAS,
  COMPRAS,
  MENU,
  ITEMS,
  PRODUCCION,
  RECETAS_MENU,
  RECETAS_PRODUCCION
} from '@/redux/actions-types';

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Helper: Calculate ISO Week Number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Helper: Normalize unit label for consistent UI display (un, gr, kg, ml, L)
function normalizeUnitName(unit) {
  if (!unit) return 'un';
  const norm = String(unit).toLowerCase().trim();
  if (['un', 'unid', 'unidad', 'unidades', 'ud', 'uds', 'u', 'unidades.', 'unidad(es)', 'piezas', 'pz', 'pza'].includes(norm)) {
    return 'un';
  }
  if (['gr', 'g', 'gramo', 'gramos'].includes(norm)) return 'gr';
  if (['kg', 'kilo', 'kilogramo', 'kilogramos'].includes(norm)) return 'kg';
  if (['ml', 'mililitro', 'mililitros'].includes(norm)) return 'ml';
  if (['l', 'litro', 'litros'].includes(norm)) return 'L';
  return unit;
}

// Helper: Unit price normalization (converts $/kg to $/gr if recipe uses gr, or $/L to $/ml)
function getNormalizedUnitPrice(itemMaster, recipeUnit, rawUnitPrice = 0) {
  let price = rawUnitPrice || parseFloat(itemMaster?.precioUnitario || itemMaster?.costoPromedio || 0);
  if (price === 0) return 0;

  const itemUnit = (itemMaster?.UNIDADES || itemMaster?.metric || '').toLowerCase().trim();
  const recUnit = (recipeUnit || '').toLowerCase().trim();

  // If item is in kg/kilo and recipe is in gr/g -> divide price by 1000
  if ((itemUnit === 'kg' || itemUnit === 'kilo' || itemUnit === 'kilogramo') &&
      (recUnit === 'gr' || recUnit === 'g' || recUnit === 'gramo' || recUnit === 'gramos')) {
    return price / 1000;
  }

  // If item is in L/litro and recipe is in ml -> divide price by 1000
  if ((itemUnit === 'l' || itemUnit === 'litro' || itemUnit === 'litros') &&
      (recUnit === 'ml' || recUnit === 'mililitro' || recUnit === 'mililitros')) {
    return price / 1000;
  }

  return price;
}

const GastosCalculadosMateriales = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux store data
    const allVentas = useSelector((state) => state.allVentas || []);
    const allCompras = useSelector((state) => state.allCompras || []);
    const allMenu = useSelector((state) => state.allMenu || []);
    const allItems = useSelector((state) => state.allItems || []);
    const allProduccion = useSelector((state) => state.allProduccion || []);
    const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []);

    // Auto-fetch missing tables if Redux is empty
    useEffect(() => {
        if (!allMenu.length) dispatch(getAllFromTable(MENU));
        if (!allItems.length) dispatch(getAllFromTable(ITEMS));
        if (!allProduccion.length) dispatch(getAllFromTable(PRODUCCION));
        if (!allRecetasMenu.length) dispatch(getAllFromTable(RECETAS_MENU));
        if (!allRecetasProduccion.length) dispatch(getAllFromTable(RECETAS_PRODUCCION));
        if (!allVentas.length) dispatch(getAllFromTable(VENTAS));
        if (!allCompras.length) dispatch(getAllFromTable(COMPRAS));
    }, [dispatch, allMenu.length, allItems.length, allProduccion.length, allRecetasMenu.length, allRecetasProduccion.length, allVentas.length, allCompras.length]);

    // Retrieve data from location state (if navigated normally) or localStorage (if opened in new tab)
    const storedData = useMemo(() => {
        if (location.state) return location.state;
        try {
            const raw = localStorage.getItem('tempGastosData');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error("Error reading tempGastosData from localStorage", e);
            return null;
        }
    }, [location.state]);

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'raw' | 'internal'
    const [expandedCards, setExpandedCards] = useState({});
    const [selectedDetailModal, setSelectedDetailModal] = useState(null); // Deep analysis modal

    // Filter controls for historical DB analysis
    const now = new Date();
    const [filterSource, setFilterSource] = useState(storedData ? 'model' : 'db'); // 'model' | 'db'
    const [timeframe, setTimeframe] = useState('month'); // 'month' | 'week' | 'year'
    const [selectedYear, setSelectedYear] = useState(storedData?.year || now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        storedData?.monthName 
            ? MONTH_NAMES.map(m => m.toLowerCase()).indexOf(storedData.monthName.toLowerCase())
            : now.getMonth()
    );
    const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(now));

    // Lookup maps for fast access
    const itemsMap = useMemo(() => {
        const map = {};
        allItems.forEach(i => { if (i?._id) map[i._id] = i; });
        return map;
    }, [allItems]);

    const produccionMap = useMemo(() => {
        const map = {};
        allProduccion.forEach(p => { if (p?._id) map[p._id] = p; });
        return map;
    }, [allProduccion]);

    const menuMap = useMemo(() => {
        const map = {};
        allMenu.forEach(m => { if (m?._id) map[m._id] = m; });
        return map;
    }, [allMenu]);

    // Find recipe helper (checks recipeId, forId, or legacyName)
    const findRecipeForProduct = useMemo(() => {
        return (productId, recipeId, productName) => {
            if (recipeId && recipeId !== 'N/A') {
                const found = allRecetasMenu.find(r => r._id === recipeId) || allRecetasProduccion.find(r => r._id === recipeId);
                if (found) return found;
            }
            if (productId) {
                const foundByFor = allRecetasMenu.find(r => r.forId === productId || r._id === productId) || 
                                    allRecetasProduccion.find(r => r.forId === productId || r._id === productId);
                if (foundByFor) return foundByFor;
            }
            if (productName) {
                const norm = productName.toLowerCase().trim();
                const foundByName = allRecetasMenu.find(r => r.legacyName?.toLowerCase().trim() === norm) ||
                                    allRecetasProduccion.find(r => r.legacyName?.toLowerCase().trim() === norm);
                if (foundByName) return foundByName;
            }
            return null;
        };
    }, [allRecetasMenu, allRecetasProduccion]);

    // Determine active productos list (from model state or filtered from DB)
    const activeProductos = useMemo(() => {
        if (filterSource === 'model' && storedData?.productos) {
            return storedData.productos;
        }

        if (!allVentas || !allVentas.length) return [];

        const startMonth = selectedMonth;
        const targetYear = selectedYear;

        const filteredVentas = allVentas.filter(venta => {
            if (!venta || (!venta.Pagado && venta.Pagado !== undefined)) return false;
            const rawDate = venta.Date || venta.created_at || venta.date;
            if (!rawDate) return false;
            const vDate = new Date(rawDate);
            if (isNaN(vDate.getTime())) return false;

            if (timeframe === 'year') {
                return vDate.getFullYear() === targetYear;
            } else if (timeframe === 'week') {
                return vDate.getFullYear() === targetYear && getWeekNumber(vDate) === selectedWeek;
            } else {
                return vDate.getFullYear() === targetYear && vDate.getMonth() === startMonth;
            }
        });

        const productosMap = {};

        filteredVentas.forEach(venta => {
            let productosArray = [];
            if (venta.Productos) {
                try {
                    productosArray = typeof venta.Productos === 'string' ? JSON.parse(venta.Productos) : venta.Productos;
                } catch (e) {
                    productosArray = [];
                }
            }

            productosArray.forEach(p => {
                const name = p.NombreES || p.nombre || p.Nombre_del_producto;
                if (!name) return;
                const qty = parseFloat(p.quantity || p.cantidad || 0);
                let price = parseFloat(p.price || p.valor || p.precio || 0);

                if (price === 0 && menuMap[p._id]) {
                    price = parseFloat(menuMap[p._id].Precio || 0);
                }

                const recipeId = p.Receta || p.recetaId || menuMap[p._id]?.Receta || 'N/A';
                const key = name.trim().toLowerCase();

                if (!productosMap[key]) {
                    const recipeData = findRecipeForProduct(p._id, recipeId, name);
                    let ingredients = [];
                    if (recipeData) {
                        ingredients = trimRecepie([...allItems, ...allProduccion], recipeData);
                    }

                    productosMap[key] = {
                        id: p._id || key,
                        nombre: name,
                        cantidad: 0,
                        totalIngreso: 0,
                        recetaId: recipeId !== 'N/A' ? recipeId : (recipeData?._id || 'N/A'),
                        ingredientes: ingredients
                    };
                }
                productosMap[key].cantidad += qty;
                productosMap[key].totalIngreso += (price * qty);
            });
        });

        return Object.values(productosMap);
    }, [filterSource, storedData, allVentas, timeframe, selectedYear, selectedMonth, selectedWeek, menuMap, findRecipeForProduct, allItems, allProduccion]);

    // RECURSIVE INGREDIENT EXPLOSION AND AGGREGATION
    const { aggregatedIngredients, internalProductionsSummary, productReports } = useMemo(() => {
        if (!activeProductos || !activeProductos.length) {
            return { aggregatedIngredients: [], internalProductionsSummary: [], productReports: [] };
        }

        const ingredientsMap = {};
        const internalProdMap = {};
        const reports = [];

        // Helper to parse yield / batch info from recipe
        const parseRecipeYield = (recipe) => {
            if (!recipe || !recipe.rendimiento) return { cant: 1, unit: 'porción' };
            try {
                const rend = typeof recipe.rendimiento === 'string' ? JSON.parse(recipe.rendimiento) : recipe.rendimiento;
                const cant = parseFloat(rend?.cantidad || rend?.cant || 0);
                const unit = (rend?.unidades || rend?.unit || '').toLowerCase().trim();
                return {
                    cant: cant > 0 ? cant : 1,
                    unit: unit || 'porción'
                };
            } catch (e) {
                return { cant: 1, unit: 'porción' };
            }
        };

        // Helper to recursively break down internal productions (sub-recipes)
        const processSubRecipe = (subProdId, totalSubRecipeVolumeNeeded, parentProductName, parentSalesCount = 1, qtyPerUnitOfSubInParent = 1, depth = 1, visited = new Set()) => {
            if (!subProdId || visited.has(subProdId)) return [];
            visited.add(subProdId);

            const subProdMaster = produccionMap[subProdId] || itemsMap[subProdId];
            const subRecipe = findRecipeForProduct(subProdId, subProdMaster?.Receta, subProdMaster?.Nombre_del_producto);
            
            if (!subRecipe) return [];

            const subRecipeYield = parseRecipeYield(subRecipe);
            const subComponents = trimRecepie([...allItems, ...allProduccion], subRecipe);
            const subIngredients = [];

            // Batch yield scale factor (works universally for gr, ml, un, unidades, etc.)
            const yieldCant = subRecipeYield.cant > 0 ? subRecipeYield.cant : 1;

            subComponents.forEach(comp => {
                const ingName = comp.name || 'Insumo';
                const itemId = comp.item_Id || comp.id;
                const itemMaster = itemsMap[itemId] || produccionMap[itemId];
                const unit = normalizeUnitName(comp.units || itemMaster?.UNIDADES || itemMaster?.metric || '');
                
                const rawPrice = comp.precioUnitario || parseFloat(itemMaster?.precioUnitario || itemMaster?.costoPromedio || 0);
                const normUnitPrice = getNormalizedUnitPrice(itemMaster, unit, rawPrice);

                const qtyPerBatch = parseFloat(comp.cuantity || 0);
                
                // Ratio per 1 unit of sub-recipe
                const ratioPerUnitOfSub = qtyPerBatch / yieldCant;
                // Total quantity of raw item needed for totalSubRecipeVolumeNeeded of sub-recipe
                const totalSubQty = ratioPerUnitOfSub * totalSubRecipeVolumeNeeded;
                const totalSubCost = totalSubQty * normUnitPrice;

                // Exact quantity of this raw item used per 1 portion of top-level parent product
                const effectiveQtyPerParentPortion = ratioPerUnitOfSub * qtyPerUnitOfSubInParent;

                subIngredients.push({
                    id: itemId,
                    name: ingName,
                    unit: unit,
                    qtyPerUnit: ratioPerUnitOfSub,
                    totalQty: totalSubQty,
                    unitPrice: normUnitPrice,
                    totalCost: totalSubCost,
                    type: comp.source === 'Produccion' ? 'internal' : 'raw'
                });

                // Add directly to global primitive raw materials explosion
                const rawKey = ingName.trim().toLowerCase();
                if (!ingredientsMap[rawKey]) {
                    ingredientsMap[rawKey] = {
                        id: itemId,
                        recipeId: null,
                        name: ingName,
                        unit: unit,
                        unitPrice: normUnitPrice,
                        totalQuantity: 0,
                        totalCost: 0,
                        isInternalProduction: false,
                        subIngredients: [],
                        usedIn: []
                    };
                }

                ingredientsMap[rawKey].totalQuantity += totalSubQty;
                ingredientsMap[rawKey].totalCost += totalSubCost;
                ingredientsMap[rawKey].usedIn.push({
                    productName: parentProductName,
                    subRecipeName: subProdMaster?.Nombre_del_producto || subRecipe?.legacyName || 'Sub-receta',
                    productQuantity: parentSalesCount,
                    qtyPerUnit: effectiveQtyPerParentPortion,
                    totalQty: totalSubQty,
                    unitPrice: normUnitPrice,
                    totalCost: totalSubCost,
                    unit: unit
                });

                // If nested item inside sub-recipe is ALSO an internal production, recurse!
                if (comp.source === 'Produccion' && itemId) {
                    processSubRecipe(itemId, totalSubQty, parentProductName, parentSalesCount, effectiveQtyPerParentPortion, depth + 1, visited);
                }
            });

            return subIngredients;
        };

        activeProductos.forEach(producto => {
            let productMaterialCost = 0;

            if (producto.ingredientes && Array.isArray(producto.ingredientes)) {
                producto.ingredientes.forEach(ing => {
                    const ingName = ing.name || ing.Ingrediente || ing.nombre || "Desconocido";
                    const key = ingName.trim().toLowerCase();
                    const itemId = ing.id || ing.item_Id;
                    const itemMaster = itemsMap[itemId] || produccionMap[itemId];
                    const unit = normalizeUnitName(ing.units || ing.Unidad || ing.unidad || itemMaster?.UNIDADES || itemMaster?.metric || '');

                    const rawPrice = ing.precioUnitario || parseFloat(itemMaster?.precioUnitario || itemMaster?.costoPromedio || 0);
                    const normUnitPrice = getNormalizedUnitPrice(itemMaster, unit, rawPrice);

                    const qtyPerUnit = parseFloat(ing.cuantity || ing.Cantidad || ing.cantidad || 0);
                    const totalQtyForProduct = qtyPerUnit * (producto.cantidad || 0);
                    const totalCostForProduct = totalQtyForProduct * normUnitPrice;

                    productMaterialCost += totalCostForProduct;

                    const isInternal = ing.source === 'Produccion' || ing.key?.startsWith('producto_interno') || !!produccionMap[itemId];
                    const linkedRecipe = findRecipeForProduct(itemId, ing.recipeId || ing.Receta, ingName);

                    if (!ingredientsMap[key]) {
                        ingredientsMap[key] = {
                            id: itemId,
                            recipeId: linkedRecipe?._id || ing.recipeId || null,
                            name: ingName,
                            unit: unit,
                            unitPrice: normUnitPrice,
                            totalQuantity: 0,
                            totalCost: 0,
                            isInternalProduction: isInternal,
                            subIngredients: [],
                            usedIn: []
                        };
                    }

                    ingredientsMap[key].totalQuantity += totalQtyForProduct;
                    ingredientsMap[key].totalCost += totalCostForProduct;
                    ingredientsMap[key].usedIn.push({
                        productName: producto.nombre,
                        productQuantity: producto.cantidad,
                        recetaId: producto.recetaId || producto.Receta || 'N/A',
                        qtyPerUnit: qtyPerUnit,
                        totalQty: totalQtyForProduct,
                        unitPrice: normUnitPrice,
                        totalCost: totalCostForProduct,
                        unit: unit
                    });

                    // If it is an internal production (sub-recipe), resolve its nested raw materials!
                    if (isInternal && itemId) {
                        const subIngredients = processSubRecipe(itemId, totalQtyForProduct, producto.nombre, producto.cantidad, qtyPerUnit);
                        ingredientsMap[key].subIngredients = subIngredients;

                        if (!internalProdMap[key]) {
                            internalProdMap[key] = {
                                id: itemId,
                                recipeId: linkedRecipe?._id || null,
                                name: ingName,
                                unit: unit,
                                totalVolume: 0,
                                unitPrice: normUnitPrice,
                                totalCost: 0,
                                subIngredients
                            };
                        }
                        internalProdMap[key].totalVolume += totalQtyForProduct;
                        internalProdMap[key].totalCost += totalCostForProduct;
                    }
                });
            }

            reports.push({
                id: producto.id || producto._id,
                nombre: producto.nombre,
                recetaId: producto.recetaId || producto.Receta,
                cantidad: producto.cantidad,
                totalIngreso: producto.totalIngreso || (producto.precio || 0) * (producto.cantidad || 0),
                costoMaterialTotal: productMaterialCost,
                costoMaterialUnitario: producto.cantidad > 0 ? productMaterialCost / producto.cantidad : 0
            });
        });

        let list = Object.values(ingredientsMap);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(i => i.name.toLowerCase().includes(term));
        }

        if (typeFilter === 'raw') {
            list = list.filter(i => !i.isInternalProduction);
        } else if (typeFilter === 'internal') {
            list = list.filter(i => i.isInternalProduction);
        }

        list.sort((a, b) => b.totalCost - a.totalCost);

        return {
            aggregatedIngredients: list,
            internalProductionsSummary: Object.values(internalProdMap),
            productReports: reports
        };
    }, [activeProductos, itemsMap, produccionMap, findRecipeForProduct, allItems, allProduccion, searchTerm, typeFilter]);

    // Handle Open Box Icon Modal
    const handleOpenItemModal = (e, itemId) => {
        e.stopPropagation();
        if (itemId) {
            window.open(`/item/${itemId}`, '_blank');
        }
    };

    const handleOpenRecipeModal = (e, recipeId) => {
        e.stopPropagation();
        if (recipeId && recipeId !== 'N/A') {
            window.open(`/receta/${recipeId}`, '_blank');
        }
    };

    // Calculate Global Total Estimated Cost strictly on primitive raw materials to avoid double-counting sub-recipes
    const totalEstimatedCost = useMemo(() => {
        return aggregatedIngredients
            .filter(ing => !ing.isInternalProduction)
            .reduce((acc, curr) => acc + curr.totalCost, 0);
    }, [aggregatedIngredients]);

    const activePeriodLabel = useMemo(() => {
        if (filterSource === 'model') return `${storedData?.monthName || ''} ${storedData?.year || ''}`;
        if (timeframe === 'month') return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
        if (timeframe === 'week') return `Semana ${selectedWeek} de ${selectedYear}`;
        return `Año ${selectedYear}`;
    }, [filterSource, storedData, timeframe, selectedMonth, selectedYear, selectedWeek]);

    if (!activeProductos || activeProductos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 font-sans p-4">
                <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md border border-gray-200">
                    <Package className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">No hay datos de ventas disponibles</h2>
                    <p className="text-gray-500 text-sm mb-6">Regresa al Modelo de Proyecto o selecciona otro período de ventas en el filtro superior.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                        Volver al Modelo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & KPI Banner */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                                title="Volver"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <ChefHat className="text-orange-500" size={28} />
                                    Gastos Calculados de Materiales
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    Explosión de insumos basada en ventas de <span className="font-bold text-blue-600">{activePeriodLabel}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 bg-blue-50 px-6 py-3 rounded-lg border border-blue-100">
                            <div className="text-center">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Total Insumos</p>
                                <p className="text-2xl font-bold text-blue-800">{aggregatedIngredients.length}</p>
                            </div>
                            <div className="w-px h-8 bg-blue-200"></div>
                            <div className="text-center">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Costo Estimado Global</p>
                                <p className="text-2xl font-bold text-blue-800">
                                    {formatCurrency(totalEstimatedCost)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls & Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-100">
                        {/* Source switch: Model vs Historical DB */}
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFilterSource('model')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    filterSource === 'model'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Modelo Actual ({storedData?.monthName || 'Mes'})
                            </button>
                            <button
                                onClick={() => setFilterSource('db')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    filterSource === 'db'
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Base de Datos (Ventas Reales)
                            </button>
                        </div>

                        {/* Period Selector when DB is active */}
                        {filterSource === 'db' && (
                            <div className="flex items-center gap-2 text-xs">
                                <select
                                    value={timeframe}
                                    onChange={(e) => setTimeframe(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-bold"
                                >
                                    <option value="month">Por Mes</option>
                                    <option value="week">Por Semana</option>
                                    <option value="year">Por Año</option>
                                </select>

                                {timeframe === 'month' && (
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-bold"
                                    >
                                        {MONTH_NAMES.map((name, idx) => (
                                            <option key={idx} value={idx}>{name}</option>
                                        ))}
                                    </select>
                                )}

                                {timeframe === 'week' && (
                                    <select
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-bold"
                                    >
                                        {Array.from({ length: 53 }, (_, i) => i + 1).map(w => (
                                            <option key={w} value={w}>Semana {w}</option>
                                        ))}
                                    </select>
                                )}

                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-bold"
                                >
                                    <option value={2026}>2026</option>
                                    <option value={2025}>2025</option>
                                    <option value={2024}>2024</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Search and Category/Type Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1 min-w-[240px] relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar insumo o sub-receta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-bold text-gray-600">
                            <button
                                onClick={() => setTypeFilter('all')}
                                className={`px-3 py-1.5 rounded-md ${typeFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setTypeFilter('raw')}
                                className={`px-3 py-1.5 rounded-md ${typeFilter === 'raw' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
                            >
                                Materia Prima
                            </button>
                            <button
                                onClick={() => setTypeFilter('internal')}
                                className={`px-3 py-1.5 rounded-md ${typeFilter === 'internal' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
                            >
                                Producciones Internas
                            </button>
                        </div>
                    </div>
                </div>

                {/* THE ORIGINAL CARDS LAYOUT (PRESERVED & ENHANCED WITH BOX ICONS & SUB-RECIPES) */}
                <div className="grid grid-cols-1 gap-6">
                    {aggregatedIngredients.map((ingrediente, index) => {
                        const isExpanded = !!expandedCards[index];

                        return (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                {/* Card Header */}
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg border border-gray-200 text-orange-500 flex items-center justify-center">
                                            {ingrediente.isInternalProduction ? <Factory size={20} className="text-purple-600" /> : <ChefHat size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-gray-800 capitalize">{ingrediente.name.toLowerCase()}</h3>
                                                
                                                {/* BOX ICON BUTTON 📦 FOR ITEM MODAL */}
                                                <button
                                                    onClick={(e) => handleOpenItemModal(e, ingrediente.id)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-flex items-center justify-center"
                                                    title={`Abrir ${ingrediente.name} en Modal de Ítem (/item/${ingrediente.id})`}
                                                >
                                                    <Package size={18} className="text-blue-600" />
                                                </button>

                                                {/* DEEP ANALYSIS INSPECTOR BUTTON */}
                                                <button
                                                    onClick={() => setSelectedDetailModal(ingrediente)}
                                                    className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors inline-flex items-center justify-center text-xs font-bold gap-1 border border-purple-200 px-2 py-0.5 rounded-md"
                                                    title="Ver Análisis Financiero a Profundidad y Cobertura Completa"
                                                >
                                                    <Activity size={14} /> Profundizar Análisis
                                                </button>

                                                {ingrediente.isInternalProduction && (
                                                    <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                                        Sub-receta Interna
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                                                <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-medium">
                                                    {ingrediente.unit || 'un'}
                                                </span>
                                                {ingrediente.unitPrice > 0 && (
                                                    <span className="text-gray-500 font-mono">
                                                        Costo Almacén: {formatCurrency(ingrediente.unitPrice)} / {ingrediente.unit}
                                                    </span>
                                                )}
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
                                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Costo Estimado Global</p>
                                                <p className="text-xl font-bold text-orange-600">
                                                    {formatCurrency(ingrediente.totalCost)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Breakdown by Product/Preparation Table */}
                                <div className="p-4 space-y-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desglose por Preparación (Ventas & Gasto por Plato)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-400 border-b border-gray-100 text-xs uppercase font-semibold">
                                                    <th className="pb-2 pl-2">Producto / Preparación</th>
                                                    <th className="pb-2 text-center">Ventas</th>
                                                    <th className="pb-2 text-right">Cant. x Plato</th>
                                                    <th className="pb-2 text-right">Consumo Total</th>
                                                    <th className="pb-2 text-right">Costo Unit.</th>
                                                    <th className="pb-2 text-right pr-2">Gasto Subtotal</th>
                                                    <th className="pb-2 text-center">% Consumo</th>
                                                    <th className="pb-2 text-center w-10">Modal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {ingrediente.usedIn.map((usage, idx) => {
                                                    const rowTotalQty = usage.totalQty || (usage.productQuantity * usage.qtyPerUnit);
                                                    const rowUnitCost = usage.unitPrice || ingrediente.unitPrice || 0;
                                                    const rowTotalCost = rowTotalQty * rowUnitCost;
                                                    const pctUsage = ingrediente.totalQuantity > 0 ? (rowTotalQty / ingrediente.totalQuantity) * 100 : 0;

                                                    return (
                                                        <tr key={idx} className="group hover:bg-blue-50/30 transition-colors text-xs">
                                                            <td className="py-2.5 pl-2 font-bold text-gray-800 flex items-center gap-2">
                                                                <span>{usage.productName}</span>
                                                                {usage.subRecipeName && (
                                                                    <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                                                                        <GitCommit size={10} /> vía {usage.subRecipeName}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 text-center text-gray-600 font-medium">{usage.productQuantity}</td>
                                                            <td className="py-2.5 text-right font-mono text-gray-600">
                                                                {usage.qtyPerUnit.toLocaleString('es-CO', { maximumFractionDigits: 3 })} {ingrediente.unit}
                                                            </td>
                                                            <td className="py-2.5 text-right font-mono font-bold text-gray-800">
                                                                {rowTotalQty.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {ingrediente.unit}
                                                            </td>
                                                            <td className="py-2.5 text-right font-mono text-gray-500">
                                                                {formatCurrency(rowUnitCost)}
                                                            </td>
                                                            <td className="py-2.5 text-right pr-2 font-mono font-bold text-orange-600">
                                                                {formatCurrency(rowTotalCost)}
                                                            </td>
                                                            <td className="py-2.5 text-center font-bold text-blue-700">
                                                                {pctUsage.toFixed(1)}%
                                                            </td>
                                                            <td className="py-2.5 text-center">
                                                                {/* BOX ICON BUTTON 📦 FOR RECIPE MODAL */}
                                                                <button
                                                                    onClick={(e) => handleOpenRecipeModal(e, usage.recetaId)}
                                                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors inline-flex items-center justify-center"
                                                                    title={`Abrir Receta de ${usage.productName} (/receta/${usage.recetaId})`}
                                                                >
                                                                    <Package size={15} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Nested Sub-recipe breakdown if this is an internal production */}
                                    {ingrediente.isInternalProduction && ingrediente.subIngredients && ingrediente.subIngredients.length > 0 && (
                                        <div className="mt-3 bg-purple-50/40 p-3 rounded-lg border border-purple-100 space-y-2">
                                            <div
                                                onClick={() => setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }))}
                                                className="flex items-center justify-between cursor-pointer font-bold text-xs text-purple-900"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <Factory size={14} className="text-purple-600" /> Desglose Recursivo de la Sub-receta ({ingrediente.subIngredients.length} ingredientes primitivos)
                                                </span>
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </div>

                                            {isExpanded && (
                                                <div className="overflow-x-auto pt-2">
                                                    <table className="w-full text-xs text-left bg-white rounded border border-purple-100">
                                                        <thead className="bg-purple-100/50 text-purple-900 font-bold uppercase text-[10px]">
                                                            <tr>
                                                                <th className="p-2">Ingrediente Primitivo</th>
                                                                <th className="p-2 text-right">Cant. x Porción</th>
                                                                <th className="p-2 text-right">Cant. Total Sub-receta</th>
                                                                <th className="p-2 text-right">Precio Unit.</th>
                                                                <th className="p-2 text-right pr-2">Costo Subtotal</th>
                                                                <th className="p-2 text-center w-10">Modal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-purple-50">
                                                            {ingrediente.subIngredients.map((sub, sIdx) => (
                                                                <tr key={sIdx} className="hover:bg-purple-50/30">
                                                                    <td className="p-2 font-bold text-gray-800">{sub.name}</td>
                                                                    <td className="p-2 text-right text-gray-500">
                                                                        {sub.qtyPerUnit.toLocaleString('es-CO', { maximumFractionDigits: 3 })} {sub.unit}
                                                                    </td>
                                                                    <td className="p-2 text-right font-bold text-purple-900">
                                                                        {sub.totalQty.toLocaleString('es-CO', { maximumFractionDigits: 3 })} {sub.unit}
                                                                    </td>
                                                                    <td className="p-2 text-right text-gray-500">{formatCurrency(sub.unitPrice)}</td>
                                                                    <td className="p-2 text-right pr-2 font-bold text-orange-600">{formatCurrency(sub.totalCost)}</td>
                                                                    <td className="p-2 text-center">
                                                                        <button
                                                                            onClick={(e) => handleOpenItemModal(e, sub.id)}
                                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded inline-flex items-center justify-center"
                                                                            title={`Abrir Ítem en Modal (/item/${sub.id})`}
                                                                        >
                                                                            <Package size={14} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* DEEP FINANCIAL ANALYSIS MODAL */}
            {selectedDetailModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl font-sans border border-gray-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                                    <Activity size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold text-gray-800 capitalize">{selectedDetailModal.name}</h3>
                                        <button
                                            onClick={(e) => handleOpenItemModal(e, selectedDetailModal.id)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Abrir Ítem Modal 📦"
                                        >
                                            <Package size={20} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Análisis financiero detallado de consumo, valor por plato, costo unitario y cobertura de recetas.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDetailModal(null)}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* KPI Metrics Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                                <span className="font-bold text-blue-600 block uppercase text-[10px]">Costo Unitario Almacén</span>
                                <span className="font-bold text-blue-900 text-lg">{formatCurrency(selectedDetailModal.unitPrice || 0)}</span>
                                <span className="text-[10px] text-blue-500 block">por {selectedDetailModal.unit}</span>
                            </div>
                            <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl">
                                <span className="font-bold text-purple-600 block uppercase text-[10px]">Consumo Global Requerido</span>
                                <span className="font-bold text-purple-900 text-lg">
                                    {selectedDetailModal.totalQuantity.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-purple-500 block">{selectedDetailModal.unit} totales</span>
                            </div>
                            <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl">
                                <span className="font-bold text-amber-600 block uppercase text-[10px]">Gasto Total Incurrido</span>
                                <span className="font-bold text-amber-900 text-lg">{formatCurrency(selectedDetailModal.totalCost)}</span>
                                <span className="text-[10px] text-amber-500 block">Costo total insumo</span>
                            </div>
                            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                                <span className="font-bold text-emerald-600 block uppercase text-[10px]">Platos que lo Utilizan</span>
                                <span className="font-bold text-emerald-900 text-lg">{selectedDetailModal.usedIn.length}</span>
                                <span className="text-[10px] text-emerald-500 block">Preparaciones en menú</span>
                            </div>
                        </div>

                        {/* RUTA DE USO Y COBERTURA COMPLETA MULTI-COLUMN TABLE */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                    <PieChart size={18} className="text-purple-600" />
                                    Ruta de Uso y Cobertura Financiera Completa
                                </h4>
                                <span className="text-xs text-gray-500 font-medium">
                                    {selectedDetailModal.usedIn.length} preparaciones analizadas
                                </span>
                            </div>

                            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-100/70 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="p-3">Producto / Preparación</th>
                                            <th className="p-3 text-center">Ventas (Platos)</th>
                                            <th className="p-3 text-right">Cant. x Plato</th>
                                            <th className="p-3 text-right">Consumo Total</th>
                                            <th className="p-3 text-right">Costo Unit. Insumo</th>
                                            <th className="p-3 text-right pr-3">Gasto Subtotal (COP)</th>
                                            <th className="p-3 text-center">% Participación</th>
                                            <th className="p-3 text-center w-12">Modal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedDetailModal.usedIn.map((usage, idx) => {
                                            const salesCount = usage.productQuantity || 1;
                                            const qtyPerPortion = usage.qtyPerUnit || 0;
                                            const totalQtyRow = usage.totalQty || (salesCount * qtyPerPortion);
                                            const unitPrice = usage.unitPrice || selectedDetailModal.unitPrice || 0;
                                            const totalCostRow = totalQtyRow * unitPrice;
                                            const pctUsage = selectedDetailModal.totalQuantity > 0 
                                                ? (totalQtyRow / selectedDetailModal.totalQuantity) * 100 
                                                : 0;

                                            return (
                                                <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                                                    <td className="p-3 font-bold text-gray-800">
                                                        <div className="flex items-center gap-2">
                                                            <span>{usage.productName}</span>
                                                            {usage.subRecipeName && (
                                                                <span className="text-[10px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                                                                    <GitCommit size={10} /> vía {usage.subRecipeName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center font-semibold text-gray-600">
                                                        {salesCount} {salesCount === 1 ? 'plato' : 'platos'}
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-semibold text-gray-700">
                                                        {qtyPerPortion.toLocaleString('es-CO', { maximumFractionDigits: 3 })} {selectedDetailModal.unit} / porción
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-bold text-gray-900">
                                                        {totalQtyRow.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {selectedDetailModal.unit}
                                                    </td>
                                                    <td className="p-3 text-right font-mono text-gray-500">
                                                        {formatCurrency(unitPrice)}
                                                    </td>
                                                    <td className="p-3 text-right pr-3 font-mono font-bold text-orange-600">
                                                        {formatCurrency(totalCostRow)}
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-purple-700">
                                                        {pctUsage.toFixed(1)}%
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={(e) => handleOpenRecipeModal(e, usage.recetaId)}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded inline-flex items-center justify-center"
                                                            title={`Abrir Receta Modal (/receta/${usage.recetaId})`}
                                                        >
                                                            <Package size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="text-xs text-gray-500">
                                ID Supabase: <span className="font-mono text-gray-700 font-bold">{selectedDetailModal.id}</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (selectedDetailModal.isInternalProduction) {
                                        window.open(`/receta/${selectedDetailModal.recipeId || selectedDetailModal.id}`, '_blank');
                                    } else {
                                        window.open(`/item/${selectedDetailModal.id}`, '_blank');
                                    }
                                }}
                                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Package size={16} /> Abrir Ítem en Modal Dedicado
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Copy Button */}
            <ReportCopyButton 
                title={`Gastos Materiales ${activePeriodLabel}`}
                type="gastos-materiales"
                data={aggregatedIngredients}
            />
        </div>
    );
};

export default GastosCalculadosMateriales;
