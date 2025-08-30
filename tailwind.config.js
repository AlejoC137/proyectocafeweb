/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
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
      // --- Paleta de Colores Personalizada ---
      colors: {
        pureRed: '#ff0000',
        lilaDark: '#5B7ABB',
        ladrillo: '#e3a18b',
        greenish: '#95bcbe',
        softGrey: '#d8d7d6',
        notBlack: '#2d2823',
        cream: '#f9e6c7',
        
        // --- Variables de Tema (Estilo shadcn/ui) ---
        // Estos colores se definen con variables HSL en tu archivo CSS global.
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