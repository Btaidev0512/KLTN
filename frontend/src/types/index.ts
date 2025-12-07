// 🎾 Product Types
export interface Product {
  product_id: number;
  product_name: string; // Backend trả về product_name
  product_slug: string;
  sku: string;
  description: string;
  short_description?: string;
  base_price: string; // Backend trả về dạng string
  sale_price?: string;
  final_price: string;
  cost_price?: string;
  weight?: string;
  dimensions?: string;
  materials?: string;
  care_instructions?: string;
  status: 'active' | 'inactive';
  featured: number; // Backend trả về số (0/1)
  is_digital: number;
  track_quantity: number;
  continue_selling_when_out_of_stock: number;
  view_count: number;
  purchase_count: number;
  rating_average: string;
  rating_count: number;
  category_name?: string;
  category_slug?: string;
  brand_name?: string;
  brand_slug?: string;
  primary_image?: string;
  created_at: string;
  updated_at: string;
  variant_count: number;
  
  // Legacy fields for compatibility
  name?: string;
  price?: number;
  stock_quantity?: number;
  image_url?: string;
}

// 🏪 Category Types
export interface Category {
  category_id: number;
  name: string;
  description?: string;
  slug: string;
  image_url?: string;
  status: 'active' | 'inactive';
}

// 🏷️ Brand Types
export interface Brand {
  brand_id: number;
  name: string;
  description?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
}

// 👤 User Types
export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  role: 'admin' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

// 🛒 Cart Types
export interface CartItem {
  cart_item_id: number;
  user_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  added_at: string;
}

// 📋 Order Types
export interface Order {
  order_id: number;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// 💳 Payment Types
export interface Payment {
  payment_id: number;
  order_id: number;
  payment_method: 'vnpay' | 'momo' | 'bank_transfer' | 'cash' | 'card';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  gateway_transaction_id?: string;
  gateway_response?: any;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// 🏠 Address Types
export interface Address {
  address_id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// 📊 API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  count?: number;
}

// 🔐 Auth Types
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username?: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
}

// 📱 App State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  cart: CartItem[];
  loading: boolean;
  error: string | null;
}

// 🔍 Search & Filter Types
export interface ProductFilter {
  category?: string;
  brand_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort_by?: 'created_at' | 'price' | 'name';
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// 📊 Admin Dashboard Types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

// 🚚 Order Tracking Types
export interface OrderTracking {
  order_id: number;
  tracking_number?: string;
  status: string;
  estimated_delivery?: string;
  tracking_events: Array<{
    timestamp: string;
    status: string;
    description: string;
    location?: string;
  }>;
}