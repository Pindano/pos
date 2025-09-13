"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Mail, Receipt, CheckCircle, Clock, CreditCard, QrCode } from "lucide-react"
import { generatePDFReceipt, emailReceipt, downloadPDFReceipt } from "@/lib/pdf-receipt"
import { useToast } from "@/hooks/use-toast"
import type { Order, OrderItem } from "@/lib/types"

interface AdditionalCharge {
  id: string
  name: string
  amount: number
  description?: string
}

interface EnhancedReceiptGeneratorProps {
  order: Order
  items?: OrderItem[]
  isAdmin?: boolean
}

export function EnhancedReceiptGenerator({ order, items = [], isAdmin = false }: EnhancedReceiptGeneratorProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [emailAddress, setEmailAddress] = useState(order.customer_email || "")
  const [businessSettings, setBusinessSettings] = useState(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(order.payment_status === "paid")
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([])

  useEffect(() => {
    fetchBusinessSettings()
    fetchAdditionalCharges()
  }, [])

  const fetchBusinessSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("business_settings").select("*").single()

      if (error) throw error
      setBusinessSettings(data)
    } catch (error) {
      console.error("Error fetching business settings:", error)
      // Fallback settings
      setBusinessSettings({
        business_name: "Fresh Market Vendor",
        business_address: "123 Market Street, City, State 12345",
        business_phone: "+1 (555) 123-4567",
        business_email: "orders@freshmarket.com",
        receipt_footer: "Thank you for your business!",
      })
    }
  }

  const fetchAdditionalCharges = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("order_additional_charges")
        .select("*")
        .eq("order_id", order.id)

      if (error) throw error
      setAdditionalCharges(data || [])
    } catch (error) {
      console.error("Error fetching additional charges:", error)
      setAdditionalCharges([])
    }
  }

  const handleConfirmPayment = async () => {
    if (!isAdmin) return

    setIsConfirmingPayment(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: order.status === "pending" ? "confirmed" : order.status,
        })
        .eq("id", order.id)

      if (error) throw error

      setPaymentConfirmed(true)
      toast({
        title: "Payment Confirmed",
        description: "Payment has been marked as received. Receipt can now be generated.",
      })

      // Auto-generate and email receipt if customer email is available
      if (emailAddress) {
        await handleEmailReceipt(true)
      }
    } catch (error) {
      console.error("Error confirming payment:", error)
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const handleGenerateReceipt = async (confirmed = paymentConfirmed) => {
    if (!businessSettings) return

    setIsGenerating(true)
    try {
      const receiptBlob = await generatePDFReceipt({
        order,
        items,
        additionalCharges, // Pass additional charges
        businessSettings,
        paymentConfirmed: confirmed,
      })

      downloadPDFReceipt(receiptBlob, order.id)

      toast({
        title: "Receipt Generated",
        description: "PDF receipt has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error generating receipt:", error)
      toast({
        title: "Error",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEmailReceipt = async (confirmed = paymentConfirmed) => {
    if (!businessSettings || !emailAddress) return

    setIsEmailing(true)
    try {
      const receiptBlob = await generatePDFReceipt({
        order,
        items,
        additionalCharges, // Pass additional charges
        businessSettings,
        paymentConfirmed: confirmed,
      })

      const success = await emailReceipt(receiptBlob, emailAddress, order, businessSettings)

      if (success) {
        toast({
          title: "Receipt Emailed",
          description: `Receipt has been sent to ${emailAddress}`,
        })
      } else {
        throw new Error("Email sending failed")
      }
    } catch (error) {
      console.error("Error emailing receipt:", error)
      toast({
        title: "Email Failed",
        description: "Failed to send receipt via email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEmailing(false)
    }
  }

  // Calculate totals including additional charges
  const itemsTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const chargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
  const grandTotal = itemsTotal + chargesTotal

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Enhanced Receipt System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {paymentConfirmed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-600" />
            )}
            <span className="font-medium">Payment Status:</span>
            <Badge variant={paymentConfirmed ? "default" : "secondary"}>
              {paymentConfirmed ? "Confirmed" : "Pending"}
            </Badge>
          </div>

          {isAdmin && !paymentConfirmed && (
            <Button onClick={handleConfirmPayment} disabled={isConfirmingPayment} size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              {isConfirmingPayment ? "Confirming..." : "Confirm Payment"}
            </Button>
          )}
        </div>

        {/* Order Summary Preview */}
        {(items.length > 0 || additionalCharges.length > 0) && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Receipt will include:</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{items.length} item(s) subtotal:</span>
                <span>KSh {itemsTotal.toFixed(2)}</span>
              </div>
              {additionalCharges.length > 0 && (
                <div className="flex justify-between">
                  <span>{additionalCharges.length} additional charge(s):</span>
                  <span>KSh {chargesTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-foreground pt-1 border-t">
                <span>Total:</span>
                <span>KSh {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Charges Preview */}
        {additionalCharges.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Additional Charges to include:</h4>
            <div className="space-y-1">
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between text-xs p-2 bg-blue-50 rounded">
                  <div>
                    <span className="font-medium">{charge.name}</span>
                    {charge.description && (
                      <span className="text-muted-foreground ml-2">({charge.description})</span>
                    )}
                  </div>
                  <span className="font-medium">KSh {charge.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Address Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Customer Email (for receipt delivery)</Label>
          <Input
            id="email"
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="customer@example.com"
          />
        </div>

        <Separator />

        {/* Receipt Features */}
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Business Branding
          </div>
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-blue-600" />
            QR Code Verification
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-purple-600" />
            PDF Download
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-orange-600" />
            Email Delivery
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleGenerateReceipt()}
              disabled={isGenerating}
              className="flex-1 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleEmailReceipt()}
              disabled={isEmailing || !emailAddress}
              className="flex-1 bg-transparent"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isEmailing ? "Sending..." : "Email Receipt"}
            </Button>
          </div>

          {paymentConfirmed && (
            <div className="text-xs text-center text-green-600 font-medium">
              ✓ Payment confirmed - Official receipt available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}