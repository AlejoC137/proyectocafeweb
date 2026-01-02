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

        let oldValue = originalItem[key];
        let newValue = updates[key];

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
            // Use original values for display, replacing empty/null with explicit text if needed or keeping as is
            historyEntries.push({
                campo: key,
                fecha: new Date().toISOString(),
                valor_inicial: originalItem[key], // Keep original for accuracy in history, even if normalized for check
                valor_final: updates[key]
            });
        }
    }

    return historyEntries;
};
