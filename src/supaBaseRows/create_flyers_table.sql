-- =========================================
-- CREAR TABLA FLYERS EN SUPABASE
-- =========================================
-- 
-- Ejecuta este script en el SQL Editor de Supabase:
-- https://supabase.com/dashboard -> SQL Editor -> New Query

CREATE TABLE IF NOT EXISTS public."flyers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL DEFAULT 'Nuevo Flyer',
    "formato" TEXT NOT NULL DEFAULT '9:16',
    "canvas" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "elements" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "copies" JSONB DEFAULT '{}'::jsonb,
    "thumbnail" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public."flyers" ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Permitir lectura para todos" ON public."flyers"
    FOR SELECT USING (true);

CREATE POLICY "Permitir insercion para todos" ON public."flyers"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion para todos" ON public."flyers"
    FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminacion para todos" ON public."flyers"
    FOR DELETE USING (true);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_flyers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_flyers_updated_at ON public."flyers";
CREATE TRIGGER trigger_flyers_updated_at
    BEFORE UPDATE ON public."flyers"
    FOR EACH ROW
    EXECUTE FUNCTION update_flyers_updated_at();

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS "idx_flyers_created_at" ON public."flyers"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_flyers_formato" ON public."flyers"("formato");
