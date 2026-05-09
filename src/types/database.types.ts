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
      orders: {
        Row: {
          address: Json | null
          cpf: string | null
          created_at: string | null
          customer_name: string
          customization_total: number
          delivery_type: string | null
          email: string
          id: string
          items: Json
          mercado_pago_id: string | null
          mercado_pago_status: string | null
          payment_method: string | null
          payment_status: string | null
          phone: string | null
          production_days: number | null
          shipping: number
          status: string | null
          subtotal: number
          total: number
          tracking_code: string | null
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          cpf?: string | null
          created_at?: string | null
          customer_name: string
          customization_total?: number
          delivery_type?: string | null
          email: string
          id?: string
          items?: Json
          mercado_pago_id?: string | null
          mercado_pago_status?: string | null
          payment_method?: string | null
          payment_status?: string | null
          phone?: string | null
          production_days?: number | null
          shipping?: number
          status?: string | null
          subtotal?: number
          total?: number
          tracking_code?: string | null
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          cpf?: string | null
          created_at?: string | null
          customer_name?: string
          customization_total?: number
          delivery_type?: string | null
          email?: string
          id?: string
          items?: Json
          mercado_pago_id?: string | null
          mercado_pago_status?: string | null
          payment_method?: string | null
          payment_status?: string | null
          phone?: string | null
          production_days?: number | null
          shipping?: number
          status?: string | null
          subtotal?: number
          total?: number
          tracking_code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          mercado_pago_response: Json | null
          order_id: string | null
          payment_id: string | null
          payment_method: string | null
          qr_code: string | null
          qr_code_base64: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          mercado_pago_response?: Json | null
          order_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          mercado_pago_response?: Json | null
          order_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          available: boolean | null
          color: string | null
          gallery: Json | null
          id: string
          image: string | null
          price: number | null
          product_id: string | null
          size: string | null
          stock: number | null
          video_url: string | null
        }
        Insert: {
          available?: boolean | null
          color?: string | null
          gallery?: Json | null
          id?: string
          image?: string | null
          price?: number | null
          product_id?: string | null
          size?: string | null
          stock?: number | null
          video_url?: string | null
        }
        Update: {
          available?: boolean | null
          color?: string | null
          gallery?: Json | null
          id?: string
          image?: string | null
          price?: number | null
          product_id?: string | null
          size?: string | null
          stock?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string | null
          customizable: boolean | null
          customizable_required: boolean | null
          customization_label: string | null
          customization_max_chars: number | null
          customization_price: number | null
          description: string | null
          extra_personalization_days: number | null
          featured: boolean | null
          gallery: Json | null
          height: number | null
          id: string
          image: string | null
          length: number | null
          max_characters: number | null
          name: string
          personalization_label: string | null
          price: number
          principal_home: boolean | null
          production_days: number | null
          slug: string
          stock: number | null
          video_url: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          customizable?: boolean | null
          customizable_required?: boolean | null
          customization_label?: string | null
          customization_max_chars?: number | null
          customization_price?: number | null
          description?: string | null
          extra_personalization_days?: number | null
          featured?: boolean | null
          gallery?: Json | null
          height?: number | null
          id?: string
          image?: string | null
          length?: number | null
          max_characters?: number | null
          name: string
          personalization_label?: string | null
          price?: number
          principal_home?: boolean | null
          production_days?: number | null
          slug: string
          stock?: number | null
          video_url?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          customizable?: boolean | null
          customizable_required?: boolean | null
          customization_label?: string | null
          customization_max_chars?: number | null
          customization_price?: number | null
          description?: string | null
          extra_personalization_days?: number | null
          featured?: boolean | null
          gallery?: Json | null
          height?: number | null
          id?: string
          image?: string | null
          length?: number | null
          max_characters?: number | null
          name?: string
          personalization_label?: string | null
          price?: number
          principal_home?: boolean | null
          production_days?: number | null
          slug?: string
          stock?: number | null
          video_url?: string | null
          weight?: number | null
          width?: number | null
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
