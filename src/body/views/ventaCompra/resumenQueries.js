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

/**
 * Consulta paginada en Supabase aplicando filtro `.or()` en el servidor
 * y seleccionando únicamente las columnas necesarias.
 */
async function fetchFilteredPaginated({ table, columns, orFilter, pageSize = 1000 }) {
  let allRows = [];
  let page = 0;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .or(orFilter)
      .range(from, to);

    if (error) {
      throw new Error(`Error consultando ${table}: ${error.message || error}`);
    }

    if (!data || data.length === 0) break;

    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    page++;
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

export async function fetchVentasByDay(year, month, day) {
  const orFilter = buildDayDateOrFilter(year, month, day);
  const rows = await fetchFilteredPaginated({
    table: "Ventas",
    columns: VENTAS_COLUMNS,
    orFilter,
  });
  return rows.filter((v) => matchesDay(v.Date, year, month, day));
}

export async function fetchComprasByDay(year, month, day) {
  const orFilter = buildDayDateOrFilter(year, month, day);
  const rows = await fetchFilteredPaginated({
    table: "Compras",
    columns: COMPRAS_COLUMNS,
    orFilter,
  });
  return rows.filter((c) => matchesDay(c.Date, year, month, day));
}

export async function fetchVentasByMonth(year, monthIndex) {
  const orFilter = buildMonthDateOrFilter(year, monthIndex + 1);
  const rows = await fetchFilteredPaginated({
    table: "Ventas",
    columns: VENTAS_COLUMNS,
    orFilter,
  });
  return rows.filter((v) => matchesMonth(v.Date, year, monthIndex));
}

export async function fetchComprasByMonth(year, monthIndex, { detailed = false } = {}) {
  const orFilter = buildMonthDateOrFilter(year, monthIndex + 1);
  const rows = await fetchFilteredPaginated({
    table: "Compras",
    columns: detailed ? COMPRAS_DETAIL_COLUMNS : COMPRAS_COLUMNS,
    orFilter,
  });
  return rows.filter((c) => matchesMonth(c.Date, year, monthIndex));
}

export async function fetchConsumoStaffByMonth(year, monthIndex) {
  const orFilter = buildMonthDateOrFilter(year, monthIndex + 1);
  const rows = await fetchFilteredPaginated({
    table: "ConsumoStaff",
    columns: CONSUMO_STAFF_COLUMNS,
    orFilter,
  });
  return rows.filter((c) => matchesMonth(c.Date, year, monthIndex));
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

export async function fetchVentasByRange(startIso, endIso) {
  const days = enumerateDateRangeDays(startIso, endIso);
  if (days.length === 0) return [];
  const orFilter = buildRangeDateOrFilter(days);
  const rows = await fetchFilteredPaginated({
    table: "Ventas",
    columns: VENTAS_COLUMNS,
    orFilter,
  });
  return rows.filter((v) => matchesAnyDay(v.Date, days));
}

export async function fetchComprasByRange(startIso, endIso) {
  const days = enumerateDateRangeDays(startIso, endIso);
  if (days.length === 0) return [];
  const orFilter = buildRangeDateOrFilter(days);
  const rows = await fetchFilteredPaginated({
    table: "Compras",
    columns: COMPRAS_COLUMNS,
    orFilter,
  });
  return rows.filter((c) => matchesAnyDay(c.Date, days));
}

export async function fetchConsumoStaffByRange(startIso, endIso) {
  const days = enumerateDateRangeDays(startIso, endIso);
  if (days.length === 0) return [];
  const orFilter = buildRangeDateOrFilter(days);
  const rows = await fetchFilteredPaginated({
    table: "ConsumoStaff",
    columns: CONSUMO_STAFF_COLUMNS,
    orFilter,
  });
  return rows.filter((c) => matchesAnyDay(c.Date, days));
}

/**
 * Obtiene únicamente la columna `Date` de Ventas (paginado) para saber qué años y meses
 * tienen ventas registradas, sin descargar el resto de columnas pesadas.
 */
export async function fetchVentasMonthsIndex({ pageSize = 1000 } = {}) {
  const yearsSet = new Set();
  const monthKeys = new Set();
  let page = 0;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("Ventas")
      .select("Date")
      .range(from, to);

    if (error) {
      throw new Error(`Error consultando índice de Ventas: ${error.message || error}`);
    }

    if (!data || data.length === 0) break;

    for (const row of data) {
      const ym = parseYearMonth(row?.Date);
      if (ym) {
        yearsSet.add(ym.year);
        monthKeys.add(`${ym.year}-${ym.monthIndex}`);
      }
    }

    if (data.length < pageSize) break;
    page++;
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
export async function ensureCatalogTablesLoaded(dispatch, getState, tables) {
  const state = getState();
  const missingTables = tables.filter((table) => {
    const key = TABLE_TO_STATE_KEY[table];
    if (!key) return true;
    const current = state[key];
    return !Array.isArray(current) || current.length === 0;
  });

  if (missingTables.length === 0) return;

  const results = await Promise.all(
    missingTables.map(async (table) => {
      const res = await dispatch(getAllFromTable(table));
      return { table, ok: res !== null && res !== undefined };
    })
  );

  const failed = results.filter((r) => !r.ok).map((r) => r.table);
  if (failed.length > 0) {
    throw new Error(`No se pudieron cargar las tablas: ${failed.join(", ")}`);
  }
}
