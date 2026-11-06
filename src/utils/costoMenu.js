/**
 * Cálculo de costo de producción para productos del Menú.
 * Lógica extraída de ProductosFinanciero.jsx para reutilizarla en otras vistas
 * (ej. /Rappi). El costo de la receta (campo `costo`) se genera en RecetaModal
 * a partir de recetaMariaPaula() (src/redux/calcularReceta.jsx).
 */

/**
 * Busca la receta asociada a un producto del menú.
 */
export function findRecetaForMenuItem(menuItem, recetasMenu = [], recetasProduccion = []) {
  if (!menuItem?.Receta) return null;
  return (
    recetasMenu.find((r) => r._id === menuItem.Receta) ||
    recetasProduccion.find((r) => r._id === menuItem.Receta) ||
    null
  );
}

/**
 * Calcula el costo consolidado (CMP + CMO) de un producto del menú.
 * @returns {{ costo: number, vCMP: number, vCMO: number, tieneReceta: boolean, recetaData: object|null }}
 */
export function calcularCostoMenuItem(menuItem, recetasMenu = [], recetasProduccion = []) {
  let costo = 0;
  let vCMP = 0;
  let vCMO = 0;
  const recetaData = findRecetaForMenuItem(menuItem, recetasMenu, recetasProduccion);

  if (recetaData && recetaData.costo) {
    try {
      const costData = typeof recetaData.costo === "string" ? JSON.parse(recetaData.costo) : recetaData.costo;

      // Formatos posibles: número plano o detalles de recetaMariaPaula
      if (typeof costData === "number") {
        costo = costData;
        vCMP = costData;
      } else if (costData && (costData.vCMP || costData.vCMO)) {
        vCMP = Number(costData.vCMP || 0);
        vCMO = Number(costData.vCMO || 0);
        costo = vCMP + vCMO;
      }
    } catch (e) {
      console.warn(`Error parsing cost for ${menuItem?.NombreES}`, e);
    }
  }

  return { costo, vCMP, vCMO, tieneReceta: !!recetaData, recetaData };
}
