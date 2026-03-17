
CREATE TABLE public.zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  estimated_time INTEGER
);

CREATE TABLE public.storefronts (
  id SERIAL PRIMARY KEY,
  storefront_id TEXT,
  zone_id INTEGER REFERENCES public.zones(id),
  address TEXT NOT NULL,
  zip_code TEXT,
  business_ids TEXT
);

CREATE TABLE public.businesses (
  id SERIAL PRIMARY KEY,
  business_id TEXT,
  storefront_id TEXT,
  business_name TEXT,
  type TEXT,
  public_business TEXT,
  notes TEXT,
  initial_encounter_made TEXT
);

CREATE TABLE public.volunteers (
  id SERIAL PRIMARY KEY,
  volunteer_link_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.canvassing_sessions (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER,
  selected_zones TEXT,
  session_link_id TEXT,
  completed BOOLEAN DEFAULT false,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  total_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.corrections (
  id SERIAL PRIMARY KEY,
  storefront_id TEXT,
  business_id TEXT,
  session_link_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  zone_id INTEGER,
  corrected_business_name TEXT NOT NULL,
  corrected_type TEXT NOT NULL,
  corrected_public_business TEXT NOT NULL,
  corrected_notes TEXT NOT NULL
);

CREATE TABLE public.volunteer_sessions (
  id SERIAL PRIMARY KEY,
  volunteer_link_id TEXT,
  session_start_time TIMESTAMPTZ NOT NULL,
  session_end_time TIMESTAMPTZ NOT NULL,
  zone_id INTEGER,
  zone_name TEXT NOT NULL,
  businesses_verified INTEGER DEFAULT 0,
  corrections_made INTEGER DEFAULT 0,
  session_link_id TEXT
);

ALTER TABLE public.zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefronts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvassing_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_sessions DISABLE ROW LEVEL SECURITY;
