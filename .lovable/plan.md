

## Plan: `/data` Page with CSV and Airtable Import/Export

There is no built-in Airtable connector available, so we'll use the Airtable REST API via an edge function with a personal access token stored as a secret.

### Architecture

```text
Browser ──CSV──> Direct Supabase client (import/export)
Browser ──Airtable──> Edge Function ──> Airtable REST API
```

### New files

**`src/pages/Data.tsx`**
- Tabbed interface: **CSV** | **Airtable**
- **CSV tab**: Export buttons per table (zones, storefronts, businesses, volunteers, corrections, canvassing_sessions, volunteer_sessions) that fetch data and trigger CSV download. Import section with file upload per table, preview parsed rows, confirm to upsert.
- **Airtable tab**: Configure Airtable Base ID and Table Name inputs. Import from Airtable (pulls records via edge function, previews, inserts into selected local table). Export to Airtable (reads local table, pushes records via edge function).
- Styled like Admin page (gradient background, cards).

**`supabase/functions/airtable-sync/index.ts`**
- Edge function that proxies Airtable API calls using the stored `AIRTABLE_PAT` secret.
- Supports two actions:
  - `import`: GET records from a specified Airtable base/table, return as JSON (handles pagination).
  - `export`: POST/PATCH records to a specified Airtable base/table with provided data (batch 10 records per request per Airtable limits).
- CORS headers included. JWT verification disabled (public endpoint).

### Secret required
- `AIRTABLE_PAT` — Airtable Personal Access Token. User will need to generate one at https://airtable.com/create/tokens with read/write scopes on their bases.

### Route update (`src/App.tsx`)
- Add `/data` → `<DataPage />`

### CSV handling
- Export: query supabase client, convert rows to CSV string, create Blob download.
- Import: parse CSV with `papaparse` (add as dependency), preview rows, batch upsert via supabase client.

### Tables supported
All 7 tables: zones, storefronts, businesses, volunteers, corrections, canvassing_sessions, volunteer_sessions.

### Steps
1. Request `AIRTABLE_PAT` secret from user
2. Create edge function `airtable-sync`
3. Create `src/pages/Data.tsx` with CSV and Airtable tabs
4. Update `src/App.tsx` with `/data` route
5. Add `papaparse` dependency

