import { trimRecepie } from '../../../redux/actions/recipeActions';
import { CATEGORIES, CATEGORIES_t, SUB_CATEGORIES } from '../../../redux/actions-types';

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
      let year = parts[2];
      if (year < 100) year += 2000;
      
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
 * Determina si una fecha arbitraria pertenece a un período (Día, Mes o Rango)
 */
export function isDateInPeriod(rawDate, rawHora, periodType, { targetDate, targetMonth, targetYear, customStartDate, customEndDate }) {
  const vDate = parseFlexibleDate(rawDate, rawHora);
  if (!vDate) return false;

  if (periodType === 'day') {
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
 * Determina si una venta pertenece a una fecha o mes específico
 */
export function isSaleInPeriod(sale, periodType, params) {
  if (!sale) return false;
  let pagoHora = null;
  if (sale.Pago_Info) {
    try {
      const pInfo = typeof sale.Pago_Info === 'string' ? JSON.parse(sale.Pago_Info) : sale.Pago_Info;
      pagoHora = pInfo?.hora || null;
    } catch (e) {}
  }
  return isDateInPeriod(sale.Date || sale.created_at || sale.date, pagoHora, periodType, params);
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
 * Incorpora: Ventas + Consumo Interno (Staff) + Bajas y Mermas
 */
export function calculateFinancialPockets({
  ventas = [],
  consumoStaff = [],
  bajas = [],
  allStaff = [],
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

  const staffMapById = {};
  allStaff.forEach(s => {
    if (s?._id) staffMapById[s._id] = s;
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

  // Helper unificado para resolver costo e ingredientes de cualquier producto
  const resolveProductCost = (productId, recipeId, productName) => {
    const normName = (productName || '').trim().toLowerCase();
    const recipeData = findRecipe(recipeId, productId, normName);
    const menuMaster = (productId && menuMapById[productId]) || menuMapByName[normName] || null;

    let unitCost = 0;
    let ingredients = [];
    let portions = 1;
    let hasCostData = false;

    if (recipeData) {
      if (recipeData.rendimiento) {
        try {
          const rend = typeof recipeData.rendimiento === 'string' ? JSON.parse(recipeData.rendimiento) : recipeData.rendimiento;
          const rCant = parseFloat(rend?.cantidad || rend?.cant || 0);
          if (rCant > 0) portions = rCant;
        } catch (e) {}
      }

      ingredients = trimRecepie(combinedCatalog, recipeData);

      if (ingredients && ingredients.length > 0) {
        let sumIngredientsCost = 0;
        ingredients.forEach(ing => {
          const ingQty = parseFloat(ing.cuantity || 0);
          const ingMaster = itemsMapById[ing.item_Id] || produccionMapById[ing.item_Id] || itemsMapByName[ing.name?.toLowerCase()] || produccionMapByName[ing.name?.toLowerCase()];
          const rawPrice = ing.precioUnitario || parseFloat(ingMaster?.precioUnitario || ingMaster?.costoPromedio || 0);
          const normalizedPrice = getNormalizedUnitPrice(ingMaster, ing.units, rawPrice);
          sumIngredientsCost += (ingQty * normalizedPrice);
        });
        unitCost = sumIngredientsCost / portions;
        hasCostData = true;
      } else if (recipeData.costo) {
        try {
          const cData = typeof recipeData.costo === 'string' ? JSON.parse(recipeData.costo) : recipeData.costo;
          if (typeof cData === 'number') {
            unitCost = cData;
          } else if (cData?.vCMP || cData?.COSTO) {
            unitCost = parseFloat(cData.vCMP || cData.COSTO || 0);
          }
          if (unitCost > 0) hasCostData = true;
        } catch (e) {}
      }
    }

    if (unitCost === 0) {
      const directItem = (productId && (itemsMapById[productId] || produccionMapById[productId])) ||
                         itemsMapByName[normName] ||
                         produccionMapByName[normName];
      if (directItem) {
        unitCost = parseFloat(directItem.precioUnitario || directItem.costoPromedio || 0);
        if (unitCost > 0) hasCostData = true;
      }
    }

    return {
      unitCost: Math.round(unitCost),
      hasCostData,
      recipeData,
      ingredients,
      portions,
      menuMaster
    };
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
  const insumosRestockMap = {};

  // Función auxiliar para registrar insumos en la lista de compras de re-stock
  const recordInsumoRestock = ({ insumoName, insumoId, recipeUnit, portionRatio, quantity, sourceCategory, parentProductName, originType }) => {
    if (!insumoName) return;
    const insumoKey = insumoName.trim().toLowerCase();
    const ingMaster = itemsMapById[insumoId] || produccionMapById[insumoId] || itemsMapByName[insumoKey] || produccionMapByName[insumoKey];
    const rawPrice = parseFloat(ingMaster?.precioUnitario || ingMaster?.costoPromedio || 0);
    const normalizedPrice = getNormalizedUnitPrice(ingMaster, recipeUnit, rawPrice);

    const insumoQtyNeeded = portionRatio * quantity;
    const insumoCostNeeded = insumoQtyNeeded * normalizedPrice;
    const insumoGrupo = ingMaster?.GRUPO || sourceCategory || 'OTROS';
    const insumoUnidad = normalizeUnit(recipeUnit || ingMaster?.UNIDADES || ingMaster?.metric || 'un');

    if (!insumosRestockMap[insumoKey]) {
      insumosRestockMap[insumoKey] = {
        id: insumoId || insumoKey,
        nombre: insumoName,
        grupo: insumoGrupo,
        unidad: insumoUnidad,
        precioUnitario: normalizedPrice,
        cantidadAReponer: 0,
        cantidadVentas: 0,
        cantidadConsumo: 0,
        cantidadBajas: 0,
        dineroRestock: 0,
        dineroVentas: 0,
        dineroConsumo: 0,
        dineroBajas: 0,
        productosAsociados: new Set(),
        origenes: new Set()
      };
    }

    insumosRestockMap[insumoKey].cantidadAReponer += insumoQtyNeeded;
    insumosRestockMap[insumoKey].dineroRestock += insumoCostNeeded;
    insumosRestockMap[insumoKey].productosAsociados.add(parentProductName);
    insumosRestockMap[insumoKey].origenes.add(originType);

    if (originType === 'Ventas') {
      insumosRestockMap[insumoKey].cantidadVentas += insumoQtyNeeded;
      insumosRestockMap[insumoKey].dineroVentas += insumoCostNeeded;
    } else if (originType === 'Consumo Interno') {
      insumosRestockMap[insumoKey].cantidadConsumo += insumoQtyNeeded;
      insumosRestockMap[insumoKey].dineroConsumo += insumoCostNeeded;
    } else if (originType === 'Bajas') {
      insumosRestockMap[insumoKey].cantidadBajas += insumoQtyNeeded;
      insumosRestockMap[insumoKey].dineroBajas += insumoCostNeeded;
    }
  };

  // PROCESAR VENTAS
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
        } else {
          metodosPago.Otros += ingreso;
        }
      } catch (e) {
        metodosPago.Otros += ingreso;
      }
    } else {
      metodosPago.Otros += ingreso;
    }

    // Productos de la venta
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

  // Calcular costos y registrar insumos de ventas
  let totalRestockVentas = 0;
  const productosVendidosList = Object.values(productosVendidosMap).map(item => {
    const { unitCost, hasCostData, recipeData, ingredients, portions } = resolveProductCost(item.id, item.recipeId, item.nombre);
    item.recipeData = recipeData;
    item.costoProduccionUnitario = unitCost;
    item.hasCostData = hasCostData;
    item.ingredientesDetalle = ingredients;
    item.costoTotalRestock = Math.round(unitCost * item.cantidadTotal);
    item.utilidad = item.totalIngreso - item.costoTotalRestock;
    item.margenPct = item.totalIngreso > 0 ? (item.utilidad / item.totalIngreso) * 100 : 0;

    totalRestockVentas += item.costoTotalRestock;

    // Registrar insumos consumidos en ventas
    if (ingredients && ingredients.length > 0) {
      ingredients.forEach(ing => {
        const ratio = parseFloat(ing.cuantity || 0) / portions;
        recordInsumoRestock({
          insumoName: ing.name,
          insumoId: ing.item_Id,
          recipeUnit: ing.units,
          portionRatio: ratio,
          quantity: item.cantidadTotal,
          sourceCategory: item.grupo,
          parentProductName: item.nombre,
          originType: 'Ventas'
        });
      });
    } else if (unitCost > 0) {
      // Direct product
      recordInsumoRestock({
        insumoName: item.nombre,
        insumoId: item.id,
        recipeUnit: 'un',
        portionRatio: 1,
        quantity: item.cantidadTotal,
        sourceCategory: item.grupo,
        parentProductName: item.nombre,
        originType: 'Ventas'
      });
    }

    return item;
  });
  productosVendidosList.sort((a, b) => b.totalIngreso - a.totalIngreso);

  // 2. PROCESAR CONSUMO INTERNO (CONSUMO STAFF)
  let totalConsumoInterno = 0;
  const consumoInternoList = [];

  consumoStaff.forEach(c => {
    let prods = [];
    if (c.Productos) {
      try {
        prods = typeof c.Productos === 'string' ? JSON.parse(c.Productos) : c.Productos;
      } catch (e) {
        prods = [];
      }
    }
    if (!Array.isArray(prods)) return;

    const staffMember = staffMapById[c.staff_id] || null;
    const staffNombre = staffMember ? `${staffMember.Nombre || ''} ${staffMember.Apellido || ''}`.trim() : 'Staff';

    prods.forEach(p => {
      const name = p.NombreES || p.nombre || p.Nombre_del_producto;
      if (!name) return;
      const qty = parseFloat(p.quantity || p.cantidad || 0);
      if (qty <= 0) return;

      const normName = name.trim();
      const menuMaster = menuMapByName[normName.toLowerCase()] || (p._id && menuMapById[p._id]);
      const recipeId = p.Receta || menuMaster?.Receta || 'N/A';
      const grupo = menuMaster?.GRUPO || p.GRUPO || 'OTROS';
      const subGrupo = menuMaster?.SUB_GRUPO || p.SUB_GRUPO || '';

      const { unitCost, ingredients, portions } = resolveProductCost(p._id || p.id, recipeId, normName);
      const costoTotal = Math.round(unitCost * qty);

      totalConsumoInterno += costoTotal;

      // Registrar insumos de consumo interno
      if (ingredients && ingredients.length > 0) {
        ingredients.forEach(ing => {
          const ratio = parseFloat(ing.cuantity || 0) / portions;
          recordInsumoRestock({
            insumoName: ing.name,
            insumoId: ing.item_Id,
            recipeUnit: ing.units,
            portionRatio: ratio,
            quantity: qty,
            sourceCategory: grupo,
            parentProductName: `${normName} (Consumo Interno)`,
            originType: 'Consumo Interno'
          });
        });
      } else if (unitCost > 0) {
        recordInsumoRestock({
          insumoName: normName,
          insumoId: p._id,
          recipeUnit: 'un',
          portionRatio: 1,
          quantity: qty,
          sourceCategory: grupo,
          parentProductName: `${normName} (Consumo Interno)`,
          originType: 'Consumo Interno'
        });
      }

      consumoInternoList.push({
        id: c._id || Math.random(),
        date: c.Date || c.created_at,
        staffId: c.staff_id,
        staffNombre: staffNombre,
        productoNombre: normName,
        cantidad: qty,
        unitCost: unitCost,
        costoTotal: costoTotal,
        grupo: grupo,
        subGrupo: subGrupo,
        notas: c.Notas || ''
      });
    });
  });
  consumoInternoList.sort((a, b) => b.costoTotal - a.costoTotal);

  // 3. PROCESAR BAJAS Y MERMAS (DETERIORO, DAÑO, VENCIMIENTO, MERMA)
  let totalBajas = 0;
  const bajasList = [];

  bajas.forEach(b => {
    const costoPerdida = parseFloat(b.costo_perdida || 0);
    const cantMermada = parseFloat(b.cantidad_mermada || b.peso_bruto || 0);
    const nombreItem = b.item_nombre || 'Item Mermado / Baja';
    const tipoBaja = b.tipo_baja || 'Baja / Merma';
    const proceso = b.proceso_origen || b.motivo || 'Deterioro / Merma';

    totalBajas += Math.round(costoPerdida);

    // Identificar grupo / bolsillo
    let grupo = 'OTROS';
    if (b.item_id && itemsMapById[b.item_id]) {
      grupo = itemsMapById[b.item_id].GRUPO || 'OTROS';
    } else if (b.produccion_id && produccionMapById[b.produccion_id]) {
      grupo = produccionMapById[b.produccion_id].GRUPO || 'OTROS';
    } else if (b.menu_id && menuMapById[b.menu_id]) {
      grupo = menuMapById[b.menu_id].GRUPO || 'OTROS';
    } else {
      const norm = nombreItem.toLowerCase();
      if (itemsMapByName[norm]) grupo = itemsMapByName[norm].GRUPO || 'OTROS';
      else if (menuMapByName[norm]) grupo = menuMapByName[norm].GRUPO || 'OTROS';
    }

    // Registrar en insumos si tiene costo o cantidad
    if (costoPerdida > 0 || cantMermada > 0) {
      recordInsumoRestock({
        insumoName: nombreItem,
        insumoId: b.item_id || b.produccion_id || b.id,
        recipeUnit: b.unidad_medida || 'un',
        portionRatio: 1,
        quantity: cantMermada || 1,
        sourceCategory: grupo,
        parentProductName: `${nombreItem} (${tipoBaja})`,
        originType: 'Bajas'
      });
    }

    bajasList.push({
      id: b.id || Math.random(),
      fecha: b.fecha_baja || b.created_at,
      nombre: nombreItem,
      tipoBaja: tipoBaja,
      motivo: proceso,
      cantidad: cantMermada,
      unidad: normalizeUnit(b.unidad_medida || 'un'),
      costoPerdida: Math.round(costoPerdida),
      grupo: grupo,
      registradoPor: b.registrado_por || ''
    });
  });
  bajasList.sort((a, b) => b.costoPerdida - a.costoPerdida);

  // 4. AGRUPAR EN BOLSILLOS FINANCIEROS (VENTAS + CONSUMO + BAJAS)
  const pocketsMap = {};
  Object.keys(POCKET_CONFIG).forEach(key => {
    pocketsMap[key] = {
      ...POCKET_CONFIG[key],
      totalVentas: 0,
      totalRestockVentas: 0,
      totalConsumoInterno: 0,
      totalBajas: 0,
      totalRestock: 0,
      totalUtilidad: 0,
      totalItemsVendidos: 0,
      productos: [],
      consumos: [],
      bajasItems: []
    };
  });

  // Sumar ventas a bolsillos
  productosVendidosList.forEach(prod => {
    const pocketKey = mapGroupToPocketKey(prod.grupo, prod.subGrupo);
    const targetPocket = pocketsMap[pocketKey] || pocketsMap.OTROS;

    targetPocket.totalVentas += prod.totalIngreso;
    targetPocket.totalRestockVentas += prod.costoTotalRestock;
    targetPocket.totalRestock += prod.costoTotalRestock;
    targetPocket.totalUtilidad += prod.utilidad;
    targetPocket.totalItemsVendidos += prod.cantidadTotal;
    targetPocket.productos.push(prod);
  });

  // Sumar consumo interno a bolsillos
  consumoInternoList.forEach(cons => {
    const pocketKey = mapGroupToPocketKey(cons.grupo, cons.subGrupo);
    const targetPocket = pocketsMap[pocketKey] || pocketsMap.OTROS;

    targetPocket.totalConsumoInterno += cons.costoTotal;
    targetPocket.totalRestock += cons.costoTotal;
    targetPocket.consumos.push(cons);
  });

  // Sumar bajas a bolsillos
  bajasList.forEach(baj => {
    const pocketKey = mapGroupToPocketKey(baj.grupo, '');
    const targetPocket = pocketsMap[pocketKey] || pocketsMap.OTROS;

    targetPocket.totalBajas += baj.costoPerdida;
    targetPocket.totalRestock += baj.costoPerdida;
    targetPocket.bajasItems.push(baj);
  });

  // TOTALES GLOBALES
  const totalRestockGlobal = totalRestockVentas + totalConsumoInterno + totalBajas;
  const gananciaLibre = totalIngresoVentas - totalRestockGlobal - totalTip;
  const margenLibrePct = totalIngresoVentas > 0 ? (gananciaLibre / totalIngresoVentas) * 100 : 0;
  const restockPctGlobal = totalIngresoVentas > 0 ? (totalRestockGlobal / totalIngresoVentas) * 100 : 0;
  const propinasPctGlobal = totalIngresoVentas > 0 ? (totalTip / totalIngresoVentas) * 100 : 0;

  // Lista activa de bolsillos
  const activePocketsList = Object.values(pocketsMap)
    .filter(p => p.totalVentas > 0 || p.totalRestock > 0 || p.totalConsumoInterno > 0 || p.totalBajas > 0)
    .map(p => ({
      ...p,
      margenPct: p.totalVentas > 0 ? ((p.totalVentas - p.totalRestock) / p.totalVentas) * 100 : 0,
      pctDelTotalVentas: totalIngresoVentas > 0 ? (p.totalVentas / totalIngresoVentas) * 100 : 0,
      pctDelTotalRestock: totalRestockGlobal > 0 ? (p.totalRestock / totalRestockGlobal) * 100 : 0
    }))
    .sort((a, b) => b.totalRestock - a.totalRestock);

  // Lista de insumos
  const insumosRestockList = Object.values(insumosRestockMap).map(ins => ({
    ...ins,
    dineroRestock: Math.round(ins.dineroRestock),
    dineroVentas: Math.round(ins.dineroVentas),
    dineroConsumo: Math.round(ins.dineroConsumo),
    dineroBajas: Math.round(ins.dineroBajas),
    cantidadAReponer: Number(ins.cantidadAReponer.toFixed(2)),
    cantidadVentas: Number(ins.cantidadVentas.toFixed(2)),
    cantidadConsumo: Number(ins.cantidadConsumo.toFixed(2)),
    cantidadBajas: Number(ins.cantidadBajas.toFixed(2)),
    productosAsociados: Array.from(ins.productosAsociados),
    origenes: Array.from(ins.origenes)
  })).sort((a, b) => b.dineroRestock - a.dineroRestock);

  return {
    totalIngresoVentas,
    totalRestockVentas,
    totalConsumoInterno,
    totalBajas,
    totalRestockGlobal,
    totalTip,
    gananciaLibre,
    margenLibrePct,
    restockPctGlobal,
    propinasPctGlobal,
    ventasPagadasCount,
    consumosCount: consumoInternoList.length,
    bajasCount: bajasList.length,
    metodosPago,
    pockets: activePocketsList,
    allPocketsMap: pocketsMap,
    productosVendidos: productosVendidosList,
    consumoInternoList,
    bajasList,
    insumosRestock: insumosRestockList,
    totalInsumosDistintos: insumosRestockList.length
  };
}
