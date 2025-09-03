# RecetaModalUniversal - Guía de Uso

## 🎯 Propósito
Componente unificado que reemplaza múltiples versiones de RecetaModal, adaptándose automáticamente según el contexto de uso (venta, inventario, producción, actividades).

## 📋 Funcionalidades por Contexto

### 1. **Contexto: "venta"** 
- ✅ Modal full-screen con portal
- ✅ Control de porcentaje de ingredientes
- ✅ Checkboxes para marcar ingredientes usados
- ✅ Edición de cantidades en tiempo real
- ✅ Perfecto para el flujo de MesaBarra

### 2. **Contexto: "inventario"**
- ✅ Modal informativo sin edición
- ❌ Sin controles de porcentaje
- ❌ Sin checkboxes
- ✅ Solo visualización de datos

### 3. **Contexto: "produccion"**
- ✅ Modal completo con edición
- ✅ Control de porcentaje para escalado
- ✅ Checkboxes para seguimiento
- ✅ Fuentes: RecetasProcedimientos, RecetasProduccion

### 4. **Contexto: "actividades"**  
- ❌ No modal (renderizado inline)
- ❌ Sin controles avanzados
- ✅ Vista simple de información

## 🔧 Instalación y Uso

### Importación
```jsx
import RecetaModalUniversal from "@/components/RecetaModalUniversal";
```

### Ejemplos de Uso

#### 1. En VentaCompra (MesaBarra.jsx)
```jsx
// Reemplazar línea 241 de MesaBarra.jsx
{selectedReceta && (
  <RecetaModalUniversal 
    item={selectedReceta} 
    context="venta"
    onClose={() => setSelectedReceta(null)} 
  />
)}
```

#### 2. En Inventario (nuevo botón "Ver Receta")
```jsx
{item.Receta && (
  <Button onClick={() => setShowRecetaModal(true)}>
    📖 Ver Receta
  </Button>
)}

{showRecetaModal && (
  <RecetaModalUniversal 
    item={item} 
    context="inventario"
    onClose={() => setShowRecetaModal(false)}
  />
)}
```

#### 3. En Producción (CardGridProcedimientos_Instance.jsx)
```jsx
// Mantener RecepieOptionsProcedimientos para edición compleja
// Añadir botón para vista rápida de receta
<Button onClick={() => setShowRecetaModal(true)}>
  👁️ Vista Rápida
</Button>

{showRecetaModal && (
  <RecetaModalUniversal 
    item={item} 
    context="produccion"
    onClose={() => setShowRecetaModal(false)}
  />
)}
```

#### 4. En Actividades (reemplazar RecetaModal.archuerf)
```jsx
// En lugar del componente actual
<RecetaModalUniversal 
  item={{ Receta: recetaId }}
  context="actividades"
/>
```

#### 5. Ruta directa (App.jsx línea 111)
```jsx
// Actualizar la ruta existente
<Route 
  path="/receta/:id" 
  element={
    <RecetaModalUniversal 
      context="inventario"
      onClose={() => navigate(-1)}
    />
  } 
/>
```

## ⚙️ Props Detalladas

```jsx
RecetaModalUniversal({
  item,              // Objeto con propiedad .Receta (ID de la receta)
  onClose,           // Función para cerrar modal (solo si context requiere modal)
  context,           // "venta" | "inventario" | "produccion" | "actividades"
  
  // Props opcionales (sobrescriben configuración de contexto)
  showPercentageControl,  // boolean: mostrar control de porcentaje
  showCheckboxes,         // boolean: mostrar checkboxes en ingredientes  
  showEditControls,       // boolean: permitir edición de cantidades
  isModal,                // boolean: renderizar como modal o inline
  title                   // string: título personalizado
})
```

## 🎨 Estilos Forzados
- ✅ **Independiente del modo oscuro**: Todos los colores con valores RGB explícitos
- ✅ **Consistente**: Misma paleta de colores en todos los contextos
- ✅ **Profesional**: Interfaz limpia y moderna

### Paleta de Colores Utilizada
```css
- Fondo principal: rgb(255, 255, 255) /* white */
- Texto principal: rgb(0, 0, 0) /* black */
- Bordes: rgb(209, 213, 219) /* gray-300 */
- Verde éxito: rgb(34, 197, 94) /* green-500 */  
- Azul información: rgb(37, 99, 235) /* blue-600 */
- Rojo error: rgb(239, 68, 68) /* red-500 */
- Gris texto secundario: rgb(107, 114, 128) /* gray-500 */
```

## 🚀 Beneficios

### ✅ Ventajas
- **DRY**: Elimina duplicación de código
- **Mantenible**: Un solo archivo para mantener
- **Consistente**: Misma UX en toda la app
- **Flexible**: Se adapta automáticamente al contexto
- **Escalable**: Fácil añadir nuevos contextos

### 🔄 Migración
1. Instalar el componente nuevo
2. Reemplazar imports existentes
3. Ajustar props según contexto
4. Eliminar componentes obsoletos:
   - `/src/body/views/ventaCompra/RecetaModal.jsx` → mantener como backup
   - `/src/body/views/actividades/RecetaModal.archuerf` → eliminar
   - Otros modals de receta → evaluar caso por caso

## 🧪 Testing

### Contextos a Probar
1. **Venta**: Abrir receta desde MesaBarra, verificar porcentajes y checkboxes
2. **Inventario**: Verificar que sea solo lectura y sin controles
3. **Producción**: Verificar carga desde RecetasProcedimientos
4. **Actividades**: Verificar renderizado inline sin modal

### Estados a Validar
- ✅ Loading state
- ✅ Error state (receta no encontrada)
- ✅ Empty state (sin ingredientes)
- ✅ Success state (datos completos)

## 🐛 Troubleshooting

### Error: "El ítem no tiene una receta asociada"
**Causa**: `item.Receta` es null/undefined
**Solución**: Verificar que el item tenga el campo Receta poblado

### Error: "Receta no encontrada"  
**Causa**: ID de receta no existe en las tablas
**Solución**: Verificar integridad de datos entre tablas

### Modal no se cierra
**Causa**: `onClose` no definido en contextos que requieren modal
**Solución**: Siempre pasar función onClose para contextos modal

### Estilos se ven afectados por modo oscuro
**Causa**: CSS de Tailwind sobrescribiendo estilos inline
**Solución**: Verificar que todos los elementos tengan style={{}} explícito
