import supabase from "../config/supabaseClient";
import { getTokens, normalizeText, parseUnitsAndQuantity } from "./supermuMatcher";

/**
 * Sanitiza números que en tablas legadas vienen como string o "NaN".
 */
export function safeNumber(val, fallback = 0) {
  if (val === null || val === undefined || val === "" || val === "NaN") return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parsea un precio en formato COP ($12.500, 12500, etc.) a número.
 */
export function parseCopPrice(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  let cleaned = String(raw || "").replace(/[^\d.,]/g, "");
  if (!cleaned) return 0;
  if (cleaned.includes(".") && !cleaned.includes(",")) {
    const parts = cleaned.split(".");
    if (parts.slice(1).every((p) => p.length === 3)) {
      cleaned = parts.join("");
    }
  }
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Parsea un extracto crudo (JSON de Agent Reach / screenshot / Supermú o Markdown/texto)
 * a una lista normalizada de productos con precio, cantidad, unidad y precio unitario.
 */
export function parseExtractToProducts(rawText) {
  const trimmed = (rawText || "").trim();
  if (!trimmed) return [];

  // 1. Intento JSON (Agent Reach `{ items: [...] }`, array directo o formato RECIBO)
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.items)
        ? parsed.items
        : Array.isArray(parsed.productos)
        ? parsed.productos
        : [];

      if (list.length > 0) {
        return list
          .map((it) => {
            const nombre = String(
              it.nombre_detectado || it.title || it.nombre || it.producto || it.name || ""
            ).trim();
            if (!nombre) return null;

            const precio = parseCopPrice(
              it.precio_total ?? it.costo_total ?? it.price ?? it.precio ?? 0
            );
            const inferred = parseUnitsAndQuantity(nombre, safeNumber(it.grams, 0));
            const cantidad = safeNumber(it.cantidad, 0) > 0 ? safeNumber(it.cantidad) : inferred.cantidad;
            const unidad = String(it.unidad || it.unidades || inferred.unidades || "und").trim();
            const precioUnitario =
              safeNumber(it.precio_unitario, 0) > 0
                ? safeNumber(it.precio_unitario)
                : cantidad > 0
                ? Math.round((precio / cantidad) * 10000) / 10000
                : precio;

            return {
              nombre_detectado: nombre,
              precio_total: precio,
              cantidad,
              unidad,
              precio_unitario: precioUnitario,
              url_producto: it.url_producto || it.url || "",
            };
          })
          .filter(Boolean);
      }
    } catch {
      // Continúa al parser de texto/Markdown
    }
  }

  // 2. Fallback texto plano / Markdown de Agent Reach
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const priceMatch = line.match(/\$\s*([\d.,]+)/);
    if (!priceMatch) continue;

    const precio = parseCopPrice(priceMatch[1]);
    if (precio <= 0) continue;

    let nombre = line.replace(/\$\s*[\d.,]+/g, "").replace(/^[-|*#\s[\]()]+|[-|*#\s[\]()]+$/g, "").trim();
    if (nombre.length < 3 && i > 0) {
      nombre = lines[i - 1].replace(/^[-|*#\s[\]()]+|[-|*#\s[\]()]+$/g, "").trim();
    }
    if (nombre.length < 3) continue;

    const key = nombre.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const inferred = parseUnitsAndQuantity(nombre);
    const precioUnitario =
      inferred.cantidad > 0
        ? Math.round((precio / inferred.cantidad) * 10000) / 10000
        : precio;

    results.push({
      nombre_detectado: nombre.slice(0, 180),
      precio_total: precio,
      cantidad: inferred.cantidad,
      unidad: inferred.unidades,
      precio_unitario: precioUnitario,
      url_producto: "",
    });
  }

  return results;
}

/**
 * Busca el mejor ítem de ItemsAlmacen para un producto detectado en un extracto.
 */
export function matchDetectedProductToAlmacen(nombreDetectado, almacenItems = []) {
  const tokens = getTokens(nombreDetectado);
  const normQuery = normalizeText(nombreDetectado);
  if (tokens.length === 0 && !normQuery) return null;

  let best = null;
  let bestScore = 0;

  for (const item of almacenItems) {
    const itemName = item.Nombre_del_producto || "";
    const normItem = normalizeText(itemName);
    if (!normItem) continue;

    if (normItem === normQuery) return { item, score: 100 };

    const itemTokens = getTokens(itemName);
    let matches = 0;
    for (const t of tokens) {
      if (itemTokens.some((it) => it === t || (t.length >= 4 && it.includes(t)) || (it.length >= 4 && t.includes(it)))) {
        matches++;
      }
    }

    const union = new Set([...tokens, ...itemTokens]).size;
    const score = union > 0 ? Math.round((matches / Math.max(tokens.length, 1)) * 100) : 0;

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best && bestScore >= 45 ? { item: best, score: bestScore } : null;
}

/**
 * Construye un ítem en formato staging para GestionAlmacen.jsx sin alterar
 * estructuras embebidas existentes (STOCK, ALMACENAMIENTO, historial_update).
 */
export function buildStagedFromHistoricalRow(almacenItem, histRow, proveedorNombre = "Proveedor") {
  const costo = safeNumber(histRow.precio_total, safeNumber(almacenItem.COSTO, 0));
  const cantidad = safeNumber(histRow.cantidad, safeNumber(almacenItem.CANTIDAD, 1)) || 1;
  const unidades = histRow.unidad || (almacenItem.UNIDADES && almacenItem.UNIDADES !== "NaN" ? almacenItem.UNIDADES : "und");
  const precioUnitario = Math.round((costo / cantidad) * 100) / 100;
  const fechaAct = new Date().toISOString().split("T")[0];

  return {
    ...almacenItem,
    COSTO: costo,
    CANTIDAD: cantidad,
    UNIDADES: unidades,
    precioUnitario,
    FECHA_ACT: fechaAct,
    _original: almacenItem,
    _isStaged: true,
    _providerSnapshotRowId: histRow._id || null,
    _providerCaptureId: histRow.captura_id || null,
    _providerSourceLabel: `${proveedorNombre} (${histRow._metodo || "Agent-Reach"})`,
    _includedFields: ["COSTO", "CANTIDAD", "UNIDADES", "precioUnitario", "FECHA_ACT"],
  };
}

export async function fetchCapturasByProveedor(proveedorId) {
  let query = supabase
    .from("CapturasProveedor")
    .select("*")
    .order("fecha_captura", { ascending: false })
    .limit(50);

  if (proveedorId && proveedorId !== "TODOS") {
    query = query.eq("proveedor_id", proveedorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchProductosByCaptura(capturaId) {
  const { data, error } = await supabase
    .from("PreciosHistoricosProducto")
    .select("*")
    .eq("captura_id", capturaId)
    .order("nombre_detectado", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchItemTimeSeries(proveedorId, itemId) {
  let query = supabase
    .from("PreciosHistoricosProducto")
    .select("*")
    .order("fecha_captura", { ascending: true })
    .limit(100);

  if (proveedorId && proveedorId !== "TODOS") {
    query = query.eq("proveedor_id", proveedorId);
  }
  if (itemId) {
    query = query.eq("item_id", itemId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function saveProviderCapture({
  proveedorId,
  fechaCaptura,
  urlFuente,
  metodo,
  extractoRaw,
  evidenciaUrl = "",
  notas = "",
  productos = [],
}) {
  const isoDate = fechaCaptura ? new Date(fechaCaptura).toISOString() : new Date().toISOString();

  const { data: capData, error: capErr } = await supabase
    .from("CapturasProveedor")
    .insert({
      proveedor_id: proveedorId,
      fecha_captura: isoDate,
      url_fuente: (urlFuente || "").trim(),
      metodo: metodo || "agent-reach",
      extracto_raw: extractoRaw || "",
      evidencia_url: evidenciaUrl || null,
      total_productos: productos.length,
      estado: "pendiente",
      notas: notas || null,
    })
    .select()
    .single();

  if (capErr) throw capErr;

  if (productos.length > 0) {
    const rows = productos.map((p) => ({
      captura_id: capData._id,
      proveedor_id: proveedorId,
      item_id: p.item_id || null,
      fecha_captura: isoDate,
      nombre_detectado: p.nombre_detectado,
      precio_total: safeNumber(p.precio_total, 0),
      cantidad: safeNumber(p.cantidad, 1) || 1,
      unidad: p.unidad || "und",
      precio_unitario: safeNumber(p.precio_unitario, 0),
      url_producto: p.url_producto || (urlFuente || "").trim(),
      aplicado_a_almacen: false,
    }));

    const { error: prodErr } = await supabase
      .from("PreciosHistoricosProducto")
      .insert(rows);
    if (prodErr) throw prodErr;
  }

  return capData;
}

export async function markHistoricalRowsApplied(rowIds = [], capturaId = null) {
  const validIds = rowIds.filter(Boolean);
  if (validIds.length > 0) {
    await supabase
      .from("PreciosHistoricosProducto")
      .update({ aplicado_a_almacen: true })
      .in("_id", validIds);
  }
  if (capturaId) {
    await supabase
      .from("CapturasProveedor")
      .update({ estado: "aplicado" })
      .eq("_id", capturaId);
  }
}
