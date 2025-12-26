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
      // Tenants table
      tenants: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          accent_color: string | null
          currency: string
          tax_rate: number
          service_charge_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ar?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          accent_color?: string | null
          currency?: string
          tax_rate?: number
          service_charge_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_ar?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          accent_color?: string | null
          currency?: string
          tax_rate?: number
          service_charge_rate?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Branches table
      branches: {
        Row: {
          id: string
          tenant_id: string
          name: string
          name_ar: string | null
          address: string
          address_ar: string | null
          phone: string | null
          email: string | null
          is_active: boolean
          is_open: boolean
          opening_hours: Json | null
          latitude: number | null
          longitude: number | null
          delivery_fee: number
          min_order_amount: number
          delivery_zones: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          name_ar?: string | null
          address: string
          address_ar?: string | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          is_open?: boolean
          opening_hours?: Json | null
          latitude?: number | null
          longitude?: number | null
          delivery_fee?: number
          min_order_amount?: number
          delivery_zones?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          name_ar?: string | null
          address?: string
          address_ar?: string | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          is_open?: boolean
          opening_hours?: Json | null
          latitude?: number | null
          longitude?: number | null
          delivery_fee?: number
          min_order_amount?: number
          delivery_zones?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Categories table
      categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          name_ar: string | null
          description: string | null
          description_ar: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          name_ar?: string | null
          description?: string | null
          description_ar?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          name_ar?: string | null
          description?: string | null
          description_ar?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Menu Items table
      menu_items: {
        Row: {
          id: string
          tenant_id: string
          category_id: string
          name: string
          name_ar: string | null
          description: string | null
          description_ar: string | null
          price: number
          image_url: string | null
          is_available: boolean
          is_popular: boolean
          calories: number | null
          prep_time_minutes: number | null
          allergens: string[] | null
          dietary_tags: string[] | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          category_id: string
          name: string
          name_ar?: string | null
          description?: string | null
          description_ar?: string | null
          price: number
          image_url?: string | null
          is_available?: boolean
          is_popular?: boolean
          calories?: number | null
          prep_time_minutes?: number | null
          allergens?: string[] | null
          dietary_tags?: string[] | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          category_id?: string
          name?: string
          name_ar?: string | null
          description?: string | null
          description_ar?: string | null
          price?: number
          image_url?: string | null
          is_available?: boolean
          is_popular?: boolean
          calories?: number | null
          prep_time_minutes?: number | null
          allergens?: string[] | null
          dietary_tags?: string[] | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Modifier Groups table
      modifier_groups: {
        Row: {
          id: string
          tenant_id: string
          name: string
          name_ar: string | null
          description: string | null
          is_required: boolean
          min_selections: number
          max_selections: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          name_ar?: string | null
          description?: string | null
          is_required?: boolean
          min_selections?: number
          max_selections?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          name_ar?: string | null
          description?: string | null
          is_required?: boolean
          min_selections?: number
          max_selections?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Modifiers table
      modifiers: {
        Row: {
          id: string
          group_id: string
          name: string
          name_ar: string | null
          price: number
          is_available: boolean
          is_default: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          name_ar?: string | null
          price?: number
          is_available?: boolean
          is_default?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          name_ar?: string | null
          price?: number
          is_available?: boolean
          is_default?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Item Modifier Groups (linking table)
      item_modifier_groups: {
        Row: {
          id: string
          item_id: string
          group_id: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          group_id: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          group_id?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }

      // Customers table
      customers: {
        Row: {
          id: string
          firebase_uid: string
          email: string
          name: string | null
          phone: string | null
          loyalty_points: number
          loyalty_tier: string
          total_orders: number
          total_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firebase_uid: string
          email: string
          name?: string | null
          phone?: string | null
          loyalty_points?: number
          loyalty_tier?: string
          total_orders?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firebase_uid?: string
          email?: string
          name?: string | null
          phone?: string | null
          loyalty_points?: number
          loyalty_tier?: string
          total_orders?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Customer Addresses table
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          label: string
          area: string
          block: string
          street: string
          building: string
          floor: string | null
          apartment: string | null
          additional_directions: string | null
          latitude: number | null
          longitude: number | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          label: string
          area: string
          block: string
          street: string
          building: string
          floor?: string | null
          apartment?: string | null
          additional_directions?: string | null
          latitude?: number | null
          longitude?: number | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          label?: string
          area?: string
          block?: string
          street?: string
          building?: string
          floor?: string | null
          apartment?: string | null
          additional_directions?: string | null
          latitude?: number | null
          longitude?: number | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Orders table
      orders: {
        Row: {
          id: string
          tenant_id: string
          branch_id: string
          customer_id: string | null
          order_number: string
          order_type: string
          status: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          delivery_address: Json | null
          items: Json
          subtotal: number
          discount: number
          delivery_fee: number
          tax: number
          service_charge: number
          total: number
          payment_method: string
          payment_status: string
          notes: string | null
          estimated_ready_time: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          branch_id: string
          customer_id?: string | null
          order_number: string
          order_type: string
          status?: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          delivery_address?: Json | null
          items: Json
          subtotal: number
          discount?: number
          delivery_fee?: number
          tax?: number
          service_charge?: number
          total: number
          payment_method: string
          payment_status?: string
          notes?: string | null
          estimated_ready_time?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          branch_id?: string
          customer_id?: string | null
          order_number?: string
          order_type?: string
          status?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          delivery_address?: Json | null
          items?: Json
          subtotal?: number
          discount?: number
          delivery_fee?: number
          tax?: number
          service_charge?: number
          total?: number
          payment_method?: string
          payment_status?: string
          notes?: string | null
          estimated_ready_time?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Coupons table
      coupons: {
        Row: {
          id: string
          tenant_id: string
          code: string
          discount_type: string
          discount_value: number
          min_order_amount: number | null
          max_uses: number | null
          used_count: number
          is_active: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          code: string
          discount_type: string
          discount_value: number
          min_order_amount?: number | null
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          code?: string
          discount_type?: string
          discount_value?: number
          min_order_amount?: number | null
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Payment Settings table
      payment_settings: {
        Row: {
          id: string
          tenant_id: string
          branch_id: string | null
          provider: string
          is_enabled: boolean
          api_key: string | null
          api_secret: string | null
          merchant_id: string | null
          config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          branch_id?: string | null
          provider: string
          is_enabled?: boolean
          api_key?: string | null
          api_secret?: string | null
          merchant_id?: string | null
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          branch_id?: string | null
          provider?: string
          is_enabled?: boolean
          api_key?: string | null
          api_secret?: string | null
          merchant_id?: string | null
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Restaurant Settings table
      settings: {
        Row: {
          id: string
          tenant_id: string
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          key: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          key?: string
          value?: Json
          created_at?: string
          updated_at?: string
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
      order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'picked_up' | 'cancelled'
      order_type: 'pickup' | 'delivery'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
      payment_method: 'cash' | 'card' | 'online'
      loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
