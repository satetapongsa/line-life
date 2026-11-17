export type OptionGroup = "size" | "sweetness";

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type ProductOption = {
  id: string;
  product_id: string;
  group_name: OptionGroup;
  label: string;
  price_delta: number;
  sort_order: number;
  is_default: boolean;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  options: ProductOption[];
};

export type CartOption = {
  id: string;
  group: OptionGroup;
  label: string;
  priceDelta: number;
};

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  basePrice: number;
  options: CartOption[];
  note: string;
  quantity: number;
};

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "reported", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  options: { group: OptionGroup; label: string; price_delta: number }[];
  note: string | null;
  line_total: number;
};

export type Order = {
  id: string;
  order_no: number;
  line_user_id: string;
  display_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  pickup_time: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
};
