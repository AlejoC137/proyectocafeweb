-- Agregamos los campos de preferencias de comunicación a la tabla userPreferences
-- para que coincidan con la funcionalidad de la tabla attendees

ALTER TABLE "userPreferences" 
ADD COLUMN IF NOT EXISTS acepta_promociones BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acepta_nuevos_eventos BOOLEAN DEFAULT false;
