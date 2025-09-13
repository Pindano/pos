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

// Helper function to convert decimal to fraction
function decimalToFraction(decimal: number): string {
  // Handle whole numbers
  if (decimal % 1 === 0) {
    return decimal.toString()
  }

  // Common fractions lookup for better readability
  const commonFractions: { [key: string]: string } = {
    '0.5': '½',
    '0.25': '¼',
    '0.75': '¾',
    '0.33': '⅓',
    '0.67': '⅔',
    '0.2': '⅕',
    '0.4': '⅖',
    '0.6': '⅗',
    '0.8': '⅘',
    '0.17': '⅙',
    '0.83': '⅚',
    '0.125': '⅛',
    '0.375': '⅜',
    '0.625': '⅝',
    '0.875': '⅞'
  }

  // Check for common fractions first
  const decimalPart = (decimal % 1).toFixed(3)
  if (commonFractions[decimalPart]) {
    const wholePart = Math.floor(decimal)
    return wholePart > 0 ? `${wholePart}${commonFractions[decimalPart]}` : commonFractions[decimalPart]
  }

  // Fall back to decimal representation for uncommon fractions
  return decimal.toString()
}

// Helper function to format units properly (handles pluralization if needed)
function formatProductUnit(unit: string, quantity: number): string {
  if (!unit) return 'pcs' // fallback if no unit provided
  
  // Some units don't need pluralization
  const nonPluralUnits = ['kg', 'g', 'ltr', 'ml', 'cm', 'm', 'km', 'lb', 'oz']
  if (nonPluralUnits.includes(unit.toLowerCase())) {
    return unit
  }
  
  // Handle pluralization for countable units
  if (quantity === 1) {
    return unit
  } else {
    // Simple pluralization rules
    if (unit.endsWith('s')) return unit
    if (unit.endsWith('ch')) return `${unit}es`
    if (unit.endsWith('y')) return `${unit.slice(0, -1)}ies`
    return `${unit}s`
  }
}

// Helper function to determine appropriate units based on product name
function getProductUnit(productName: string, quantity: number): string {
  const name = productName.toLowerCase()
  
  // Weight-based items (typically sold by kg)
  if (name.includes('garlic') || name.includes('ginger') || name.includes('meat') || 
      name.includes('flour') || name.includes('sugar') || name.includes('rice')) {
    return quantity === 1 ? 'kg' : 'kg'
  }
  
  // Liquid items
  if (name.includes('oil') || name.includes('milk') || name.includes('juice')) {
    return quantity === 1 ? 'ltr' : 'ltrs'
  }
  
  // Bundle/bunch items
  if (name.includes('dhania') || name.includes('spinach') || name.includes('kale') ||
      name.includes('sukuma')) {
    return quantity === 1 ? 'bunch' : 'bunches'
  }
  
  // Bag items
  if (name.includes('charcoal') || name.includes('cement')) {
    return quantity === 1 ? 'bag' : 'bags'
  }
  
  // Default to pieces for countable items
  return quantity === 1 ? 'pc' : 'pcs'
}

