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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_announcements: {
        Row: {
          author_id: string
          body: string
          category: string
          created_at: string
          id: string
          title: string
        }
        Insert: { }
        Update: {
          author_id?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          last_message_at: string
          property_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          last_message_at?: string
          property_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          last_message_at?: string
          property_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_collections: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          collection_id: string | null
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "favorite_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_verifications: {
        Row: {
          admin_notes: string | null
          business_name: string | null
          created_at: string
          full_name: string
          id: string
          id_photo_url: string | null
          landlord_id: string
          national_id: string
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_name?: string | null
          created_at?: string
          full_name: string
          id?: string
          id_photo_url?: string | null
          landlord_id: string
          national_id: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_photo_url?: string | null
          landlord_id?: string
          national_id?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_verified: boolean
          national_id: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean
          national_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean
          national_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[]
          area_sqm: number | null
          average_rating: number
          bathrooms: number
          bedrooms: number
          county: string
          cover_image: string | null
          created_at: string
          description: string | null
          estate: string | null
          featured: boolean
          house_rules: string[]
          house_type: string
          id: string
          images: string[]
          landlord_id: string
          latitude: number | null
          longitude: number | null
          monthly_rent: number
          name: string
          nearby: Json
          reviews_count: number
          status: string
          updated_at: string
          views_count: number
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          area_sqm?: number | null
          average_rating?: number
          bathrooms?: number
          bedrooms?: number
          county: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          estate?: string | null
          featured?: boolean
          house_rules?: string[]
          house_type: string
          id?: string
          images?: string[]
          landlord_id: string
          latitude?: number | null
          longitude?: number | null
          monthly_rent: number
          name: string
          nearby?: Json
          reviews_count?: number
          status?: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          address?: string | null
          amenities?: string[]
          area_sqm?: number | null
          average_rating?: number
          bathrooms?: number
          bedrooms?: number
          county?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          estate?: string | null
          featured?: boolean
          house_rules?: string[]
          house_type?: string
          id?: string
          images?: string[]
          landlord_id?: string
          latitude?: number | null
          longitude?: number | null
          monthly_rent?: number
          name?: string
          nearby?: Json
          reviews_count?: number
          status?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      property_units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          id: string
          is_vacant: boolean
          label: string
          monthly_rent: number | null
          property_id: string
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          id?: string
          is_vacant?: boolean
          label: string
          monthly_rent?: number | null
          property_id: string
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          id?: string
          is_vacant?: boolean
          label?: string
          monthly_rent?: number | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          photos: string[]
          property_id: string
          rating: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          photos?: string[]
          property_id: string
          rating: number
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          photos?: string[]
          property_id?: string
          rating?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_preferences: {
        Row: {
          counties: string[]
          created_at: string
          estates: string[]
          furnished_preference: string | null
          has_pets: boolean
          house_types: string[]
          max_budget: number | null
          min_budget: number | null
          move_in_date: string | null
          needs_parking: boolean
          onboarding_completed: boolean
          onboarding_dismissed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          counties?: string[]
          created_at?: string
          estates?: string[]
          furnished_preference?: string | null
          has_pets?: boolean
          house_types?: string[]
          max_budget?: number | null
          min_budget?: number | null
          move_in_date?: string | null
          needs_parking?: boolean
          onboarding_completed?: boolean
          onboarding_dismissed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          counties?: string[]
          created_at?: string
          estates?: string[]
          furnished_preference?: string | null
          has_pets?: boolean
          house_types?: string[]
          max_budget?: number | null
          min_budget?: number | null
          move_in_date?: string | null
          needs_parking?: boolean
          onboarding_completed?: boolean
          onboarding_dismissed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          property_id: string
          scheduled_at: string
          status: string
          tenant_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          scheduled_at: string
          status?: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          scheduled_at?: string
          status?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "tenant" | "landlord" | "admin" | "verified_landlord"
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
    Enums: {
      app_role: ["tenant", "landlord", "admin", "verified_landlord"],
    },
  },
} as const
