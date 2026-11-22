import supabase from "../../../config/supabaseClient";
import { getAllFromTable } from "../../../redux/actions";
import {
  MENU,
  ITEMS,
  PRODUCCION,
  RECETAS_MENU,
  RECETAS_PRODUCCION,
  STAFF,
} from "../../../redux/actions-types";

const TABLE_TO_STATE_KEY = {
  [MENU]: "allMenu",
  [ITEMS]: "allItems",
  [PRODUCCION]: "allProduccion",
  [RECETAS_MENU]: "allRecetasMenu",
  [RECETAS_PRODUCCION]: "allRecetasProduccion",
  [STAFF]: "allStaff",
};

const VENTAS_COLUMNS =
  "_id, Date, Time, Total_Ingreso, Tip, Pagado, Pago_Info, Productos";
const COMPRAS_COLUMNS = "_id, Date, Valor";
const COMPRAS_DETAIL_COLUMNS = "_id, Date, Valor, Concepto, Proveedor_Id, Comprador";
const CONSUMO_STAFF_COLUMNS = "_id, Date, Productos";

/**
 * Parsea de forma segura un campo que puede venir como texto plano JSON,
 * JSON doblemente serializado (string dentro de string), u objeto/array ya parseado.
 */
export function safeParseJson(raw, fallback = null) {
  if (raw === null || raw === undefined || raw === "") return fallback;
  if (typeof raw !== "string") return raw;

  let current = raw.trim();
  if (!current) return fallback;

  for (let depth = 0; depth < 3; depth++) {
    try {
      const parsed = JSON.parse(current);
      if (typeof parsed === "string") {
        const inner = parsed.trim();
        if (
          (inner.startsWith("{") && inner.endsWith("}")) ||
          (inner.startsWith("[") && inner.endsWith("]"))
        ) {
          current = inner;
          continue;
        }
      }
      return parsed;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Determina si una venta está efectivamente pagada (soporta boolean o string "true").
 */
export function isSalePaid(venta) {
  if (!venta) return false;
  return venta.Pagado === true || String(venta.Pagado).toLowerCase() === "true";
}

/**
 * Devuelve siempre un array de productos válidos a partir de `venta.Productos`.
 * Soporta:
 * - Array JSON serializado (2025–2026)
 * - Objeto JSON único serializado (registros legacy de 2024)
 * - JSON doblemente serializado o ya parseado
 * Descarta filas placeholder vacías.
 */
export function parseSaleProductos(rawProductos) {
  const parsed = safeParseJson(rawProductos, null);
  if (!parsed) return [];
  const list = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object"
      ? [parsed]
      : [];

  return list.filter((p) => {
    if (!p || typeof p !== "object") return false;
    if (
      p.id === "" &&
      p.NombreES === "" &&
      Number(p.Precio || 0) === 0 &&
      Number(p.quantity || 0) === 1 &&
      Array.isArray(p.matches) &&
      p.matches.length === 0
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Parsea `venta.Pago_Info` (texto plano JSON u objeto/array).
 */
export function parseSalePagoInfo(rawPagoInfo) {
  return safeParseJson(rawPagoInfo, null);
}

/**
 * Calcula el desglose por método de pago de una venta pagada.
 * Soporta tanto objeto único `{ metodo }` como array de pagos parciales.
 */
export function getSalePaymentBreakdown(venta) {
  const ingreso = parseFloat(venta?.Total_Ingreso || 0) || 0;
  const out = { tarjeta: 0, efectivo: 0, transferencia: 0, metodo: "N/A" };
  if (!venta?.Pago_Info) return out;

  const parsed = parseSalePagoInfo(venta.Pago_Info);
  if (!parsed) return out;

  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const metodos = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const rawMetodo = String(entry.metodo || entry.method || "").trim();
    if (!rawMetodo) continue;
    metodos.push(rawMetodo);
    const amount =
      entries.length > 1 && entry.monto !== undefined
        ? parseFloat(entry.monto || 0) || 0
        : entries.length > 1 && entry.valor !== undefined
          ? parseFloat(entry.valor || 0) || 0
          : ingreso;

    const norm = rawMetodo.toLowerCase();
    if (norm.includes("tarjeta")) out.tarjeta += amount;
    else if (norm.includes("efectivo")) out.efectivo += amount;
    else if (norm.includes("transferencia")) out.transferencia += amount;
  }

  if (metodos.length > 0) {
    out.metodo = metodos.join(" / ");
  }
  return out;
}

/**
 * Obtiene el precio unitario de un producto de `venta.Productos`.
 * Prioriza `Precio` (campo real guardado en Ventas), luego variantes en minúscula,
 * y finalmente el precio actual en `allMenu` solo si el registro histórico no trae precio.
 */
export function getProductUnitPrice(producto, allMenu = []) {
  if (!producto || typeof producto !== "object") return 0;
  const rawPrice = parseFloat(
    producto.Precio ?? producto.price ?? producto.precio ?? producto.valor ?? 0
  );
  if (!Number.isNaN(rawPrice) && rawPrice > 0) return rawPrice;

  if (Array.isArray(allMenu) && allMenu.length > 0) {
    const name = producto.NombreES || producto.nombre || "";
    const menuProduct =
      (producto.id && allMenu.find((m) => m._id === producto.id)) ||
      (name && allMenu.find((m) => m.NombreES === name));
    if (menuProduct) {
      const menuPrice = parseFloat(menuProduct.Precio || 0);
      if (!Number.isNaN(menuPrice) && menuPrice > 0) return menuPrice;
    }
  }
  return 0;
}

/**
 * Normaliza cualquier cadena `Date` de `Ventas` a una clave de día calendario `YYYY-MM-DD`,
 * evitando que horas embebidas (ej. "11/22/2026, 9:17:15 AM") inflen el conteo de días únicos.
 */
export function getSaleCalendarDateKey(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const datePart = dateStr.split(",")[0].trim();
  if (!datePart) return null;

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(datePart);
  if (isoMatch) {
    return `${isoMatch[1]}-${String(Number(isoMatch[2])).padStart(2, "0")}-${String(Number(isoMatch[3])).padStart(2, "0")}`;
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(datePart);
  if (slashMatch) {
    const m = Number(slashMatch[1]);
    const d = Number(slashMatch[2]);
    let y = Number(slashMatch[3]);
    if (y < 100) y += 2000;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

/**
 * Construye el filtro PostgREST `.or(...)` para un día específico,
 * cubriendo formatos históricos: "M/D/YYYY", "M/D/YYYY, HH:MM:SS",
 * "MM/DD/YYYY", "MM/DD/YYYY, ..." e ISO "YYYY-MM-DD...".
 */
export function buildDayDateOrFilter(year, month, day) {
  const m = Number(month);
  const d = Number(day);
  const y = Number(year);
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");

  const unpadded = `${m}/${d}/${y}`;
  const padded = `${mm}/${dd}/${y}`;
  const iso = `${y}-${mm}-${dd}`;

  const conditions = [
    `Date.eq.${unpadded}`,
    `Date.like."${unpadded},%"`,
    `Date.like.${iso}%`,
  ];

  if (padded !== unpadded) {
    conditions.push(`Date.eq.${padded}`, `Date.like."${padded},%"`);
  }

  return conditions.join(",");
}

/**
 * Construye el filtro PostgREST `.or(...)` para un mes específico (month: 1..12),
 * cubriendo "M/%/YYYY%", "MM/%/YYYY%" e ISO "YYYY-MM-%" (más borde UTC-5 del día 1 siguiente).
 */
export function buildMonthDateOrFilter(year, month) {
  const m = Number(month);
  const y = Number(year);
  const mm = String(m).padStart(2, "0");

  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const nextMm = String(nextMonth).padStart(2, "0");

  const conditions = [
    `Date.like.${m}/%/${y}%`,
    `Date.like.${y}-${mm}-%`,
    `Date.like.${nextYear}-${nextMm}-01T0%`,
  ];

  if (mm !== String(m)) {
    conditions.push(`Date.like.${mm}/%/${y}%`);
  }

  return conditions.join(",");
}

/**
 * Verifica exactamente en cliente que una cadena Date corresponda al día (year, month 1..12, day).
 */
export function matchesDay(dateStr, year, month, day) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const m = Number(month);
  const d = Number(day);
  const y = Number(year);
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");

  const datePart = dateStr.split(",")[0].trim();
  if (datePart === `${m}/${d}/${y}` || datePart === `${mm}/${dd}/${y}`) {
    return true;
  }
  if (datePart.startsWith(`${y}-${mm}-${dd}`)) {
    return true;
  }
  return false;
}

/**
 * Extrae { year, monthIndex } (monthIndex 0..11) de una cadena Date.
 * Maneja ISO solo-fecha "YYYY-MM-DD" sin desplazamiento por zona horaria UTC.
 */
export function parseYearMonth(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();

  // ISO solo-fecha (YYYY-MM-DD) sin hora: evitar desplazamiento UTC-5
  const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDateOnly) {
    const year = parseInt(isoDateOnly[1], 10);
    const monthIndex = parseInt(isoDateOnly[2], 10) - 1;
    if (!Number.isNaN(year) && monthIndex >= 0 && monthIndex <= 11) {
      return { year, monthIndex };
    }
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return { year: parsed.getFullYear(), monthIndex: parsed.getMonth() };
}

/**
 * Verifica exactamente en cliente que una cadena Date corresponda al mes (year, monthIndex 0..11).
 */
export function matchesMonth(dateStr, year, monthIndex) {
  const ym = parseYearMonth(dateStr);
  if (!ym) return false;
  return ym.monthIndex === monthIndex && ym.year === year;
}

const DATE_INDEX_TTL_MS = 60 * 1000;
const dateIndexCache = new Map();

function isStatementTimeoutError(error) {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || error).toLowerCase();
  return (
    code === "57014" ||
    msg.includes("statement timeout") ||
    msg.includes("canceling statement")
  );
}

/**
 * Paginación determinista por keyset (`_id > lastId ORDER BY _id ASC LIMIT pageSize`).
 * Evita la pérdida silenciosa de filas de `.range(from, to)` sin `ORDER BY` en Postgres
 * y aprovecha el índice de clave primaria `_id` sin costo de `OFFSET`.
 */
async function fetchKeysetPaginated({
  table,
  columns,
  orFilter = null,
  pageSize = 1000,
}) {
  let allRows = [];
  let lastId = null;

  while (true) {
    let query = supabase
      .from(table)
      .select(columns)
      .order("_id", { ascending: true })
      .limit(pageSize);

    if (orFilter) {
      query = query.or(orFilter);
    }
    if (lastId !== null) {
      query = query.gt("_id", lastId);
    }

    const { data, error } = await query;

    if (error) {
      const wrapped = new Error(`Error consultando ${table}: ${error.message || error}`);
      wrapped.code = error.code;
      throw wrapped;
    }

    if (!data || data.length === 0) break;

    allRows = allRows.concat(data);
    if (data.length < pageSize) break;

    const nextLastId = data[data.length - 1]?._id;
    if (nextLastId === undefined || nextLastId === null || nextLastId === lastId) {
      break;
    }
    lastId = nextLastId;
  }

  const seen = new Set();
  return allRows.filter((row) => {
    if (row._id === undefined || row._id === null) return true;
    if (seen.has(row._id)) return false;
    seen.add(row._id);
    return true;
  });
}

/**
 * Descarga un índice liviano `{ _id, Date }` de la tabla ordenado determinísticamente
 * por `_id` (paginación por keyset), garantizando el 100% de las filas sin pérdida ni duplicados.
 * Reutiliza caché en memoria por 60s y deduplica llamadas concurrentes.
 */
async function fetchTableDateIndex(table, { force = false, pageSize = 1000 } = {}) {
  const now = Date.now();
  const cached = dateIndexCache.get(table);

  if (!force && cached?.rows && now - cached.fetchedAt < DATE_INDEX_TTL_MS) {
    return cached.rows;
  }
  if (!force && cached?.promise) {
    return cached.promise;
  }

  const promise = (async () => {
    const deduped = await fetchKeysetPaginated({
      table,
      columns: "_id, Date",
      pageSize,
    });

    dateIndexCache.set(table, { rows: deduped, fetchedAt: Date.now(), promise: null });
    return deduped;
  })().catch((err) => {
    const cur = dateIndexCache.get(table);
    if (cur?.promise === promise) {
      dateIndexCache.delete(table);
    }
    throw err;
  });

  dateIndexCache.set(table, {
    rows: cached?.rows || null,
    fetchedAt: cached?.fetchedAt || 0,
    promise,
  });

  return promise;
}

/**
 * Obtiene las columnas solicitadas para un conjunto de `_id` en lotes pequeños
 * con concurrencia acotada.
 */
async function fetchRowsByIds({ table, columns, ids, chunkSize = 100, concurrency = 3 }) {
  if (!ids || ids.length === 0) return [];

  const chunks = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const results = new Array(chunks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < chunks.length) {
      const idx = nextIndex++;
      const chunk = chunks[idx];
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .in("_id", chunk);

      if (error) {
        throw new Error(`Error consultando ${table}: ${error.message || error}`);
      }
      results[idx] = data || [];
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, chunks.length) }, () => worker());
  await Promise.all(workers);

  const flat = results.flat();
  const seen = new Set();
  return flat.filter((row) => {
    if (row._id === undefined || row._id === null) return true;
    if (seen.has(row._id)) return false;
    seen.add(row._id);
    return true;
  });
}

/**
 * Fallback secuencial ordenado por `_id` (paginación por keyset en lotes de 500) filtrando en cliente.
 */
async function fetchSequentialClientFiltered({ table, columns, predicate, pageSize = 500 }) {
  let matched = [];
  let lastId = null;

  while (true) {
    let query = supabase
      .from(table)
      .select(columns)
      .order("_id", { ascending: true })
      .limit(pageSize);

    if (lastId !== null) {
      query = query.gt("_id", lastId);
    }

    const { data, error } = await query;

    if (error) {
      const wrapped = new Error(`Error consultando ${table}: ${error.message || error}`);
      wrapped.code = error.code;
      throw wrapped;
    }

    if (!data || data.length === 0) break;

    for (const row of data) {
      if (predicate(row)) matched.push(row);
    }

    if (data.length < pageSize) break;

    const nextLastId = data[data.length - 1]?._id;
    if (nextLastId === undefined || nextLastId === null || nextLastId === lastId) {
      break;
    }
    lastId = nextLastId;
  }

  if (matched.length > 0 && matched[0]._id !== undefined) {
    const seen = new Set();
    return matched.filter((row) => {
      if (seen.has(row._id)) return false;
      seen.add(row._id);
      return true;
    });
  }

  return matched;
}

/**
 * Consulta en 2 fases para tablas con `Date` en texto:
 * 1) Descarga/reutiliza el índice liviano `{ _id, Date }` ordenado por `_id`.
 * 2) Filtra en cliente y descarga las columnas completas solo para los `_id` coincidentes.
 * Si el lookup por `_id` llegara a dar timeout, cae a escaneo secuencial ordenado en lotes pequeños.
 */
async function fetchByDatePredicate({ table, columns, predicate, force = false }) {
  const indexRows = await fetchTableDateIndex(table, { force });
  const matchingIds = [];

  for (const row of indexRows) {
    if (predicate(row) && row._id !== undefined && row._id !== null) {
      matchingIds.push(row._id);
    }
  }

  if (matchingIds.length === 0) return [];

  try {
    return await fetchRowsByIds({ table, columns, ids: matchingIds });
  } catch (err) {
    if (isStatementTimeoutError(err)) {
      console.warn(`Lookup por _id en ${table} dio timeout; usando escaneo secuencial.`);
      return fetchSequentialClientFiltered({ table, columns, predicate });
    }
    throw err;
  }
}

/**
 * Intenta primero una consulta directa filtrada en el servidor (rápida y siempre fresca,
 * paginada por keyset `_id`). Si ocurre `statement timeout`, cae al índice ordenado en cliente.
 */
async function fetchByServerOrWithFallback({
  table,
  columns,
  orFilter,
  predicate,
  force = false,
}) {
  try {
    const rows = await fetchKeysetPaginated({
      table,
      columns,
      orFilter,
    });
    return rows.filter(predicate);
  } catch (err) {
    if (isStatementTimeoutError(err)) {
      console.warn(`Filtro directo en ${table} dio timeout; usando índice ordenado por _id.`);
      return fetchByDatePredicate({ table, columns, predicate, force });
    }
    throw err;
  }
}

/**
 * Consulta paginada por keyset en Supabase para columnas `timestamp with time zone`
 * aplicando rango [startIso, endIso) en el servidor.
 */
async function fetchTimestampRangePaginated({
  table,
  columns,
  startIso,
  endIso,
  dateColumn = "Date",
  pageSize = 1000,
}) {
  let allRows = [];
  let lastId = null;

  while (true) {
    let query = supabase
      .from(table)
      .select(columns)
      .gte(dateColumn, startIso)
      .lt(dateColumn, endIso)
      .order("_id", { ascending: true })
      .limit(pageSize);

    if (lastId !== null) {
      query = query.gt("_id", lastId);
    }

    const { data, error } = await query;

    if (error) {
      const wrapped = new Error(`Error consultando ${table}: ${error.message || error}`);
      wrapped.code = error.code;
      throw wrapped;
    }

    if (!data || data.length === 0) break;

    allRows = allRows.concat(data);
    if (data.length < pageSize) break;

    const nextLastId = data[data.length - 1]?._id;
    if (nextLastId === undefined || nextLastId === null || nextLastId === lastId) {
      break;
    }
    lastId = nextLastId;
  }

  // Deduplicar por _id si existe (protección ante inserciones durante paginación)
  if (allRows.length > 0 && allRows[0]._id !== undefined) {
    const seen = new Set();
    return allRows.filter((row) => {
      if (seen.has(row._id)) return false;
      seen.add(row._id);
      return true;
    });
  }

  return allRows;
}

export async function fetchVentasByDay(year, month, day, { force = false } = {}) {
  return fetchByServerOrWithFallback({
    table: "Ventas",
    columns: VENTAS_COLUMNS,
    orFilter: buildDayDateOrFilter(year, month, day),
    predicate: (v) => matchesDay(v.Date, year, month, day),
    force,
  });
}

export async function fetchComprasByDay(year, month, day, { force = false } = {}) {
  return fetchByServerOrWithFallback({
    table: "Compras",
    columns: COMPRAS_COLUMNS,
    orFilter: buildDayDateOrFilter(year, month, day),
    predicate: (c) => matchesDay(c.Date, year, month, day),
    force,
  });
}

export async function fetchVentasByMonth(year, monthIndex, { force = false } = {}) {
  return fetchByServerOrWithFallback({
    table: "Ventas",
    columns: VENTAS_COLUMNS,
    orFilter: buildMonthDateOrFilter(year, monthIndex + 1),
    predicate: (v) => matchesMonth(v.Date, year, monthIndex),
    force,
  });
}

export async function fetchComprasByMonth(year, monthIndex, { detailed = false, force = false } = {}) {
  return fetchByServerOrWithFallback({
    table: "Compras",
    columns: detailed ? COMPRAS_DETAIL_COLUMNS : COMPRAS_COLUMNS,
    orFilter: buildMonthDateOrFilter(year, monthIndex + 1),
    predicate: (c) => matchesMonth(c.Date, year, monthIndex),
    force,
  });
}

export async function fetchConsumoStaffByMonth(year, monthIndex) {
  const start = new Date(Number(year), Number(monthIndex), 1, 0, 0, 0, 0);
  const end = new Date(Number(year), Number(monthIndex) + 1, 1, 0, 0, 0, 0);
  return fetchTimestampRangePaginated({
    table: "ConsumoStaff",
    columns: CONSUMO_STAFF_COLUMNS,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  });
}

/**
 * Enumera los días { year, month (1..12), day, iso } entre startIso y endIso (YYYY-MM-DD, inclusive).
 */
export function enumerateDateRangeDays(startIso, endIso) {
  if (!startIso || !endIso) return [];
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  if ([sy, sm, sd, ey, em, ed].some(Number.isNaN)) return [];

  const cur = new Date(sy, sm - 1, sd, 12, 0, 0);
  const end = new Date(ey, em - 1, ed, 12, 0, 0);
  const days = [];

  while (cur <= end && days.length <= 62) {
    const year = cur.getFullYear();
    const month = cur.getMonth() + 1;
    const day = cur.getDate();
    days.push({
      year,
      month,
      day,
      iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function buildRangeDateOrFilter(days) {
  return days.map((d) => buildDayDateOrFilter(d.year, d.month, d.day)).join(",");
}

function matchesAnyDay(dateStr, days) {
  return days.some((d) => matchesDay(dateStr, d.year, d.month, d.day));
}

export async function fetchVentasByRange(startIso, endIso, { force = false } = {}) {
  const days = enumerateDateRangeDays(startIso, endIso);
  if (days.length === 0) return [];
  if (days.length <= 14) {
    return fetchByServerOrWithFallback({
      table: "Ventas",
      columns: VENTAS_COLUMNS,
      orFilter: buildRangeDateOrFilter(days),
      predicate: (v) => matchesAnyDay(v.Date, days),
      force,
    });
  }
  return fetchByDatePredicate({
    table: "Ventas",
    columns: VENTAS_COLUMNS,
    predicate: (v) => matchesAnyDay(v.Date, days),
    force,
  });
}

export async function fetchComprasByRange(startIso, endIso, { force = false } = {}) {
  const days = enumerateDateRangeDays(startIso, endIso);
  if (days.length === 0) return [];
  if (days.length <= 14) {
    return fetchByServerOrWithFallback({
      table: "Compras",
      columns: COMPRAS_COLUMNS,
      orFilter: buildRangeDateOrFilter(days),
      predicate: (c) => matchesAnyDay(c.Date, days),
      force,
    });
  }
  return fetchByDatePredicate({
    table: "Compras",
    columns: COMPRAS_COLUMNS,
    predicate: (c) => matchesAnyDay(c.Date, days),
    force,
  });
}

export async function fetchConsumoStaffByRange(startIso, endIso) {
  if (!startIso || !endIso) return [];
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  if ([sy, sm, sd, ey, em, ed].some(Number.isNaN)) return [];

  const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
  const end = new Date(ey, em - 1, ed + 1, 0, 0, 0, 0);
  if (end <= start) return [];

  return fetchTimestampRangePaginated({
    table: "ConsumoStaff",
    columns: CONSUMO_STAFF_COLUMNS,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  });
}

/**
 * Obtiene únicamente la columna `Date` de Ventas (reutilizando el índice liviano)
 * para saber qué años y meses tienen ventas registradas.
 */
export async function fetchVentasMonthsIndex({ force = false, pageSize = 1000 } = {}) {
  const indexRows = await fetchTableDateIndex("Ventas", { force, pageSize });
  const yearsSet = new Set();
  const monthKeys = new Set();

  for (const row of indexRows) {
    const ym = parseYearMonth(row?.Date);
    if (ym) {
      yearsSet.add(ym.year);
      monthKeys.add(`${ym.year}-${ym.monthIndex}`);
    }
  }

  return {
    years: Array.from(yearsSet).sort((a, b) => b - a),
    monthKeys,
  };
}

/**
 * Carga en Redux únicamente las tablas de catálogo que todavía están vacías,
 * evitando descargas redundantes al cambiar de fecha o mes.
 * Lanza error si alguna tabla falla al cargar para permitir reintento automático.
 */
export async function ensureCatalogTablesLoaded(dispatch, getState, tables, { force = false } = {}) {
  const state = getState();
  const tablesToLoad = force
    ? tables
    : tables.filter((table) => {
        const key = TABLE_TO_STATE_KEY[table];
        if (!key) return true;
        const current = state[key];
        return !Array.isArray(current) || current.length === 0;
      });

  if (tablesToLoad.length === 0) return;

  const results = await Promise.all(
    tablesToLoad.map(async (table) => {
      const res = await dispatch(getAllFromTable(table));
      return { table, ok: res !== null && res !== undefined };
    })
  );

  const failed = results.filter((r) => !r.ok).map((r) => r.table);
  if (failed.length > 0) {
    throw new Error(`No se pudieron cargar las tablas: ${failed.join(", ")}`);
  }
}
