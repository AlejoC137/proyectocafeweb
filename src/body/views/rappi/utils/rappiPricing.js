/**
 * Cálculos de precio y rentabilidad para canales externos (Rappi / Proyecto 1 / Proyecto 2).
 * Costo de producción: utils/costoMenu.js (CMP + CMO de recetaMariaPaula).
 */
import { calcularCostoMenuItem } from "@/utils/costoMenu";

export const CANALES = [
  { key: "RAPPI", campo: "RAPPI", label: "Rappi", emoji: "🛵", color: "orange" },
  { key: "PROYECTO_1", campo: "PROYECTO_1", label: "Proyecto 1", emoji: "1️⃣", color: "blue" },
  { key: "PROYECTO_2", campo: "PROYECTO_2", label: "Proyecto 2", emoji: "2️⃣", color: "purple" },
];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const redondearArriba = (valor, redondeo = 100) => {
  const r = num(redondeo) || 1;
  return Math.ceil(num(valor) / r) * r;
};

/** Precio sugerido para Rappi = precio local + % aumento, redondeado hacia arriba. */
export const precioRappiSugerido = (precioLocal, cfg) =>
  redondearArriba(num(precioLocal) * (1 + num(cfg?.aumento_pct) / 100), cfg?.redondeo);

/** Precio efectivo: override manual (Precio_Rappi) o el sugerido por el moderador. */
export const precioRappiEfectivo = (menuItem, cfg) => {
  const manual = menuItem?.Precio_Rappi;
  if (manual !== null && manual !== undefined && manual !== "" && !isNaN(Number(manual))) return Number(manual);
  return precioRappiSugerido(menuItem?.Precio, cfg);
};

export const esPrecioManual = (menuItem) =>
  menuItem?.Precio_Rappi !== null && menuItem?.Precio_Rappi !== undefined && menuItem?.Precio_Rappi !== "";

/** Comisión del canal incluyendo IVA sobre la comisión. */
export const comisionRappi = (precio, cfg) =>
  num(precio) * (num(cfg?.comision_pct) / 100) * (1 + num(cfg?.iva_comision_pct) / 100);

export const netoRappi = (precio, cfg) => num(precio) - comisionRappi(precio, cfg);

/**
 * Precio mínimo en el canal para lograr un margen neto objetivo (0-100).
 * neto = P·(1 − c·(1+iva));  ganancia = neto − costo;  margen = ganancia / P
 * ⇒ P = costo / ((1 − c·(1+iva)) − margen)
 */
export const precioPorMargenObjetivo = (costo, margenObjetivoPct, cfg) => {
  const factorNeto = 1 - (num(cfg?.comision_pct) / 100) * (1 + num(cfg?.iva_comision_pct) / 100);
  const denom = factorNeto - num(margenObjetivoPct) / 100;
  if (denom <= 0 || num(costo) <= 0) return null;
  return redondearArriba(num(costo) / denom, cfg?.redondeo);
};

/** Fila completa de análisis para un producto del menú. */
export function analizarProducto(menuItem, cfg, recetasMenu, recetasProduccion, precioOverride = undefined) {
  const { costo, vCMP, vCMO, tieneReceta } = calcularCostoMenuItem(menuItem, recetasMenu, recetasProduccion);
  const precioLocal = num(menuItem.Precio);
  const precioRappi = precioOverride !== undefined ? num(precioOverride) : precioRappiEfectivo(menuItem, cfg);
  const comision = comisionRappi(precioRappi, cfg);
  const neto = precioRappi - comision;
  const gananciaLocal = precioLocal - costo;
  const gananciaRappi = neto - costo;
  return {
    id: menuItem._id,
    nombre: menuItem.NombreES,
    nombreEN: menuItem.NombreEN,
    descripcion: menuItem.DescripcionMenuES,
    grupo: menuItem.GRUPO,
    subGrupo: menuItem.SUB_GRUPO,
    foto: menuItem.Foto,
    estado: menuItem.Estado,
    recetaId: menuItem.Receta,
    RAPPI: !!menuItem.RAPPI,
    PROYECTO_1: !!menuItem.PROYECTO_1,
    PROYECTO_2: !!menuItem.PROYECTO_2,
    precioManual: esPrecioManual(menuItem),
    precioLocal,
    precioRappi,
    diferenciaPct: precioLocal > 0 ? ((precioRappi - precioLocal) / precioLocal) * 100 : 0,
    costo,
    vCMP,
    vCMO,
    tieneReceta,
    comision,
    neto,
    gananciaLocal,
    gananciaRappi,
    margenLocal: precioLocal > 0 ? (gananciaLocal / precioLocal) * 100 : 0,
    margenRappi: precioRappi > 0 ? (gananciaRappi / precioRappi) * 100 : 0,
  };
}

export const colorMargen = (margen, tieneCosto = true) => {
  if (!tieneCosto) return "bg-slate-100 text-slate-500";
  if (margen < 20) return "bg-red-100 text-red-700";
  if (margen < 35) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
};

export const formatCOP = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "$ 0";

export const formatPct = (n) => `${Number(n || 0).toFixed(1)}%`;

/** Parsea fechas de Ventas.Date ("M/D/YYYY", formato en-US de crearVenta). */
export const parseVentaDate = (dateStr) => {
  if (!dateStr) return null;
  const m = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
};

export const parseJSONSafe = (v, fallback = null) => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};
