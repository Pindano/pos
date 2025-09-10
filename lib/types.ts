export interface Product {
  id: string
  name: string
  description: string
  price: number
  unit: string // kg, pieces, bunches, etc.
  category: string // vegetables, fruits, grains, etc.
  
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  default_address?: string
  created_at: string
  updated_at: string
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"
export type PaymentStatus = "pending" | "paid" | "failed"

export interface Order {
  id: string
  customer_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address: string
  total_amount: number
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export type NotificationType = "order_confirmation" | "status_update" | "price_update" | "promotion"

export interface Notification {
  id: string
  customer_id?: string
  type: NotificationType
  title: string
  message: string
  sent_at: string
  read: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CheckoutForm {
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address: string
  notes?: string
}
