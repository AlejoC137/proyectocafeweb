-- ==============================================================================
-- Migración: Canales de venta en la tabla "Menu" (Rappi / Proyecto 1 / Proyecto 2)
-- Propósito: Indexar productos del menú a canales externos y guardar precio Rappi.
-- Ejecutar en: Editor SQL de Supabase (Dashboard -> SQL Editor -> New Query)
-- Usado por: src/body/views/rappi (pestaña Productos, Análisis y Tienda)
-- ==============================================================================

ALTER TABLE public."Menu"
  ADD COLUMN IF NOT EXISTS "RAPPI"        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "PROYECTO_1"   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "PROYECTO_2"   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "Precio_Rappi" numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "Rappi_Info"   jsonb   DEFAULT NULL;

COMMENT ON COLUMN public."Menu"."RAPPI"        IS 'Producto indexado/publicado en Rappi';
COMMENT ON COLUMN public."Menu"."PROYECTO_1"   IS 'Producto incluido en el catálogo/canal Proyecto 1';
COMMENT ON COLUMN public."Menu"."PROYECTO_2"   IS 'Producto incluido en el catálogo/canal Proyecto 2';
COMMENT ON COLUMN public."Menu"."Precio_Rappi" IS 'Precio manual para Rappi. Si es NULL se calcula con el moderador (RappiConfig)';
COMMENT ON COLUMN public."Menu"."Rappi_Info"   IS 'Metadatos Rappi: {nombreRappi, descripcionRappi, categoriaRappi, disponible, ultimaSync}';

CREATE INDEX IF NOT EXISTS idx_menu_rappi      ON public."Menu" ("RAPPI")      WHERE "RAPPI" = true;
CREATE INDEX IF NOT EXISTS idx_menu_proyecto_1 ON public."Menu" ("PROYECTO_1") WHERE "PROYECTO_1" = true;
CREATE INDEX IF NOT EXISTS idx_menu_proyecto_2 ON public."Menu" ("PROYECTO_2") WHERE "PROYECTO_2" = true;
