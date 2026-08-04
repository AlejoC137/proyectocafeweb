-- =================================================================
-- Esquema de Base de Datos para Modelos 3D e Interacciones (PostgreSQL / Supabase)
-- =================================================================

-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: models3d
CREATE TABLE IF NOT EXISTS models3d (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla: user_customizations
CREATE TABLE IF NOT EXISTS user_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models3d(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    selected_colors JSONB DEFAULT '{}'::jsonb,
    texture_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas rápidas
CREATE INDEX IF NOT EXISTS idx_models3d_created_at ON models3d (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_customizations_model ON user_customizations (model_id);
CREATE INDEX IF NOT EXISTS idx_user_customizations_user ON user_customizations (user_id);

-- Trigger para actualización automática de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_update_models3d_updated_at
    BEFORE UPDATE ON models3d
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_user_customizations_updated_at
    BEFORE UPDATE ON user_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS para Supabase Security (Opcional según requerimiento)
ALTER TABLE models3d ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica a models3d" ON models3d FOR SELECT USING (true);
CREATE POLICY "Permitir insercion/modificacion a usuarios autenticados en models3d" ON models3d FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica a user_customizations" ON user_customizations FOR SELECT USING (true);
CREATE POLICY "Permitir escritura a user_customizations" ON user_customizations FOR ALL USING (true);
