import { useState, useEffect } from "react";

/**
 * useDebounce — retrasa la actualización de un valor hasta que el usuario
 * deja de escribir durante `delay` ms. Evita búsquedas/filtros en cada keystroke.
 *
 * @param {*}      value  Valor a debouncear (texto de búsqueda, etc.)
 * @param {number} delay  Tiempo en ms a esperar (por defecto 300 ms)
 * @returns El valor debounceado
 *
 * Ejemplo de uso:
 *   const [search, setSearch] = useState("");
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   useEffect(() => {
 *     // Solo se ejecuta cuando el usuario para de escribir 300 ms
 *     dispatch(filtrarItems(debouncedSearch));
 *   }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);   // limpia el timer si value cambia antes
  }, [value, delay]);

  return debouncedValue;
}
