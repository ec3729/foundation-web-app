export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          business_id: string | null
          business_name: string | null
          id: number
          initial_encounter_made: string | null
          notes: string | null
          public_business: string | null
          storefront_id: string | null
          type: string | null
        }
        Insert: {
          business_id?: string | null
          business_name?: string | null
          id?: number
          initial_encounter_made?: string | null
          notes?: string | null
          public_business?: string | null
          storefront_id?: string | null
          type?: string | null
        }
        Update: {
          business_id?: string | null
          business_name?: string | null
          id?: number
          initial_encounter_made?: string | null
          notes?: string | null
          public_business?: string | null
          storefront_id?: string | null
          type?: string | null
        }
        Relationships: []
      }
      canvassing_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          end_time: string | null
          id: number
          selected_zones: string | null
          session_link_id: string | null
          start_time: string | null
          total_duration_minutes: number | null
          volunteer_id: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          end_time?: string | null
          id?: number
          selected_zones?: string | null
          session_link_id?: string | null
          start_time?: string | null
          total_duration_minutes?: number | null
          volunteer_id?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          end_time?: string | null
          id?: number
          selected_zones?: string | null
          session_link_id?: string | null
          start_time?: string | null
          total_duration_minutes?: number | null
          volunteer_id?: number | null
        }
        Relationships: []
      }
      corrections: {
        Row: {
          business_id: string | null
          corrected_business_name: string
          corrected_notes: string
          corrected_public_business: string
          corrected_type: string
          email: string
          first_name: string
          id: number
          last_name: string
          organization: string | null
          session_link_id: string | null
          storefront_id: string | null
          zone_id: number | null
        }
        Insert: {
          business_id?: string | null
          corrected_business_name: string
          corrected_notes: string
          corrected_public_business: string
          corrected_type: string
          email: string
          first_name: string
          id?: number
          last_name: string
          organization?: string | null
          session_link_id?: string | null
          storefront_id?: string | null
          zone_id?: number | null
        }
        Update: {
          business_id?: string | null
          corrected_business_name?: string
          corrected_notes?: string
          corrected_public_business?: string
          corrected_type?: string
          email?: string
          first_name?: string
          id?: number
          last_name?: string
          organization?: string | null
          session_link_id?: string | null
          storefront_id?: string | null
          zone_id?: number | null
        }
        Relationships: []
      }
      storefronts: {
        Row: {
          address: string
          business_ids: string | null
          id: number
          storefront_id: string | null
          zip_code: string | null
          zone_id: number | null
        }
        Insert: {
          address: string
          business_ids?: string | null
          id?: number
          storefront_id?: string | null
          zip_code?: string | null
          zone_id?: number | null
        }
        Update: {
          address?: string
          business_ids?: string | null
          id?: number
          storefront_id?: string | null
          zip_code?: string | null
          zone_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "storefronts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_sessions: {
        Row: {
          businesses_verified: number | null
          corrections_made: number | null
          id: number
          session_end_time: string
          session_link_id: string | null
          session_start_time: string
          volunteer_link_id: string | null
          zone_id: number | null
          zone_name: string
        }
        Insert: {
          businesses_verified?: number | null
          corrections_made?: number | null
          id?: number
          session_end_time: string
          session_link_id?: string | null
          session_start_time: string
          volunteer_link_id?: string | null
          zone_id?: number | null
          zone_name: string
        }
        Update: {
          businesses_verified?: number | null
          corrections_made?: number | null
          id?: number
          session_end_time?: string
          session_link_id?: string | null
          session_start_time?: string
          volunteer_link_id?: string | null
          zone_id?: number | null
          zone_name?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: number
          last_name: string
          organization: string | null
          volunteer_link_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: number
          last_name: string
          organization?: string | null
          volunteer_link_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: number
          last_name?: string
          organization?: string | null
          volunteer_link_id?: string | null
        }
        Relationships: []
      }
      zones: {
        Row: {
          description: string | null
          estimated_time: number | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          estimated_time?: number | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          estimated_time?: number | null
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
