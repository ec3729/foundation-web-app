import { supabase } from "@/integrations/supabase/client";
import type { Zone, Storefront, Business, Volunteer, CanvassingSession } from "./types";

// Helper to add camelCase aliases to a row
function addBusinessAliases(b: any): Business {
  return {
    ...b,
    businessId: b.business_id,
    storefrontId: b.storefront_id,
    businessName: b.business_name,
    publicBusiness: b.public_business,
    initialEncounterMade: b.initial_encounter_made,
  };
}

function addStorefrontAliases(s: any): Storefront {
  return {
    ...s,
    storefrontId: s.storefront_id,
    zoneId: s.zone_id,
    zipCode: s.zip_code,
    businessIds: s.business_ids,
  };
}

function addVolunteerAliases(v: any): Volunteer {
  return {
    ...v,
    volunteerLinkId: v.volunteer_link_id,
    firstName: v.first_name,
    lastName: v.last_name,
  };
}

function addSessionAliases(s: any): CanvassingSession {
  return {
    ...s,
    startTime: s.start_time,
    endTime: s.end_time,
    sessionLinkId: s.session_link_id,
  };
}

export async function getAllZones(): Promise<Zone[]> {
  const { data, error } = await supabase.from("zones").select("*").order("id");
  if (error) throw error;
  return (data || []).map(z => ({ ...z, estimatedTime: z.estimated_time }));
}

export async function getStorefrontsByZone(zoneId: number): Promise<Storefront[]> {
  const { data, error } = await supabase
    .from("storefronts")
    .select("*")
    .eq("zone_id", zoneId)
    .order("id");
  if (error) throw error;
  return (data || []).map(addStorefrontAliases);
}

export async function getBusinessesByStorefrontId(storefrontId: string | number): Promise<Business[]> {
  // storefrontId here is the internal DB id used in query keys
  // We need to find the storefront, get its business_ids, then fetch businesses
  const { data: storefront, error: sfError } = await supabase
    .from("storefronts")
    .select("*")
    .or(`id.eq.${storefrontId},storefront_id.eq.${storefrontId}`)
    .limit(1)
    .single();
  
  if (sfError || !storefront) return [];

  // Parse business_ids - could be JSON array or comma-separated
  let businessIdList: string[] = [];
  if (storefront.business_ids) {
    try {
      const parsed = JSON.parse(storefront.business_ids);
      businessIdList = Array.isArray(parsed) ? parsed : [storefront.business_ids];
    } catch {
      businessIdList = storefront.business_ids.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  if (businessIdList.length === 0) return [];

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .in("business_id", businessIdList);
  if (error) throw error;
  return (data || []).map(addBusinessAliases);
}

export async function createOrGetVolunteer(info: {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
}): Promise<Volunteer> {
  // Check if exists
  const { data: existing } = await supabase
    .from("volunteers")
    .select("*")
    .ilike("email", info.email)
    .limit(1);

  if (existing && existing.length > 0) {
    return addVolunteerAliases(existing[0]);
  }

  // Generate volunteer link id
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let linkId = "vol_";
  for (let i = 0; i < 16; i++) linkId += chars.charAt(Math.floor(Math.random() * chars.length));

  const { data, error } = await supabase
    .from("volunteers")
    .insert({
      first_name: info.firstName,
      last_name: info.lastName,
      email: info.email,
      organization: info.organization || null,
      volunteer_link_id: linkId,
    })
    .select()
    .single();

  if (error) throw error;
  return addVolunteerAliases(data);
}

export async function createCorrection(correctionData: {
  storefrontId: string | null;
  businessId: string | null;
  sessionLinkId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  zoneId: number | null;
  correctedBusinessName: string;
  correctedType: string;
  correctedPublicBusiness: string;
  correctedNotes: string;
}) {
  const { data, error } = await supabase
    .from("corrections")
    .insert({
      storefront_id: correctionData.storefrontId,
      business_id: correctionData.businessId,
      session_link_id: correctionData.sessionLinkId,
      first_name: correctionData.firstName,
      last_name: correctionData.lastName,
      email: correctionData.email,
      organization: correctionData.organization || null,
      zone_id: correctionData.zoneId,
      corrected_business_name: correctionData.correctedBusinessName,
      corrected_type: correctionData.correctedType,
      corrected_public_business: correctionData.correctedPublicBusiness,
      corrected_notes: correctionData.correctedNotes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createCanvassingSession(sessionData: {
  selectedZones: string;
  sessionLinkId: string;
  completed: boolean;
}): Promise<CanvassingSession> {
  const { data, error } = await supabase
    .from("canvassing_sessions")
    .insert({
      selected_zones: sessionData.selectedZones,
      session_link_id: sessionData.sessionLinkId,
      completed: sessionData.completed,
    })
    .select()
    .single();

  if (error) throw error;
  return addSessionAliases(data);
}

export async function updateCanvassingSessionStartTime(id: number, startTime: string) {
  const { data, error } = await supabase
    .from("canvassing_sessions")
    .update({ start_time: startTime })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return addSessionAliases(data);
}

export async function endCanvassingSession(id: number): Promise<CanvassingSession> {
  const endTime = new Date().toISOString();
  
  // Get session to calculate duration
  const { data: session } = await supabase
    .from("canvassing_sessions")
    .select("*")
    .eq("id", id)
    .single();

  let totalMinutes = 0;
  if (session?.start_time) {
    totalMinutes = Math.round(
      (new Date(endTime).getTime() - new Date(session.start_time).getTime()) / 60000
    );
  }

  const { data, error } = await supabase
    .from("canvassing_sessions")
    .update({
      end_time: endTime,
      completed: true,
      total_duration_minutes: totalMinutes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return addSessionAliases(data);
}

export async function createVolunteerSession(sessionData: {
  volunteerLinkId: string;
  sessionStartTime: string;
  sessionEndTime: string;
  zoneId: number | null;
  zoneName: string;
  businessesVerified: number;
  correctionsMade: number;
  sessionLinkId: string;
}) {
  const { data, error } = await supabase
    .from("volunteer_sessions")
    .insert({
      volunteer_link_id: sessionData.volunteerLinkId,
      session_start_time: sessionData.sessionStartTime,
      session_end_time: sessionData.sessionEndTime,
      zone_id: sessionData.zoneId,
      zone_name: sessionData.zoneName,
      businesses_verified: sessionData.businessesVerified,
      corrections_made: sessionData.correctionsMade,
      session_link_id: sessionData.sessionLinkId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
