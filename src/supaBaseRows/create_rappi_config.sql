-- ==============================================================================
-- Tabla: "RappiConfig"
-- Propósito: Parámetros del moderador de precios y comisiones por canal.
-- Ejecutar en: Editor SQL de Supabase (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public."RappiConfig" (
  canal             text PRIMARY KEY,               -- RAPPI | PROYECTO_1 | PROYECTO_2
  aumento_pct       numeric NOT NULL DEFAULT 25,     -- % de aumento sobre el precio local
  redondeo          integer NOT NULL DEFAULT 100,    -- múltiplo de redondeo (100/500/1000)
  comision_pct      numeric NOT NULL DEFAULT 25,     -- % de comisión del canal
  iva_comision_pct  numeric NOT NULL DEFAULT 19,     -- % IVA sobre la comisión
  costo_envio       numeric NOT NULL DEFAULT 0,      -- costo de envío (tienda propia)
  actualizado       timestamptz DEFAULT now(),
  actualizado_por   text
);

ALTER TABLE public."RappiConfig" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RappiConfig full access" ON public."RappiConfig";
CREATE POLICY "RappiConfig full access" ON public."RappiConfig"
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public."RappiConfig" (canal) VALUES ('RAPPI'), ('PROYECTO_1'), ('PROYECTO_2')
ON CONFLICT (canal) DO NOTHING;
