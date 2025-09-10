"use client"

import { useState, useEffect } from "react"
import { useOrderStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, ShoppingBag,LogIn } from "lucide-react"
import Link from "next/link"
import type { User as SupabaseUser } from "@supabase/supabase-js"


export default function OrdersPage() {
  const { orders, isLoading, error, fetchOrders } = useOrderStore()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [authLoading, setAuthLoading] = useState(true)
  const supabase = createClient()

  const filteredAndSortedOrders = orders
    .filter((order) => statusFilter === "all" || order.status === statusFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const orderStatuses = Array.from(new Set(orders.map((order) => order.status)))
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          fetchOrders()
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [supabase.auth, fetchOrders])// Dependency on fetchOrders ensures it's stable (Zustand auto-memoizes actions)
  if (authLoading) {
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
          <div className="text-center py-12">
            <LogIn className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign in to view your orders</h2>
            <p className="text-muted-foreground mb-6">You need to be signed in to access your order history.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/login">
                <Button>Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline">Create Account</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }
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
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Order History</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
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
        {filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-12">
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
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedOrders.map((order) => (
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
                      <p className="text-muted-foreground">Ksh {order.total_amount.toFixed(2)}</p>
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