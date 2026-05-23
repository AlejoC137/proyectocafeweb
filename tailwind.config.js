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
        'sage-green-dark': '#8fa68b',
        'terracotta-light': '#e8b5a6',
        'terracotta-accent': '#ec947e',
        'cobalt-light': '#5a6bff',
        'cobalt-dark': '#2938de',

        // --- Google Stitch Base ---
        "surface-main": "#FDF8EC",
        "on-tertiary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "outline": "#747783",
        "error-container": "#ffdad6",
        "tertiary-fixed": "#ccebc4",
        "inverse-surface": "#323029",
        "on-tertiary-fixed-variant": "#334d30",
        "surface-container-high": "#ede8dc",
        "surface-dim": "#dedace",
        "on-tertiary-container": "#b7d6b0",
        "secondary-stitch": "#99462a",
        "tertiary-stitch": "#2c462a",
        "action-blue": "#2E53A7",
        "success-sage": "#769371",
        "on-error": "#ffffff",
        "primary-fixed-dim": "#b2c5ff",
        "primary-fixed": "#dae2ff",
        "on-surface-variant": "#434652",
        "on-secondary-container": "#762c12",
        "primary-stitch": "#0c3a8e",
        "surface-card": "#FFFFFF",
        "on-secondary-fixed": "#390b00",
        "on-background": "#1d1c15",
        "surface-container-highest": "#e7e2d6",
        "surface-container-low": "#f8f3e7",
        "outline-variant": "#c4c6d3",
        "tertiary-container": "#435e40",
        "on-surface": "#1d1c15",
        "surface-variant": "#e7e2d6",
        "surface-tint": "#365aaf",
        "tertiary-fixed-dim": "#b0cfa9",
        "on-secondary": "#ffffff",
        "on-primary-fixed-variant": "#184295",
        "secondary-fixed-dim": "#ffb59e",
        "error": "#ba1a1a",
        "on-error-container": "#93000a",
        "surface-container": "#f2eee2",
        "surface": "#fef9ed",
        "inverse-on-surface": "#f5f0e4",
        "on-primary-container": "#bcccff",
        "primary-container": "#2e53a7",
        "inverse-primary": "#b2c5ff",
        "secondary-fixed": "#ffdbd0",
        "on-secondary-fixed-variant": "#7a2f15",
        "secondary-container": "#fe9572",
        "surface-bright": "#fef9ed",
        "on-tertiary-fixed": "#072108",
        "accent-terracotta": "#D97757",
        "on-primary-stitch": "#ffffff",
        "on-primary-fixed": "#001848",

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
      // --- Sombras Neobrutalistas (MenuPrint) ---
      boxShadow: {
        'solid': '4px 4px 0px 0px rgba(0,0,0,1)',
        'solid-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'solid-lg': '6px 6px 0px 0px rgba(0,0,0,1)',
      },
      // --- Spacing de Google Stitch ---
      spacing: {
        "base": "8px",
        "margin-desktop": "32px",
        "margin-mobile": "16px",
        "max-width": "1440px",
        "gutter": "16px"
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
        FirstBunny: ['First Bunny', 'sans-serif'],
        BobbyJones: ['Bobby Jones Regular', 'sans-serif'],
        LilitaOne: ['Lilita One', 'sans-serif'],
        SpaceGrotesk: ['Space Grotesk', 'sans-serif'],
        AlteHaasGrotesk: ['AlteHaasGrotesk', 'sans-serif'],
        Montserrat: ['Montserrat', 'sans-serif'],
        PlaywriteDE: ['Playwrite DE Grund', 'cursive'],
        'sans': ['Playwrite DE Grund', 'Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'], // Playwrite DE como fuente principal
        "body-lg": ["Space Grotesk"],
        "body-md": ["Space Grotesk"],
        "headline-sm": ["Space Grotesk"],
        "headline-md": ["Space Grotesk"],
        "headline-lg": ["Space Grotesk"],
        "label-md": ["Space Grotesk"],
        "body-sm": ["Space Grotesk"],
        "headline-xl": ["Space Grotesk"],
        "code-md": ["Space Grotesk"],
        "headline-lg-mobile": ["Space Grotesk"]
      },
      // --- Tamaños de Fuente Personalizados ---
      fontSize: {
        '10pt': '10pt',
        '12pt': '12pt',
        '13pt': '13pt',
        '15pt': '15pt',
        '20pt': '20pt',
        '30pt': '30pt',
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
        "label-md": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "headline-xl": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "code-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "500"}],
        "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "600"}]
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