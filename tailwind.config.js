/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      width: {
        'custom-width1200px': '1200px',
        'custom-width350px': '400px',
        'custom-width400px': '400px',
      },
      height: {
        'custom-height225': '225px',
        'custom-height750': '800px'
      },

  fontFamily: {
  BobbyJones: ['Bobby Jones Regular', 'sans-serif'],
  LilitaOne: ['Lilita One', 'sans-serif'], 
  SpaceGrotesk: ['Space Grotesk', 'sans-serif'],
},
      fontSize: {
        '10pt': '10pt',
        '12pt': '12pt',
        '13pt': '13pt',
        '15pt': '15pt',
        '20pt': '20pt',
        '30pt': '30pt'
      },
      colors: {
        pureRed: '#ff0000',
        lilaDark: '#5B7ABB',
        ladrillo: '#e3a18b',
        greenish: '#95bcbe',
        softGrey: '#d8d7d6',
        notBlack: '#2d2823',
        cream: '#f9e6c7',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
