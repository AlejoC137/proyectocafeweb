-- Archivo para agregar campos de configuración dinámica a la tabla Agenda y attendees

-- 1. Agregamos el campo preguntas_personalizadas a la tabla Agenda
ALTER TABLE "Agenda" 
ADD COLUMN IF NOT EXISTS preguntas_personalizadas JSONB DEFAULT '[]'::jsonb;

-- 2. Agregamos el campo respuestas_personalizadas a la tabla attendees
ALTER TABLE attendees 
ADD COLUMN IF NOT EXISTS respuestas_personalizadas JSONB DEFAULT '{}'::jsonb;
