-- ====================================================================
-- SCRIPT DDL PARA LA TABLA public.models3d EN SUPABASE / POSTGRESQL
-- PROYECTOCAFEWEB /review_ProyectoCafe
-- ====================================================================

-- 1. Habilitar extensión UUID (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Función auxiliar para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Creación de la Tabla public.models3d
CREATE TABLE IF NOT EXISTS public.models3d (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  title character varying(255) NOT NULL,
  description text NULL,
  file_url text NOT NULL,
  metadata_json jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT models3d_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 4. Creación de Índice para consultas ordenadas por fecha de creación
CREATE INDEX IF NOT EXISTS idx_models3d_created_at ON public.models3d USING btree (created_at DESC) TABLESPACE pg_default;

-- 5. Trigger para actualizar el timestamp updated_at antes de cada UPDATE
DROP TRIGGER IF EXISTS trigger_update_models3d_updated_at ON public.models3d;
CREATE TRIGGER trigger_update_models3d_updated_at BEFORE
UPDATE ON public.models3d FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column ();

-- 6. Políticas de RLS (Row Level Security) para permitir Lectura e Inserción Pública / Anon
ALTER TABLE public.models3d ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica de models3d" ON public.models3d;
CREATE POLICY "Permitir lectura publica de models3d" 
ON public.models3d FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de models3d" ON public.models3d;
CREATE POLICY "Permitir insercion publica de models3d" 
ON public.models3d FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica de models3d" ON public.models3d;
CREATE POLICY "Permitir actualizacion publica de models3d" 
ON public.models3d FOR UPDATE 
USING (true);
