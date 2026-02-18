/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    // --- Utilidad de Contenedor Central ---
    // Te permite usar la clase `container` para centrar el contenido con padding.
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // --- Paleta de Colores Unificada (shadcn/ui + extensiones específicas) ---
      colors: {
        // DEPRECATED: Migrar gradualmente estos colores al sistema unificado
        // Mantener temporalmente para compatibilidad, pero usar con moderación
        pureRed: '#ef4444', // → Migrar a destructive
        lilaDark: '#3b82f6', // → Migrar a primary
        ladrillo: '#f97316', // → Migrar a secondary con orange
        greenish: '#10b981', // → Migrar a accent con emerald
        softGrey: '#e5e7eb', // → Migrar a muted
        notBlack: '#1f2937', // → Migrar a slate-800
        cream: '#fef7ed', // → Migrar a background variations
        
        // --- Nueva Paleta Cafetería (Gemini suggestion) ---
        'cream-bg': '#F5F0E1', // Fondo principal, color crema pálido
        'sage-green': '#A5B8A1', // Verde principal, para fondos de sección, barras laterales
        'terracotta-pink': '#E0A996', // Rosa ladrillo, para tarjetas, acentos sutiles
        'cobalt-blue': '#3A4FDE', // Azul vibrante, para botones de acción (CTAs), iconos, elementos interactivos
        'light-leaf': '#D9E4D7', // Un verde muy claro para elementos de fondo sutiles
        
        // --- Colores Funcionales del Sistema ---
        // Estados OK/NA
        'status-ok': '#10b981',      // Verde para OK
        'status-na': '#64748b',      // Gris para NA
        'status-pending': '#f59e0b', // Amarillo para pendiente
        
        // Acciones de edición y gestión
        'action-edit': '#3b82f6',    // Azul para editar
        'action-delete': '#ef4444',  // Rojo para eliminar
        'action-save': '#10b981',    // Verde para guardar
        'action-cancel': '#6b7280',  // Gris para cancelar
        
        // Funciones de tarjetas y tablas
        'card-primary': '#8b5cf6',   // Morado para tarjetas principales
        'card-secondary': '#06b6d4', // Cyan para tarjetas secundarias
        'excel-export': '#16a34a',   // Verde para Excel
        'pdf-export': '#dc2626',     // Rojo para PDF
        
        // Módulos específicos
        'almacen-primary': '#a3a3a3', // Gris para almacén
        'almacen-secondary': '#737373',
        'produccion-primary': '#f97316', // Naranja para producción
        'produccion-secondary': '#ea580c',
        
        // Tonos adicionales de la paleta base
        'sage-green-light': '#b8c5b5',
        'sage-green- ': '#8fa68b',
        'terracotta-light': '#e8b5a6',
        'terracotta- ': '#d49886',
        'cobalt-light': '#5a6bff',
        'cobalt- ': '#2938de',
        
        // --- Sistema Unificado shadcn/ui ---
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      // --- Tamaños y Alturas Personalizadas ---
      width: {
        'custom-width1200px': '1200px',
        'custom-width350px': '350px', // CORREGIDO: Antes era '400px'
        'custom-width400px': '400px',
        'custom-width1200px': '1200px',
        'custom-widthSillax': '600px',
      },
      height: {
        'custom-height225': '225px',
        'custom-height750': '825px'
      },
      // --- Tipografías Personalizadas ---
      fontFamily: {
        BobbyJones: ['Bobby Jones Regular', 'sans-serif'],
        LilitaOne: ['Lilita One', 'sans-serif'], 
        SpaceGrotesk: ['Space Grotesk', 'sans-serif'],
        AlteHaasGrotesk: ['AlteHaasGrotesk', 'sans-serif'],
        Montserrat: ['Montserrat', 'sans-serif'],
        PlaywriteDE: ['Playwrite DE Grund', 'cursive'],
        'sans': ['Playwrite DE Grund', 'Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'], // Playwrite DE como fuente principal
      },
      // --- Tamaños de Fuente Personalizados ---
      fontSize: {
        '10pt': '10pt',
        '12pt': '12pt',
        '13pt': '13pt',
        '15pt': '15pt',
        '20pt': '20pt',
        '30pt': '30pt'
      },
      // --- Radio de Bordes Personalizado (usa variables CSS) ---
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // --- Keyframes para Animaciones ---
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      // --- Definiciones de Animación ---
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}