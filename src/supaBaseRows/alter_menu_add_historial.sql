-- ==============================================================================
-- Migración: Agregar columna historial_update a la tabla "Menu"
-- Propósito: Registrar cronológicamente cada cambio de precio y configuración
--            de los platillos del menú (sin sobrescribir los anteriores).
-- Ejecutar en: Editor SQL de Supabase (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

ALTER TABLE public."Menu" 
ADD COLUMN IF NOT EXISTS historial_update text[] DEFAULT NULL;

COMMENT ON COLUMN public."Menu".historial_update IS 'Historial cronológico acumulado de cambios de precio (formato JSON array text[])';
