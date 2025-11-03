# Agenda - Sistema de Gestión de Eventos

## Descripción

Sistema completo CRUD para gestionar eventos del café, con tres modos de visualización (Calendario, Tabla, Tarjetas) y formulario integrado para registro de eventos con servicios requeridos.

## Archivos Creados/Modificados

### Nuevos Archivos
1. **AgendaForm.jsx** - Formulario completo (usado en dialog, deprecado)
2. **AgendaFormPage.jsx** - Página standalone para crear/editar eventos
3. **AgendaModal.jsx** - Modal para ver/editar detalles de eventos existentes
4. **README.md** - Esta documentación

### Archivos Modificados
1. **Agenda.jsx** - Vista principal con CRUD completo y tres modos de visualización
2. **App.jsx** - Rutas agregadas: `/evento/:id` y `/agendaForm/:id`
3. **src/components/ui/cardInstanceAgenda.jsx** - Tarjeta de evento con navegación al modal
4. **src/components/ui/cardGridAgenda.jsx** - Grid de tarjetas con navegación
5. **src/supaBaseRows/Agenda_rows.jsx** - Documentación de estructura de tabla

## Características Implementadas

### 1. CRUD Completo
- ✅ **Create**: Crear nuevos eventos con formulario completo
- ✅ **Read**: Listar todos los eventos desde Supabase
- ✅ **Update**: Editar eventos existentes
- ✅ **Delete**: Eliminar eventos con confirmación

### 2. Tres Modos de Visualización

#### Modo Calendario (Predeterminado)
- Eventos agrupados por fecha
- Diseño en cards con información resumida
- Botones de edición y eliminación en cada card
- Formato de fecha en español (día de semana, mes, año)

#### Modo Tabla
- Vista tabular completa con todas las columnas
- Columnas: Evento, Fecha, Horario, Cliente, Personas, Valor, Acciones
- Información de contacto del cliente visible
- Acciones rápidas (editar/eliminar) por fila

#### Modo Tarjetas
- Vista de tarjetas tipo "galería"
- Diseño visual atractivo con imagen banner
- Información resumida y botón de inscripción
- Botones de edición/eliminación integrados

### 3. Formulario de Eventos (AgendaForm.jsx)

#### Información Básica del Evento
- Nombre del evento (requerido)
- Fecha (requerido)
- Hora inicio y final (requerido)
- Número de personas
- Valor del evento

#### Información de Contacto
- Nombre del cliente
- Email
- Teléfono
- Autores/Organizadores

#### Servicios Requeridos (Checkboxes con descripciones)
1. **🍽️ Alimentos**
   - Checkbox para activar
   - Campo de texto para describir: "¿Quieres desayuno completo o algo para picar?"

2. **🪑 Mesas y Sillas**
   - Checkbox para activar
   - Campo de texto: "¿Cuántas mesas necesitas? ¿Dónde quieres ubicarte?"

3. **📺 Audio Visual**
   - Checkbox para activar
   - Campo de texto: "¿Necesitas televisión, sonido, proyector, micrófono?"

4. **✨ Otros Servicios**
   - Checkbox para activar
   - Campo de texto: "A la orden, cuéntanos qué más necesitas..."

#### Información Adicional
- URL de imagen banner
- Link de inscripción
- Información adicional (textarea)

### 4. Filtros y Controles

- **Filtro por mes**: Selector de mes/año para filtrar eventos
- **Estadísticas en tiempo real**:
  - Total de eventos
  - Eventos del día actual
  - Eventos del mes seleccionado
- **Botón "Nuevo Evento"**: Abre el formulario en un diálogo modal

### 5. Integraciones Redux

#### Actions Utilizadas (actions.js)
```javascript
- getAllFromTable(AGENDA) // Obtener todos los eventos
- crearItem(eventoData, AGENDA) // Crear nuevo evento
- updateItem(evento._id, eventoData, AGENDA) // Actualizar evento
- deleteItem(evento._id, AGENDA) // Eliminar evento
```

#### Estado Redux
```javascript
const allAgenda = useSelector((state) => state.allAgenda || [])
```

## Estructura de Datos

### Evento en Supabase (tabla "Agenda")

```javascript
{
  _id: "UUID",                    // Generado automáticamente
  nombre: "string",               // *Requerido
  fecha: "YYYY-MM-DD",           // *Requerido
  horaInicio: "HH:MM",           // *Requerido
  horaFinal: "HH:MM",            // *Requerido
  nombreCliente: "string",
  emailCliente: "string",
  telefonoCliente: "string",
  numeroPersonas: number,
  valor: "string",
  autores: "string",
  infoAdicional: "string",
  bannerIMG: "URL",
  linkInscripcion: "URL",
  servicios: "JSON string"      // Ver estructura abajo
}
```

### Estructura de Servicios (JSON)

