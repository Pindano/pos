import jsPDF from "jspdf"
import QRCode from "qrcode"
import type { Order, OrderItem } from "./types"

interface BusinessSettings {
  business_name: string
  business_address: string
  business_phone: string
  business_email: string
  logo_url?: string
  receipt_footer: string
}

interface AdditionalCharge {
  id: string
  name: string
  amount: number
  description?: string
}

interface ReceiptData {
  order: Order
  items: OrderItem[]
  additionalCharges?: AdditionalCharge[]
  businessSettings: BusinessSettings
  paymentConfirmed?: boolean
}

export async function generatePDFReceipt(data: ReceiptData): Promise<Blob> {
  const { order, items, additionalCharges = [], businessSettings, paymentConfirmed = false } = data

  // Create new PDF document
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Set font
  pdf.setFont("helvetica")

  let yPosition = 20

  // Header - Business Logo and Name
  if (businessSettings.logo_url) {
    try {
      // Note: In a real implementation, you'd need to handle CORS for external images
      // For now, we'll just add space for the logo
      yPosition += 15
    } catch (error) {
      console.warn("Could not load logo:", error)
    }
  }

  // Business Name
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.text(businessSettings.business_name, 105, yPosition, { align: "center" })
  yPosition += 8

  // Business Address
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  if (businessSettings.business_address) {
    const addressLines = businessSettings.business_address.split("\n")
    addressLines.forEach((line) => {
      pdf.text(line.trim(), 105, yPosition, { align: "center" })
      yPosition += 4
    })
  }

  // Business Contact
  if (businessSettings.business_phone) {
    pdf.text(`Phone: ${businessSettings.business_phone}`, 105, yPosition, { align: "center" })
    yPosition += 4
  }
  if (businessSettings.business_email) {
    pdf.text(`Email: ${businessSettings.business_email}`, 105, yPosition, { align: "center" })
    yPosition += 4
  }

  yPosition += 10

  // Receipt Title
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  const receiptTitle = paymentConfirmed ? "PAYMENT RECEIPT" : "ORDER RECEIPT"
  pdf.text(receiptTitle, 105, yPosition, { align: "center" })
  yPosition += 10

  // Order Information
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")

  // Order details in two columns
  pdf.text(`Order ID: #${order.id.slice(0, 8)}`, 20, yPosition)
  pdf.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 120, yPosition)
  yPosition += 6

  pdf.text(`Customer: ${order.customer_name}`, 20, yPosition)
  pdf.text(`Status: ${order.status.replace("_", " ").toUpperCase()}`, 120, yPosition)
  yPosition += 6

  if (order.customer_phone) {
    pdf.text(`Phone: ${order.customer_phone}`, 20, yPosition)
  }
  if (paymentConfirmed) {
    pdf.text(`Payment: CONFIRMED`, 120, yPosition)
  }
  yPosition += 6

  if (order.customer_address) {
    pdf.text(`Address: ${order.customer_address}`, 20, yPosition)
    yPosition += 6
  }

  yPosition += 5

  // Line separator
  pdf.line(20, yPosition, 190, yPosition)
  yPosition += 8

  // Items header
  pdf.setFont("helvetica", "bold")
  pdf.text("Item", 20, yPosition)
  pdf.text("Qty", 120, yPosition)
  pdf.text("Price", 140, yPosition)
  pdf.text("Total", 170, yPosition)
  yPosition += 6

  pdf.line(20, yPosition, 190, yPosition)
  yPosition += 6

  // Items
  pdf.setFont("helvetica", "normal")
  let itemsSubtotal = 0

  items.forEach((item) => {
    const itemTotal = item.unit_price * item.quantity
    itemsSubtotal += itemTotal

    // Handle long product names by wrapping text
    const productName = item.product_name.length > 30 
      ? item.product_name.substring(0, 30) + "..." 
      : item.product_name

    pdf.text(productName, 20, yPosition)
    pdf.text(item.quantity.toString(), 120, yPosition)
    pdf.text(`KSh ${item.unit_price.toFixed(2)}`, 140, yPosition)
    pdf.text(`KSh ${itemTotal.toFixed(2)}`, 170, yPosition)
    yPosition += 5
  })

  // Add spacing before additional charges section
  if (additionalCharges.length > 0) {
    yPosition += 3
    pdf.line(20, yPosition, 190, yPosition)
    yPosition += 6

    // Additional Charges header
    pdf.setFont("helvetica", "bold")
    pdf.text("Additional Charges", 20, yPosition)
    yPosition += 6

    pdf.line(20, yPosition, 190, yPosition)
    yPosition += 6

    // Additional charges items
    pdf.setFont("helvetica", "normal")
    let chargesSubtotal = 0

    additionalCharges.forEach((charge) => {
      chargesSubtotal += charge.amount

      // Charge name with description if available
      let chargeName = charge.name
      if (charge.description) {
        chargeName += ` (${charge.description})`
      }
      
      // Handle long charge names
      if (chargeName.length > 50) {
        chargeName = chargeName.substring(0, 50) + "..."
      }

      pdf.text(chargeName, 20, yPosition)
      pdf.text(`KSh ${charge.amount.toFixed(2)}`, 170, yPosition)
      yPosition += 5
    })

    yPosition += 3
    pdf.line(20, yPosition, 190, yPosition)
    yPosition += 8

    // Subtotals breakdown
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    
    pdf.text(`Items Subtotal:`, 120, yPosition)
    pdf.text(`KSh ${itemsSubtotal.toFixed(2)}`, 170, yPosition)
    yPosition += 6

    pdf.text(`Additional Charges:`, 120, yPosition)
    pdf.text(`KSh ${chargesSubtotal.toFixed(2)}`, 170, yPosition)
    yPosition += 6

    // Total line
    pdf.line(120, yPosition, 190, yPosition)
    yPosition += 6

    // Grand Total
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    const grandTotal = itemsSubtotal + chargesSubtotal
    pdf.text(`TOTAL:`, 120, yPosition)
    pdf.text(`KSh ${grandTotal.toFixed(2)}`, 170, yPosition)
    yPosition += 8

  } else {
    // No additional charges - just show items total
    yPosition += 3
    pdf.line(20, yPosition, 190, yPosition)
    yPosition += 6

    // Total
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    pdf.text(`TOTAL:`, 120, yPosition)
    pdf.text(`KSh ${order.total_amount.toFixed(2)}`, 170, yPosition)
    yPosition += 8
  }

  // Payment Method
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.text(`Payment Method: ${order.payment_method.replace("_", " ").toUpperCase()}`, 20, yPosition)
  yPosition += 10

  // Generate QR Code
  try {
    const qrData = JSON.stringify({
      orderId: order.id,
      total: order.total_amount,
      date: order.created_at,
      customer: order.customer_name,
      itemsCount: items.length,
      chargesCount: additionalCharges.length,
    })

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 100,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    // Add QR code to PDF
    pdf.addImage(qrCodeDataURL, "PNG", 20, yPosition, 25, 25)

    // QR code description
    pdf.text("Scan QR code for order verification", 50, yPosition + 12)
    yPosition += 30
  } catch (error) {
    console.error("Error generating QR code:", error)
    yPosition += 10
  }

  // Footer
  if (businessSettings.receipt_footer) {
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    pdf.text(businessSettings.receipt_footer, 105, yPosition, { align: "center" })
    yPosition += 6
  }

  // Timestamp
  pdf.setFontSize(8)
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, yPosition, { align: "center" })

  return pdf.output("blob")
}

