-- ==============================================================================
-- MIGRACIÓN CONSOLIDADA: RAPPI Y CANALES DE VENTA (PROYECTO CAFÉ)
-- Copia y pega todo este bloque en Supabase (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. MODIFICAR TABLA "Menu": Nuevas propiedades Rappi, Proyecto 1 y Proyecto 2
-- ------------------------------------------------------------------------------
ALTER TABLE public."Menu"
  ADD COLUMN IF NOT EXISTS "RAPPI"        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "PROYECTO_1"   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "PROYECTO_2"   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "Precio_Rappi" numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "Rappi_Info"   jsonb   DEFAULT NULL;

COMMENT ON COLUMN public."Menu"."RAPPI"        IS 'Producto indexado/publicado en Rappi';
COMMENT ON COLUMN public."Menu"."PROYECTO_1"   IS 'Producto incluido en el catálogo/canal Proyecto 1';
COMMENT ON COLUMN public."Menu"."PROYECTO_2"   IS 'Producto incluido en el catálogo/canal Proyecto 2';
COMMENT ON COLUMN public."Menu"."Precio_Rappi" IS 'Precio manual para Rappi (si es NULL se calcula automáticamente con el moderador)';
COMMENT ON COLUMN public."Menu"."Rappi_Info"   IS 'Metadatos adicionales de canal: {nombreRappi, descripcionRappi, disponible, etc.}';

CREATE INDEX IF NOT EXISTS idx_menu_rappi      ON public."Menu" ("RAPPI")      WHERE "RAPPI" = true;
CREATE INDEX IF NOT EXISTS idx_menu_proyecto_1 ON public."Menu" ("PROYECTO_1") WHERE "PROYECTO_1" = true;
CREATE INDEX IF NOT EXISTS idx_menu_proyecto_2 ON public."Menu" ("PROYECTO_2") WHERE "PROYECTO_2" = true;


-- ------------------------------------------------------------------------------
-- 2. MODIFICAR TABLA "Ventas": Canal de venta (Historial y Análisis Financiero)
-- ------------------------------------------------------------------------------
ALTER TABLE public."Ventas"
  ADD COLUMN IF NOT EXISTS "Canal"      text  DEFAULT 'LOCAL',
  ADD COLUMN IF NOT EXISTS "Canal_Info" jsonb DEFAULT NULL;

COMMENT ON COLUMN public."Ventas"."Canal"      IS 'Origen de la venta: LOCAL | RAPPI | PROYECTO_1 | PROYECTO_2';
COMMENT ON COLUMN public."Ventas"."Canal_Info" IS 'Metadatos financieros: {pedidoIdExterno, comisionPct, comisionValor, ivaComision, netoRecibido}';

-- Asegurar que las ventas existentes queden etiquetadas como LOCAL
UPDATE public."Ventas" 
SET "Canal" = 'LOCAL' 
WHERE "Canal" IS NULL;

-- Migración retroactiva: Si alguna venta se registró previamente con método de pago "Rappi"
UPDATE public."Ventas"
SET "Canal" = 'RAPPI'
WHERE "Pago_Info"::text ILIKE '%"metodo":"Rappi"%'
  AND ("Canal" IS NULL OR "Canal" = 'LOCAL');

CREATE INDEX IF NOT EXISTS idx_ventas_canal ON public."Ventas" ("Canal");


-- ------------------------------------------------------------------------------
-- 3. CREAR TABLA "RappiConfig": Parámetros del Moderador de Precios y Comisiones
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."RappiConfig" (
  canal             text PRIMARY KEY,               -- RAPPI | PROYECTO_1 | PROYECTO_2
  aumento_pct       numeric NOT NULL DEFAULT 25,     -- % aumento sobre precio local
  redondeo          integer NOT NULL DEFAULT 100,    -- Múltiplo de redondeo (100, 500, 1000)
  comision_pct      numeric NOT NULL DEFAULT 25,     -- % comisión cobrada por el canal
  iva_comision_pct  numeric NOT NULL DEFAULT 19,     -- % IVA sobre la comisión
  costo_envio       numeric NOT NULL DEFAULT 0,
  actualizado       timestamptz DEFAULT now(),
  actualizado_por   text
);

ALTER TABLE public."RappiConfig" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RappiConfig full access" ON public."RappiConfig";
CREATE POLICY "RappiConfig full access" ON public."RappiConfig"
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public."RappiConfig" (canal, aumento_pct, redondeo, comision_pct, iva_comision_pct) 
VALUES 
  ('RAPPI', 25, 100, 25, 19),
  ('PROYECTO_1', 25, 100, 25, 19),
  ('PROYECTO_2', 25, 100, 25, 19)
ON CONFLICT (canal) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 4. CREAR TABLA "PedidosCanal": Pedidos a domicilio para el flujo de tienda
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."PedidosCanal" (
  _id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal             text NOT NULL DEFAULT 'RAPPI',   -- RAPPI | PROYECTO_1 | PROYECTO_2
  cliente           jsonb,                            -- {nombre, telefono, direccion, notas}
  productos         jsonb NOT NULL DEFAULT '[]',      -- Lista de ítems pedidos
  subtotal          numeric NOT NULL DEFAULT 0,
  envio             numeric NOT NULL DEFAULT 0,
  total             numeric NOT NULL DEFAULT 0,
  metodo_pago       text,
  estado            text NOT NULL DEFAULT 'NUEVO',    -- NUEVO | ACEPTADO | EN_PREPARACION | LISTO | EN_CAMINO | ENTREGADO | CANCELADO
  historial_estados jsonb NOT NULL DEFAULT '[]',
  venta_id          uuid,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_canal_estado ON public."PedidosCanal" (estado, created_at DESC);

ALTER TABLE public."PedidosCanal" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PedidosCanal full access" ON public."PedidosCanal";
CREATE POLICY "PedidosCanal full access" ON public."PedidosCanal"
  FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Supabase Realtime para actualización automática
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public."PedidosCanal";
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
