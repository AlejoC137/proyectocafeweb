-- ================================================================
-- Script ALTER TABLE para agregar columnas de mermas a la tabla "Bajas"
-- Ejecutar este script en el SQL Editor de Supabase si la tabla "Bajas"
-- fue creada previamente sin las columnas de mermas.
-- ================================================================

ALTER TABLE public."Bajas" 
ADD COLUMN IF NOT EXISTS origen_tabla TEXT DEFAULT 'ItemsAlmacen',
ADD COLUMN IF NOT EXISTS item_nombre TEXT,
ADD COLUMN IF NOT EXISTS produccion_id UUID REFERENCES public."ProduccionInterna"(_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES public."Menu"(_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS proceso_origen TEXT DEFAULT 'Pelado / Limpieza',
ADD COLUMN IF NOT EXISTS peso_bruto NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS peso_util NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS cantidad_mermada NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS unidad_medida TEXT DEFAULT 'gr',
ADD COLUMN IF NOT EXISTS porcentaje_merma NUMERIC(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS costo_perdida NUMERIC(12,2) DEFAULT 0.00;

-- Recargar la caché del esquema de PostgREST en Supabase
NOTIFY pgrst, 'reload schema';
