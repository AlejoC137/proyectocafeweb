import { trimRecepie } from '../../../../redux/actions/recipeActions';
import { CATEGORIES, CATEGORIES_t, SUB_CATEGORIES } from '../../../../redux/actions-types';

/**
 * Normaliza nombres de unidades a estándares comunes (un, gr, ml, kg, L)
 */
export function normalizeUnit(unit) {
  if (!unit) return 'un';
  const norm = String(unit).toLowerCase().trim();
  if (['un', 'unid', 'unidad', 'unidades', 'ud', 'uds', 'u', 'piezas', 'pz', 'pza', 'botella', 'botellas', 'lata', 'latas'].includes(norm)) {
    return 'un';
  }
  if (['gr', 'g', 'gramo', 'gramos'].includes(norm)) return 'gr';
  if (['kg', 'kilo', 'kilogramo', 'kilogramos'].includes(norm)) return 'kg';
  if (['ml', 'mililitro', 'mililitros', 'cc'].includes(norm)) return 'ml';
  if (['l', 'litro', 'litros'].includes(norm)) return 'L';
  return unit;
}

/**
 * Ajusta el precio unitario del insumo según la unidad de la receta
 * (Ej: si el insumo está en $/kg y la receta usa gr, divide por 1000)
 */
export function getNormalizedUnitPrice(itemMaster, recipeUnit, rawUnitPrice = 0) {
  let price = rawUnitPrice || parseFloat(itemMaster?.precioUnitario || itemMaster?.costoPromedio || 0);
  if (!price || isNaN(price)) return 0;

  const itemUnit = (itemMaster?.UNIDADES || itemMaster?.metric || '').toLowerCase().trim();
  const recUnit = (recipeUnit || '').toLowerCase().trim();

  if (['kg', 'kilo', 'kilogramo'].includes(itemUnit) && ['gr', 'g', 'gramo', 'gramos'].includes(recUnit)) {
    return price / 1000;
  }
  if (['l', 'litro', 'litros'].includes(itemUnit) && ['ml', 'mililitro', 'mililitros', 'cc'].includes(recUnit)) {
    return price / 1000;
  }
  return price;
}

/**
 * Parsea una fecha en formatos heterogéneos (ISO, 'M/D/YYYY', serial de Excel, timestamp)
 * y devuelve un objeto Date válido o null.
 */
