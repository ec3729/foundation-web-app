

## Plan: Add React Router and /admin Route

The app currently renders `CanvassingApp` directly without any routing. `react-router-dom` is already installed but not used. To serve `/admin`:

### Changes to `src/App.tsx`
- Import `BrowserRouter`, `Routes`, `Route` from `react-router-dom`
- Import `AdminPage` from `./pages/Admin`
- Wrap content in `<BrowserRouter>`
- Add two routes:
  - `/` → `<CanvassingApp />`
  - `/admin` → `<AdminPage />`

That's it — one file change.

