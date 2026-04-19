-- SQL Script to create the attendees table

CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID REFERENCES "Agenda"("_id") ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    como_nos_encontraste TEXT,
    recomendaciones_lugar TEXT,
    dieta_especial TEXT,
    acepta_promociones BOOLEAN DEFAULT false,
    acepta_nuevos_eventos BOOLEAN DEFAULT false,
    estado_pago TEXT DEFAULT 'pendiente', -- 'gratis', 'pendiente', 'pagado'
    usuario_id UUID,
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) si es necesario
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Crear políticas (ajustar según tus reglas de Supabase)
CREATE POLICY "Permitir inserción a cualquier usuario" ON attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura general" ON attendees FOR SELECT USING (true);
CREATE POLICY "Permitir actualización general" ON attendees FOR UPDATE USING (true);
