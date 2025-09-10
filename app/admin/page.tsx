import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Package, DollarSign, Clock, CheckCircle, Truck } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch orders from Supabase
  const { data: orders = [], error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch products from Supabase
  const { data: products = [], error: productsError } = await supabase.from("products").select("*").order("name")

  if (ordersError) console.error("Error fetching orders:", ordersError)
  if (productsError) console.error("Error fetching products:", productsError)

  // Calculate statistics
  const totalOrders = orders.length
  const totalRevenue = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + order.total_amount, 0)

  const pendingOrders = orders.filter((order) => order.status === "pending").length
  const todayOrders = orders.filter((order) => {
    const today = new Date().toDateString()
    return new Date(order.created_at).toDateString() === today
  }).length

  const lowStockProducts = products.filter((product) => product.stock_quantity < 10)
  const recentOrders = orders.slice(0, 5)

  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
    confirmed: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100" },
    preparing: { icon: Package, color: "text-orange-600", bg: "bg-orange-100" },
    out_for_delivery: { icon: Truck, color: "text-purple-600", bg: "bg-purple-100" },
    delivered: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    cancelled: { icon: Clock, color: "text-red-600", bg: "bg-red-100" },
  }

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {totalOrders} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders}</div>
            <p className="text-xs text-muted-foreground">Orders placed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">{lowStockProducts.length} low stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/admin/orders">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock
                    const statusStyle = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending

                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${statusStyle.bg}`}>
                            <StatusIcon className={`h-4 w-4 ${statusStyle.color}`} />
                          </div>
                          <div>
                          <Link href={`/admin/orders/${order.id}`}>
                            <p className="font-medium">#{order.id.slice(0, 8)}</p>
                          </Link>
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.total_amount.toFixed(2)}</p>
                          <Badge variant="secondary" className="text-xs">
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <span className="text-sm">{product.name}</span>
                      <Badge variant="destructive">{product.stock_quantity} left</Badge>
                    </div>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{lowStockProducts.length - 3} more items</p>
                  )}
                </div>
                <Separator className="my-3" />
                <Link href="/admin/products">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Manage Inventory
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/products">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
              </Link>
              <Link href="/admin/orders?status=pending">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Clock className="h-4 w-4 mr-2" />
                  Review Pending Orders
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
