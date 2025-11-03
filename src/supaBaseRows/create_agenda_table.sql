-- =========================================
-- CREAR TABLA AGENDA EN SUPABASE
-- =========================================
-- 
-- Ejecutar este script en el SQL Editor de Supabase
-- https://supabase.com/dashboard → SQL Editor → New Query
--

-- Eliminar tabla si existe (¡CUIDADO! Esto borra todos los datos)
-- DROP TABLE IF EXISTS "Agenda";

-- Crear tabla Agenda
CREATE TABLE IF NOT EXISTS "Agenda" (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica del evento
  "nombre" TEXT NOT NULL,
  "fecha" DATE NOT NULL,
  "horaInicio" TIME NOT NULL,
  "horaFinal" TIME NOT NULL,
  
  -- Información del cliente
  "nombreCliente" TEXT,
  "emailCliente" TEXT,
  "telefonoCliente" TEXT,
  
  -- Detalles del evento
  "numeroPersonas" INTEGER DEFAULT 1,
  "valor" TEXT,
  "autores" TEXT,
  "infoAdicional" TEXT,
  
  -- Media
  "bannerIMG" TEXT,
  "linkInscripcion" TEXT,
  
  -- Servicios (almacenado como JSON)
  "servicios" JSONB,
  
  -- Timestamps
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS "idx_agenda_fecha" ON "Agenda"("fecha");
CREATE INDEX IF NOT EXISTS "idx_agenda_nombreCliente" ON "Agenda"("nombreCliente");
CREATE INDEX IF NOT EXISTS "idx_agenda_created_at" ON "Agenda"("created_at");

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a la tabla Agenda
DROP TRIGGER IF EXISTS update_agenda_updated_at ON "Agenda";
CREATE TRIGGER update_agenda_updated_at
  BEFORE UPDATE ON "Agenda"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE "Agenda" ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todas las operaciones (ajusta según tus necesidades de seguridad)
-- NOTA: Esta política permite acceso total. En producción, deberías restringir según usuario/rol
CREATE POLICY "Enable all operations for authenticated users" ON "Agenda"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Si quieres permitir acceso público (sin autenticación), usa esta política:
-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON "Agenda";
-- CREATE POLICY "Enable all operations for all users" ON "Agenda"
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- Comentarios en las columnas (documentación)
COMMENT ON TABLE "Agenda" IS 'Tabla para gestionar eventos y reservaciones del café';
COMMENT ON COLUMN "Agenda"."_id" IS 'UUID único del evento';
COMMENT ON COLUMN "Agenda"."nombre" IS 'Nombre del evento';
COMMENT ON COLUMN "Agenda"."fecha" IS 'Fecha del evento (YYYY-MM-DD)';
COMMENT ON COLUMN "Agenda"."horaInicio" IS 'Hora de inicio del evento';
COMMENT ON COLUMN "Agenda"."horaFinal" IS 'Hora de finalización del evento';
COMMENT ON COLUMN "Agenda"."servicios" IS 'Servicios solicitados (JSON): alimentos, mesas, audioVisual, otros';

-- Verificar que la tabla se creó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'Agenda'
ORDER BY ordinal_position;

-- =========================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =========================================

-- Insertar un evento de prueba
INSERT INTO "Agenda" (
  "nombre",
  "fecha",
  "horaInicio",
  "horaFinal",
  "nombreCliente",
  "emailCliente",
  "telefonoCliente",
  "numeroPersonas",
  "valor",
  "autores",
  "infoAdicional",
  "bannerIMG",
  "linkInscripcion",
  "servicios"
) VALUES (
  'Lanzamiento de Libro - Poesía Contemporánea',
  '2025-02-15',
  '18:00:00',
  '21:00:00',
  'María González',
  'maria.gonzalez@example.com',
  '300-123-4567',
  50,
  '$100,000',
  'María González, Juan Pérez',
  'Presentación de libro de poesía contemporánea con vino y aperitivos. Se realizará una lectura de poemas seleccionados seguida de una sesión de preguntas y respuestas con los autores.',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
  'https://eventbrite.com/evento-ejemplo',
  '{
    "alimentos": {
      "activo": true,
      "descripcion": "Vino tinto y blanco, quesos artesanales, aperitivos variados para 50 personas"
    },
    "mesas": {
      "activo": true,
      "descripcion": "Necesitamos 10 mesas redondas en el área principal del café, preferiblemente cerca de las ventanas"
    },
    "audioVisual": {
      "activo": true,
      "descripcion": "Micrófono inalámbrico para presentadores y proyector para mostrar extractos del libro"
    },
    "otros": {
      "activo": false,
      "descripcion": ""
    }
  }'::jsonb
);

-- Insertar otro evento de prueba
INSERT INTO "Agenda" (
  "nombre",
  "fecha",
  "horaInicio",
  "horaFinal",
  "nombreCliente",
  "emailCliente",
  "telefonoCliente",
  "numeroPersonas",
  "valor",
  "autores",
  "servicios"
) VALUES (
  'Taller de Cerámica para Principiantes',
  '2025-02-20',
  '14:00:00',
  '17:00:00',
  'Carlos Ramírez',
  'carlos.ramirez@example.com',
  '301-555-8899',
  15,
  '$75,000',
  'Carlos Ramírez (Instructor)',
  '{
    "alimentos": {
      "activo": true,
      "descripcion": "Café y pasabocas durante el receso"
    },
    "mesas": {
      "activo": true,
      "descripcion": "5 mesas de trabajo amplias en el área de talleres"
    },
    "audioVisual": {
      "activo": false,
      "descripcion": ""
    },
    "otros": {
      "activo": true,
      "descripcion": "Necesitamos acceso a agua corriente y espacio para secar las piezas"
    }
  }'::jsonb
);

-- Verificar los datos insertados
SELECT 
  "nombre",
  "fecha",
  "horaInicio",
  "horaFinal",
  "nombreCliente",
  "numeroPersonas"
FROM "Agenda"
ORDER BY "fecha", "horaInicio";

-- =========================================
-- CONSULTAS ÚTILES PARA DEBUGGING
-- =========================================

-- Ver todos los eventos
-- SELECT * FROM "Agenda" ORDER BY "fecha", "horaInicio";

-- Ver eventos de un mes específico
-- SELECT * FROM "Agenda" 
-- WHERE "fecha" BETWEEN '2025-02-01' AND '2025-02-28'
-- ORDER BY "fecha", "horaInicio";

-- Ver servicios solicitados de un evento
-- SELECT "nombre", "servicios" FROM "Agenda" WHERE "_id" = 'tu-uuid-aqui';

-- Contar eventos por mes
-- SELECT 
--   TO_CHAR("fecha", 'YYYY-MM') as mes,
--   COUNT(*) as total_eventos
-- FROM "Agenda"
-- GROUP BY TO_CHAR("fecha", 'YYYY-MM')
-- ORDER BY mes;

-- =========================================
-- NOTAS IMPORTANTES
-- =========================================
--
-- 1. Asegúrate de configurar las políticas RLS según tus necesidades de seguridad
-- 2. El campo "servicios" es JSONB para almacenar la estructura compleja de servicios
-- 3. Los triggers mantienen "updated_at" actualizado automáticamente
-- 4. Los índices mejoran el rendimiento de búsquedas por fecha y cliente
-- 5. La tabla está lista para funcionar con el código React que creamos
--
-- =========================================
