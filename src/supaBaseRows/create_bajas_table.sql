-- ================================================================
-- Script para crear / actualizar la tabla "Bajas" en Supabase / PostgreSQL
-- Proyecto: Proyecto Café Web
-- Descripción: Control CRUD completo de bajas por daño/deterioro (ej: tomates dañados)
--              y mermas de procesamiento (ej: pelado de tomate) con cálculo de % de merma.
-- ================================================================

CREATE TABLE IF NOT EXISTS public."Bajas" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Tipo de Registro ('Baja por Daño' o 'Merma de Procesamiento')
    tipo_baja TEXT NOT NULL DEFAULT 'Merma de Procesamiento', 
    
    -- Origen de los Datos ('ItemsAlmacen', 'ProduccionInterna', 'Menu', 'Staff', 'Otro')
    origen_tabla TEXT NOT NULL DEFAULT 'ItemsAlmacen',
    item_nombre TEXT, -- Nombre del producto guardado para referencia rápida (ej: "Tomate", "Relleno Manzana")
    
    -- Relaciones (Llaves foráneas)
    staff_id UUID REFERENCES public."Staff"(_id) ON DELETE SET NULL,
    item_id UUID REFERENCES public."ItemsAlmacen"(_id) ON DELETE SET NULL,
    produccion_id UUID REFERENCES public."ProduccionInterna"(_id) ON DELETE SET NULL,
    menu_id UUID REFERENCES public."Menu"(_id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES public."Proveedores"(_id) ON DELETE SET NULL,

    -- Datos de Fecha y Proceso
    fecha_baja DATE NOT NULL DEFAULT CURRENT_DATE,
    proceso_origen TEXT DEFAULT 'Pelado / Limpieza', -- 'Pelado / Limpieza', 'Deterioro / Daño', 'Vencimiento', 'Cocción', 'Desposte', 'Otro'
    motivo TEXT NOT NULL DEFAULT 'Merma de Pelado/Limpieza',

    -- Calculadora de Merma y Pesos
    peso_bruto NUMERIC(10,2) DEFAULT 0.00, -- Cantidad / Peso bruto inicial (ej: 1000 gr de tomate bruto)
    peso_util NUMERIC(10,2) DEFAULT 0.00,  -- Cantidad / Peso útil obtenido (ej: 850 gr de tomate pelado)
    cantidad_mermada NUMERIC(10,2) DEFAULT 0.00, -- Cantidad mermada/desperdiciada (ej: 150 gr)
    unidad_medida TEXT DEFAULT 'gr', -- 'gr', 'kg', 'unidades', 'ml', 'lt'
    porcentaje_merma NUMERIC(5,2) DEFAULT 0.00, -- Porcentaje de merma % (ej: 15.00 %)
    
    -- Control Financiero y Estado
    costo_perdida NUMERIC(12,2) DEFAULT 0.00, -- Costo monetario estimado de la merma/baja
    monto_liquidacion NUMERIC(12,2) DEFAULT 0.00,
    estado TEXT NOT NULL DEFAULT 'Completado', -- 'Pendiente', 'En Proceso', 'Completado', 'Rechazado'
    
    -- Trazabilidad y Comentarios
    paz_y_salvo BOOLEAN DEFAULT false,
    entrega_dotacion BOOLEAN DEFAULT false,
    observaciones TEXT,
    registrado_por TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentarios explicativos
COMMENT ON TABLE public."Bajas" IS 'Tabla para registro y control CRUD de bajas por daño y mermas de insumos (ItemsAlmacen, ProduccionInterna, Menu).';
COMMENT ON COLUMN public."Bajas".porcentaje_merma IS 'Porcentaje de merma calculado ((peso_bruto - peso_util) / peso_bruto) * 100';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_bajas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bajas_updated_at ON public."Bajas";

CREATE TRIGGER trigger_update_bajas_updated_at
BEFORE UPDATE ON public."Bajas"
FOR EACH ROW
EXECUTE FUNCTION update_bajas_updated_at();

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_bajas_origen_tabla ON public."Bajas"(origen_tabla);
CREATE INDEX IF NOT EXISTS idx_bajas_item_id ON public."Bajas"(item_id);
CREATE INDEX IF NOT EXISTS idx_bajas_produccion_id ON public."Bajas"(produccion_id);
CREATE INDEX IF NOT EXISTS idx_bajas_menu_id ON public."Bajas"(menu_id);
CREATE INDEX IF NOT EXISTS idx_bajas_fecha_baja ON public."Bajas"(fecha_baja DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public."Bajas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura completa de Bajas" ON public."Bajas" FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de Bajas" ON public."Bajas" FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion de Bajas" ON public."Bajas" FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminacion de Bajas" ON public."Bajas" FOR DELETE USING (true);
