# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build (generates dist/stats.html for bundle analysis)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

## Architecture Overview

This is a **React + Vite SPA** for managing a café business. It is a Spanish-language internal tool.

### Core layers

- **`src/body/views/`** — Feature pages, organized by domain (e.g., `ventaCompra/`, `agenda/`, `inventario/`)
- **`src/body/components/`** — Shared components scoped to the app shell (sidebar, menu, print layouts)
- **`src/components/ui/`** — Base UI primitives (shadcn/ui-style, built on Radix UI + Tailwind)
- **`src/redux/`** — All state management (see below)
- **`src/config/supabaseClient.js`** — Supabase client singleton
- **`src/hooks/`** — Custom React hooks
- **`src/utils/`** — Utility functions and message templates

### Routing (App.jsx)

React Router v6 with `React.lazy()` + `Suspense` on every route for code splitting. Default route (`/`) is `StaffPortal`. Notable patterns:
- Parameterized detail routes: `/receta/:id`, `/item/:id`, `/evento/:id/:tab?`, `/staff-details/:cc`
- Optional date param: `/DiaResumen/:date?`

### State management (Redux)

The store (`src/redux/store.js`) is a hybrid:
- **`legacyReducer`** — older switch/case reducers, still used broadly
- **`employeeSlice`** — modern RTK slice for staff data

Async data fetching uses Redux Thunk with Supabase calls inside the thunk bodies. All domain action files follow the pattern `actions-<Domain>.js` (e.g., `actions-VentasCompras.js`, `actions-Proveedores.js`).

The store's serializable check middleware is customized to allow Supabase `Date` and `File` objects in state.

### Backend

- **Supabase** (PostgreSQL) is the primary database. The client is in `src/config/supabaseClient.js` and uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- **OpenAI** is integrated for AI features (key: `OPENAI_API_KEY`).
- SQL migration/schema files live under `src/supaBaseRows/`.

### UI system

- **TailwindCSS 3** with a custom café-themed color palette (see `tailwind.config.js`)
- **shadcn/ui** components (Radix UI primitives), configured via `components.json`
- **Framer Motion** for animations; **Lucide React** for icons
- Path alias `@` → `./src` (configured in both `vite.config.js` and `jsconfig.json`)

### Build chunking

`vite.config.js` manually splits vendor chunks (`react-router`, `redux`, `radix-ui`, `framer-motion`, `supabase`, PDF libs, XLSX) for better caching. Production strips `console.log` and `debugger`.

## Environment variables

Copy `.env.example` and fill in:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```
