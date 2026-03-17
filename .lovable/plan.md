

## Render Canvassing Page as Landing Page

The Canvassing component and all its dependencies already exist. The only change needed is to swap `Index` for `CanvassingApp` in `App.tsx`.

### Changes

**`src/App.tsx`** — Import and render `CanvassingApp` from `src/pages/Canvassing.tsx` instead of `Index`.

### Dependencies

All dependencies are already in place:
- `src/pages/Canvassing.tsx` — the main component
- `src/lib/types.ts` — TypeScript interfaces
- `src/lib/supabase-storage.ts` — Supabase data functions
- `src/components/wtc-branding.tsx` — branding components
- `lucide-react`, `@tanstack/react-query` — already installed

### Note

The Canvassing page calls Supabase for data (zones, storefronts, businesses). The current Supabase client is a placeholder (`null as any`), so data fetches will fail until a real Supabase connection is configured.