export async function generatePDFReceipt(data: ReceiptData): Promise<Blob> {
  const { order, items, additionalCharges = [], businessSettings, paymentConfirmed = false } = data

  // Create new PDF document with better margins
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Set font
  pdf.setFont("helvetica")

  let yPosition = 20
  const leftMargin = 15
  const rightMargin = 195
  const pageWidth = 210
  const pageHeight = 297

  // Function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
    }
  }

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
  pdf.text(businessSettings.business_name, pageWidth/2, yPosition, { align: "center" })
  yPosition += 8

  // Business Address
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  if (businessSettings.business_address) {
    const addressLines = businessSettings.business_address.split("\n")
    addressLines.forEach((line) => {
      pdf.text(line.trim(), pageWidth/2, yPosition, { align: "center" })
      yPosition += 4
    })
  }

  // Business Contact
  if (businessSettings.business_phone) {
    pdf.text(`Phone: ${businessSettings.business_phone}`, pageWidth/2, yPosition, { align: "center" })
    yPosition += 4
  }
  if (businessSettings.business_email) {
    pdf.text(`Email: ${businessSettings.business_email}`, pageWidth/2, yPosition, { align: "center" })
    yPosition += 4
  }

  yPosition += 10

  // Receipt Title
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  const receiptTitle = paymentConfirmed ? "PAYMENT RECEIPT" : "ORDER RECEIPT"
  pdf.text(receiptTitle, pageWidth/2, yPosition, { align: "center" })
  yPosition += 10

  // Order Information
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")

  // Order details in two columns
  pdf.text(`Order ID: #${order.id.slice(0, 8)}`, leftMargin, yPosition)
  pdf.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 120, yPosition)
  yPosition += 6

  pdf.text(`Customer: ${order.customer_name}`, leftMargin, yPosition)
  pdf.text(`Status: ${order.status.replace("_", " ").toUpperCase()}`, 120, yPosition)
  yPosition += 6

  if (order.customer_phone) {
    pdf.text(`Phone: ${order.customer_phone}`, leftMargin, yPosition)
  }
  if (paymentConfirmed) {
    pdf.text(`Payment: CONFIRMED`, 120, yPosition)
  }
  yPosition += 6

  if (order.customer_address) {
    // Handle long addresses by splitting into multiple lines
    const maxAddressLength = 50
    const address = order.customer_address
    if (address.length > maxAddressLength) {
      const addressParts = address.split(',').map(part => part.trim())
      let currentLine = ''
      addressParts.forEach((part, index) => {
        if ((currentLine + part).length <= maxAddressLength) {
          currentLine += (currentLine ? ', ' : '') + part
        } else {
          if (currentLine) {
            pdf.text(`Address: ${currentLine}`, leftMargin, yPosition)
            yPosition += 5
          }
          currentLine = part
        }
        if (index === addressParts.length - 1 && currentLine) {
          const prefix = yPosition === (yPosition - 5) ? 'Address: ' : '         '
          pdf.text(`${prefix}${currentLine}`, leftMargin, yPosition)
          yPosition += 6
        }
      })
    } else {
      pdf.text(`Address: ${address}`, leftMargin, yPosition)
      yPosition += 6
    }
  }

  yPosition += 5

  // Check for page break before items table
  checkPageBreak(30)

  // Line separator
  pdf.line(leftMargin, yPosition, rightMargin, yPosition)
  yPosition += 8

  // Items header with better spacing
  pdf.setFont("helvetica", "bold")
  pdf.text("Item", leftMargin, yPosition)
  pdf.text("Qty", 110, yPosition)
  pdf.text("Price", 135, yPosition)
  pdf.text("Total", 170, yPosition)
  yPosition += 6

  pdf.line(leftMargin, yPosition, rightMargin, yPosition)
  yPosition += 6

  // Items with better formatting
  pdf.setFont("helvetica", "normal")
  let itemsSubtotal = 0

  items.forEach((item) => {
    // Check for page break before each item
    checkPageBreak(8)
    
    const itemTotal = item.unit_price * item.quantity
    itemsSubtotal += itemTotal

    // Handle long product names by using text wrapping
    const productName = item.product_name.length > 35 
      ? item.product_name.substring(0, 32) + "..." 
      : item.product_name

    // Format quantity with units and fractions
    const formattedQuantity = decimalToFraction(item.quantity)
    const unit = formatProductUnit(item.unit || 'pcs', item.quantity) // Use item.unit from database
    const quantityWithUnit = `${formattedQuantity} ${unit}`

    pdf.text(productName, leftMargin, yPosition)
    pdf.text(quantityWithUnit, 110, yPosition)
    pdf.text(`KSh ${item.unit_price.toFixed(2)}`, 135, yPosition)
    pdf.text(`KSh ${itemTotal.toFixed(2)}`, 170, yPosition)
    yPosition += 5
  })

  // Add spacing before additional charges section
  if (additionalCharges.length > 0) {
    yPosition += 3
    checkPageBreak(20)
    
    pdf.line(leftMargin, yPosition, rightMargin, yPosition)
    yPosition += 6

    // Additional Charges header
    pdf.setFont("helvetica", "bold")
    pdf.text("Additional Charges", leftMargin, yPosition)
    yPosition += 6

    pdf.line(leftMargin, yPosition, rightMargin, yPosition)
    yPosition += 6

    // Additional charges items
    pdf.setFont("helvetica", "normal")
    let chargesSubtotal = 0

    additionalCharges.forEach((charge) => {
      checkPageBreak(8)
      chargesSubtotal += charge.amount

      // Charge name with description if available
      let chargeName = charge.name
      if (charge.description) {
        chargeName += ` (${charge.description})`
      }
      
      // Handle long charge names with proper text wrapping
      if (chargeName.length > 45) {
        const firstLine = chargeName.substring(0, 45)
        const secondLine = chargeName.substring(45)
        pdf.text(firstLine, leftMargin, yPosition)
        yPosition += 4
        pdf.text(`  ${secondLine}`, leftMargin, yPosition)
      } else {
        pdf.text(chargeName, leftMargin, yPosition)
      }

      pdf.text(`KSh ${charge.amount.toFixed(2)}`, 170, yPosition)
      yPosition += 5
    })

    yPosition += 3
    checkPageBreak(25)
    
    pdf.line(leftMargin, yPosition, rightMargin, yPosition)
    yPosition += 8

    // Subtotals breakdown
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    
    pdf.text(`Items Subtotal:`, 110, yPosition)
    pdf.text(`KSh ${itemsSubtotal.toFixed(2)}`, 170, yPosition)
    yPosition += 6

    pdf.text(`Additional Charges:`, 110, yPosition)
    pdf.text(`KSh ${chargesSubtotal.toFixed(2)}`, 170, yPosition)
    yPosition += 6

    // Total line
    pdf.line(110, yPosition, rightMargin, yPosition)
    yPosition += 6

    // Grand Total
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    const grandTotal = itemsSubtotal + chargesSubtotal
    pdf.text(`TOTAL:`, 110, yPosition)
    pdf.text(`KSh ${grandTotal.toFixed(2)}`, 170, yPosition)
    yPosition += 8

  } else {
    // No additional charges - just show items total
    yPosition += 3
    checkPageBreak(15)
    
    pdf.line(leftMargin, yPosition, rightMargin, yPosition)
    yPosition += 6

    // Total
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    pdf.text(`TOTAL:`, 110, yPosition)
    pdf.text(`KSh ${order.total_amount.toFixed(2)}`, 170, yPosition)
    yPosition += 8
  }

  // Payment Method
  checkPageBreak(15)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.text(`Payment Method: ${order.payment_method.replace("_", " ").toUpperCase()}`, leftMargin, yPosition)
  yPosition += 10

  // Generate QR Code
  checkPageBreak(35)
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
    pdf.addImage(qrCodeDataURL, "PNG", leftMargin, yPosition, 25, 25)

    // QR code description
    pdf.text("Scan QR code for order verification", leftMargin + 30, yPosition + 12)
    yPosition += 30
  } catch (error) {
    console.error("Error generating QR code:", error)
    yPosition += 10
  }

  // Footer
  checkPageBreak(20)
  if (businessSettings.receipt_footer) {
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    pdf.text(businessSettings.receipt_footer, pageWidth/2, yPosition, { align: "center" })
    yPosition += 6
  }

  // Timestamp
  pdf.setFontSize(8)
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth/2, yPosition, { align: "center" })

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