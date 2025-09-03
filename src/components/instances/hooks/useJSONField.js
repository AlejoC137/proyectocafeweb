import { useState, useMemo } from 'react';

/**
 * Hook para manejo unificado de campos JSON
 * Centraliza el parseo y stringify de campos que pueden venir como string o object
 * @param {*} initialValue - Valor inicial (puede ser string JSON u object)
 * @param {Object} defaultValue - Valor por defecto si el parseo falla
 * @returns {[Object, Function, Function]} - [parsedValue, updateValue, stringifyValue]
 */
export const useJSONField = (initialValue, defaultValue = {}) => {
  // Parseo inicial seguro
  const parseValue = (value) => {
    if (!value) return defaultValue;
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : defaultValue;
      } catch (e) {
        // Intento parseo manual para formato no estándar
        try {
          const obj = {};
          const propertyRegex = /(\w+):\s*"([^"]*)"/g;
          let match;
          while ((match = propertyRegex.exec(value)) !== null) {
            obj[match[1]] = match[2];
          }
          return Object.keys(obj).length > 0 ? obj : defaultValue;
        } catch {
          console.warn('Failed to parse JSON field:', value);
          return defaultValue;
        }
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      return { ...defaultValue, ...value };
    }
    
    return defaultValue;
  };

  const [value, setValue] = useState(() => parseValue(initialValue));

  // Función para actualizar valor
  const updateValue = (newValue) => {
    if (typeof newValue === 'function') {
      setValue(prev => {
        const updated = newValue(prev);
        return parseValue(updated);
      });
    } else {
      setValue(parseValue(newValue));
    }
  };

  // Función para convertir a string JSON
  const stringifyValue = useMemo(() => {
    try {
      // Solo stringify si tiene contenido válido
      if (!value || Object.values(value).every(v => v === "" || v == null)) {
        return "";
      }
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }, [value]);

  // Función para actualizar un campo específico del objeto
  const updateField = (fieldName, fieldValue) => {
    setValue(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
  };

  return {
    value,           // Objeto parseado actual
    updateValue,     // Función para actualizar todo el valor
    updateField,     // Función para actualizar un campo específico
    stringifyValue,  // String JSON para guardar en BD
    isValid: Object.keys(value).length > 0  // Indica si tiene datos válidos
  };
};

/**
 * Hook especializado para STOCK (muy común en inventario)
 */
export const useStockField = (initialStock) => {
  const defaultStock = { minimo: "", maximo: "", actual: "" };
  return useJSONField(initialStock, defaultStock);
};

/**
 * Hook especializado para ALMACENAMIENTO (común en inventario)
 */
export const useAlmacenamientoField = (initialAlmacenamiento) => {
  const defaultAlmacenamiento = { ALMACENAMIENTO: "", BODEGA: "" };
  return useJSONField(initialAlmacenamiento, defaultAlmacenamiento);
};

/**
 * Hook especializado para DATES (común en workissues)
 */
export const useDatesField = (initialDates) => {
  const defaultDates = { 
    isued: new Date().toISOString(), 
    finished: "", 
    date_asigmente: [] 
  };
  return useJSONField(initialDates, defaultDates);
};

/**
 * Hook especializado para PAGADO (común en workissues)
 */
export const usePagadoField = (initialPagado) => {
  const defaultPagado = { pagadoFull: false, adelanto: "NoAplica", susceptible: false };
  return useJSONField(initialPagado, defaultPagado);
};