export function parseFlexibleDate(rawDate, rawPagoHora = null) {
  if (!rawDate && !rawPagoHora) return null;

  // 1. Si es un serial de Excel numérico
  if (typeof rawDate === 'number' && rawDate > 30000 && rawDate < 60000) {
    const jsDate = new Date((rawDate - 25569) * 86400 * 1000);
    if (!isNaN(jsDate.getTime())) return jsDate;
  }

  // 2. Si rawPagoHora tiene un timestamp ISO válido
  if (rawPagoHora) {
    const dHora = new Date(rawPagoHora);
    if (!isNaN(dHora.getTime())) return dHora;
  }

  const str = String(rawDate || '').trim();
  if (!str) return null;

  // 3. Formato 'M/D/YYYY, H:MM:SS AM/PM' o 'D/M/YYYY'
  const commaIndex = str.indexOf(',');
  const datePart = commaIndex !== -1 ? str.slice(0, commaIndex).trim() : str;

  // Intentar parseo de M/D/YYYY o D/M/YYYY
  if (datePart.includes('/')) {
    const parts = datePart.split('/').map(p => parseInt(p, 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
      // parts[0] = mes o dia, parts[1] = dia o mes, parts[2] = año
      let year = parts[2];
      if (year < 100) year += 2000;
      
      // En este sistema histórico: primer dígito suele ser mes (ej: 2/5/2025 es 5 de Feb)
      // pero si el primer dígito es > 12, es día.
      let month = parts[0];
      let day = parts[1];
      if (parts[0] > 12 && parts[1] <= 12) {
        day = parts[0];
        month = parts[1];
      }
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  }

  // 4. Formato estándar 'YYYY-MM-DD'
  if (datePart.includes('-')) {
    const parts = datePart.split('-').map(p => parseInt(p, 10));
    if (parts.length === 3 && parts[0] > 1900) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
  }

  // 5. Intento estándar de JavaScript
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

/**
 * Determina si una venta pertenece a una fecha o mes específico
 */
export function isSaleInPeriod(sale, periodType, { targetDate, targetMonth, targetYear, customStartDate, customEndDate }) {
  if (!sale) return false;

  // Obtener hora de Pago_Info si existe
  let pagoHora = null;
  if (sale.Pago_Info) {
    try {
      const pInfo = typeof sale.Pago_Info === 'string' ? JSON.parse(sale.Pago_Info) : sale.Pago_Info;
      pagoHora = pInfo?.hora || null;
    } catch (e) {}
  }

  const vDate = parseFlexibleDate(sale.Date || sale.created_at || sale.date, pagoHora);
  if (!vDate) return false;

  if (periodType === 'day') {
    // targetDate en formato 'YYYY-MM-DD'
    if (!targetDate) return false;
    const [tYear, tMonth, tDay] = targetDate.split('-').map(Number);
    return vDate.getFullYear() === tYear &&
           (vDate.getMonth() + 1) === tMonth &&
           vDate.getDate() === tDay;
  }

  if (periodType === 'month') {
    return vDate.getFullYear() === targetYear && vDate.getMonth() === targetMonth;
  }

  if (periodType === 'custom') {
    if (!customStartDate || !customEndDate) return false;
    const start = new Date(customStartDate + 'T00:00:00');
    const end = new Date(customEndDate + 'T23:59:59');
    return vDate >= start && vDate <= end;
  }

  return false;
}

/**
 * Mapeo amigable de categorías/grupos a Bolsillos
 */
export const POCKET_CONFIG = {
  CAFE: {
    id: 'CAFE',
    nombre: 'Café & Barismo',
    icono: '☕',
    color: 'amber',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    headerClass: 'from-amber-600 to-amber-800 text-white',
    borderClass: 'border-amber-400',
    descripcion: 'Re-stock para café en grano, leches y barismo'
  },
  BEBIDAS: {
    id: 'BEBIDAS',
    nombre: 'Bebidas & Cervezas',
    icono: '🍺',
    color: 'sky',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    headerClass: 'from-sky-600 to-sky-800 text-white',
    borderClass: 'border-sky-400',
    descripcion: 'Re-stock para cervezas, gaseosas, sodas, vinos y licores'
  },
  PANADERIA: {
    id: 'PANADERIA',
    nombre: 'Panadería & Repostería',
    icono: '🥐',
    color: 'orange',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    headerClass: 'from-orange-600 to-orange-800 text-white',
    borderClass: 'border-orange-400',
    descripcion: 'Re-stock de harinas, masas, panificados y postres'
  },
  DESAYUNO: {
    id: 'DESAYUNO',
    nombre: 'Cocina & Desayunos',
    icono: '🥞',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    headerClass: 'from-emerald-600 to-emerald-800 text-white',
    borderClass: 'border-emerald-400',
    descripcion: 'Re-stock para platos de cocina, huevos, carnes y vegetales'
  },
  TARDEO: {
    id: 'TARDEO',
    nombre: 'Tardeo & Almuerzos',
    icono: '🥪',
    color: 'teal',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    headerClass: 'from-teal-600 to-teal-800 text-white',
    borderClass: 'border-teal-400',
    descripcion: 'Re-stock para opciones de almuerzo y tardeo'
  },
  HELADOS: {
    id: 'HELADOS',
    nombre: 'Heladería Artesanal',
    icono: '🍦',
    color: 'pink',
    badgeClass: 'bg-pink-100 text-pink-900 border-pink-300',
    headerClass: 'from-pink-600 to-pink-800 text-white',
    borderClass: 'border-pink-400',
    descripcion: 'Re-stock para bases de helado, conos y toppings'
  },
  ADICIONES: {
    id: 'ADICIONES',
    nombre: 'Adiciones & Extras',
    icono: '🥚',
    color: 'purple',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    headerClass: 'from-purple-600 to-purple-800 text-white',
    borderClass: 'border-purple-400',
    descripcion: 'Re-stock de ingredientes extra'
  },
  DESECHABLES: {
    id: 'DESECHABLES',
    nombre: 'Desechables & Empaques',
    icono: '🥡',
    color: 'stone',
    badgeClass: 'bg-stone-100 text-stone-900 border-stone-300',
    headerClass: 'from-stone-600 to-stone-800 text-white',
    borderClass: 'border-stone-400',
    descripcion: 'Re-stock de vasos, tapas, bolsas y servilletas'
  },
  OTROS: {
    id: 'OTROS',
    nombre: 'Otras Categorías',
    icono: '📦',
    color: 'gray',
    badgeClass: 'bg-gray-100 text-gray-900 border-gray-300',
    headerClass: 'from-gray-600 to-gray-800 text-white',
    borderClass: 'border-gray-400',
    descripcion: 'Productos e insumos varios'
  }
};

/**
 * Normaliza cualquier GRUPO / Categoría de la base de datos hacia una clave de bolsillo
 */
export function mapGroupToPocketKey(rawGrupo, rawSubGrupo) {
  const g = String(rawGrupo || '').toUpperCase().trim();
  const sg = String(rawSubGrupo || '').toUpperCase().trim();

  if (g === 'CAFE' || sg.includes('CAFE')) return 'CAFE';
  if (['BEBIDAS', 'ENLATADOS', 'CERVEZAS', 'LICORES'].includes(g) || sg.includes('BEBIDA')) return 'BEBIDAS';
  if (['PANADERIA', 'REPOSTERIA', 'HARINAS'].includes(g) || sg.includes('PANADERIA') || sg.includes('REPOSTERIA')) return 'PANADERIA';
  if (['DESAYUNO', 'CARNICO', 'VERDURAS_FRUTAS', 'LACTEO'].includes(g) || sg.includes('DESAYUNO')) return 'DESAYUNO';
  if (['TARDEO', 'GUARNICION'].includes(g) || sg.includes('TARDEO') || sg.includes('ALMUERZO')) return 'TARDEO';
  if (['HELADOS', 'HELADO'].includes(g) || sg.includes('HELADO')) return 'HELADOS';
  if (['ADICIONES', 'ADICION'].includes(g) || sg.includes('ADICION')) return 'ADICIONES';
  if (['DESECHABLES', 'LIMPIEZA', 'DOTACION'].includes(g)) return 'DESECHABLES';

  return 'OTROS';
}

/**
 * Motor central de cálculo de Bolsillos Financieros y Re-Stock
 */
export function calculateFinancialPockets({
  ventas = [],
  allMenu = [],
  allRecetasMenu = [],
  allRecetasProduccion = [],
  allItems = [],
  allProduccion = []
}) {
  // Indexadores para búsqueda O(1)
  const menuMapById = {};
  const menuMapByName = {};
  allMenu.forEach(m => {
    if (m?._id) menuMapById[m._id] = m;
    if (m?.NombreES) menuMapByName[m.NombreES.trim().toLowerCase()] = m;
  });

  const recipesMapById = {};
  const recipesMapByForId = {};
  const recipesMapByName = {};
  [...allRecetasMenu, ...allRecetasProduccion].forEach(r => {
    if (r?._id) recipesMapById[r._id] = r;
    if (r?.forId) recipesMapByForId[r.forId] = r;
    if (r?.legacyName) recipesMapByName[r.legacyName.trim().toLowerCase()] = r;
  });

  const itemsMapById = {};
  const itemsMapByName = {};
  allItems.forEach(i => {
    if (i?._id) itemsMapById[i._id] = i;
    if (i?.Nombre_del_producto) itemsMapByName[i.Nombre_del_producto.trim().toLowerCase()] = i;
  });

  const produccionMapById = {};
  const produccionMapByName = {};
  allProduccion.forEach(p => {
    if (p?._id) produccionMapById[p._id] = p;
    if (p?.Nombre_del_producto) produccionMapByName[p.Nombre_del_producto.trim().toLowerCase()] = p;
  });

  const combinedCatalog = [...allItems, ...allProduccion];

  // Helper para buscar receta
  const findRecipe = (recipeId, menuItemId, productName) => {
    if (recipeId && recipeId !== 'N/A' && recipesMapById[recipeId]) {
      return recipesMapById[recipeId];
    }
    if (menuItemId && recipesMapByForId[menuItemId]) {
      return recipesMapByForId[menuItemId];
    }
    if (productName) {
      const norm = productName.trim().toLowerCase();
      if (recipesMapByName[norm]) return recipesMapByName[norm];
    }
    return null;
  };

  // 1. Acumuladores de Ventas Globales y Métodos de Pago
  let totalIngresoVentas = 0;
  let totalTip = 0;
  let ventasPagadasCount = 0;

  const metodosPago = {
    Efectivo: 0,
    Tarjeta: 0,
    Transferencia: 0,
    Otros: 0
  };

  const productosVendidosMap = {};

  ventas.forEach(venta => {
    const isPaid = venta.Pagado === true || String(venta.Pagado).toLowerCase() === 'true';
    if (!isPaid) return;

    ventasPagadasCount++;
    const ingreso = parseFloat(venta.Total_Ingreso || 0) || 0;
    totalIngresoVentas += ingreso;

    const tip = parseFloat(venta.Tip || 0) || 0;
    totalTip += tip;

    // Métodos de Pago
    if (venta.Pago_Info) {
      try {
        const pInfo = typeof venta.Pago_Info === 'string' ? JSON.parse(venta.Pago_Info) : venta.Pago_Info;
        const metodo = (pInfo?.metodo || '').trim();
        if (metodo.toLowerCase().includes('efectivo')) {
          metodosPago.Efectivo += ingreso;
        } else if (metodo.toLowerCase().includes('tarjeta')) {
          metodosPago.Tarjeta += ingreso;
        } else if (metodo.toLowerCase().includes('transferencia')) {
          metodosPago.Transferencia += ingreso;
        } else if (metodo) {
          metodosPago.Otros += ingreso;
        } else {
          metodosPago.Otros += ingreso;
        }
      } catch (e) {
        metodosPago.Otros += ingreso;
      }
    } else {
      metodosPago.Otros += ingreso;
    }

    // Procesar Productos de la venta
    let prods = [];
    if (venta.Productos) {
      try {
        prods = typeof venta.Productos === 'string' ? JSON.parse(venta.Productos) : venta.Productos;
      } catch (e) {
        prods = [];
      }
    }

    if (!Array.isArray(prods)) return;

    prods.forEach(p => {
      const name = p.NombreES || p.nombre || p.Nombre_del_producto;
      if (!name) return;

      const qty = parseFloat(p.quantity || p.cantidad || 0);
      if (qty <= 0) return;

      const normName = name.trim();
      const key = normName.toLowerCase();

      // Buscar maestro de menú
      const menuMaster = (p._id && menuMapById[p._id]) || (p.id && menuMapById[p.id]) || menuMapByName[key];

      let price = parseFloat(p.price || p.valor || p.precio || 0);
      if (price === 0 && menuMaster) {
        price = parseFloat(menuMaster.Precio || 0);
      }

      const recipeId = p.Receta || p.recetaId || menuMaster?.Receta || 'N/A';
      const grupo = menuMaster?.GRUPO || p.GRUPO || 'OTROS';
      const subGrupo = menuMaster?.SUB_GRUPO || p.SUB_GRUPO || '';

      if (!productosVendidosMap[key]) {
        productosVendidosMap[key] = {
          id: p._id || p.id || menuMaster?._id || key,
          nombre: normName,
          menuMaster: menuMaster || null,
          grupo: grupo,
          subGrupo: subGrupo,
          precioVentaUnitario: price,
          cantidadTotal: 0,
          totalIngreso: 0,
          recipeId: recipeId,
          recipeData: null,
          ingredientesDetalle: [],
          costoProduccionUnitario: 0,
          costoTotalRestock: 0,
          hasCostData: false
        };
      }

      productosVendidosMap[key].cantidadTotal += qty;
      productosVendidosMap[key].totalIngreso += (price * qty);
    });
  });

  // 2. Resolver Recetas, Costos de Producción y Re-stock de Insumos
  const insumosRestockMap = {};

  const productosVendidosList = Object.values(productosVendidosMap).map(item => {
    const recipeData = findRecipe(item.recipeId, item.id, item.nombre);
    item.recipeData = recipeData;

    let unitCost = 0;
    let ingredients = [];
    let portions = 1;

    if (recipeData) {
      // Parsear porciones o rendimiento
      if (recipeData.rendimiento) {
        try {
          const rend = typeof recipeData.rendimiento === 'string' ? JSON.parse(recipeData.rendimiento) : recipeData.rendimiento;
          const rCant = parseFloat(rend?.cantidad || rend?.cant || 0);
          if (rCant > 0) portions = rCant;
        } catch (e) {}
      }

      // Trimear receta
      ingredients = trimRecepie(combinedCatalog, recipeData);

      // Calcular costo sumando ingredientes
      if (ingredients && ingredients.length > 0) {
        let sumIngredientsCost = 0;
        ingredients.forEach(ing => {
          const ingQty = parseFloat(ing.cuantity || 0);
          const ingMaster = itemsMapById[ing.item_Id] || produccionMapById[ing.item_Id] || itemsMapByName[ing.name?.toLowerCase()] || produccionMapByName[ing.name?.toLowerCase()];
          const rawPrice = ing.precioUnitario || parseFloat(ingMaster?.precioUnitario || ingMaster?.costoPromedio || 0);
          const normalizedPrice = getNormalizedUnitPrice(ingMaster, ing.units, rawPrice);

          const subtotalCost = ingQty * normalizedPrice;
          sumIngredientsCost += subtotalCost;

          // Registrar en la lista global de insumos de re-stock
          const insumoName = ing.name || 'Insumo Sin Nombre';
          const insumoKey = insumoName.trim().toLowerCase();
          const insumoQtyNeeded = (ingQty / portions) * item.cantidadTotal;
          const insumoCostNeeded = insumoQtyNeeded * normalizedPrice;

          const insumoGrupo = ingMaster?.GRUPO || item.grupo;

          if (!insumosRestockMap[insumoKey]) {
            insumosRestockMap[insumoKey] = {
              id: ing.item_Id || insumoKey,
              nombre: insumoName,
              grupo: insumoGrupo,
              unidad: normalizeUnit(ing.units || ingMaster?.UNIDADES || ingMaster?.metric || 'un'),
              precioUnitario: normalizedPrice,
              cantidadAReponer: 0,
              dineroRestock: 0,
              productosAsociados: new Set()
            };
          }
          insumosRestockMap[insumoKey].cantidadAReponer += insumoQtyNeeded;
          insumosRestockMap[insumoKey].dineroRestock += insumoCostNeeded;
          insumosRestockMap[insumoKey].productosAsociados.add(item.nombre);
        });

        unitCost = sumIngredientsCost / portions;
        item.hasCostData = true;
      } else if (recipeData.costo) {
        // Fallback a costo guardado en la receta
        try {
          const cData = typeof recipeData.costo === 'string' ? JSON.parse(recipeData.costo) : recipeData.costo;
          if (typeof cData === 'number') {
            unitCost = cData;
          } else if (cData?.vCMP || cData?.COSTO) {
            unitCost = parseFloat(cData.vCMP || cData.COSTO || 0);
          }
          if (unitCost > 0) item.hasCostData = true;
        } catch (e) {}
      }
    }

    // Si aún no tiene costo (ej: cerveza, gaseosa o producto directo sin receta)
    // Buscamos directamente en ItemsAlmacen o ProduccionInterna
    if (unitCost === 0) {
      const directItem = (item.id && (itemsMapById[item.id] || produccionMapById[item.id])) ||
                         itemsMapByName[item.nombre.toLowerCase()] ||
                         produccionMapByName[item.nombre.toLowerCase()];
      if (directItem) {
        unitCost = parseFloat(directItem.precioUnitario || directItem.costoPromedio || 0);
        if (unitCost > 0) {
          item.hasCostData = true;
          // Registrar como insumo directo
          const directKey = item.nombre.toLowerCase();
          if (!insumosRestockMap[directKey]) {
            insumosRestockMap[directKey] = {
              id: directItem._id || directKey,
              nombre: item.nombre,
              grupo: directItem.GRUPO || item.grupo,
              unidad: normalizeUnit(directItem.UNIDADES || directItem.metric || 'un'),
              precioUnitario: unitCost,
              cantidadAReponer: 0,
              dineroRestock: 0,
              productosAsociados: new Set([item.nombre])
            };
          }
          insumosRestockMap[directKey].cantidadAReponer += item.cantidadTotal;
          insumosRestockMap[directKey].dineroRestock += (item.cantidadTotal * unitCost);
        }
      }
    }

    item.costoProduccionUnitario = Math.round(unitCost);
    item.costoTotalRestock = Math.round(unitCost * item.cantidadTotal);
    item.utilidad = item.totalIngreso - item.costoTotalRestock;
    item.margenPct = item.totalIngreso > 0 ? (item.utilidad / item.totalIngreso) * 100 : 0;
    item.ingredientesDetalle = ingredients;

    return item;
  });

  // Ordenar productos vendidos por mayor total recaudado
  productosVendidosList.sort((a, b) => b.totalIngreso - a.totalIngreso);

  // 3. Agrupar en Bolsillos Financieros
  const pocketsMap = {};
  Object.keys(POCKET_CONFIG).forEach(key => {
    pocketsMap[key] = {
      ...POCKET_CONFIG[key],
      totalVentas: 0,
      totalRestock: 0,
      totalUtilidad: 0,
      totalItemsVendidos: 0,
      productos: []
    };
  });

  let totalRestockGlobal = 0;

  productosVendidosList.forEach(prod => {
    const pocketKey = mapGroupToPocketKey(prod.grupo, prod.subGrupo);
    const targetPocket = pocketsMap[pocketKey] || pocketsMap.OTROS;

    targetPocket.totalVentas += prod.totalIngreso;
    targetPocket.totalRestock += prod.costoTotalRestock;
    targetPocket.totalUtilidad += prod.utilidad;
    targetPocket.totalItemsVendidos += prod.cantidadTotal;
    targetPocket.productos.push(prod);

    totalRestockGlobal += prod.costoTotalRestock;
  });

  // Convertir pockets a lista activa (solo los que tengan ventas o re-stock)
  const activePocketsList = Object.values(pocketsMap)
    .filter(p => p.totalVentas > 0 || p.totalRestock > 0)
    .map(p => ({
      ...p,
      margenPct: p.totalVentas > 0 ? (p.totalUtilidad / p.totalVentas) * 100 : 0,
      pctDelTotalVentas: totalIngresoVentas > 0 ? (p.totalVentas / totalIngresoVentas) * 100 : 0,
      pctDelTotalRestock: totalRestockGlobal > 0 ? (p.totalRestock / totalRestockGlobal) * 100 : 0
    }))
    .sort((a, b) => b.totalRestock - a.totalRestock);

  // Lista de Insumos formateada
  const insumosRestockList = Object.values(insumosRestockMap).map(ins => ({
    ...ins,
    dineroRestock: Math.round(ins.dineroRestock),
    cantidadAReponer: Number(ins.cantidadAReponer.toFixed(2)),
    productosAsociados: Array.from(ins.productosAsociados)
  })).sort((a, b) => b.dineroRestock - a.dineroRestock);

  // Ganancia Libre / Margen Operativo Libre (Ventas - ReStock - Propinas)
  const gananciaLibre = totalIngresoVentas - totalRestockGlobal - totalTip;
  const margenLibrePct = totalIngresoVentas > 0 ? (gananciaLibre / totalIngresoVentas) * 100 : 0;
  const restockPctGlobal = totalIngresoVentas > 0 ? (totalRestockGlobal / totalIngresoVentas) * 100 : 0;
  const propinasPctGlobal = totalIngresoVentas > 0 ? (totalTip / totalIngresoVentas) * 100 : 0;

  return {
    totalIngresoVentas,
    totalRestockGlobal,
    totalTip,
    gananciaLibre,
    margenLibrePct,
    restockPctGlobal,
    propinasPctGlobal,
    ventasPagadasCount,
    metodosPago,
    pockets: activePocketsList,
    allPocketsMap: pocketsMap,
    productosVendidos: productosVendidosList,
    insumosRestock: insumosRestockList,
    totalInsumosDistintos: insumosRestockList.length
  };
}
