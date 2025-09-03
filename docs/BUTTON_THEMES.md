# Sistema de Botones Funcional 🔧

Este proyecto cuenta con un sistema de botones **limpio, funcional y diferenciado** con colores específicos para cada acción del sistema.

## 🎯 Filosofía de Diseño

- **Simplicidad**: Diseño limpio sin efectos innecesarios
- **Funcionalidad**: Cada color tiene un propósito específico
- **Consistencia**: Fondo cream-bg en todos los temas
- **Diferenciación**: Estados OK/NA, acciones, módulos claramente identificados

## 🔧 Características del Sistema

### Estilos Globales Limpios
Todos los elementos `<button>` automáticamente reciben:
```css
button {
  background-color: #F5F0E1; /* cream-bg */
  color: #A5B8A1; /* sage-green */
  border: 1px solid #A5B8A1;
  border-radius: 6px;
  padding: 8px 16px;
  transition: all 0.15s ease;
}

button:hover {
  background-color: #A5B8A1;
  color: white;
}
```

## 🔍 Variantes Funcionales del Sistema

### 🟫 Botones Básicos
```jsx
<Button>Default</Button>                    // Cobalt-blue
<Button variant="secondary">Secondary</Button>   // Sage-green
<Button variant="destructive">Delete</Button>   // Action-delete (rojo)
```

### 🟢 Estados PC: OK/NA
```jsx
<Button variant="status-ok">🟢 OK</Button>
<Button variant="status-na">🔘 NA</Button>
<Button variant="status-pending">🟡 Pendiente</Button>
```
Los botones cambian de color según el estado seleccionado.

### ✏️ Acciones de Edición
```jsx
<Button variant="action-edit">✏️ Editar</Button>
<Button variant="action-save">💾 Guardar</Button>
<Button variant="action-cancel">❌ Cancelar</Button>
```
Colores diferenciados para acciones de tarjetas y tablas.

### 📈 Exportación y Tablas
```jsx
<Button variant="excel-export">📈 Excel</Button>
<Button variant="pdf-export">📄 PDF</Button>
<Button variant="card-primary">🃏 Tarjeta</Button>
```
Funciones diferenciadas para Excel y otras operaciones.

### 🏢 Módulos Específicos
```jsx
<Button variant="almacen">🏢 Almacén</Button>        // Gris
<Button variant="produccion">🏭 Producción</Button>  // Naranja
```
Colores dentro de la gama para diferentes módulos.

## 🛠 Clases de Utilidad

Para casos especiales, puedes usar estas clases:

### Tema Consistente
```jsx
<button className="btn-cream-theme">
  Botón con estilo consistente
</button>
```

### Primary Personalizado
```jsx
<button className="btn-cream-primary">
  Botón Primary
</button>
```

### Danger Personalizado
```jsx
<button className="btn-cream-danger">
  Botón Danger
</button>
```

## 🎭 Efectos Especiales y Animaciones

### 🌈 Gradiente Animado
```jsx
<Button variant="premium" className="animate-gradient">
  Arcoíris Animado
</Button>
```

### 💓 Pulso Suave
```jsx
<Button className="animate-pulse-slow">
  Efecto Pulso
</Button>
```

### 🏀 Rebote
```jsx
<Button className="animate-bounce-slow">
  Efecto Rebote
</Button>
```

### ✨ Efecto Shimmer
```jsx
<Button className="animate-shimmer">
  Brillo Desplazándose
</Button>
```

### 🔮 Glassmorphism
```jsx
<button className="glass">
  Efecto Vidrio
</button>
```

## 🍹 Casos de Uso Prácticos

### 1. Botón Standard HTML
```html
<button>Gradiente automático sage-green</button>
```

### 2. Botón con Clases Especiales
```jsx
<button className="success">
  Botón de éxito
</button>
<button className="danger">
  Botón de peligro
</button>
<button className="premium">
  Botón premium animado
</button>
```

### 3. Combinando Efectos
```jsx
<Button variant="premium" className="animate-gradient animate-pulse-slow">
  Múltiples efectos
</Button>
```

## 🌙 Comportamiento en Dark Mode

Al activar el dark mode (agregando clase `dark` al HTML):

1. **Los fondos de botones se mantienen claros**
2. **Los textos pueden volverse más oscuros para mejor contraste**
3. **Los bordes pueden intensificarse**
4. **Las animaciones y efectos hover permanecen**

### Activar Dark Mode
```javascript
// Activar dark mode
document.documentElement.classList.add('dark');

// Desactivar dark mode
document.documentElement.classList.remove('dark');
```

## 🎨 Paleta de Colores Utilizada

- **cream-bg**: `#F5F0E1` - Fondo principal de botones
- **light-leaf**: `#D9E4D7` - Fondo hover
- **sage-green**: `#A5B8A1` - Bordes y texto secundario
- **cobalt-blue**: `#3A4FDE` - Texto primary y bordes
- **terracotta-pink**: `#E0A996` - Texto secondary

## ✨ Ventajas de Este Sistema

1. **Consistencia visual**: Todos los botones se ven coherentes
2. **Accesibilidad**: Buen contraste en todos los temas
3. **Mantenibilidad**: Un solo sistema de estilos
4. **Flexibilidad**: Fácil personalización con clases de utilidad
5. **Compatibilidad**: Funciona con cualquier componente o elemento button

## 🔍 Debugging

Si un botón no está tomando los estilos correctos:

1. Verifica que no tenga estilos inline que anulen los globales
2. Usa las clases de utilidad como `btn-cream-theme`
3. Inspecciona si hay conflictos de especificidad CSS
4. Asegúrate de que los estilos se estén aplicando con `!important`
