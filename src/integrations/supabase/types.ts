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
      admin_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      channels_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          epg_id: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number | null
          stream_url: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          epg_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number | null
          stream_url: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          epg_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number | null
          stream_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          plan_name: string
          session_id: string
          status: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          plan_name: string
          session_id: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          plan_name?: string
          session_id?: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
      device_pairings: {
        Row: {
          app_type: string | null
          created_at: string | null
          device_type: string
          expires_at: string
          id: string
          pairing_code: string
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          app_type?: string | null
          created_at?: string | null
          device_type: string
          expires_at: string
          id?: string
          pairing_code: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          app_type?: string | null
          created_at?: string | null
          device_type?: string
          expires_at?: string
          id?: string
          pairing_code?: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      iptv_accounts: {
        Row: {
          activation_code: string | null
          adult_content: boolean | null
          created_at: string
          dns_link: string | null
          enable_vpn: boolean | null
          expires_at: string | null
          forced_country: string | null
          id: string
          megaott_subscription_id: string | null
          megaott_user_id: string | null
          package_id: number | null
          password: string
          plan_type: string
          playlist_url: string | null
          server_url: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          activation_code?: string | null
          adult_content?: boolean | null
          created_at?: string
          dns_link?: string | null
          enable_vpn?: boolean | null
          expires_at?: string | null
          forced_country?: string | null
          id?: string
          megaott_subscription_id?: string | null
          megaott_user_id?: string | null
          package_id?: number | null
          password: string
          plan_type: string
          playlist_url?: string | null
          server_url?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          activation_code?: string | null
          adult_content?: boolean | null
          created_at?: string
          dns_link?: string | null
          enable_vpn?: boolean | null
          expires_at?: string | null
          forced_country?: string | null
          id?: string
          megaott_subscription_id?: string | null
          megaott_user_id?: string | null
          package_id?: number | null
          password?: string
          plan_type?: string
          playlist_url?: string | null
          server_url?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      megaott_credits: {
        Row: {
          amount: number
          created_at: string
          id: string
          last_updated: string
          reseller_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          last_updated?: string
          reseller_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          last_updated?: string
          reseller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "megaott_credits_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      megaott_diagnostics: {
        Row: {
          error_message: string | null
          executed_at: string
          id: string
          response_data: Json | null
          status: string
          test_type: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          id?: string
          response_data?: Json | null
          status: string
          test_type: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          id?: string
          response_data?: Json | null
          status?: string
          test_type?: string
        }
        Relationships: []
      }
      megaott_subscribers: {
        Row: {
          created_at: string
          expires_at: string | null
          external_id: string
          id: string
          last_synced: string
          max_connections: number | null
          password: string
          plan: string
          reseller_id: string | null
          status: string
          username: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          external_id: string
          id?: string
          last_synced?: string
          max_connections?: number | null
          password: string
          plan: string
          reseller_id?: string | null
          status?: string
          username: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          external_id?: string
          id?: string
          last_synced?: string
          max_connections?: number | null
          password?: string
          plan?: string
          reseller_id?: string | null
          status?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "megaott_subscribers_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      megaott_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          id: string
          megaott_subscription_id: string
          plan_name: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          id?: string
          megaott_subscription_id: string
          plan_name: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          id?: string
          megaott_subscription_id?: string
          plan_name?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      megaott_tokens: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          created_at: string
          duration_days: number
          expires_at: string | null
          id: string
          megaott_token_id: string | null
          package_type: string
          purchased_at: string
          status: string
          token_code: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          duration_days: number
          expires_at?: string | null
          id?: string
          megaott_token_id?: string | null
          package_type: string
          purchased_at?: string
          status?: string
          token_code: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          id?: string
          megaott_token_id?: string | null
          package_type?: string
          purchased_at?: string
          status?: string
          token_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      megaott_transactions: {
        Row: {
          created_at: string | null
          credits_used: number | null
          error_message: string | null
          error_type: string | null
          id: string
          megaott_response: Json | null
          plan: string
          request_payload: Json | null
          response_time_ms: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits_used?: number | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          megaott_response?: Json | null
          plan: string
          request_payload?: Json | null
          response_time_ms?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits_used?: number | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          megaott_response?: Json | null
          plan?: string
          request_payload?: Json | null
          response_time_ms?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      optimized_playlists: {
        Row: {
          content: string
          created_at: string
          id: string
          last_accessed: string | null
          original_url: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          last_accessed?: string | null
          original_url?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_accessed?: string | null
          original_url?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          megaott_token_id: string | null
          payment_method: string | null
          payment_status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          megaott_token_id?: string | null
          payment_method?: string | null
          payment_status?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          megaott_token_id?: string | null
          payment_method?: string | null
          payment_status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_megaott_token_id_fkey"
            columns: ["megaott_token_id"]
            isOneToOne: false
            referencedRelation: "megaott_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      playlist_access_logs: {
        Row: {
          accessed_at: string | null
          activation_code: string | null
          id: string
          ip_address: unknown | null
          playlist_url: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          activation_code?: string | null
          id?: string
          ip_address?: unknown | null
          playlist_url?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          activation_code?: string | null
          id?: string
          ip_address?: unknown | null
          playlist_url?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          genres: string[] | null
          id: string
          megaott_subscription_id: string | null
          name: string | null
          preferred_device: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_end_date: string | null
          updated_at: string
          xtream_password: string | null
          xtream_username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          genres?: string[] | null
          id: string
          megaott_subscription_id?: string | null
          name?: string | null
          preferred_device?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
          xtream_password?: string | null
          xtream_username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          genres?: string[] | null
          id?: string
          megaott_subscription_id?: string | null
          name?: string | null
          preferred_device?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
          xtream_password?: string | null
          xtream_username?: string | null
        }
        Relationships: []
      }
      purchase_automations: {
        Row: {
          automation_status: string
          created_at: string
          email_sent: boolean | null
          error_message: string | null
          id: string
          megaott_response: Json | null
          payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          automation_status?: string
          created_at?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          megaott_response?: Json | null
          payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          automation_status?: string
          created_at?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          megaott_response?: Json | null
          payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string | null
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
      roles: {
        Row: {
          id: string
          role_name: string
        }
        Insert: {
          id?: string
          role_name: string
        }
        Update: {
          id?: string
          role_name?: string
        }
        Relationships: []
      }
      steadystream_playlists: {
        Row: {
          activation_code: string
          created_at: string
          id: string
          is_active: boolean
          playlist_token: string
          playlist_url: string
          steadystream_user_id: string
          updated_at: string
        }
        Insert: {
          activation_code: string
          created_at?: string
          id?: string
          is_active?: boolean
          playlist_token: string
          playlist_url: string
          steadystream_user_id: string
          updated_at?: string
        }
        Update: {
          activation_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          playlist_token?: string
          playlist_url?: string
          steadystream_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "steadystream_playlists_steadystream_user_id_fkey"
            columns: ["steadystream_user_id"]
            isOneToOne: false
            referencedRelation: "steadystream_users"
            referencedColumns: ["id"]
          },
        ]
      }
      steadystream_users: {
        Row: {
          created_at: string
          email: string
          expiry_date: string
          full_name: string
          id: string
          is_active: boolean
          max_connections: number
          password: string
          subscription_plan: string
          subscription_status: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          expiry_date: string
          full_name: string
          id?: string
          is_active?: boolean
          max_connections?: number
          password: string
          subscription_plan?: string
          subscription_status?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          expiry_date?: string
          full_name?: string
          id?: string
          is_active?: boolean
          max_connections?: number
          password?: string
          subscription_plan?: string
          subscription_status?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          amount: number
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_name: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_name: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_name?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          end_date: string
          id: number
          plan: string
          start_date: string
          user_id: string | null
        }
        Insert: {
          end_date: string
          id?: never
          plan: string
          start_date: string
          user_id?: string | null
        }
        Update: {
          end_date?: string
          id?: never
          plan?: string
          start_date?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      token_retry_queue: {
        Row: {
          activation_code: string
          completed_at: string | null
          created_at: string | null
          failed_at: string | null
          id: string
          last_error: string | null
          max_retries: number | null
          next_retry_at: string | null
          plan: string
          retry_count: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          activation_code: string
          completed_at?: string | null
          created_at?: string | null
          failed_at?: string | null
          id?: string
          last_error?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          plan: string
          retry_count?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          activation_code?: string
          completed_at?: string | null
          created_at?: string | null
          failed_at?: string | null
          id?: string
          last_error?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          plan?: string
          retry_count?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_active: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_active?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_active?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_playlists: {
        Row: {
          activation_code: string
          created_at: string | null
          id: number
          is_active: boolean | null
          playlist_token: string
          user_id: string
        }
        Insert: {
          activation_code: string
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          playlist_token: string
          user_id: string
        }
        Update: {
          activation_code?: string
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          playlist_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_active_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          blocked_categories: string[] | null
          created_at: string
          device_type: string | null
          favorite_categories: string[] | null
          id: string
          preferred_quality: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_categories?: string[] | null
          created_at?: string
          device_type?: string | null
          favorite_categories?: string[] | null
          id?: string
          preferred_quality?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_categories?: string[] | null
          created_at?: string
          device_type?: string | null
          favorite_categories?: string[] | null
          id?: string
          preferred_quality?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences_enhanced: {
        Row: {
          blocked_categories: string[] | null
          created_at: string | null
          favorite_categories: string[] | null
          id: string
          language_preference: string | null
          parental_controls: boolean | null
          preferred_quality: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blocked_categories?: string[] | null
          created_at?: string | null
          favorite_categories?: string[] | null
          id?: string
          language_preference?: string | null
          parental_controls?: boolean | null
          preferred_quality?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blocked_categories?: string[] | null
          created_at?: string | null
          favorite_categories?: string[] | null
          id?: string
          language_preference?: string | null
          parental_controls?: boolean | null
          preferred_quality?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activation_code: string | null
          created_at: string | null
          current_subscription_id: string | null
          email: string
          error_type: string | null
          full_name: string
          id: string
          iptv_credentials: Json | null
          megaott_error: string | null
          onboarding_completed: boolean | null
          password: string | null
          playlist_url: string | null
          status: string | null
          stream_url: string | null
          subscription_active: boolean | null
          subscription_expires: string | null
          subscription_plan: string | null
          supabase_user_id: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          activation_code?: string | null
          created_at?: string | null
          current_subscription_id?: string | null
          email: string
          error_type?: string | null
          full_name: string
          id?: string
          iptv_credentials?: Json | null
          megaott_error?: string | null
          onboarding_completed?: boolean | null
          password?: string | null
          playlist_url?: string | null
          status?: string | null
          stream_url?: string | null
          subscription_active?: boolean | null
          subscription_expires?: string | null
          subscription_plan?: string | null
          supabase_user_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          activation_code?: string | null
          created_at?: string | null
          current_subscription_id?: string | null
          email?: string
          error_type?: string | null
          full_name?: string
          id?: string
          iptv_credentials?: Json | null
          megaott_error?: string | null
          onboarding_completed?: boolean | null
          password?: string | null
          playlist_url?: string | null
          status?: string | null
          stream_url?: string | null
          subscription_active?: boolean | null
          subscription_expires?: string | null
          subscription_plan?: string | null
          supabase_user_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_current_subscription_id_fkey"
            columns: ["current_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles_new: {
        Row: {
          created_at: string | null
          device_type: string | null
          email: string
          full_name: string
          id: string
          onboarding_completed: boolean | null
          subscription_plan: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          email: string
          full_name: string
          id: string
          onboarding_completed?: boolean | null
          subscription_plan?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          email?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean | null
          subscription_plan?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_active_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_status: string
          created_at: string
          end_date: string
          id: string
          plan_type: string
          start_date: string
          stripe_subscription_id: string | null
          updated_at: string
          user_profile_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          billing_status?: string
          created_at?: string
          end_date: string
          id?: string
          plan_type: string
          start_date?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_profile_id: string
        }
        Update: {
          auto_renew?: boolean | null
          billing_status?: string
          created_at?: string
          end_date?: string
          id?: string
          plan_type?: string
          start_date?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "users_with_active_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions_new: {
        Row: {
          created_at: string | null
          device_limit: number
          devices_connected: number | null
          expires_at: string | null
          id: string
          password: string | null
          plan: string
          playlist_url: string | null
          server_url: string | null
          status: string
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          device_limit?: number
          devices_connected?: number | null
          expires_at?: string | null
          id?: string
          password?: string | null
          plan: string
          playlist_url?: string | null
          server_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          device_limit?: number
          devices_connected?: number | null
          expires_at?: string | null
          id?: string
          password?: string | null
          plan?: string
          playlist_url?: string | null
          server_url?: string | null
          status?: string
          updated_at?: string | null
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
      viewing_analytics: {
        Row: {
          category: string | null
          channel_id: string | null
          channel_name: string | null
          duration_seconds: number | null
          id: string
          user_id: string
          watched_at: string | null
        }
        Insert: {
          category?: string | null
          channel_id?: string | null
          channel_name?: string | null
          duration_seconds?: number | null
          id?: string
          user_id: string
          watched_at?: string | null
        }
        Update: {
          category?: string | null
          channel_id?: string | null
          channel_name?: string | null
          duration_seconds?: number | null
          id?: string
          user_id?: string
          watched_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      users_with_active_subscriptions: {
        Row: {
          activation_code: string | null
          active_plan: string | null
          auto_renew: boolean | null
          billing_status: string | null
          created_at: string | null
          current_subscription_id: string | null
          email: string | null
          error_type: string | null
          full_name: string | null
          id: string | null
          iptv_credentials: Json | null
          megaott_error: string | null
          onboarding_completed: boolean | null
          password: string | null
          playlist_url: string | null
          status: string | null
          stream_url: string | null
          subscription_active: boolean | null
          subscription_end_date: string | null
          subscription_expires: string | null
          subscription_plan: string | null
          supabase_user_id: string | null
          updated_at: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_current_subscription_id_fkey"
            columns: ["current_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_admin_role: {
        Args: { user_id: string }
        Returns: boolean
      }
      create_megaott_subscription_v2: {
        Args: {
          user_id_param: string
          customer_email: string
          customer_name: string
          plan_type: string
          stripe_session_id?: string
        }
        Returns: Json
      }
      expire_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_m3u_playlist: {
        Args: { input_token: string }
        Returns: string
      }
      get_user_playlist: {
        Args: Record<PropertyKey, never> | { playlist_token: string }
        Returns: string
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
