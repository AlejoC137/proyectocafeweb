-- ==============================================================================
-- Tabla: "PedidosCanal"
-- Propósito: Pedidos a domicilio de la tienda propia (clon tipo Rappi) por canal.
--            Al entregarse se convierten en una fila de "Ventas" (venta_id).
-- Ejecutar en: Editor SQL de Supabase (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public."PedidosCanal" (
  _id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal             text NOT NULL DEFAULT 'RAPPI',   -- RAPPI | PROYECTO_1 | PROYECTO_2
  cliente           jsonb,                            -- {nombre, telefono, direccion, notas}
  productos         jsonb NOT NULL DEFAULT '[]',      -- mismo formato que Ventas.Productos
  subtotal          numeric NOT NULL DEFAULT 0,
  envio             numeric NOT NULL DEFAULT 0,
  total             numeric NOT NULL DEFAULT 0,
  metodo_pago       text,
  estado            text NOT NULL DEFAULT 'NUEVO',    -- NUEVO | ACEPTADO | EN_PREPARACION | LISTO | EN_CAMINO | ENTREGADO | CANCELADO
  historial_estados jsonb NOT NULL DEFAULT '[]',      -- [{estado, fecha, por}]
  venta_id          uuid,                             -- FK lógica a "Ventas"._id
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_canal_estado ON public."PedidosCanal" (estado, created_at DESC);

ALTER TABLE public."PedidosCanal" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PedidosCanal full access" ON public."PedidosCanal";
CREATE POLICY "PedidosCanal full access" ON public."PedidosCanal"
  FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para el tablero de pedidos
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public."PedidosCanal";
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
