-- Script para crear la tabla de relaciones "Vease"
-- Permite vincular recetas, productos/ítems, procedimientos y producción interna.

CREATE TABLE IF NOT EXISTS public."Vease" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id TEXT NOT NULL,          -- ID del objeto origen (ej: receta o ítem)
    source_type TEXT NOT NULL,        -- Tipo origen: 'receta', 'item', 'procedimiento', 'produccion'
    target_id TEXT NOT NULL,          -- ID del objeto destino
    target_type TEXT NOT NULL,        -- Tipo destino: 'receta', 'item', 'procedimiento', 'produccion'
    titulo TEXT,                      -- Título o alias personalizado (opcional)
    grupo TEXT DEFAULT 'General',     -- Grupo/Categoría: 'Procedimientos', 'Recetas', 'Producción', 'Productos'
    notas TEXT,                       -- Notas contextuales adicionales
    orden INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public."Vease" ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Permitir lectura publica de Vease" ON public."Vease"
    FOR SELECT USING (true);

CREATE POLICY "Permitir insercion autenticada en Vease" ON public."Vease"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion autenticada en Vease" ON public."Vease"
    FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminacion autenticada en Vease" ON public."Vease"
    FOR DELETE USING (true);

-- Crear índices para optimizar las consultas por origen
CREATE INDEX IF NOT EXISTS idx_vease_source ON public."Vease"(source_id, source_type);
