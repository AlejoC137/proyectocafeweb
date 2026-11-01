/**
 * Supermú Catalog Matcher & Processor Utility
 * Provides intelligent matching between Almacén inventory items and Supermú products (Shopify JSON catalog).
 */

let cachedSupermuCatalog = null;

/**
 * Loads and caches the Supermú products catalog from public/supermu_viewer/supermu_products.json
 */
export async function getSupermuCatalog() {
  if (cachedSupermuCatalog && cachedSupermuCatalog.length > 0) {
    return cachedSupermuCatalog;
  }
  try {
    const res = await fetch("/supermu_viewer/supermu_products.json");
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar catálogo de Supermú`);
    const data = await res.json();
    cachedSupermuCatalog = Array.isArray(data) ? data : [];
    return cachedSupermuCatalog;
  } catch (err) {
    console.error("Error al cargar catálogo Supermú:", err);
    return [];
  }
}

/**
 * Normalizes text for comparison (lowercase, accents removed, punctuation to spaces)
 */
export function normalizeText(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "de", "la", "el", "los", "las", "con", "por", "para", "en", "y", "o", "al", "del",
  "und", "unid", "unidades", "gr", "g", "kg", "kilos", "ml", "lt", "litro", "supermu",
  "tipo", "marca", "calidad", "extra", "aprox", "precio", "promocion", "x"
]);

/**
 * Extract meaningful tokens from a name
 */
export function getTokens(str) {
  return normalizeText(str)
    .split(" ")
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Infers quantity and units from product title and grams field
 */
export function parseUnitsAndQuantity(title, gramsFallback = 0) {
  const t = (title || "").toLowerCase();

  const kgMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilo)\b/i);
  if (kgMatch) {
    return {
      cantidad: Math.round(parseFloat(kgMatch[1]) * 1000),
      unidades: "gr",
      label: `${kgMatch[1]} kg`
    };
  }

  const gMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:gr|g|gramos)\b/i);
  if (gMatch) {
    return {
      cantidad: Math.round(parseFloat(gMatch[1])),
      unidades: "gr",
      label: `${gMatch[1]} gr`
    };
  }

  const ltMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:lt|lts|litro|litros)\b/i);
  if (ltMatch) {
    return {
      cantidad: Math.round(parseFloat(ltMatch[1]) * 1000),
      unidades: "ml",
      label: `${ltMatch[1]} lt`
    };
  }

  const mlMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:ml|cc|cm3)\b/i);
  if (mlMatch) {
    return {
      cantidad: Math.round(parseFloat(mlMatch[1])),
      unidades: "ml",
      label: `${mlMatch[1]} ml`
    };
  }

  const undMatch = t.match(/(\d+)\s*(?:und|unid|unidades|u\b)/i);
  if (undMatch) {
    return {
      cantidad: parseInt(undMatch[1], 10),
      unidades: "und",
      label: `${undMatch[1]} und`
    };
  }

  if (gramsFallback && Number(gramsFallback) > 0) {
    return {
      cantidad: Number(gramsFallback),
      unidades: "gr",
      label: `${gramsFallback} gr`
    };
  }

  return {
    cantidad: 1,
    unidades: "und",
    label: "1 und"
  };
}

/**
 * Scoring algorithm between a warehouse item and a Supermú candidate
 * Returns score between 0.0 and 1.0
 */
export function scoreMatch(itemTitle, candidateTitle, candidateProduct = null) {
  const normItem = normalizeText(itemTitle);
  const normCand = normalizeText(candidateTitle);

  if (!normItem || !normCand) return 0;
  if (normCand === normItem) return 1.0;

  const iTokens = getTokens(itemTitle);
  const cTokens = getTokens(candidateTitle);
  if (iTokens.length === 0 || cTokens.length === 0) return 0;

  // Exact phrase substring match
  if (normCand.includes(normItem)) {
    // If the candidate is just slightly longer (e.g. "platano verde" -> "platano verde aprox 1000gr")
    return Math.max(0.85, 1.0 - (cTokens.length - iTokens.length) * 0.03);
  }

  let matchedTokens = 0;
  for (const it of iTokens) {
    if (cTokens.includes(it)) {
      matchedTokens += 1.0;
    } else if (cTokens.some((ct) => ct.startsWith(it) || it.startsWith(ct))) {
      matchedTokens += 0.8;
    }
  }

  const tokenCoverage = matchedTokens / iTokens.length;

  // Penalty if candidate has way too many extra words (like a processed recipe/bakery product)
  const lengthRatio = Math.min(1.0, (iTokens.length / cTokens.length) * 1.4);

  // Bonus if the first word matches (e.g. "Pechuga...", "Papa...", "Arroz...")
  let prefixBonus = 0;
  if (iTokens[0] && cTokens[0] && (iTokens[0] === cTokens[0] || cTokens.includes(iTokens[0]))) {
    prefixBonus = 0.15;
  }

  let finalScore = (tokenCoverage * 0.7 + lengthRatio * 0.2 + prefixBonus) * (tokenCoverage >= 0.5 ? 1 : 0.4);
  return Math.min(1.0, Math.max(0, finalScore));
}

/**
 * Finds top matching candidates for a single inventory item
 */
export function findCandidatesForItem(item, supermuProducts, limit = 4, minScore = 0.4) {
  const itemName = item.Nombre_del_producto || "";
  const candidates = [];

  for (const prod of supermuProducts) {
    const score = scoreMatch(itemName, prod.title, prod);
    if (score >= minScore) {
      candidates.push({
        product: prod,
        score: Math.round(score * 100),
        rawScore: score
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

/**
 * Builds a staging proposal object for an inventory item matched with a Supermú product
 */
export function buildProposedStagedItem(item, supermuProd) {
  const { cantidad, unidades } = parseUnitsAndQuantity(supermuProd.title, supermuProd.grams);
  const costo = Number(supermuProd.price) || 0;
  const precioUnitario = cantidad > 0 ? Math.round((costo / cantidad) * 100) / 100 : costo;
  const fechaAct = new Date().toISOString().split("T")[0];

  return {
    ...item,
    COSTO: costo,
    CANTIDAD: cantidad,
    UNIDADES: unidades,
    precioUnitario,
    FECHA_ACT: fechaAct,
    _original: item,
    _isStaged: true,
    _matchedSupermu: supermuProd,
    _includedFields: ["COSTO", "CANTIDAD", "UNIDADES", "precioUnitario", "FECHA_ACT"]
  };
}

/**
 * Batch matches multiple warehouse items against Supermú catalog
 */
export function autoMatchInventory(items = [], supermuProducts = [], minScore = 0.55) {
  const matches = [];
  const unmatched = [];

  for (const item of items) {
    const candidates = findCandidatesForItem(item, supermuProducts, 4, minScore);
    if (candidates.length > 0 && candidates[0].score >= Math.round(minScore * 100)) {
      const best = candidates[0].product;
      const proposed = buildProposedStagedItem(item, best);
      const oldCosto = Number(item.COSTO) || 0;
      const newCosto = proposed.COSTO;
      const diff = newCosto - oldCosto;
      const pctDiff = oldCosto > 0 ? ((diff / oldCosto) * 100).toFixed(1) : null;

      matches.push({
        item,
        bestProduct: best,
        candidates,
        score: candidates[0].score,
        proposed,
        oldCosto,
        newCosto,
        diff,
        pctDiff,
        isUp: diff > 0,
        isDown: diff < 0
      });
    } else {
      unmatched.push(item);
    }
  }

  return {
    matches,
    unmatched,
    summary: {
      totalInput: items.length,
      matchedCount: matches.length,
      unmatchedCount: unmatched.length,
      subieron: matches.filter((m) => m.isUp).length,
      bajaron: matches.filter((m) => m.isDown).length,
      iguales: matches.filter((m) => m.diff === 0).length
    }
  };
}

/**
 * Builds AI Context text if user selects Supermú as the sole truth source
 */
export function buildSupermuPromptContext(matchedList = []) {
  if (!matchedList || matchedList.length === 0) return "";
  
  return matchedList
    .map((m) => {
      const p = m.bestProduct;
      return `- Ítem: "${m.item.Nombre_del_producto}" (ID: ${m.item._id})
    ➔ Supermú Coincidente: "${p.title}"
    ➔ Precio Catálogo: $${p.price} COP | Gramos/Medida: ${p.grams || "N/A"}
    ➔ URL Oficial: ${p.url || "https://supermu.com"}`;
    })
    .join("\n\n");
}
