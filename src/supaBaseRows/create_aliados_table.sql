-- Script para crear la tabla de Aliados

CREATE TABLE public."Aliados" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL, -- Ej: Patrocinado, Aliado Sin Ánimo de Lucro, Aliado Con Ánimo de Lucro
    email TEXT,
    telefono TEXT,
    instagram TEXT,
    estado_proceso TEXT DEFAULT 'Prospecto', -- Ej: Prospecto, En Negociación, Activo, Inactivo
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurar RLS (Row Level Security) para que cualquier usuario autenticado o anónimo (según configuración del proyecto) pueda leer/escribir
ALTER TABLE public."Aliados" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public."Aliados"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public."Aliados"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public."Aliados"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public."Aliados"
    FOR DELETE USING (true);
