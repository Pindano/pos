import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, Product, Order } from "./types"
import { createClient } from "@/lib/supabase/client"

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

interface ProductStore {
  products: Product[]
  getProducts: () => Product[]
  getProductById: (id: string) => Product | undefined
  getProductsByCategory: (category: string) => Product[]
  searchProducts: (query: string) => Product[]
  fetchProducts: () => Promise<void>
  addProduct: (productData: Omit<Product, "id" | "created_at" | "updated_at">) => Promise<string>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  isLoading: boolean
}

interface OrderStore {
  orders: Order[]
  addOrder: (orderData: Omit<Order, "id" | "created_at" | "updated_at">) => string
  getOrderById: (id: string) => Order | undefined
  updateOrderStatus: (id: string, status: Order["status"]) => void
  getRecentOrders: () => Order[]
  createOrder: (orderData: Omit<Order, "id" | "created_at" | "updated_at" | "customer_id">) => Promise<string>
  fetchOrders: () => Promise<void>
  fetchAllOrders: () => Promise<void>
  isLoading: boolean
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => {
        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id)

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
            ),
          })
        } else {
          set({ items: [...items, { product, quantity }] })
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.product.id !== productId) })
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
        })
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0)
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)

export const useProductStore = create<ProductStore>()((set, get) => ({
  
  products: [],
  isLoading: false,
  getProducts: () => get().products.filter((p) => p.is_available),
  getProductById: (id) => get().products.find((p) => p.id === id),
  getProductsByCategory: (category) => get().products.filter((p) => p.category.toLowerCase() === category.toLowerCase() && p.is_available),
  searchProducts: (query) => {
    const products = get().products
    const lowercaseQuery = query.toLowerCase()
    return products.filter(
      (p) =>
        p.is_available &&
        (p.name.toLowerCase().includes(lowercaseQuery) ||
          p.description.toLowerCase().includes(lowercaseQuery) ||
          p.category.toLowerCase().includes(lowercaseQuery)),
    )
  },
  fetchProducts: async () => {
    if (get().isLoading) return  // Prevent duplicate fetches
    set({ isLoading: true })
    try {
      const supabase = createClient()

      const { data, error } = await supabase.from("products").select("*").eq("is_available", true).order("name")

      if (error) throw error
      if (data) {
        set({ products: data || [], isLoading: false })
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      set({ isLoading: false })

    }
  },
  addProduct: async (productData: Omit<Product, "id" | "created_at" | "updated_at">) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("products").insert(productData).select().single()

      if (error) throw error

      if (data) {
        set({ products: [...get().products, data] })
        return data.id
      }
    } catch (error) {
      console.error("Error adding product:", error)
      throw error
    }
  },
  updateProduct: async (id: string, updates: Partial<Product>) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single()

      if (error) throw error

      if (data) {
        set({
          products: get().products.map((p) => (p.id === id ? data : p)),
        })
      }
    } catch (error) {
      console.error("Error updating product:", error)
      throw error
    }
  },
}))

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      isLoading: false,
      addOrder: (orderData) => {
        const id = generateUUID()
        const now = new Date().toISOString()
        const order: Order = {
          ...orderData,
          id,
          created_at: now,
          updated_at: now,
        }
        set({ orders: [...get().orders, order] })
        return id
      },
      getOrderById: (id) => get().orders.find((o) => o.id === id),
      updateOrderStatus: (id, status) => {
        set({
          orders: get().orders.map((order) =>
            order.id === id ? { ...order, status, updated_at: new Date().toISOString() } : order,
          ),
        })
      },
      getRecentOrders: () => {
        return get()
          .orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
      },
      createOrder: async (orderData) => {
        try {
          const supabase = createClient()

          // Get the authenticated user
          const { data: { session }, error: authError } = await supabase.auth.getSession();

          if (authError || !session || !session.user) {
            console.error("Authentication error:", authError);
            throw new Error("User not authenticated or session invalid");
          }
          

          // Create order in Supabase with customer_id
          const { data: orderResult, error: orderError } = await supabase
            .from("orders")
            .insert({
              customer_id: session.user.id,
              customer_name: orderData.customer_name,
              customer_email: orderData.customer_email,
              customer_phone: orderData.customer_phone,
              customer_address: orderData.delivery_address,
              total_amount: orderData.total_amount,
              status: orderData.status,
              payment_method: orderData.payment_method,
              payment_status: orderData.payment_status,
              notes: orderData.notes,
            })
            .select()
            .single()

          if (orderError) {
            console.error("Order creation error:", orderError)
            throw orderError
          }

          const orderId = orderResult.id

          // Create order items
          const cartItems = useCartStore.getState().items
          const orderItems = cartItems.map((item) => ({
            order_id: orderId,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            total_price: item.product.price * item.quantity,
          }))

          const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

          if (itemsError) {
            console.error("Order items creation error:", itemsError)
            throw itemsError
          }

          const completeOrder: Order = {
            ...orderData,
            id: orderId,
            customer_id: session.user.id, // Include customer_id in local state too
            created_at: orderResult.created_at,
            updated_at: orderResult.updated_at,
            items: cartItems,
          }
          set({ orders: [...get().orders, completeOrder] })

          return orderId
        } catch (error) {
          console.error("Error creating order:", error)
          // Don't fallback to local storage if user is not authenticated
          // This ensures we maintain data integrity
          throw error
        }
      },
      fetchOrders: async () => {
        set({ isLoading: true, error: null })
        try {
          const supabase = createClient()
          
          // Get the authenticated user
          const { data: { session }, error: authError } = await supabase.auth.getSession()
          
          if (authError || !session) {
            console.error("Authentication error when fetching orders:", authError)
            return
          }

          // Fetch only orders for the current user
          const { data: orders, error } = await supabase
            .from("orders")
            .select(`
              *,
              order_items (
                id,
                product_id,
                product_name,
                quantity,
                unit_price,
                total_price
              )
            `)
            .eq('customer_id', session.user.id) // Filter by customer_id
            .order("created_at", { ascending: false })

          if (error) {
            console.error("Error fetching orders:", error)
            throw error
          }

          if (orders) {
            // Transform to match our Order type
            const transformedOrders = orders.map((order) => ({
              ...order,
              delivery_address: order.customer_address,
              items:
                order.order_items?.map((item) => ({
                  product: {
                    id: item.product_id,
                    name: item.product_name,
                    price: item.unit_price,
                  } as Product,
                  quantity: item.quantity,
                })) || [],
            }))
            set({ orders: transformedOrders, isLoading: false })
          }
        } catch (error) {
          console.error("Error fetching orders:", error)
          set({ error: error.message, isLoading: false })
        }
      },
      // Add this method inside the store creator (after fetchOrders)
      fetchAllOrders: async () => {
        if (get().isLoading) return; // Prevent duplicates
        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          
          // Auth check (add this for security)
          const { data: { session }, error: authError } = await supabase.auth.getSession();
          if (authError || !session) {
            throw new Error("User not authenticated");
          }
          // Optional admin check
          // if (!session.user.user_metadata?.isAdmin) {
          //   throw new Error("Admin access required");
          // }
      
          // Fetch with join and proper order (by created_at, not name)
          const { data, error } = await supabase
            .from("orders")
            .select(`
              *,
              order_items (
                id,
                product_id,
                product_name,
                quantity,
                unit_price,
                total_price
              )
            `)
            .order("created_at", { ascending: false }); // Sort by date, newest first
      
          if (error) throw error;
      
          // Transform to match Order type
          const transformedOrders = data?.map((order) => ({
            ...order,
            delivery_address: order.customer_address, // Map raw field
            items: order.order_items?.map((item) => ({
              product: {
                id: item.product_id,
                name: item.product_name,
                price: item.unit_price,
              } as Product,
              quantity: item.quantity,
            })) || [],
          })) || [];
      
          set({ orders: transformedOrders, isLoading: false });
        } catch (error) {
          console.error("Error fetching orders:", error); // Fixed log message
          set({ 
            error: error instanceof Error ? error.message : "Unknown error", 
            isLoading: false 
          });
          // Optional: Re-throw for component to handle (e.g., show toast/redirect)
          // throw error;
        }
      },
      // Add a method to fetch orders for the current user
      fetchUserOrders: async () => {
        return get().fetchOrders()
      },
      fetchAdminOrders: async () => {
        return get().fetchAllOrders()
      },
    }),
    {
      name: "orders-storage",
    },
  ),
)
