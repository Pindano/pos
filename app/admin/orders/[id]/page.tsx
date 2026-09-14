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
import { CustomerDetailsEditor } from "@/components/customer-details-editor"
import { DuplicateOrderButton } from "@/components/duplicate-order-button"

interface AdminOrderDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailsPage({ params }: AdminOrderDetailsPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch order details
  const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single()

  // Fetch order items with product units using JOIN
  const { data: orderItems = [], error: itemsError } = await supabase
    .from("order_items")
    .select(`
      id,
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total_price,
      created_at,
      products:product_id (
        unit,
        category,
        description
      )
    `)
    .eq("order_id", id)

  // Transform the data to include unit at the top level for easier access
  const orderItemsWithUnits = orderItems.map(item => ({
    ...item,
    unit: item.products?.unit || 'pcs' // Extract unit from joined products table
  }))

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
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <DuplicateOrderButton order={order} items={orderItemsWithUnits} />
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

          {/* Customer Information - Editable */}
          <CustomerDetailsEditor
            orderId={order.id}
            initialDetails={{
              customer_name: order.customer_name,
              customer_phone: order.customer_phone,
              customer_email: order.customer_email,
              customer_address: order.customer_address,
              notes: order.notes
            }}
          />

          {/* Order Items */}
          <OrderEditor
            order={order}
            initialItems={orderItemsWithUnits}
            availableProducts={products || []}
          />
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <OrderStatusUpdater order={order} />

          {/* Enhanced Receipt Generator - now with units! */}
          <EnhancedReceiptGenerator
            order={order}
            items={orderItemsWithUnits}
            isAdmin={true}
          />
        </div>
      </div>
    </main>
  )
}