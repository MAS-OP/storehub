export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          subdomain: string;
          name: string;
          name_ar: string | null;
          description: string | null;
          description_ar: string | null;
          logo_url: string | null;
          banner_url: string | null;
          primary_color: string;
          owner_id: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          country: string;
          currency: string;
          is_active: boolean;
          ai_enabled: boolean;
          ai_personality: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["stores"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["stores"]["Insert"]
        >;
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          name_ar: string | null;
          description: string | null;
          description_ar: string | null;
          price: number;
          compare_price: number | null;
          images: string[];
          category_id: string | null;
          sku: string | null;
          stock: number;
          is_active: boolean;
          weight: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["products"]["Insert"]
        >;
      };
      categories: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          name_ar: string | null;
          slug: string;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["categories"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["categories"]["Insert"]
        >;
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          order_number: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
          payment_status: "pending" | "paid" | "refunded";
          payment_method: string | null;
          subtotal: number;
          shipping_fee: number;
          discount: number;
          total: number;
          notes: string | null;
          shipping_address: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["orders"]["Insert"]
        >;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_image: string | null;
          price: number;
          quantity: number;
          subtotal: number;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id">;
        Update: Partial<
          Database["public"]["Tables"]["order_items"]["Insert"]
        >;
      };
      delivery_methods: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          name_ar: string | null;
          description: string | null;
          fee: number;
          is_active: boolean;
          estimated_days: number | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["delivery_methods"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["delivery_methods"]["Insert"]
        >;
      };
      analytics_events: {
        Row: {
          id: string;
          store_id: string;
          event_type: string;
          product_id: string | null;
          order_id: string | null;
          value: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["analytics_events"]["Row"],
          "id" | "created_at"
        >;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
