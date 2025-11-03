# 🚀 Setup de la Tabla Agenda en Supabase

## ❌ Error Actual

```
Could not find the 'nombre' column of 'Agenda' in the schema cache
```

**Causa:** La tabla "Agenda" no existe en tu base de datos de Supabase.

---

## ✅ Solución: Crear la Tabla en Supabase

### Paso 1: Acceder al SQL Editor de Supabase

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: **gmothqjjqvbxshvvlbrq**
3. En el menú lateral, haz clic en **"SQL Editor"**
4. Haz clic en **"New Query"**

### Paso 2: Ejecutar el Script SQL

1. Abre el archivo: `src/supaBaseRows/create_agenda_table.sql`
2. **Copia TODO el contenido** del archivo
3. **Pega** en el SQL Editor de Supabase
4. Haz clic en el botón **"Run"** (o presiona `Ctrl+Enter`)

### Paso 3: Verificar la Creación

Deberías ver mensajes de éxito indicando que:
- ✅ Tabla "Agenda" creada
- ✅ Índices creados
- ✅ Trigger de updated_at creado
- ✅ Políticas RLS habilitadas
- ✅ Datos de prueba insertados (2 eventos de ejemplo)

### Paso 4: Verificar en la Interfaz

1. En el menú lateral de Supabase, ve a **"Table Editor"**
2. Busca la tabla **"Agenda"**
3. Deberías ver las columnas:
   - `_id` (UUID)
   - `nombre` (TEXT)
   - `fecha` (DATE)
   - `horaInicio` (TIME)
   - `horaFinal` (TIME)
   - `nombreCliente` (TEXT)
   - `emailCliente` (TEXT)
   - `telefonoCliente` (TEXT)
   - `numeroPersonas` (INTEGER)
   - `valor` (TEXT)
   - `autores` (TEXT)
   - `infoAdicional` (TEXT)
   - `bannerIMG` (TEXT)
   - `linkInscripcion` (TEXT)
   - `servicios` (JSONB)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

4. Deberías ver **2 eventos de prueba** ya insertados

---

## 🎯 Probar la Aplicación

Una vez creada la tabla:

1. **Refresca tu aplicación** React (F5)
2. Navega a `/Agenda`
3. Deberías ver los 2 eventos de prueba en el calendario
4. Haz clic en **"Nuevo Evento"** para crear uno nuevo

---

## 🔒 Configuración de Seguridad (Opcional)

El script incluye una política RLS que **permite acceso total**:

```sql
CREATE POLICY "Enable all operations for authenticated users" ON "Agenda"
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Para Producción (Más Seguro):

Si quieres restringir el acceso solo a usuarios autenticados:

```sql
-- Eliminar política actual
DROP POLICY "Enable all operations for authenticated users" ON "Agenda";

-- Crear política que requiere autenticación
CREATE POLICY "Enable read for all users" ON "Agenda"
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "Agenda"
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON "Agenda"
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON "Agenda"
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

---

## 📊 Consultas Útiles

### Ver todos los eventos:
```sql
SELECT * FROM "Agenda" ORDER BY "fecha", "horaInicio";
```

### Ver eventos del mes actual:
```sql
SELECT * FROM "Agenda" 
WHERE "fecha" >= DATE_TRUNC('month', CURRENT_DATE)
  AND "fecha" < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY "fecha", "horaInicio";
```

### Ver servicios de un evento específico:
```sql
SELECT 
  "nombre",
  "fecha",
  "servicios"
FROM "Agenda" 
WHERE "_id" = 'tu-uuid-aqui';
```

### Contar eventos por mes:
```sql
SELECT 
  TO_CHAR("fecha", 'YYYY-MM') as mes,
  COUNT(*) as total_eventos
FROM "Agenda"
GROUP BY TO_CHAR("fecha", 'YYYY-MM')
ORDER BY mes DESC;
```

---

## 🐛 Troubleshooting

### Si el error persiste después de crear la tabla:

1. **Verificar que la tabla existe:**
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename = 'Agenda';
   ```

2. **Verificar las columnas:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Agenda';
   ```

3. **Limpiar caché de Supabase:**
   - Ve a **Settings** → **API**
   - Haz clic en **"Restart"** para reiniciar el servidor

4. **Verificar las políticas RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'Agenda';
   ```

5. **Verificar permisos:**
   - Asegúrate de que tu API Key (en `.env`) sea correcta
   - Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas

---

## 📝 Estructura de Datos de Ejemplo

### Evento Completo:

```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Lanzamiento de Libro",
  "fecha": "2025-02-15",
  "horaInicio": "18:00:00",
  "horaFinal": "21:00:00",
  "nombreCliente": "María González",
  "emailCliente": "maria@example.com",
  "telefonoCliente": "300-123-4567",
  "numeroPersonas": 50,
  "valor": "$100,000",
  "autores": "María González, Juan Pérez",
  "infoAdicional": "Presentación de libro con vino y aperitivos",
  "bannerIMG": "https://example.com/banner.jpg",
  "linkInscripcion": "https://eventbrite.com/evento123",
  "servicios": {
    "alimentos": {
      "activo": true,
      "descripcion": "Vino, quesos y aperitivos para 50 personas"
    },
    "mesas": {
      "activo": true,
      "descripcion": "10 mesas redondas en el área principal"
    },
    "audioVisual": {
      "activo": true,
      "descripcion": "Micrófono y proyector"
    },
    "otros": {
      "activo": false,
      "descripcion": ""
    }
  }
}
```

---

## ✅ Checklist Final

- [ ] Script SQL ejecutado exitosamente en Supabase
- [ ] Tabla "Agenda" visible en Table Editor
- [ ] 2 eventos de prueba insertados
- [ ] Políticas RLS configuradas
- [ ] Variables de entorno (.env) correctas
- [ ] Aplicación React refrescada
- [ ] Ruta /Agenda accesible
- [ ] Botón "Nuevo Evento" funcional
- [ ] Eventos de prueba visibles en el calendario

---

## 🎉 ¡Listo!

Una vez completados estos pasos, tu sistema de Agenda estará completamente funcional y podrás:

- ✅ Ver eventos en 3 modos (calendario, tabla, tarjetas)
- ✅ Crear nuevos eventos en nueva pestaña
- ✅ Ver detalles en modal
- ✅ Editar eventos inline o en página separada
- ✅ Eliminar eventos con confirmación
- ✅ Filtrar por mes
- ✅ Ver estadísticas en tiempo real

**Si tienes algún problema, revisa la sección de Troubleshooting arriba.** 🚀