export async function emailReceipt(
  receiptBlob: Blob,
  customerEmail: string,
  order: Order,
  businessSettings: BusinessSettings,
): Promise<boolean> {
  try {
    // Convert blob to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1]
        resolve(base64String)
      }
      reader.readAsDataURL(receiptBlob)
    })

    // In a real implementation, you would send this to your email service
    // For now, we'll simulate the email sending
    const emailData = {
      to: customerEmail,
      subject: `Receipt for Order #${order.id.slice(0, 8)} - ${businessSettings.business_name}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Dear ${order.customer_name},</p>
        <p>Thank you for your order with ${businessSettings.business_name}. Please find your receipt attached.</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: #${order.id.slice(0, 8)}</li>
          <li>Total: KSh ${order.total_amount.toFixed(2)}</li>
          <li>Status: ${order.status.replace("_", " ")}</li>
        </ul>
        <p>If you have any questions, please contact us at ${businessSettings.business_phone} or ${businessSettings.business_email}.</p>
        <p>Best regards,<br>${businessSettings.business_name}</p>
      `,
      attachments: [
        {
          filename: `receipt-${order.id.slice(0, 8)}.pdf`,
          content: base64,
          encoding: "base64",
        },
      ],
    }

    // Simulate API call to email service
    console.log("Email would be sent:", emailData)

    // In production, replace with actual email service call:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(emailData)
    // })
    // return response.ok

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

export function downloadPDFReceipt(blob: Blob, orderId: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `receipt-${orderId.slice(0, 8)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}