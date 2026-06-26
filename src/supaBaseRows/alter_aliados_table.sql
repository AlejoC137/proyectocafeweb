-- Script para añadir campos adicionales a la tabla de Aliados para autogestión
ALTER TABLE public."Aliados"
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_description TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS expected_value TEXT,
ADD COLUMN IF NOT EXISTS sitio_web TEXT,
ADD COLUMN IF NOT EXISTS nombre_contacto TEXT;

-- Script para relacionar la tabla Agenda con la tabla Aliados
ALTER TABLE public."Agenda"
ADD COLUMN IF NOT EXISTS aliado_id UUID REFERENCES public."Aliados"(id);
