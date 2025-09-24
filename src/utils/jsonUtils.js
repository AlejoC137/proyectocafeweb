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


// src/utils/jsonUtils.js

// export const parseCompLunch = (compLunchString) => {
//   if (!compLunchString || typeof compLunchString !== 'string') {
//     return null;
//   }
//   try {
//     const data = JSON.parse(compLunchString);
//     return data;
//   } catch (error) {
//     console.error("Error parsing Comp_Lunch JSON:", error);
//     return null;
//   }
// };

/**
 * Parsea de forma segura un string que puede contener JSON.
 * Si el string no es un JSON válido, lo devuelve como un valor dentro de un objeto.
 * @param {string | object} obj - El objeto o string a parsear.
 * @param {object} fallback - El valor por defecto si el parseo falla.
 * @returns {object} El objeto parseado.
 */
export const parseNestedObject = (obj, fallback = {}) => {
  try {
    if (typeof obj === "string") {
      if (obj === "NaN" || obj === "null" || obj === "undefined" || !obj) {
        return fallback;
      }
      // Si no parece un objeto o array JSON, lo tratamos como un valor simple.
      if (!obj.trim().startsWith("{") && !obj.trim().startsWith("[")) {
        return { ...fallback, valor: obj };
      }
      return JSON.parse(obj);
    }
    return obj || fallback;
  } catch (e) {
    // Silenciamos el warning para no llenar la consola, pero puedes activarlo para depurar.
    // console.warn("Invalid nested object JSON, returning fallback:", obj);
    return fallback;
  }
};