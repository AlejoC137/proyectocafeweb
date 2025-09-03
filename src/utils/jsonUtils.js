/**
 * Utilitario para parsear JSON de forma segura, especialmente útil para datos que vienen de CSV
 * donde las comillas pueden estar escapadas.
 *
 * @param {string} jsonString - String JSON a parsear
 * @param {any} fallback - Valor por defecto si el parsing falla
 * @returns {any} - Objeto parseado o fallback
 */
export function safeJsonParse(jsonString, fallback = null) {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return fallback;
    }
    
    // Limpiar el string JSON de posibles escapados de CSV
    let cleanedJsonString = jsonString;
    
    // Si viene del CSV, puede tener comillas dobles escapadas
    if (cleanedJsonString.includes('\\"')) {
      cleanedJsonString = cleanedJsonString.replace(/\\"/g, '"');
    }
    
    return JSON.parse(cleanedJsonString);
  } catch (e) {
    console.warn('Error parsing JSON:', e, 'Original data:', jsonString);
    return fallback;
  }
}

/**
 * Parsea específicamente el campo Comp_Lunch asegurando que todas las propiedades esperadas existan
 *
 * @param {string} compLunchString - String JSON del campo Comp_Lunch
 * @returns {object|null} - Objeto parseado con estructura completa o null
 */
export function parseCompLunch(compLunchString) {
  const defaultStructure = {
    fecha: { dia: "", fecha: "" },
    entrada: { nombre: "", descripcion: "" },
    proteina: { nombre: "", descripcion: "" },
    proteina_opcion_2: { nombre: "", descripcion: "" },
    carbohidrato: { nombre: "", descripcion: "" },
    acompanante: { nombre: "", descripcion: "" },
    ensalada: { nombre: "", descripcion: "" },
    bebida: { nombre: "", descripcion: "" },
    lista: [],
  };

  const parsedData = safeJsonParse(compLunchString);
  if (!parsedData) {
    return null;
  }

  // Asegurar que todas las propiedades existen con la estructura correcta
  return {
    fecha: parsedData.fecha || defaultStructure.fecha,
    entrada: parsedData.entrada || defaultStructure.entrada,
    proteina: parsedData.proteina || defaultStructure.proteina,
    proteina_opcion_2: parsedData.proteina_opcion_2 || defaultStructure.proteina_opcion_2,
    carbohidrato: parsedData.carbohidrato || defaultStructure.carbohidrato,
    acompanante: parsedData.acompanante || defaultStructure.acompanante,
    ensalada: parsedData.ensalada || defaultStructure.ensalada,
    bebida: parsedData.bebida || defaultStructure.bebida,
    lista: parsedData.lista || defaultStructure.lista,
  };
}

/**
 * Convierte un objeto a JSON string de forma segura
 *
 * @param {any} obj - Objeto a convertir
 * @param {boolean} prettyFormat - Si debe formatear con indentación
 * @returns {string} - String JSON
 */
export function safeJsonStringify(obj, prettyFormat = true) {
  try {
    return JSON.stringify(obj, null, prettyFormat ? 2 : 0);
  } catch (e) {
    console.error('Error stringifying JSON:', e, 'Object:', obj);
    return '{}';
  }
}
