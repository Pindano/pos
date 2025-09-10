"use client"

import { useOrderStore } from "@/lib/store"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Eye, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
  const { orders, isLoading, error, fetchOrders } = useOrderStore()
  const sortedOrders = orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  console.log(orders);

  // Fetch orders for the current user on component mount
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders]) // Dependency on fetchOrders ensures it's stable (Zustand auto-memoizes actions)
  if (isLoading) return <div className="text-center py-12">Loading your orders...</div>
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>
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
            <h1 className="text-xl font-bold">Order History</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here!</p>
            <Link href="/">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                  <Link href={`/orders/${order.id}`}>
                    <CardTitle className="text-lg">Order #{order.id}</CardTitle>
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
                      <p className="text-muted-foreground">Kes {order.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}