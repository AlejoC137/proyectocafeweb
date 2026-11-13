-- ==============================================================================
-- Tablas: "CapturasProveedor" y "PreciosHistoricosProducto"
-- Propósito: Historial de precios por proveedor/tienda indexado por fecha,
--            alimentado por Agent Reach, screenshots o catálogos web, sin alterar
--            las estructuras de texto plano existentes en ItemsAlmacen o Proveedores.
-- Ejecutar en: Editor SQL de Supabase (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public."CapturasProveedor" (
  _id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id     uuid NOT NULL REFERENCES public."Proveedores"(_id) ON DELETE CASCADE,
  fecha_captura    timestamptz NOT NULL DEFAULT now(),
  url_fuente       text,
  metodo           text NOT NULL DEFAULT 'agent-reach', -- 'agent-reach' | 'screenshot' | 'supermu_json' | 'manual'
  extracto_raw     text,                                -- Texto/Markdown/JSON crudo devuelto por Agent Reach
  evidencia_url    text,                                -- URL opcional de screenshot en Storage
  total_productos  integer NOT NULL DEFAULT 0,
  estado           text NOT NULL DEFAULT 'pendiente',   -- 'pendiente' | 'aplicado'
  notas            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capturas_proveedor_fecha
  ON public."CapturasProveedor" (proveedor_id, fecha_captura DESC);

CREATE TABLE IF NOT EXISTS public."PreciosHistoricosProducto" (
  _id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captura_id          uuid NOT NULL REFERENCES public."CapturasProveedor"(_id) ON DELETE CASCADE,
  proveedor_id        uuid NOT NULL REFERENCES public."Proveedores"(_id) ON DELETE CASCADE,
  item_id             uuid REFERENCES public."ItemsAlmacen"(_id) ON DELETE SET NULL,
  fecha_captura       timestamptz NOT NULL DEFAULT now(),
  nombre_detectado    text NOT NULL,
  precio_total        numeric(12,2) NOT NULL DEFAULT 0,
  cantidad            numeric(12,2) NOT NULL DEFAULT 1,
  unidad              text NOT NULL DEFAULT 'und',
  precio_unitario     numeric(12,4) NOT NULL DEFAULT 0,
  url_producto        text,
  aplicado_a_almacen  boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_precios_hist_item_fecha
  ON public."PreciosHistoricosProducto" (item_id, fecha_captura DESC);

CREATE INDEX IF NOT EXISTS idx_precios_hist_prov_fecha
  ON public."PreciosHistoricosProducto" (proveedor_id, fecha_captura DESC);

CREATE INDEX IF NOT EXISTS idx_precios_hist_captura
  ON public."PreciosHistoricosProducto" (captura_id);

-- Row Level Security (misma convención que PedidosCanal / RappiConfig)
ALTER TABLE public."CapturasProveedor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PreciosHistoricosProducto" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CapturasProveedor full access" ON public."CapturasProveedor";
CREATE POLICY "CapturasProveedor full access" ON public."CapturasProveedor"
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "PreciosHistoricosProducto full access" ON public."PreciosHistoricosProducto";
CREATE POLICY "PreciosHistoricosProducto full access" ON public."PreciosHistoricosProducto"
  FOR ALL USING (true) WITH CHECK (true);
