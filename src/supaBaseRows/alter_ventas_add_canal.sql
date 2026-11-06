-- ==============================================================================
-- Migración: Canal de venta en la tabla "Ventas"
-- Propósito: Distinguir ventas del local de ventas por Rappi / Proyecto 1 / Proyecto 2 / Tienda web.
--            Las ventas antiguas quedan como 'LOCAL' (no afecta DiaResumen/MesResumen).
-- Ejecutar en: Editor SQL de Supabase (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

ALTER TABLE public."Ventas"
  ADD COLUMN IF NOT EXISTS "Canal"      text  DEFAULT 'LOCAL',
  ADD COLUMN IF NOT EXISTS "Canal_Info" jsonb DEFAULT NULL;

COMMENT ON COLUMN public."Ventas"."Canal"      IS 'LOCAL | RAPPI | PROYECTO_1 | PROYECTO_2 | TIENDA_WEB';
COMMENT ON COLUMN public."Ventas"."Canal_Info" IS '{pedidoIdExterno, comisionPct, comisionValor, ivaComision, costoEnvio, descuentoPromo, netoRecibido}';

UPDATE public."Ventas" SET "Canal" = 'LOCAL' WHERE "Canal" IS NULL;

-- Ventas registradas antes de la migración con método de pago "Rappi"
UPDATE public."Ventas"
SET "Canal" = 'RAPPI'
WHERE "Pago_Info"::text ILIKE '%"metodo":"Rappi"%'
  AND ("Canal" IS NULL OR "Canal" = 'LOCAL');

CREATE INDEX IF NOT EXISTS idx_ventas_canal ON public."Ventas" ("Canal");
