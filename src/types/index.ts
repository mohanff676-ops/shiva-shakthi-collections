// ============================================================
// Shiva Shakthi Collections — TypeScript Database & App Types
// All monetary values are in paise (integer). 100 paise = ₹1
// ============================================================

/* ───────── Enums ───────── */

export type UserRole = 'customer' | 'admin';

export type OrderStatus =
  | 'inquiry_pending'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod' | 'other';

export type DiscountType = 'percentage' | 'fixed';

/* ───────── Database Row Types ───────── */

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_banned?: boolean;
  banned_reason?: string | null;
  banned_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price_paise: number;
  compare_at_price_paise: number | null;
  cost_price_paise: number | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_published: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  weight_grams: number | null;
  material: string | null;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined fields
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  price_adjustment_paise: number;
  stock_quantity: number;
  sku: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  product?: Product;
  variant?: ProductVariant;
}

export interface Wishlist {
  id: string;
  user_id: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal_paise: number;
  discount_paise: number;
  shipping_paise: number;
  tax_paise: number;
  total_paise: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  coupon_id?: string | null;
  shipping_address?: ShippingAddress | null;
  billing_address?: ShippingAddress | null;
  notes?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  items?: OrderItem[];
  payment?: Payment;
  profile?: Profile;
  coupon?: Coupon;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  product_name: string;
  product_image?: string | null;
  product_sku?: string | null;
  variant_info?: string | null;
  quantity: number;
  unit_price_paise: number;
  total_price_paise?: number;
  line_total_paise?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_reference: string | null;
  amount_paise: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  error_code: string | null;
  error_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_paise: number;
  max_discount_paise: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/* ───────── UI / App Types ───────── */

export interface CartItemLocal {
  productId: string;
  variantId: string | null;
  quantity: number;
  product: Product;
  variant: ProductVariant | null;
}

export interface FilterState {
  categoryId: string | null;
  priceRange: [number, number]; // paise
  sortBy: SortOption;
  search: string;
  inStock: boolean;
}

export type SortOption =
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'name-asc'
  | 'name-desc'
  | 'popular';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Order[];
  monthlyRevenue: { month: string; revenue: number }[];
}

export interface CheckoutFormData {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  save_address: boolean;
}
