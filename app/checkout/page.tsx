"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useCartStore, useOrderStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, CreditCard, Smartphone, User, UserPlus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { CheckoutForm } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { createOrder } = useOrderStore()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<CheckoutForm>({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    delivery_address: "",
    notes: "",
  })

  const [paymentMethod, setPaymentMethod] = useState("mobile_money")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Pre-fill form with user data
        setFormData(prev => ({
          ...prev,
          customer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          customer_email: user.email || '',
        }))
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart")
    }
  }, [items, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show authentication required screen
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Cart
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Checkout</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Sign In Required</CardTitle>
                <p className="text-muted-foreground">
                  Please sign in or create an account to complete your order
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => router.push('/auth/login?redirect=/checkout')} 
                  className="w-full"
                  size="lg"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => router.push('/auth/signup?redirect=/checkout')} 
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <p>Why do I need to sign in?</p>
                  <p className="text-xs">This helps us track your order and send you updates</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary for reference */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>Kes {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Kes {getTotalPrice().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Use createOrder instead of addOrder to save to database
      const orderId = await createOrder({
        customer_name: formData.customer_name,
        
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        delivery_address: formData.delivery_address,
        total_amount: getTotalPrice(),
        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod,
        notes: formData.notes,
      })

      // Clear cart
      clearCart()

      // Show success message
      toast({
        title: "Order placed successfully!",
        description: `Your order #${orderId} has been received and is being processed.`,
      })

      // Redirect to order confirmation
      setTimeout(() => {
        router.push(`/orders/${orderId}`)
      }, 0)
    } catch (error) {
      console.error('Order creation error:', error)
      toast({
        title: "Error placing order",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
    
  }

  return (
    <div className="min-h-screen bg-background">
      
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/cart">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Checkout</h1>
            
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.customer_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.customer_phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customer_phone: e.target.value }))}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customer_email: e.target.value }))}
                      placeholder="your@email.com"
                      disabled // Pre-filled from auth, read-only
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      required
                      value={formData.delivery_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, delivery_address: e.target.value }))}
                      placeholder="Enter your complete delivery address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Special Instructions</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special delivery instructions (optional)"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mobile_money" id="mobile_money" />
                      <Label htmlFor="mobile_money" className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Mobile Money
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                      <Label htmlFor="cash_on_delivery" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cash on Delivery
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Placing Order..." : "Place Order"}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>Kes {(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>Kes {getTotalPrice().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}