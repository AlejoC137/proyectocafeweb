# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React + Vite cafe management system that handles inventory, menu planning, staff scheduling, recipes, purchases, and financial tracking. The application integrates with Supabase for backend data storage and includes web scraping functionality for price comparison.

## Common Commands

### Development
```powershell
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint to check code quality
```

### Testing
This project does not currently have a test suite configured.

## Environment Setup

Required environment variables (see `.env.example`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENAI_API_KEY` - OpenAI API key for AI features

Copy `.env.example` to `.env` and populate with real credentials before running the app.

## Architecture Overview

### State Management (Redux)

The application uses Redux with Redux Thunk for global state management. The store is configured with Redux DevTools support.

**Key State Structure:**
- `allStaff` - Staff members and their information
- `allMenu` - Menu items for the cafe
- `allItems` - Inventory items (ItemsAlmacen table)
- `allProduccion` - Internal production items
- `allProcedimientos` - Procedures/procedimientos
- `allRecetasMenu`, `allRecetasProduccion`, `allRecetasProcedimientos` - Recipes for menu items, production, and procedures
- `allWorkIsue` - Work issues/tasks
- `allCompras` - Purchases
- `Proveedores` - Suppliers/providers
- `allAgenda` - Agenda/calendar items
- `currentView` - Controls which view is displayed
- `selectedProviderId` - Currently selected provider
- `orderItems` - Items in current order
- `models` - Data models
- `scrapedData` - Results from web scraping

### Redux Actions Organization

Actions are split across multiple files by domain:
- `actions.js` - General actions (CRUD for tables, view updates, state management)
- `actions-Staff.js` - Staff-related actions
- `actions-Proveedores.js` - Provider/supplier actions
- `actions-Procedimientos.js` - Procedure actions
- `actions-WorkIsue.js` - Work issue/task actions
- `actions-VentasCompras.js` - Sales and purchases actions
- `standaloneTaskActions.js` - Standalone task operations
- `actions-types.js` - Constants for action types, table names, categories, units, etc.

### Routing

The app uses React Router v6 with routes defined in `App.jsx`. Key routes include:
- `/` - Staff Portal (default)
- `/MenuView` - Menu view
- `/MenuLunch` - Lunch menu
- `/Inventario` - Inventory management
- `/Manager` - Manager view
- `/Recetas` - Recipes
- `/Compras` - Purchases
- `/VentaCompra` - Sales/Purchase tracking
- `/Proveedores` - Suppliers
- `/Actividades` - Activities/tasks
- `/WorkIsue` - Work issues (Excel view)
- `/CalculoNomina` - Payroll calculation
- `/Gastos` - Expenses
- `/Predict/:MenuItem` - Prediction for menu items
- `/receta/:id` - Recipe modal
- `/ProcedimientoModal/:id` - Procedure modal

### Data Layer (Supabase)

The app connects to Supabase via `src/config/supabaseClient.js`. Main tables:
- `ItemsAlmacen` - Warehouse/inventory items
- `Menu` - Menu items
- `ProduccionInterna` - Internal production
- `Staff` - Staff members
- `RecetasProduccion` - Production recipes
- `Procedimientos` - Procedures
- `RecetasProcedimientos` - Recipe-procedure relationships
- `Proveedores` - Suppliers
- `Compras` - Purchases
- `WorkIsue` - Work issues/tasks
- `Agenda` - Calendar/agenda items

### Categories and Constants

**CATEGORIES (GRUPO):** Product/item groups defined in `actions-types.js`
- CAFE, DESAYUNO, BEBIDAS, PANADERIA, REPOSTERIA, TARDEO, ADICIONES
- CARNICO, LACTEO, VERDURAS_FRUTAS, CONDIMENTOS_ESPECIAS_ADITIVOS
- GRANOS_CEREALES, LIMPIEZA, DOTACION, CONCERVAS_FERMENTOS_PRECOCIDOS
- GUARNICION, DESECHABLES, ENLATADOS, GRANOS, HARINAS

**AREAS:** Physical areas in the cafe
- COCINA, BARRA, MESAS, JARDINERIA, LIBROS_TIENDA, BAÑO, DESPACHO

**BODEGA:** Storage locations (refrigeration, freezer, shelves in different areas)

**UNIDADES:** Units of measurement (gr, kl, ml, li, un, srv)

**ROLES:** Staff roles (BARISTA, DESPACHADOR, AUX_PRODUCCION, COCINERO, EVENTOS, REDES, MANAGER)

**ESTATUS:** Status values (PC, PP, OK, NA)

### Component Organization

```
src/
├── body/
│   ├── components/      # Reusable components (gastos, Menu)
│   └── views/          # Page-level views
│       ├── actividades/     # Activities/tasks management
│       ├── agenda/          # Calendar/scheduling
│       ├── home/            # Landing/home pages
│       ├── inventario/      # Inventory management
│       ├── menuView/        # Menu display
│       ├── proveedores/     # Supplier management
│       ├── staff/           # Staff management and payroll
│       └── ventaCompra/     # Sales, purchases, recipes, predictions
├── components/ui/      # UI components (bottom-nav, top-nav)
├── config/            # Configuration (Supabase client)
├── redux/             # State management
└── utils/             # Utility functions
```

### Special Features

**Web Scraping:** The `scraper/` directory contains functionality to scrape prices from various sources (defined in `sources.jsx`). Results stored in Redux state under `scrapedData`.

**Payroll Calculation:** Uses Colombian minimum wage constant (SMMV_COL_2025) defined in `actions-types.js` for payroll calculations.

**Multi-language Support:** Language state (`currentLeng`) supports ESP/ENG, with translation objects in `CATEGORIES_t`.

**Recipe Management:** Complex recipe system with relationships between menu items, production items, and procedures. Recipes can be created, updated, and cost-calculated.

**Work Issues/Tasks:** Excel-like view for managing tasks with staff assignments, dates, and notes.

## Development Guidelines

### Path Aliasing
The project uses `@` as an alias for the `src/` directory (configured in `vite.config.js`):
```javascript
import Component from '@/components/Component'
```

### Styling
- TailwindCSS for styling
- Custom theme color: `cream-bg` used for overlay backgrounds
- Uses Radix UI components for complex UI elements
- Framer Motion for animations

### Code Style
- React 18.3 with JSX runtime (no need to import React in files)
- Functional components with hooks
- Redux hooks: `useSelector` for state, `useDispatch` for actions
- ESLint configured with React, React Hooks, and React Refresh plugins

### Adding New Features
1. Define action types in `redux/actions-types.js`
2. Create action creators in appropriate action file
3. Add reducer case in `redux/reducer.js`
4. Create view component in `src/body/views/[feature]/`
5. Add route in `App.jsx`
6. Ensure Supabase table exists and client can access it

### Common Patterns
- Fetching data: Dispatch `getAllFromTable(tableName)` action on component mount
- View switching: Use `UPDATE_CURRENT_VIEW` action or React Router navigation
- Modal patterns: Use Radix Dialog components for overlays
- Forms: Typically inline with local state, then dispatch actions on submit
