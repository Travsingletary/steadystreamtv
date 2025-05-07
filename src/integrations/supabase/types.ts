export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: {
          country_id: number
          id: number
          name: string
        }
        Insert: {
          country_id: number
          id?: never
          name: string
        }
        Update: {
          country_id?: number
          id?: never
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: never
          name: string
        }
        Update: {
          code?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          expiry_date: string
          id: string
          name: string
          password: string
          plan: string
          reseller_id: string
          status: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          expiry_date: string
          id?: string
          name: string
          password: string
          plan: string
          reseller_id: string
          status: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          expiry_date?: string
          id?: string
          name?: string
          password?: string
          plan?: string
          reseller_id?: string
          status?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          genres: string[] | null
          id: string
          name: string | null
          preferred_device: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_end_date: string | null
          updated_at: string
          xtream_password: string | null
          xtream_username: string | null
        }
        Insert: {
          created_at?: string
          genres?: string[] | null
          id: string
          name?: string | null
          preferred_device?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
          xtream_password?: string | null
          xtream_username?: string | null
        }
        Update: {
          created_at?: string
          genres?: string[] | null
          id?: string
          name?: string | null
          preferred_device?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
          xtream_password?: string | null
          xtream_username?: string | null
        }
        Relationships: []
      }
      resellers: {
        Row: {
          api_key: string | null
          created_at: string
          credits: number
          id: string
          panel_url: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          credits?: number
          id?: string
          panel_url?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          credits?: number
          id?: string
          panel_url?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      Users: {
        Row: {
          created_at: string
          Email: string | null
          id: number
          "Subscription Status": boolean | null
          Username: string | null
        }
        Insert: {
          created_at?: string
          Email?: string | null
          id?: number
          "Subscription Status"?: boolean | null
          Username?: string | null
        }
        Update: {
          created_at?: string
          Email?: string | null
          id?: number
          "Subscription Status"?: boolean | null
          Username?: string | null
        }
        Relationships: []
      }
      users_log: {
        Row: {
          action: string
          changed_at: string
          id: number
          user_id: number
        }
        Insert: {
          action: string
          changed_at?: string
          id?: number
          user_id: number
        }
        Update: {
          action?: string
          changed_at?: string
          id?: number
          user_id?: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
