import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, MapPin, Phone, Mail, Calendar, CreditCard } from "lucide-react"
import Link from "next/link"
import { EnhancedReceiptGenerator } from "@/components/enhanced-receipt-generator"
import { OrderEditor } from "@/components/order-editor"
import { OrderStatusUpdater } from "@/components/order-status-updater"

interface AdminOrderDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailsPage({ params }: AdminOrderDetailsPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch order details
  const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single()

  // Fetch order items
  const { data: orderItems = [], error: itemsError } = await supabase.from("order_items").select("*").eq("order_id", id)

  const { data: products = [] } = await supabase.from("products").select("id, name, price, category").eq("is_available", true)

  if (orderError || !order) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Order not found</p>
            <Link href="/admin/orders">
              <Button variant="outline" className="mt-4 bg-transparent">
                Back to Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  const statusConfig = {
    pending: { color: "text-yellow-600", bg: "bg-yellow-100" },
    confirmed: { color: "text-blue-600", bg: "bg-blue-100" },
    preparing: { color: "text-orange-600", bg: "bg-orange-100" },
    out_for_delivery: { color: "text-purple-600", bg: "bg-purple-100" },
    delivered: { color: "text-green-600", bg: "bg-green-100" },
    cancelled: { color: "text-red-600", bg: "bg-red-100" },
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                <Badge
                  variant="secondary"
                  className={`${statusConfig[order.status as keyof typeof statusConfig]?.bg} ${statusConfig[order.status as keyof typeof statusConfig]?.color}`}
                >
                  {order.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Placed: {new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Payment: {order.payment_method.replace("_", " ")}</span>
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">KSh {order.total_amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.customer_name}</span>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
              {order.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_email}</span>
                </div>
              )}
              {order.customer_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{order.customer_address}</span>
                </div>
              )}
              {order.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Special Instructions:</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          {/* <Card>
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
          </Card> */}
          <OrderEditor 
            order={order} 
            initialItems={orderItems} 
            availableProducts={products || []}
          />
        </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <OrderStatusUpdater order={order} />

          {/* Enhanced Receipt Generator */}
          <EnhancedReceiptGenerator order={order} items={orderItems} isAdmin={true} />
        </div>
      
    </main>
  )
}
