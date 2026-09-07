export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: number
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          agreed_total: number
          carrier_id: string
          created_at: string
          customer_id: string
          id: string
          move_id: string
          quote_id: string
          scheduled_pickup_date: string | null
          status: Database["public"]["Enums"]["booking_status"]
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          updated_at: string
        }
        Insert: {
          agreed_total: number
          carrier_id: string
          created_at?: string
          customer_id: string
          id?: string
          move_id: string
          quote_id: string
          scheduled_pickup_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string
        }
        Update: {
          agreed_total?: number
          carrier_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          move_id?: string
          quote_id?: string
          scheduled_pickup_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_availability: {
        Row: {
          available_on: string
          capacity_cubic_feet: number
          carrier_id: string
          created_at: string
          id: string
          is_available: boolean
        }
        Insert: {
          available_on: string
          capacity_cubic_feet?: number
          carrier_id: string
          created_at?: string
          id?: string
          is_available?: boolean
        }
        Update: {
          available_on?: string
          capacity_cubic_feet?: number
          carrier_id?: string
          created_at?: string
          id?: string
          is_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "carrier_availability_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_service_areas: {
        Row: {
          carrier_id: string
          center_zip: string
          created_at: string
          id: string
          label: string | null
          radius_miles: number
        }
        Insert: {
          carrier_id: string
          center_zip: string
          created_at?: string
          id?: string
          label?: string | null
          radius_miles?: number
        }
        Update: {
          carrier_id?: string
          center_zip?: string
          created_at?: string
          id?: string
          label?: string | null
          radius_miles?: number
        }
        Relationships: [
          {
            foreignKeyName: "carrier_service_areas_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          cal_t_number: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description_en: string | null
          description_es: string | null
          dot_number: string | null
          id: string
          insurance_expires_on: string | null
          mc_number: string | null
          owner_id: string | null
          price_multiplier: number
          status: Database["public"]["Enums"]["carrier_status"]
          updated_at: string
        }
        Insert: {
          cal_t_number?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description_en?: string | null
          description_es?: string | null
          dot_number?: string | null
          id?: string
          insurance_expires_on?: string | null
          mc_number?: string | null
          owner_id?: string | null
          price_multiplier?: number
          status?: Database["public"]["Enums"]["carrier_status"]
          updated_at?: string
        }
        Update: {
          cal_t_number?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description_en?: string | null
          description_es?: string | null
          dot_number?: string | null
          id?: string
          insurance_expires_on?: string | null
          mc_number?: string | null
          owner_id?: string | null
          price_multiplier?: number
          status?: Database["public"]["Enums"]["carrier_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carriers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          category: string
          created_at: string
          cubic_feet: number
          id: string
          is_active: boolean
          is_placeholder: boolean
          name_en: string
          name_es: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          cubic_feet: number
          id?: string
          is_active?: boolean
          is_placeholder?: boolean
          name_en: string
          name_es: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          cubic_feet?: number
          id?: string
          is_active?: boolean
          is_placeholder?: boolean
          name_en?: string
          name_es?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      move_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string
          cubic_feet_each: number
          custom_name: string | null
          id: string
          move_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string
          cubic_feet_each: number
          custom_name?: string | null
          id?: string
          move_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string
          cubic_feet_each?: number
          custom_name?: string | null
          id?: string
          move_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_items_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
        ]
      }
      move_photos: {
        Row: {
          created_at: string
          id: string
          move_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          move_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          move_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "move_photos_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moves: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          customer_id: string
          destination_access: Database["public"]["Enums"]["access_type"]
          destination_city: string | null
          destination_floor: number
          destination_line1: string | null
          destination_line2: string | null
          destination_long_carry: boolean
          destination_state: string | null
          destination_zip: string | null
          distance_miles: number | null
          id: string
          move_date: string | null
          move_date_flexible: boolean
          notes: string | null
          origin_access: Database["public"]["Enums"]["access_type"]
          origin_city: string | null
          origin_floor: number
          origin_line1: string | null
          origin_line2: string | null
          origin_long_carry: boolean
          origin_state: string | null
          origin_zip: string | null
          status: Database["public"]["Enums"]["move_status"]
          total_cubic_feet: number
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id: string
          destination_access?: Database["public"]["Enums"]["access_type"]
          destination_city?: string | null
          destination_floor?: number
          destination_line1?: string | null
          destination_line2?: string | null
          destination_long_carry?: boolean
          destination_state?: string | null
          destination_zip?: string | null
          distance_miles?: number | null
          id?: string
          move_date?: string | null
          move_date_flexible?: boolean
          notes?: string | null
          origin_access?: Database["public"]["Enums"]["access_type"]
          origin_city?: string | null
          origin_floor?: number
          origin_line1?: string | null
          origin_line2?: string | null
          origin_long_carry?: boolean
          origin_state?: string | null
          origin_zip?: string | null
          status?: Database["public"]["Enums"]["move_status"]
          total_cubic_feet?: number
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string
          destination_access?: Database["public"]["Enums"]["access_type"]
          destination_city?: string | null
          destination_floor?: number
          destination_line1?: string | null
          destination_line2?: string | null
          destination_long_carry?: boolean
          destination_state?: string | null
          destination_zip?: string | null
          distance_miles?: number | null
          id?: string
          move_date?: string | null
          move_date_flexible?: boolean
          notes?: string | null
          origin_access?: Database["public"]["Enums"]["access_type"]
          origin_city?: string | null
          origin_floor?: number
          origin_line1?: string | null
          origin_line2?: string | null
          origin_long_carry?: boolean
          origin_state?: string | null
          origin_zip?: string | null
          status?: Database["public"]["Enums"]["move_status"]
          total_cubic_feet?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moves_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          charged_at: string | null
          created_at: string
          failure_reason: string | null
          id: string
          stage: Database["public"]["Enums"]["payment_stage"]
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          charged_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          stage: Database["public"]["Enums"]["payment_stage"]
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          charged_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          stage?: Database["public"]["Enums"]["payment_stage"]
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          base_rate: number
          cubic_feet_to_pounds_factor: number
          delivery_pct: number
          deposit_pct: number
          id: boolean
          included_miles: number
          is_placeholder: boolean
          long_carry_fee: number
          minimum_charge: number
          packing_fee_per_cubic_foot: number
          platform_commission_pct: number
          pre_move_pct: number
          quote_valid_days: number
          rate_per_cubic_foot: number
          rate_per_mile: number
          stairs_fee_per_flight: number
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          base_rate: number
          cubic_feet_to_pounds_factor: number
          delivery_pct: number
          deposit_pct: number
          id?: boolean
          included_miles?: number
          is_placeholder?: boolean
          long_carry_fee?: number
          minimum_charge: number
          packing_fee_per_cubic_foot?: number
          platform_commission_pct?: number
          pre_move_pct: number
          quote_valid_days?: number
          rate_per_cubic_foot: number
          rate_per_mile?: number
          stairs_fee_per_flight?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          base_rate?: number
          cubic_feet_to_pounds_factor?: number
          delivery_pct?: number
          deposit_pct?: number
          id?: boolean
          included_miles?: number
          is_placeholder?: boolean
          long_carry_fee?: number
          minimum_charge?: number
          packing_fee_per_cubic_foot?: number
          platform_commission_pct?: number
          pre_move_pct?: number
          quote_valid_days?: number
          rate_per_cubic_foot?: number
          rate_per_mile?: number
          stairs_fee_per_flight?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_locale: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accessorials_total: number
          breakdown: Json
          carrier_id: string
          created_at: string
          estimated_weight_lbs: number
          id: string
          move_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          pricing_config_version: number
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          total: number
          total_cubic_feet: number
          valid_until: string
        }
        Insert: {
          accessorials_total?: number
          breakdown?: Json
          carrier_id: string
          created_at?: string
          estimated_weight_lbs: number
          id?: string
          move_id: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          pricing_config_version: number
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          total: number
          total_cubic_feet: number
          valid_until: string
        }
        Update: {
          accessorials_total?: number
          breakdown?: Json
          carrier_id?: string
          created_at?: string
          estimated_weight_lbs?: number
          id?: string
          move_id?: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          pricing_config_version?: number
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          total?: number
          total_cubic_feet?: number
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "moves"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_move: { Args: { target_move: string }; Returns: boolean }
      can_write_move: { Args: { target_move: string }; Returns: boolean }
      carrier_can_see_move: { Args: { target_move: string }; Returns: boolean }
      current_carrier_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      access_type: "ground_floor" | "elevator" | "stairs"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      carrier_status: "pending" | "active" | "inactive"
      move_status:
        | "draft"
        | "quoted"
        | "booked"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_stage: "deposit" | "pre_move" | "delivery"
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
      quote_status: "active" | "expired" | "accepted" | "superseded"
      user_role: "customer" | "carrier" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_type: ["ground_floor", "elevator", "stairs"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      carrier_status: ["pending", "active", "inactive"],
      move_status: [
        "draft",
        "quoted",
        "booked",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_stage: ["deposit", "pre_move", "delivery"],
      payment_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "refunded",
      ],
      quote_status: ["active", "expired", "accepted", "superseded"],
      user_role: ["customer", "carrier", "admin"],
    },
  },
} as const

