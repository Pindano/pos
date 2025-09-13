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
  isLoading: boolean
  
  getProducts: () => Product[]
  getProductById: (id: string) => Product | undefined
  getProductsByCategory: (category: string) => Product[]
  searchProducts: (query: string) => Product[]
  fetchProducts: () => Promise<void>
  addProduct: (productData: Omit<Product, "id" | "created_at" | "updated_at">) => Promise<string>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
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
      // Add these methods to your existing order store

// Update order items and charges
updateOrder: async (orderId: string, items: OrderItem[], additionalCharges: AdditionalCharge[]) => {
  try {
    const supabase = createClient()
    
    // Calculate new total
    const itemsTotal = items.reduce((sum, item) => sum + item.total_price, 0)
    const chargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
    const newTotal = itemsTotal + chargesTotal

    // Start transaction-like operations
    // 1. Delete existing items
    const { error: deleteItemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId)
    
    if (deleteItemsError) throw deleteItemsError

    // 2. Insert new items
    const itemsToInsert = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }))
    
    const { error: insertItemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert)

    if (insertItemsError) throw insertItemsError

    // 3. Handle additional charges
    const { error: deleteChargesError } = await supabase
      .from("order_additional_charges")
      .delete()
      .eq("order_id", orderId)
    
    if (deleteChargesError) throw deleteChargesError

    if (additionalCharges.length > 0) {
      const chargesToInsert = additionalCharges.map(charge => ({
        order_id: orderId,
        name: charge.name,
        amount: charge.amount,
        description: charge.description
      }))
      
      const { error: insertChargesError } = await supabase
        .from("order_additional_charges")
        .insert(chargesToInsert)

      if (insertChargesError) throw insertChargesError
    }

    // 4. Update order total
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({ 
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)

    if (updateOrderError) throw updateOrderError

    // 5. Update local store
    set({
      orders: get().orders.map(order =>
        order.id === orderId 
          ? { ...order, total_amount: newTotal, updated_at: new Date().toISOString() }
          : order
      )
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating order:", error)
    throw error
  }
},

// Get order with items and charges for editing
getOrderForEditing: async (orderId: string) => {
  try {
    const supabase = createClient()
    
    // Fetch order with items and charges
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*),
        order_additional_charges (*)
      `)
      .eq("id", orderId)
      .single()

    if (orderError) throw orderError
    
    return order
  } catch (error) {
    console.error("Error fetching order for editing:", error)
    throw error
  }
},

// Add single item to existing order
addItemToOrder: async (orderId: string, productId: string, quantity: number = 1) => {
  try {
    const supabase = createClient()
    
    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("id", productId)
      .single()

    if (productError || !product) throw new Error("Product not found")

    // Check if item already exists in order
    const { data: existingItem } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("product_id", productId)
      .single()

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity
      const newTotalPrice = product.price * newQuantity

      const { error: updateError } = await supabase
        .from("order_items")
        .update({
          quantity: newQuantity,
          total_price: newTotalPrice
        })
        .eq("id", existingItem.id)

      if (updateError) throw updateError
    } else {
      // Add new item
      const { error: insertError } = await supabase
        .from("order_items")
        .insert({
          order_id: orderId,
          product_id: productId,
          product_name: product.name,
          quantity: quantity,
          unit_price: product.price,
          total_price: product.price * quantity
        })

      if (insertError) throw insertError
    }

    // Recalculate and update order total
    await this.recalculateOrderTotal(orderId)
    
    return { success: true }
  } catch (error) {
    console.error("Error adding item to order:", error)
    throw error
  }
},

// Remove item from order
removeItemFromOrder: async (orderId: string, itemId: string) => {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("id", itemId)
      .eq("order_id", orderId)

    if (error) throw error

    // Recalculate order total
    await this.recalculateOrderTotal(orderId)
    
    return { success: true }
  } catch (error) {
    console.error("Error removing item from order:", error)
    throw error
  }
},

// Update item quantity or price
updateOrderItem: async (orderId: string, itemId: string, updates: { quantity?: number, unit_price?: number }) => {
  try {
    const supabase = createClient()
    
    // Get current item
    const { data: currentItem, error: fetchError } = await supabase
      .from("order_items")
      .select("*")
      .eq("id", itemId)
      .single()

    if (fetchError || !currentItem) throw new Error("Item not found")

    // Prepare updates
    const newQuantity = updates.quantity ?? currentItem.quantity
    const newUnitPrice = updates.unit_price ?? currentItem.unit_price
    const newTotalPrice = newQuantity * newUnitPrice

    const { error: updateError } = await supabase
      .from("order_items")
      .update({
        quantity: newQuantity,
        unit_price: newUnitPrice,
        total_price: newTotalPrice
      })
      .eq("id", itemId)

    if (updateError) throw updateError

    // Recalculate order total
    await this.recalculateOrderTotal(orderId)
    
    return { success: true }
  } catch (error) {
    console.error("Error updating order item:", error)
    throw error
  }
},

// Add additional charge to order
addAdditionalCharge: async (orderId: string, name: string, amount: number, description?: string) => {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from("order_additional_charges")
      .insert({
        order_id: orderId,
        name,
        amount,
        description
      })

    if (error) throw error

    // Recalculate order total
    await this.recalculateOrderTotal(orderId)
    
    return { success: true }
  } catch (error) {
    console.error("Error adding additional charge:", error)
    throw error
  }
},

// Remove additional charge
removeAdditionalCharge: async (chargeId: string) => {
  try {
    const supabase = createClient()
    
    // Get the order_id before deleting
    const { data: charge } = await supabase
      .from("order_additional_charges")
      .select("order_id")
      .eq("id", chargeId)
      .single()

    const { error } = await supabase
      .from("order_additional_charges")
      .delete()
      .eq("id", chargeId)

    if (error) throw error

    // Recalculate order total if we have the order_id
    if (charge?.order_id) {
      await this.recalculateOrderTotal(charge.order_id)
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error removing additional charge:", error)
    throw error
  }
},

// Helper method to recalculate order total
recalculateOrderTotal: async (orderId: string) => {
  try {
    const supabase = createClient()
    
    // Get all items and charges for the order
    const [itemsResult, chargesResult] = await Promise.all([
      supabase
        .from("order_items")
        .select("total_price")
        .eq("order_id", orderId),
      supabase
        .from("order_additional_charges")
        .select("amount")
        .eq("order_id", orderId)
    ])

    const itemsTotal = itemsResult.data?.reduce((sum, item) => sum + item.total_price, 0) || 0
    const chargesTotal = chargesResult.data?.reduce((sum, charge) => sum + charge.amount, 0) || 0
    const newTotal = itemsTotal + chargesTotal

    // Update order total
    const { error } = await supabase
      .from("orders")
      .update({ 
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)

    if (error) throw error

    // Update local store
    set({
      orders: get().orders.map(order =>
        order.id === orderId 
          ? { ...order, total_amount: newTotal, updated_at: new Date().toISOString() }
          : order
      )
    })

    return newTotal
  } catch (error) {
    console.error("Error recalculating order total:", error)
    throw error
  }
},

// Bulk update order (for complex edits)
bulkUpdateOrder: async (orderId: string, orderData: {
  items?: Array<{
    id?: string
    product_id?: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  additionalCharges?: Array<{
    id?: string
    name: string
    amount: number
    description?: string
  }>
  customerInfo?: {
    customer_name?: string
    customer_email?: string
    customer_phone?: string
    customer_address?: string
    notes?: string
  }
}) => {
  try {
    const supabase = createClient()
    
    // Update customer info if provided
    if (orderData.customerInfo) {
      const { error: customerError } = await supabase
        .from("orders")
        .update({
          ...orderData.customerInfo,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId)

      if (customerError) throw customerError
    }

    // Update items if provided
    if (orderData.items) {
      // Delete existing items
      await supabase.from("order_items").delete().eq("order_id", orderId)
      
      // Insert new items
      const itemsToInsert = orderData.items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))
      
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert)

      if (itemsError) throw itemsError
    }

    // Update additional charges if provided
    if (orderData.additionalCharges) {
      // Delete existing charges
      await supabase.from("order_additional_charges").delete().eq("order_id", orderId)
      
      // Insert new charges
      if (orderData.additionalCharges.length > 0) {
        const chargesToInsert = orderData.additionalCharges.map(charge => ({
          order_id: orderId,
          name: charge.name,
          amount: charge.amount,
          description: charge.description
        }))
        
        const { error: chargesError } = await supabase
          .from("order_additional_charges")
          .insert(chargesToInsert)

        if (chargesError) throw chargesError
      }
    }

    // Recalculate total if items or charges were updated
    if (orderData.items || orderData.additionalCharges) {
      await this.recalculateOrderTotal(orderId)
    }

    return { success: true }
  } catch (error) {
    console.error("Error bulk updating order:", error)
    throw error
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
