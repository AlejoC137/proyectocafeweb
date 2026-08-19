import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllFromTable } from '@/redux/actions/tableActions';
import {
  VENTAS,
  COMPRAS,
  MENU,
  ITEMS,
  PRODUCCION,
  RECETAS_MENU,
  RECETAS_PRODUCCION
} from '@/redux/actions-types';

// Helper: Calculate ISO Week Number
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Helper: Get Start and End dates for a given Year and Week number
export function getWeekDateRange(year, weekNum) {
  const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4 && dow > 0) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else if (dow === 0) {
    ISOweekStart.setDate(simple.getDate() - 6);
  } else {
    ISOweekStart.setDate(simple.getDate() + (8 - simple.getDay()));
  }
  ISOweekStart.setHours(0, 0, 0, 0);

  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
  ISOweekEnd.setHours(23, 59, 59, 999);

  return { start: ISOweekStart, end: ISOweekEnd };
}

export function useGastosCalculados(initialStateData = null) {
  const dispatch = useDispatch();

  // Redux Data
  const allVentas = useSelector(state => state.allVentas || []);
  const allCompras = useSelector(state => state.allCompras || []);
  const allMenu = useSelector(state => state.allMenu || []);
  const allItems = useSelector(state => state.allItems || []);
  const allProduccion = useSelector(state => state.allProduccion || []);
  const allRecetasMenu = useSelector(state => state.allRecetasMenu || []);
  const allRecetasProduccion = useSelector(state => state.allRecetasProduccion || []);

  const [loadingData, setLoadingData] = useState(false);

  // Auto-fetch tables from Supabase if Redux store is empty
  useEffect(() => {
    const loadMissingTables = async () => {
      setLoadingData(true);
      const promises = [];
      if (!allMenu.length) promises.push(dispatch(getAllFromTable(MENU)));
      if (!allItems.length) promises.push(dispatch(getAllFromTable(ITEMS)));
      if (!allProduccion.length) promises.push(dispatch(getAllFromTable(PRODUCCION)));
      if (!allRecetasMenu.length) promises.push(dispatch(getAllFromTable(RECETAS_MENU)));
      if (!allRecetasProduccion.length) promises.push(dispatch(getAllFromTable(RECETAS_PRODUCCION)));
      if (!allVentas.length) promises.push(dispatch(getAllFromTable(VENTAS)));
      if (!allCompras.length) promises.push(dispatch(getAllFromTable(COMPRAS)));

      if (promises.length > 0) {
        try {
          await Promise.all(promises);
        } catch (e) {
          console.error("Error loading Supabase tables for GastosCalculados:", e);
        }
      }
      setLoadingData(false);
    };

    loadMissingTables();
  }, [
    dispatch,
    allMenu.length,
    allItems.length,
    allProduccion.length,
    allRecetasMenu.length,
    allRecetasProduccion.length,
    allVentas.length,
    allCompras.length
  ]);

  // Filter States
  const now = new Date();
  const [sourceMode, setSourceMode] = useState(initialStateData ? 'simulated' : 'historical'); // 'historical' | 'simulated'
  const [timeframeMode, setTimeframeMode] = useState('month'); // 'year' | 'month' | 'week' | 'custom'
  const [selectedYear, setSelectedYear] = useState(initialStateData?.year || now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    initialStateData?.monthName 
      ? ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"].indexOf(initialStateData.monthName.toLowerCase())
      : now.getMonth()
  );
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(now));
  const [customStartDate, setCustomStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(now.toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientTypeFilter, setIngredientTypeFilter] = useState('all'); // 'all' | 'raw' | 'internal'

  // Maps for ultra-fast lookup
  const itemsMap = useMemo(() => {
    const map = {};
    allItems.forEach(item => { if (item?._id) map[item._id] = item; });
    return map;
  }, [allItems]);

  const produccionMap = useMemo(() => {
    const map = {};
    allProduccion.forEach(item => { if (item?._id) map[item._id] = item; });
    return map;
  }, [allProduccion]);

  const menuMap = useMemo(() => {
    const map = {};
    allMenu.forEach(item => { if (item?._id) map[item._id] = item; });
    return map;
  }, [allMenu]);

  // Helper to match a product or item to its recipe
  const findRecipe = useCallback((productId, recipeId, productName) => {
    if (recipeId && recipeId !== 'N/A') {
      const found = allRecetasMenu.find(r => r._id === recipeId) || allRecetasProduccion.find(r => r._id === recipeId);
      if (found) return found;
    }
    if (productId) {
      const foundByFor = allRecetasMenu.find(r => r.forId === productId) || allRecetasProduccion.find(r => r.forId === productId);
      if (foundByFor) return foundByFor;
    }
    if (productName) {
      const norm = productName.toLowerCase().trim();
      const foundByName = allRecetasMenu.find(r => r.legacyName?.toLowerCase().trim() === norm) ||
                          allRecetasProduccion.find(r => r.legacyName?.toLowerCase().trim() === norm);
      if (foundByName) return foundByName;
    }
    return null;
  }, [allRecetasMenu, allRecetasProduccion]);

  // Extract raw ingredients and internal production entries from a single recipe
  const extractRecipeComponents = useCallback((recipe) => {
    if (!recipe) return [];
    const components = [];

    // 1. Raw items (item_1..30)
    for (let i = 1; i <= 30; i++) {
      const idKey = `item_${i}_Id`;
      const qtyKey = `item_${i}_Cuantity_Units`;
      const itemId = recipe[idKey];
      const qtyRaw = recipe[qtyKey];

      if (itemId) {
        let quantity = 0;
        let unit = '';
        if (qtyRaw) {
          try {
            const parsed = typeof qtyRaw === 'string' ? JSON.parse(qtyRaw) : qtyRaw;
            quantity = parseFloat(parsed?.metric?.cuantity || parsed?.cuantity || 0);
            unit = parsed?.metric?.units || parsed?.units || '';
          } catch (e) {
            quantity = parseFloat(qtyRaw) || 0;
          }
        }
        const itemMaster = itemsMap[itemId];
        const name = itemMaster?.Nombre_del_producto || itemMaster?.Nombre || recipe[`item_${i}_Name`] || 'Insumo Desconocido';
        const price = parseFloat(itemMaster?.precioUnitario || itemMaster?.costoPromedio || 0);
        const masterUnit = unit || itemMaster?.UNIDADES || itemMaster?.metric || '';

        components.push({
          id: itemId,
          key: idKey,
          type: 'raw',
          name,
          quantityPerUnit: quantity,
          unit: masterUnit,
          unitPrice: price,
          source: 'itemAlmacen'
        });
      }
    }

    // 2. Internal Production items (producto_interno_1..20)
    for (let i = 1; i <= 20; i++) {
      const idKey = `producto_interno_${i}_Id`;
      const qtyKey = `producto_interno_${i}_Cuantity_Units`;
      const prodId = recipe[idKey];
      const qtyRaw = recipe[qtyKey];

      if (prodId) {
        let quantity = 0;
        let unit = '';
        if (qtyRaw) {
          try {
            const parsed = typeof qtyRaw === 'string' ? JSON.parse(qtyRaw) : qtyRaw;
            quantity = parseFloat(parsed?.metric?.cuantity || parsed?.cuantity || 0);
            unit = parsed?.metric?.units || parsed?.units || '';
          } catch (e) {
            quantity = parseFloat(qtyRaw) || 0;
          }
        }
        const prodMaster = produccionMap[prodId] || itemsMap[prodId];
        const name = prodMaster?.Nombre_del_producto || prodMaster?.Nombre || 'Producción Interna';
        const price = parseFloat(prodMaster?.precioUnitario || prodMaster?.COSTO || 0);
        const masterUnit = unit || prodMaster?.UNIDADES || prodMaster?.metric || '';

        components.push({
          id: prodId,
          key: idKey,
          type: 'internal',
          name,
          quantityPerUnit: quantity,
          unit: masterUnit,
          unitPrice: price,
          source: 'itemProduccion'
        });
      }
    }

    return components;
  }, [itemsMap, produccionMap]);

  // Helper to parse yield / batch info from recipe
  const parseRecipeYield = (recipe) => {
    if (!recipe || !recipe.rendimiento) return 1;
    try {
      const rend = typeof recipe.rendimiento === 'string' ? JSON.parse(recipe.rendimiento) : recipe.rendimiento;
      const cant = parseFloat(rend?.cantidad || rend?.cant || 0);
      return cant > 0 ? cant : 1;
    } catch (e) {
      return 1;
    }
  };

  // RECURSIVE RECIPE RESOLUTION ENGINE
  const resolveRecipeRecursive = useCallback((productOrRecipe, multiplier = 1, visitedSet = new Set(), depth = 0) => {
    const recipe = productOrRecipe._id && (allRecetasMenu.some(r => r._id === productOrRecipe._id) || allRecetasProduccion.some(r => r._id === productOrRecipe._id))
      ? productOrRecipe
      : findRecipe(productOrRecipe.id || productOrRecipe._id, productOrRecipe.recetaId || productOrRecipe.Receta, productOrRecipe.nombre || productOrRecipe.NombreES);

    const productName = productOrRecipe.nombre || productOrRecipe.NombreES || productOrRecipe.legacyName || productOrRecipe.Nombre_del_producto || "Producto";

    if (!recipe) {
      return {
        id: productOrRecipe._id || productOrRecipe.id || 'no_id',
        recipeId: productOrRecipe.recetaId || productOrRecipe.Receta || null,
        name: productName,
        type: 'product',
        recipeFound: false,
        multiplier,
        unitCost: 0,
        totalCost: 0,
        depth,
        children: []
      };
    }

    if (visitedSet.has(recipe._id)) {
      // Prevent circular infinite loop recursion
      return {
        id: recipe._id,
        recipeId: recipe._id,
        name: `${productName} (Ciclo Detectado)`,
        type: 'circular_reference',
        recipeFound: true,
        multiplier,
        unitCost: 0,
        totalCost: 0,
        depth,
        children: []
      };
    }

    const newVisited = new Set(visitedSet);
    newVisited.add(recipe._id);

    const recipeYield = parseRecipeYield(recipe);
    const components = extractRecipeComponents(recipe);

    let totalRecipeUnitCost = 0;

    const childrenNodes = components.map(comp => {
      const totalQtyForParent = (comp.quantityPerUnit / recipeYield) * multiplier;

      if (comp.type === 'raw') {
        const componentTotalCost = totalQtyForParent * comp.unitPrice;
        totalRecipeUnitCost += (comp.quantityPerUnit / recipeYield) * comp.unitPrice;

        return {
          id: comp.id,
          name: comp.name,
          type: 'raw',
          quantityPerUnit: comp.quantityPerUnit / recipeYield,
          totalQuantity: totalQtyForParent,
          unit: comp.unit,
          unitPrice: comp.unitPrice,
          totalCost: componentTotalCost,
          depth: depth + 1,
          children: []
        };
      } else {
        // Internal production -> Recurse into sub-recipe!
        const subProdMaster = produccionMap[comp.id] || itemsMap[comp.id] || { _id: comp.id, Nombre_del_producto: comp.name };
        const subResult = resolveRecipeRecursive(subProdMaster, totalQtyForParent, newVisited, depth + 1);

        // If sub-recipe has calculated unit cost, use it, else fallback to subProdMaster unitPrice
        const effectiveSubUnitPrice = subResult.unitCost > 0 ? subResult.unitCost : comp.unitPrice;
        const componentTotalCost = totalQtyForParent * effectiveSubUnitPrice;
        totalRecipeUnitCost += (comp.quantityPerUnit / recipeYield) * effectiveSubUnitPrice;

        return {
          id: comp.id,
          recipeId: subResult.recipeId || subProdMaster.Receta || null,
          name: comp.name,
          type: 'internal',
          quantityPerUnit: comp.quantityPerUnit / recipeYield,
          totalQuantity: totalQtyForParent,
          unit: comp.unit,
          unitPrice: effectiveSubUnitPrice,
          totalCost: componentTotalCost,
          depth: depth + 1,
          recipeFound: subResult.recipeFound,
          subTree: subResult,
          children: subResult.children
        };
      }
    });

    return {
      id: productOrRecipe.id || productOrRecipe._id || recipe._id,
      recipeId: recipe._id,
      name: productName,
      type: depth === 0 ? 'menu_product' : 'internal_production',
      recipeFound: true,
      multiplier,
      unitCost: totalRecipeUnitCost,
      totalCost: totalRecipeUnitCost * multiplier,
      depth,
      children: childrenNodes
    };
  }, [allRecetasMenu, allRecetasProduccion, findRecipe, extractRecipeComponents, produccionMap, itemsMap]);

  // Filter Sales data from Supabase according to Timeframe and Products
  const filteredSalesData = useMemo(() => {
    if (sourceMode === 'simulated' && initialStateData?.productos) {
      return initialStateData.productos.map(p => ({
        id: p._id || p.id,
        nombre: p.nombre || p.NombreES,
        cantidad: parseFloat(p.cantidad || 0),
        totalIngreso: parseFloat(p.totalIngreso || (p.precio || 0) * (p.cantidad || 0) || 0),
        recetaId: p.recetaId || p.Receta || 'N/A'
      }));
    }

    if (!allVentas || !allVentas.length) return [];

    let startCutoff, endCutoff;
    if (timeframeMode === 'year') {
      startCutoff = new Date(selectedYear, 0, 1, 0, 0, 0);
      endCutoff = new Date(selectedYear, 11, 31, 23, 59, 59);
    } else if (timeframeMode === 'month') {
      startCutoff = new Date(selectedYear, selectedMonth, 1, 0, 0, 0);
      endCutoff = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    } else if (timeframeMode === 'week') {
      const range = getWeekDateRange(selectedYear, selectedWeek);
      startCutoff = range.start;
      endCutoff = range.end;
    } else if (timeframeMode === 'custom') {
      startCutoff = new Date(customStartDate + 'T00:00:00');
      endCutoff = new Date(customEndDate + 'T23:59:59');
    }

    const mapProductos = {};

    allVentas.forEach(venta => {
      if (!venta || (!venta.Pagado && venta.Pagado !== undefined)) return;
      const rawDate = venta.Date || venta.created_at || venta.date;
      if (!rawDate) return;
      const vDate = new Date(rawDate);
      if (isNaN(vDate.getTime())) return;

      if (vDate < startCutoff || vDate > endCutoff) return;

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

        const recetaId = p.Receta || p.recetaId || menuMap[p._id]?.Receta || 'N/A';
        const key = name.trim().toLowerCase();

        if (!mapProductos[key]) {
          mapProductos[key] = {
            id: p._id || key,
            nombre: name,
            cantidad: 0,
            totalIngreso: 0,
            recetaId: recetaId
          };
        }
        mapProductos[key].cantidad += qty;
        mapProductos[key].totalIngreso += (price * qty);
      });
    });

    let result = Object.values(mapProductos);

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => {
        const menuObj = allMenu.find(m => m.NombreES?.toLowerCase() === p.nombre.toLowerCase());
        return menuObj && (menuObj.GRUPO === selectedCategory || menuObj.CATEGORIA === selectedCategory);
      });
    }

    // Filter by Product
    if (selectedProduct !== 'all') {
      result = result.filter(p => p.nombre.toLowerCase() === selectedProduct.toLowerCase());
    }

    return result;
  }, [
    sourceMode,
    initialStateData,
    allVentas,
    timeframeMode,
    selectedYear,
    selectedMonth,
    selectedWeek,
    customStartDate,
    customEndDate,
    menuMap,
    selectedCategory,
    selectedProduct,
    allMenu
  ]);

  // COMPREHENSIVE RECURSIVE CALCULATION OF ALL INGREDIENTS AND SUB-RECETAS
  const calculatedData = useMemo(() => {
    const rawMaterialsMap = {};
    const internalProductionsMap = {};
    const recipeTrees = [];
    const productReports = [];

    let totalGlobalRevenue = 0;
    let totalGlobalMaterialCost = 0;

    // Helper to recursively walk trees and aggregate primitives
    const walkTreeForAggregation = (node, parentProductName) => {
      if (!node) return;

      if (node.type === 'raw') {
        const key = (node.name || 'Desconocido').trim().toLowerCase();
        if (!rawMaterialsMap[key]) {
          rawMaterialsMap[key] = {
            id: node.id,
            name: node.name,
            unit: node.unit || 'Unidad',
            totalQuantity: 0,
            unitPrice: node.unitPrice,
            totalCost: 0,
            usedIn: []
          };
        }
        rawMaterialsMap[key].totalQuantity += node.totalQuantity;
        rawMaterialsMap[key].totalCost += node.totalCost;
        rawMaterialsMap[key].usedIn.push({
          productName: parentProductName,
          qty: node.totalQuantity,
          unit: node.unit
        });
      } else if (node.type === 'internal') {
        const key = (node.name || 'Producción Interna').trim().toLowerCase();
        if (!internalProductionsMap[key]) {
          internalProductionsMap[key] = {
            id: node.id,
            recipeId: node.recipeId,
            name: node.name,
            unit: node.unit || 'Unidad',
            totalQuantityNeeded: 0,
            unitPrice: node.unitPrice,
            totalCost: 0,
            usedIn: [],
            subTree: node.subTree
          };
        }
        internalProductionsMap[key].totalQuantityNeeded += node.totalQuantity;
        internalProductionsMap[key].totalCost += node.totalCost;
        if (!internalProductionsMap[key].recipeId && node.recipeId) {
          internalProductionsMap[key].recipeId = node.recipeId;
        }
        internalProductionsMap[key].usedIn.push({
          productName: parentProductName,
          qty: node.totalQuantity,
          unit: node.unit
        });

        // Recurse into children of internal production
        if (node.children && node.children.length) {
          node.children.forEach(child => walkTreeForAggregation(child, `${parentProductName} ➔ ${node.name}`));
        }
      }
    };

    filteredSalesData.forEach(producto => {
      totalGlobalRevenue += producto.totalIngreso;

      const tree = resolveRecipeRecursive(producto, producto.cantidad);
      recipeTrees.push(tree);

      totalGlobalMaterialCost += tree.totalCost;

      productReports.push({
        id: producto.id,
        nombre: producto.nombre,
        recetaId: tree.recipeId || producto.recetaId,
        cantidadVendida: producto.cantidad,
        totalIngreso: producto.totalIngreso,
        costoUnitarioReceta: tree.unitCost,
        costoTotalInsumos: tree.totalCost,
        utilidadBruta: producto.totalIngreso - tree.totalCost,
        margenPorcentaje: producto.totalIngreso > 0 ? ((producto.totalIngreso - tree.totalCost) / producto.totalIngreso) * 100 : 0,
        tree
      });

      // Walk tree to aggregate primitives
      if (tree.children && tree.children.length) {
        tree.children.forEach(child => walkTreeForAggregation(child, producto.nombre));
      }
    });

    let rawList = Object.values(rawMaterialsMap);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rawList = rawList.filter(r => r.name.toLowerCase().includes(term));
    }
    if (ingredientTypeFilter === 'raw') {
      rawList = rawList.filter(r => r.unitPrice > 0);
    }
    rawList.sort((a, b) => b.totalCost - a.totalCost);

    let internalList = Object.values(internalProductionsMap);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      internalList = internalList.filter(i => i.name.toLowerCase().includes(term));
    }
    internalList.sort((a, b) => b.totalCost - a.totalCost);

    return {
      totalGlobalRevenue,
      totalGlobalMaterialCost,
      rawMaterialsList: rawList,
      internalProductionsList: internalList,
      recipeTrees,
      productReports
    };
  }, [filteredSalesData, resolveRecipeRecursive, searchTerm, ingredientTypeFilter]);

  // DATABASE DIAGNOSTICS & AUDIT
  const dbAudit = useMemo(() => {
    const missingPricesInItems = allItems.filter(i => !parseFloat(i.precioUnitario || i.costoPromedio || 0));
    const missingRecipesInMenu = allMenu.filter(m => !m.Receta && !allRecetasMenu.some(r => r.forId === m._id));
    const unlinkedInternalProductions = allProduccion.filter(p => !p.Receta && !allRecetasProduccion.some(r => r.forId === p._id));

    return {
      missingPricesCount: missingPricesInItems.length,
      missingRecipesCount: missingRecipesInMenu.length,
      unlinkedInternalProductionsCount: unlinkedInternalProductions.length,
      missingPricesInItems,
      missingRecipesInMenu,
      unlinkedInternalProductions
    };
  }, [allItems, allMenu, allProduccion, allRecetasMenu, allRecetasProduccion]);

  // Categories list for filter dropdown
  const categoriesList = useMemo(() => {
    const cats = new Set();
    allMenu.forEach(m => {
      if (m.GRUPO) cats.add(m.GRUPO);
      if (m.CATEGORIA) cats.add(m.CATEGORIA);
    });
    return Array.from(cats).sort();
  }, [allMenu]);

  // Available Years list
  const availableYears = useMemo(() => {
    const years = new Set([now.getFullYear(), 2024, 2025, 2026]);
    allVentas.forEach(v => {
      const raw = v.Date || v.created_at || v.date;
      if (raw) {
        const y = new Date(raw).getFullYear();
        if (!isNaN(y) && y > 2000) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allVentas]);

  return {
    loadingData,
    // Filter Controls
    sourceMode, setSourceMode,
    timeframeMode, setTimeframeMode,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedWeek, setSelectedWeek,
    customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate,
    selectedCategory, setSelectedCategory,
    selectedProduct, setSelectedProduct,
    searchTerm, setSearchTerm,
    ingredientTypeFilter, setIngredientTypeFilter,
    // Options
    categoriesList,
    availableYears,
    allMenu,
    // Calculated Outputs
    filteredSalesCount: filteredSalesData.length,
    calculatedData,
    dbAudit,
    resolveRecipeRecursive
  };
}
