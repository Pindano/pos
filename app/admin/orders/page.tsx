"use client"
import { useEffect, useState } from "react"
import { useOrderStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Eye, Clock, CheckCircle, Package, Truck, Filter, AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { OrderStatus } from "@/lib/types"

export default function AdminOrdersPage() {
  const { orders, fetchAllOrders, isLoading, error, updateOrderStatus } = useOrderStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone.includes(searchQuery) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || order.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100", variant: "secondary" as const },
    confirmed: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100", variant: "default" as const },
    preparing: { icon: Package, color: "text-orange-600", bg: "bg-orange-100", variant: "secondary" as const },
    out_for_delivery: { icon: Truck, color: "text-purple-600", bg: "bg-purple-100", variant: "default" as const },
    delivered: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", variant: "default" as const },
    cancelled: { icon: Clock, color: "text-red-600", bg: "bg-red-100", variant: "destructive" as const },
  }

  // 🔧 Updated to handle async updateOrderStatus
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
    } catch (error) {
      console.error("Failed to update order status:", error)
      // You could add a toast notification here
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // 🔧 Added retry function for failed loads
  const handleRetry = async () => {
    try {
      await fetchAllOrders()
    } catch (error) {
      console.error("Retry failed:", error)
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [fetchAllOrders])

  // 🔧 Better loading state
  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Order Management</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Loading orders...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 🔧 Better error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Order Management</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load orders</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={handleRetry} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Order Management</h1>
              <Badge variant="secondary">{orders.length} total orders</Badge>
            </div>
            {/* 🔧 Added refresh button */}
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer name, phone, or order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {orders.length === 0 
                    ? "No orders found in the system." 
                    : "No orders found matching your criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon
              const isUpdating = updatingOrderId === order.id
              
              return (
                <Card key={order.id} className={isUpdating ? "opacity-75" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${statusConfig[order.status].bg}`}>
                          <StatusIcon className={`h-4 w-4 ${statusConfig[order.status].color}`} />
                        </div>
                        <div>
                      
                          <h3 className="font-semibold">Order #{order.id}</h3>
                          
                          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusConfig[order.status].variant}>
                          {order.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Customer</p>
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Delivery Address</p>
                        <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Amount</p>
                        <p className="text-lg font-bold">KSh {order.total_amount.toFixed(2)}</p>
                        <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                          {order.payment_status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mb-4">
                        <p className="text-sm font-medium">Special Instructions</p>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      </div>
                    )}

                    {/* Status Update Actions */}
                    {order.status !== "delivered" && order.status !== "cancelled" && (
                      <div className="flex gap-2 pt-4 border-t">
                        {order.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusUpdate(order.id, "confirmed")}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Confirm Order"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/50"
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, "cancelled")}
                              disabled={isUpdating}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, "preparing")}
                            disabled={isUpdating}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, "out_for_delivery")}
                            disabled={isUpdating}
                          >
                            Out for Delivery
                          </Button>
                        )}
                        {order.status === "out_for_delivery" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, "delivered")}
                            disabled={isUpdating}
                          >
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}