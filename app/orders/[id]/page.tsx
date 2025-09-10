"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EnhancedReceiptGenerator } from "@/components/enhanced-receipt-generator"
import { ArrowLeft, CheckCircle, Clock, Truck, Package, MapPin, Phone, Mail, FileText } from "lucide-react"
import Link from "next/link"
import type { Order, OrderItem } from "@/lib/types"

const statusConfig = {
  pending: {
    icon: Clock,
    color: "bg-yellow-500",
    label: "Order Received",
    description: "Your order has been received and is awaiting confirmation.",
  },
  confirmed: {
    icon: CheckCircle,
    color: "bg-blue-500",
    label: "Confirmed",
    description: "Your order has been confirmed and will be prepared soon.",
  },
  preparing: {
    icon: Package,
    color: "bg-orange-500",
    label: "Preparing",
    description: "Your order is being prepared for delivery.",
  },
  out_for_delivery: {
    icon: Truck,
    color: "bg-purple-500",
    label: "Out for Delivery",
    description: "Your order is on the way to your delivery address.",
  },
  delivered: {
    icon: CheckCircle,
    color: "bg-green-500",
    label: "Delivered",
    description: "Your order has been successfully delivered.",
  },
  cancelled: { icon: Clock, color: "bg-red-500", label: "Cancelled", description: "This order has been cancelled." },
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedItems, setEditedItems] = useState<OrderItem[]>([])

  useEffect(() => {
    fetchOrderDetails()
  }, [params.id])

  const fetchOrderDetails = async () => {
    try {
      const supabase = createClient()

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", params.id)
        .single()

      if (orderError) throw orderError

      // Fetch order items
      const { data: itemsData = [], error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", params.id)

      if (itemsError) console.error("Error fetching items:", itemsError)

      setOrder(orderData)
      setOrderItems(itemsData)
    } catch (error) {
      console.error("Error fetching order:", error)
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }
  const handleEditOrder = () => {
    setEditedItems([...orderItems])
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    try {
      const supabase = createClient()

      // Update order items
      for (const item of editedItems) {
        const { error } = await supabase
          .from("order_items")
          .update({
            quantity: item.quantity,
            total_price: item.quantity * item.unit_price,
          })
          .eq("id", item.id)

        if (error) throw error
      }

      // Recalculate total
      const newTotal = editedItems.reduce((sum, item) => sum + item.total_price, 0)

      const { error: orderError } = await supabase.from("orders").update({ total_amount: newTotal }).eq("id", params.id)

      if (orderError) throw orderError

      setOrderItems(editedItems)
      setOrder((prev) => (prev ? { ...prev, total_amount: newTotal } : null))
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating order:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditedItems([])
    setIsEditing(false)
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setEditedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price } : item,
      ),
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${statusConfig[order.status as keyof typeof statusConfig]?.color || "bg-gray-500"}`}
                  >
                    <StatusIcon className="h-5 w-5 text-white" />
                  </div>
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {statusConfig[order.status as keyof typeof statusConfig]?.label || "Unknown"}
                    </span>
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                      {order.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {statusConfig[order.status as keyof typeof statusConfig]?.description ||
                      "Status information not available."}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <p>Order placed: {new Date(order.created_at).toLocaleString()}</p>
                    <p>Last updated: {new Date(order.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No items found</p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">${item.unit_price.toFixed(2)} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.quantity}</p>
                          <p className="text-sm font-bold">${item.total_price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}

                    <Separator />

                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span>${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                    </div>
                  </div>
                  {order.customer_phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{order.customer_phone}</p>
                        <p className="text-sm text-muted-foreground">Phone Number</p>
                      </div>
                    </div>
                  )}
                  {order.customer_email && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <div className="p-2 bg-muted rounded-full">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{order.customer_email}</p>
                        <p className="text-sm text-muted-foreground">Email Address</p>
                      </div>
                    </div>
                  )}
                  {order.customer_address && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="p-2 bg-muted rounded-full">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{order.customer_address}</p>
                        <p className="text-sm text-muted-foreground">Delivery Address</p>
                      </div>
                    </div>
                  )}
                  {order.notes && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="p-2 bg-muted rounded-full">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{order.notes}</p>
                        <p className="text-sm text-muted-foreground">Special Instructions</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Payment Method</p>
                      <p className="text-sm text-muted-foreground">
                        {order.payment_method?.replace("_", " ").toUpperCase() || "Not specified"}
                      </p>
                    </div>
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {order.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
          {order.payment_status === "paid" ? (
  <EnhancedReceiptGenerator order={order} items={orderItems} isAdmin={false} />
) : (
  <p className="text-sm text-muted-foreground">Receipt will be available once payment is confirmed.</p>
)}
            {/* Order Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    Continue Shopping
                  </Button>
                </Link>
                <Link href="/orders" className="block">
                  <Button className="w-full">View All Orders</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {order.status !== "pending" && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">Status Updated</p>
                        <p className="text-muted-foreground">{new Date(order.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
