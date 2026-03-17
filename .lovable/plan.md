

## Plan: Enable Lovable Cloud and Populate Database

### Step 1: Enable Lovable Cloud
Enable Lovable Cloud to get a real Supabase backend. This replaces the placeholder client in `src/integrations/supabase/client.ts`.

### Step 2: Create Database Tables
Create migrations for the 6 tables the app uses:

1. **zones** — `id` (serial PK), `name` (text), `description` (text nullable), `estimated_time` (int nullable)
2. **storefronts** — `id` (serial PK), `storefront_id` (text nullable), `zone_id` (int FK→zones), `address` (text), `zip_code` (text nullable), `business_ids` (text nullable)
3. **businesses** — `id` (serial PK), `business_id` (text nullable), `storefront_id` (text nullable), `business_name` (text nullable), `type` (text nullable), `public_business` (text nullable), `notes` (text nullable), `initial_encounter_made` (text nullable)
4. **volunteers** — `id` (serial PK), `volunteer_link_id` (text nullable unique), `first_name` (text), `last_name` (text), `email` (text), `organization` (text nullable), `created_at` (timestamptz default now())
5. **canvassing_sessions** — `id` (serial PK), `volunteer_id` (int nullable), `selected_zones` (text nullable), `session_link_id` (text nullable), `completed` (bool default false), `start_time` (timestamptz nullable), `end_time` (timestamptz nullable), `total_duration_minutes` (int nullable), `created_at` (timestamptz default now())
6. **corrections** — `id` (serial PK), `storefront_id` (text nullable), `business_id` (text nullable), `session_link_id` (text nullable), `first_name` (text), `last_name` (text), `email` (text), `organization` (text nullable), `zone_id` (int nullable), `corrected_business_name` (text), `corrected_type` (text), `corrected_public_business` (text), `corrected_notes` (text)
7. **volunteer_sessions** — `id` (serial PK), `volunteer_link_id` (text nullable), `session_start_time` (timestamptz), `session_end_time` (timestamptz), `zone_id` (int nullable), `zone_name` (text), `businesses_verified` (int default 0), `corrections_made` (int default 0), `session_link_id` (text nullable)

RLS will be disabled for now since this is a public canvassing app without authentication.

### Step 3: Populate with Sample Data
Insert sample data via the insert tool:

- **3 zones**: e.g. "Chinatown Core", "Little Italy North", "Canal Street Corridor"
- **6 storefronts** (2 per zone) with addresses and business_ids references
- **12 businesses** (2 per storefront) with names, types, and public_business values

### Step 4: Update Supabase Client
The Lovable Cloud enablement will auto-generate `src/integrations/supabase/client.ts` with real credentials, replacing the placeholder.

### Technical Notes
- The existing `supabase-storage.ts` query code will work as-is once the real client and tables exist
- No code changes needed beyond the auto-generated Supabase client
- All tables use `serial` primary keys matching the `id: number` types in the codebase

