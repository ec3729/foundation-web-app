export interface Zone {
  id: number;
  name: string;
  description: string | null;
  estimated_time: number | null;
  // Aliases for camelCase compatibility
  estimatedTime?: number | null;
}

export interface Storefront {
  id: number;
  storefront_id: string | null;
  zone_id: number | null;
  address: string;
  zip_code: string | null;
  business_ids: string | null;
  // Aliases
  storefrontId?: string | null;
  zoneId?: number | null;
  zipCode?: string | null;
  businessIds?: string | null;
}

export interface Business {
  id: number;
  business_id: string | null;
  storefront_id: string | null;
  business_name: string | null;
  type: string | null;
  public_business: string | null;
  notes: string | null;
  initial_encounter_made: string | null;
  // Aliases
  businessId?: string | null;
  storefrontId?: string | null;
  businessName?: string | null;
  publicBusiness?: string | null;
  initialEncounterMade?: string | null;
}

export interface StorefrontWithBusinesses extends Storefront {
  businesses?: Business[];
}

export interface Volunteer {
  id: number;
  volunteer_link_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  organization: string | null;
  created_at: string | null;
  // Aliases
  volunteerLinkId?: string | null;
  firstName?: string;
  lastName?: string;
}

export interface CanvassingSession {
  id: number;
  volunteer_id: number | null;
  selected_zones: string | null;
  session_link_id: string | null;
  completed: boolean | null;
  start_time: string | null;
  end_time: string | null;
  total_duration_minutes: number | null;
  created_at: string | null;
  // Aliases
  startTime?: string | null;
  endTime?: string | null;
  sessionLinkId?: string | null;
}
