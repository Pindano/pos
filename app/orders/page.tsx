"use client"

import { useState, useEffect } from "react"
import { useOrderStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, ShoppingBag, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
  const { orders, isLoading, error, fetchOrders } = useOrderStore()
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredAndSortedOrders = orders
    .filter((order) => statusFilter === "all" || order.status === statusFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const orderStatuses = Array.from(new Set(orders.map((order) => order.status)))

  // 🔧 Added retry function for failed loads
  const handleRetry = async () => {
    try {
      await fetchOrders()
    } catch (error) {
      console.error("Retry failed:", error)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 🔧 Better loading state
  if (isLoading && orders.length === 0) {
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
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Order History</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Loading your orders...</p>
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Shop
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Order History</h1>
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Shop
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Order History</h1>
              {orders.length > 0 && (
                <Badge variant="secondary">{orders.length} total orders</Badge>
              )}
            </div>
            {/* 🔧 Added refresh button */}
            {orders.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleRetry} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filter - only show if there are orders */}
        {orders.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {filteredAndSortedOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {orders.length === 0 ? "No orders yet" : "No orders match your filter"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {orders.length === 0
                  ? "Start shopping to see your orders here!"
                  : "Try selecting a different status filter."}
              </p>
              {orders.length === 0 && (
                <Link href="/">
                  <Button>Start Shopping</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Link href={`/orders/${order.id}`}>
                      <CardTitle className="text-lg hover:underline cursor-pointer">
                        Order #{order.id}
                      </CardTitle>
                    </Link>
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                      {order.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Customer</p>
                      <p className="text-muted-foreground">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-muted-foreground font-semibold">
                        KSh {order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* 🔧 Added delivery address and payment status for better info */}
                  <div className="mt-4 pt-4 border-t grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Delivery Address</p>
                      <p className="text-muted-foreground">{order.delivery_address}</p>
                    </div>
                    <div>
                      <p className="font-medium">Payment Status</p>
                      <Badge 
                        variant={order.payment_status === "paid" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {order.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Show special notes if they exist */}
                  {order.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-medium text-sm">Special Instructions</p>
                      <p className="text-muted-foreground text-sm">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}