```javascript
{
  alimentos: {
    activo: boolean,
    descripcion: "string"
  },
  mesas: {
    activo: boolean,
    descripcion: "string"
  },
  audioVisual: {
    activo: boolean,
    descripcion: "string"
  },
  otros: {
    activo: boolean,
    descripcion: "string"
  }
}
```

## Componentes UI Utilizados

- `PageLayout` - Layout principal de página
- `ContentCard` - Tarjeta de contenido
- `Button` - Botones de Shadcn/UI
- `Dialog` - Diálogo modal para formulario
- `Card`, `CardContent`, `CardHeader` - Componentes de tarjeta
- `Label` - Etiquetas de formulario
- `Checkbox` - Checkboxes para servicios
- Iconos de Lucide React: `Calendar`, `CalendarDays`, `Plus`, `Table`, `Edit`, `Trash2`, `Users`, `Clock`, `ExternalLink`

## Uso

### Crear un nuevo evento
1. Navegar a `/Agenda`
2. Hacer clic en botón "Nuevo Evento"
3. **Se abre una nueva pestaña** con el formulario en `/agendaForm/new`
4. Completar formulario (nombre, fecha y horarios son obligatorios)
5. Marcar servicios requeridos y agregar descripciones
6. Hacer clic en "Crear Evento"
7. Automáticamente redirige a `/Agenda` donde verás el nuevo evento

### Ver detalles de un evento
1. En cualquier vista, hacer clic en el evento o en botón "Ver" (👁️)
2. Se abrirá el modal en la ruta `/evento/:id`
3. Ver toda la información del evento incluyendo servicios solicitados

### Editar un evento
1. Abrir el modal del evento (ver detalles)
2. Hacer clic en botón "Editar Evento"
3. Modificar información en el formulario
4. Hacer clic en "Guardar Cambios"

### Eliminar un evento
1. En cualquier vista, hacer clic en botón "Eliminar" (🗑️)
2. Confirmar eliminación en el diálogo
3. O desde el modal, hacer clic en "Eliminar Evento"

### Cambiar modo de vista
- Usar los botones en la parte superior: "Calendario", "Tabla", "Tarjetas"

### Filtrar por mes
- Usar el selector de mes en la parte superior derecha

## Patrones de Diseño

### Modal Pattern (AgendaModal)
Sigue el patrón de `RecetaModal.jsx` donde:
- La ruta `/evento/:id` abre un modal de pantalla completa
- El modal se renderiza usando `ReactDOM.createPortal`
- Permite ver y editar el evento sin salir del modal
- Se puede cerrar con botón X o navegando hacia atrás
- Los cambios se reflejan inmediatamente en la vista de Agenda

### Calendar View Pattern
El diseño de la vista de calendario se basó en `ProductCalendarView.jsx`:
- Agrupa eventos por fecha
- Muestra eventos en formato de tarjetas
- Permite hacer clic en las tarjetas para ver detalles

## Próximos Pasos Sugeridos

1. **Notificaciones**: Agregar sistema de notificaciones para eventos próximos
2. **Sincronización con calendario externo**: Integrar con Google Calendar o iCal
3. **Estados de evento**: Agregar estados (Pendiente, Confirmado, Completado, Cancelado)
4. **Exportación**: Permitir exportar agenda a PDF o Excel
5. **Dashboard de eventos**: Crear vista de analytics con gráficos de eventos por mes
6. **Recordatorios**: Sistema de recordatorios automáticos por email

## Notas Técnicas

- El componente usa `useMemo` para optimizar el agrupamiento de eventos por fecha
- Los servicios se guardan como JSON stringify para facilitar almacenamiento en Supabase
- El formulario es reutilizable tanto para crear como para editar eventos
- El diálogo se muestra en un portal de React para mejor UX
- Filtros y vistas se mantienen en estado local (no persisten al recargar)

## Ejemplo de Uso en Código

```javascript
import Agenda from '@/body/views/agenda/Agenda';
import AgendaModal from '@/body/views/agenda/AgendaModal';
import AgendaFormPage from '@/body/views/agenda/AgendaFormPage';

// En tu router (App.jsx):
<Route path="/Agenda" element={<Agenda />} />
<Route path="/evento/:id" element={<AgendaModal />} />
<Route path="/agendaForm/:id" element={<AgendaFormPage />} />
```

### Navegación

```javascript
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

// Abrir formulario en nueva pestaña (crear nuevo evento):
window.open('/agendaForm/new', '_blank');

// Editar evento en nueva pestaña:
window.open(`/agendaForm/${eventoId}`, '_blank');

// Ver detalles en modal:
navigate(`/evento/${eventoId}`);

// Volver:
navigate(-1); // o navigate('/Agenda')
```

## Dependencias Requeridas

- React 18.3+
- Redux + React-Redux
- Lucide React (iconos)
- Radix UI components (Dialog, Checkbox)
- Tailwind CSS
