// Peptide Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  discount_price: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  discount_active: boolean;

  // Peptide-specific fields
  purity_percentage: number;
  molecular_weight: string | null;
  cas_number: string | null;
  sequence: string | null;
  storage_conditions: string;
  inclusions: string[] | null;

  // Complete set pricing
  is_complete_set: boolean;
  complete_set_price: number | null;
  complete_set_description: string | null;

  // Stock and availability
  stock_quantity: number;
  available: boolean;
  featured: boolean;

  // Images and metadata
  image_url: string | null;
  safety_sheet_url: string | null;

  created_at: string;
  updated_at: string;

  // Relations
  variations?: ProductVariation[];
}

export interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  quantity_mg: number;
  price: number;
  stock_quantity: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  account_number: string;
  account_name: string;
  qr_code_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  value: string;
  type: string;
  description: string | null;
  updated_at: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  variation?: ProductVariation;
  quantity: number;
  price: number;
  isCompleteSet?: boolean; // Track if customer selected complete set option
}

// Order Types
export interface OrderDetails {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  payment_method: string;
  notes?: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend: number;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface COA {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
}

// Assessment Types
export interface AssessmentResponse {
  id: string;
  full_name: string;
  email: string;
  age_range: string;
  location: string;
  goals: string[];
  medical_history: string[];
  experience_level: string;
  preferences: {
    budget?: string;
    frequency?: string;
    [key: string]: any;
  };
  consent_agreed: boolean;
  recommendation_generated?: any;
  created_at: string;
  status: 'new' | 'reviewed' | 'contacted';
}

export interface RecommendationRule {
  id: string;
  rule_name: string;
  target_goal: string;
  target_experience: string;
  primary_product_id: string | null;
  secondary_product_ids: string[] | null;
  educational_note: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
}
