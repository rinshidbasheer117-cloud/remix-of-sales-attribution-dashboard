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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bike_events: {
        Row: {
          actor_id: string
          bike_id: string
          created_at: string
          detail: string
          happened_on: string
          id: string
          stage: string
        }
        Insert: {
          actor_id: string
          bike_id: string
          created_at?: string
          detail?: string
          happened_on: string
          id?: string
          stage: string
        }
        Update: {
          actor_id?: string
          bike_id?: string
          created_at?: string
          detail?: string
          happened_on?: string
          id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "bike_events_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "bikes"
            referencedColumns: ["id"]
          },
        ]
      }
      bikes: {
        Row: {
          appointment_by: string | null
          asking_price: number | null
          brand: string
          created_at: string
          created_by: string
          id: string
          inspected_by: string | null
          inspection_date: string | null
          intake_photo: string | null
          listing_date: string | null
          listing_photo: string | null
          listing_url: string
          model: string
          notes: string
          procured_by: string
          purchase_cost: number
          purchase_date: string
          refurb_cost: number
          sale_price: number | null
          serial_number: string
          service_date: string | null
          serviced_by: string | null
          sku: string
          sold_by: string | null
          sold_date: string | null
          sourcing_assistant: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_by?: string | null
          asking_price?: number | null
          brand: string
          created_at?: string
          created_by: string
          id?: string
          inspected_by?: string | null
          inspection_date?: string | null
          intake_photo?: string | null
          listing_date?: string | null
          listing_photo?: string | null
          listing_url?: string
          model: string
          notes?: string
          procured_by: string
          purchase_cost?: number
          purchase_date: string
          refurb_cost?: number
          sale_price?: number | null
          serial_number?: string
          service_date?: string | null
          serviced_by?: string | null
          sku: string
          sold_by?: string | null
          sold_date?: string | null
          sourcing_assistant?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_by?: string | null
          asking_price?: number | null
          brand?: string
          created_at?: string
          created_by?: string
          id?: string
          inspected_by?: string | null
          inspection_date?: string | null
          intake_photo?: string | null
          listing_date?: string | null
          listing_photo?: string | null
          listing_url?: string
          model?: string
          notes?: string
          procured_by?: string
          purchase_cost?: number
          purchase_date?: string
          refurb_cost?: number
          sale_price?: number | null
          serial_number?: string
          service_date?: string | null
          serviced_by?: string | null
          sku?: string
          sold_by?: string | null
          sold_date?: string | null
          sourcing_assistant?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bikes_appointment_by_fkey"
            columns: ["appointment_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikes_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikes_procured_by_fkey"
            columns: ["procured_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikes_serviced_by_fkey"
            columns: ["serviced_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikes_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bikes_sourcing_assistant_fkey"
            columns: ["sourcing_assistant"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          allocation_role: string
          amount: number
          bike_id: string
          created_at: string
          employee_id: string
          id: string
          profit: number
          stock_days: number
          zone: string
        }
        Insert: {
          allocation_role: string
          amount: number
          bike_id: string
          created_at?: string
          employee_id: string
          id?: string
          profit: number
          stock_days: number
          zone: string
        }
        Update: {
          allocation_role?: string
          amount?: number
          bike_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          profit?: number
          stock_days?: number
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "bikes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_pins: {
        Row: {
          employee_id: string
          failed_attempts: number
          locked_until: string | null
          pin_hash: string
        }
        Insert: {
          employee_id: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash: string
        }
        Update: {
          employee_id?: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_pins_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          commission_eligible: boolean
          id: string
          job_title: string
          name: string
        }
        Insert: {
          active?: boolean
          commission_eligible?: boolean
          id?: string
          job_title: string
          name: string
        }
        Update: {
          active?: boolean
          commission_eligible?: boolean
          id?: string
          job_title?: string
          name?: string
        }
        Relationships: []
      }
      portal_sessions: {
        Row: {
          employee_id: string
          expires_at: string
          token_hash: string
          user_id: string
        }
        Insert: {
          employee_id: string
          expires_at: string
          token_hash: string
          user_id: string
        }
        Update: {
          employee_id?: string
          expires_at?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          display_name: string
          employee_id: string | null
          id: string
        }
        Insert: {
          display_name?: string
          employee_id?: string | null
          id: string
        }
        Update: {
          display_name?: string
          employee_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_bike: {
        Args: {
          bike: string
          expected_status: string
          historical?: boolean
          payload: Json
        }
        Returns: undefined
      }
      assign_account: {
        Args: {
          access_role: Database["public"]["Enums"]["app_role"]
          account: string
          employee: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      intake_bike: {
        Args: { historical?: boolean; payload: Json }
        Returns: string
      }
      is_operator: { Args: never; Returns: boolean }
      my_portal: { Args: { token: string }; Returns: Json }
      set_my_pin: { Args: { pin: string }; Returns: undefined }
      unlock_portal: { Args: { pin: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "operations" | "employee"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "operations", "employee"],
    },
  },
} as const
