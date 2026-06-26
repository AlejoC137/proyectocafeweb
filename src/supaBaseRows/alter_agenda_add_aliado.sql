-- =========================================
-- ALTER TABLE AGENDA PARA AÑADIR ALIADO_ID
-- =========================================
-- 
-- Ejecutar este script en el SQL Editor de Supabase
-- https://supabase.com/dashboard → SQL Editor → New Query
--
-- Este script crea el "tejido conectivo" entre la base de datos de Eventos (Agenda) y Aliados.

ALTER TABLE "Agenda" 
ADD COLUMN IF NOT EXISTS "aliado_id" UUID REFERENCES "Aliados"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "Agenda"."aliado_id" IS 'Referencia al aliado organizador/patrocinador vinculado al evento';
