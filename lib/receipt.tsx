import type { Order, OrderItem } from "./types"

export interface ReceiptData {
  order: Order
  items: OrderItem[]
  businessInfo: {
    name: string
    address: string
    phone: string
    email?: string
  }
}

export function generateReceiptText(data: ReceiptData): string {
  const { order, items, businessInfo } = data

  let receipt = ""

  // Header
  receipt += `${businessInfo.name}\n`
  receipt += `${businessInfo.address}\n`
  receipt += `Phone: ${businessInfo.phone}\n`
  if (businessInfo.email) {
    receipt += `Email: ${businessInfo.email}\n`
  }
  receipt += "\n"

  // Order Info
  receipt += `RECEIPT\n`
  receipt += `Order #: ${order.id}\n`
  receipt += `Date: ${new Date(order.created_at).toLocaleString()}\n`
  receipt += `Customer: ${order.customer_name}\n`
  receipt += `Phone: ${order.customer_phone}\n`
  receipt += "\n"

  // Items
  receipt += `ITEMS:\n`
  receipt += `${"Item".padEnd(20)} ${"Qty".padEnd(5)} ${"Price".padEnd(8)} ${"Total".padStart(8)}\n`
  receipt += "-".repeat(45) + "\n"

  items.forEach((item) => {
    const name = item.product_name.length > 18 ? item.product_name.substring(0, 18) + ".." : item.product_name
    const qty = item.quantity.toString()
    const price = `$${item.unit_price.toFixed(2)}`
    const total = `$${item.total_price.toFixed(2)}`

    receipt += `${name.padEnd(20)} ${qty.padEnd(5)} ${price.padEnd(8)} ${total.padStart(8)}\n`
  })

  receipt += "-".repeat(45) + "\n"

  // Totals
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  receipt += `${"Subtotal:".padEnd(37)} ${`$${subtotal.toFixed(2)}`.padStart(8)}\n`
  receipt += `${"TOTAL:".padEnd(37)} ${`$${order.total_amount.toFixed(2)}`.padStart(8)}\n`
  receipt += "\n"

  // Payment Info
  receipt += `Payment Method: ${order.payment_method?.replace("_", " ").toUpperCase() || "N/A"}\n`
  receipt += `Payment Status: ${order.payment_status.toUpperCase()}\n`
  receipt += "\n"

  // Delivery Info
  receipt += `DELIVERY ADDRESS:\n`
  receipt += `${order.delivery_address}\n`
  receipt += "\n"

  if (order.notes) {
    receipt += `SPECIAL INSTRUCTIONS:\n`
    receipt += `${order.notes}\n`
    receipt += "\n"
  }

  // Footer
  receipt += `Thank you for your business!\n`
  receipt += `Order Status: ${order.status.replace("_", " ").toUpperCase()}\n`

  return receipt
}

export function downloadReceipt(receiptText: string, orderId: string) {
  const blob = new Blob([receiptText], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `receipt-${orderId}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printReceipt(receiptText: string) {
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.4;
              margin: 20px;
              white-space: pre-wrap;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${receiptText}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
}
