"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Printer, Receipt } from "lucide-react"
import { generateReceiptText, downloadReceipt, printReceipt } from "@/lib/receipt"
import type { Order, OrderItem } from "@/lib/types"

interface ReceiptGeneratorProps {
  order: Order
  items?: OrderItem[]
}

export function ReceiptGenerator({ order, items = [] }: ReceiptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const businessInfo = {
    name: "Fresh Market",
    address: "123 Market Street, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "orders@freshmarket.com",
  }

  const handleDownload = () => {
    setIsGenerating(true)
    try {
      const receiptText = generateReceiptText({ order, items, businessInfo })
      downloadReceipt(receiptText, order.id)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    setIsGenerating(true)
    try {
      const receiptText = generateReceiptText({ order, items, businessInfo })
      printReceipt(receiptText)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Receipt Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">Generate and download a receipt for this order</div>

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={isGenerating} className="flex-1 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={isGenerating} className="flex-1 bg-transparent">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
