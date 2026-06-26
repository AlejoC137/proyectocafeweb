-- =========================================
-- ACTUALIZAR ESQUEMA DE LA TABLA AGENDA
-- =========================================
-- Ejecutar en el SQL Editor de Supabase para agregar las columnas faltantes

ALTER TABLE "Agenda" 
ADD COLUMN IF NOT EXISTS "nombreCliente" TEXT,
ADD COLUMN IF NOT EXISTS "telefonoCliente" TEXT,
ADD COLUMN IF NOT EXISTS "emailCliente" TEXT,
ADD COLUMN IF NOT EXISTS "instagramsAliados" JSONB,
ADD COLUMN IF NOT EXISTS "numeroPersonas" INTEGER,
ADD COLUMN IF NOT EXISTS "aliado_id" UUID REFERENCES "Aliados"("id") ON DELETE SET NULL;
