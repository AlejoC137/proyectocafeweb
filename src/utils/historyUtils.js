/**
 * Compares an original item with updates and generates history entries.
 * 
 * @param {Object} originalItem - The original item data (before update).
 * @param {Object} updates - The new values to apply.
 * @returns {Array} - An array of history objects describing the changes.
 */
export const compareAndGenerateHistory = (originalItem, updates) => {
    const historyEntries = [];
    const ignoredKeys = ["_id", "historial_update", "_isUpdated", "_original", "campos_parseados", "_excludedFields", "_latestHistoryIndex"];

    for (const key in updates) {
        if (ignoredKeys.includes(key) || key.startsWith('_')) continue;

        let oldValue = originalItem ? originalItem[key] : "";
        let newValue = updates ? updates[key] : "";

        // Normalize for comparison
        // Treat null and undefined as equivalent
        if (oldValue === null || oldValue === undefined) oldValue = "";
        if (newValue === null || newValue === undefined) newValue = "";

        // If numeric-ish, try to compare as numbers
        const isOldNumber = !isNaN(oldValue) && oldValue !== "" && typeof oldValue !== 'object';
        const isNewNumber = !isNaN(newValue) && newValue !== "" && typeof newValue !== 'object';

        let different = false;

        if (isOldNumber && isNewNumber) {
            if (Number(oldValue) !== Number(newValue)) {
                different = true;
            }
        } else {
            // String comparison
            if (String(oldValue).trim() !== String(newValue).trim()) {
                different = true;
            }
        }

        if (different) {
            historyEntries.push({
                campo: key,
                fecha: new Date().toISOString(),
                valor_inicial: originalItem ? originalItem[key] : null,
                valor_final: updates[key]
            });
        }
    }

    return historyEntries;
};

/**
 * Appends a new changes entry to the item's historial_update array without replacing previous entries.
 * Every modification appends a new independent log entry into the array.
 * 
 * @param {Array|string|null} originalHistory - Current historial_update from DB.
 * @param {Object} cambios - Map of changed fields: { [campo]: { anterior, nuevo } }.
 * @param {Object|string} meta - Metadata about origin and type: { origen: "Tabla Inventario", tipo: "manual" | "automático" }
 * @returns {Array<string>} - New array of JSON strings containing ALL past logs plus the new log.
 */
export const buildUpdatedHistory = (originalHistory, cambios, meta = {}) => {
    if (!cambios || Object.keys(cambios).length === 0) {
        return Array.isArray(originalHistory) ? originalHistory : (originalHistory ? [originalHistory] : []);
    }

    let historyArray = [];
    if (Array.isArray(originalHistory)) {
        historyArray = [...originalHistory];
    } else if (typeof originalHistory === "string") {
        try {
            const parsed = JSON.parse(originalHistory);
            if (Array.isArray(parsed)) historyArray = parsed;
            else historyArray = [originalHistory];
        } catch {
            historyArray = [originalHistory];
        }
    }

    let origen = "Inventario";
    let tipo = "manual";

    if (typeof meta === "string") {
        origen = meta;
        if (meta.toLowerCase().includes("ia") || meta.toLowerCase().includes("recibo") || meta.toLowerCase().includes("autom")) {
            tipo = "automático";
        }
    } else if (typeof meta === "object" && meta !== null) {
        if (meta.origen) origen = meta.origen;
        if (meta.tipo) tipo = meta.tipo;
        else if (origen.toLowerCase().includes("ia") || origen.toLowerCase().includes("recibo")) {
            tipo = "automático";
        }
    }

    const newEntry = JSON.stringify({
        fecha: new Date().toISOString(),
        origen,
        tipo, // "manual" | "automático"
        cambios
    });

    // Append to end of array (all previous logs are preserved)
    return [...historyArray, newEntry];
};

/**
 * Safely parses and normalizes historial_update into objects for UI display.
 * Includes logIndex indicating the chronological change order (#1, #2, #3...).
 * 
 * @param {Array|string|null} rawHistory - historial_update from DB.
 * @returns {Array<Object>} - Parsed history objects sorted newest first.
 */
export const parseHistoryEntries = (rawHistory) => {
    if (!rawHistory) return [];

    let array = [];
    if (Array.isArray(rawHistory)) {
        array = rawHistory;
    } else if (typeof rawHistory === "string") {
        try {
            const parsed = JSON.parse(rawHistory);
            if (Array.isArray(parsed)) array = parsed;
            else array = [rawHistory];
        } catch {
            array = [rawHistory];
        }
    }

    const parsedArray = array.map((item, idx) => {
        const logNumber = idx + 1;
        if (typeof item === "object" && item !== null) {
            return {
                ...item,
                _id: idx,
                logIndex: logNumber,
                origen: item.origen || "Manual",
                tipo: item.tipo || (item.origen?.toLowerCase().includes("ia") ? "automático" : "manual")
            };
        }
        try {
            const parsed = JSON.parse(item);
            return {
                ...parsed,
                _id: idx,
                logIndex: logNumber,
                origen: parsed.origen || "Manual",
                tipo: parsed.tipo || (parsed.origen?.toLowerCase().includes("ia") ? "automático" : "manual")
            };
        } catch {
            return {
                fecha: null,
                raw: item,
                _id: idx,
                logIndex: logNumber,
                origen: "Manual",
                tipo: "manual"
            };
        }
    });

    // Return newest first for default display
    return parsedArray.reverse();
};
