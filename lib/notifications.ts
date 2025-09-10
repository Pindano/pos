import type { Order, Notification, NotificationType } from "./types"

// Mock notification store - in production, use Supabase
const notifications: Notification[] = []

export interface NotificationTemplate {
  type: NotificationType
  title: string
  body: string
  emailSubject?: string
  emailBody?: string
  smsBody?: string
}

export const notificationTemplates: Record<string, NotificationTemplate> = {
  order_confirmation: {
    type: "order_confirmation",
    title: "Order Confirmed!",
    body: "Your order has been received and confirmed.",
    emailSubject: "Order Confirmation - Fresh Market",
    emailBody: "Thank you for your order! We have received your order and it is being processed.",
    smsBody: "Your Fresh Market order has been confirmed. We will notify you when it's ready for delivery.",
  },
  order_preparing: {
    type: "status_update",
    title: "Order Being Prepared",
    body: "Your order is now being prepared for delivery.",
    emailSubject: "Order Update - Being Prepared",
    emailBody: "Good news! Your order is now being prepared by our team.",
    smsBody: "Your Fresh Market order is being prepared. Estimated delivery time will be updated soon.",
  },
  order_out_for_delivery: {
    type: "status_update",
    title: "Out for Delivery",
    body: "Your order is on the way to your delivery address.",
    emailSubject: "Order Update - Out for Delivery",
    emailBody: "Your order is now out for delivery and should arrive soon.",
    smsBody: "Your Fresh Market order is out for delivery. Please be available to receive it.",
  },
  order_delivered: {
    type: "status_update",
    title: "Order Delivered",
    body: "Your order has been successfully delivered. Thank you!",
    emailSubject: "Order Delivered - Thank You!",
    emailBody: "Your order has been delivered successfully. Thank you for choosing Fresh Market!",
    smsBody: "Your Fresh Market order has been delivered. Thank you for your business!",
  },
  price_update: {
    type: "price_update",
    title: "Price Update",
    body: "Prices have been updated for some products.",
    emailSubject: "Fresh Market - Price Updates",
    emailBody: "We have updated prices for some of our products. Check out the latest prices on our app.",
    smsBody: "Fresh Market: Some product prices have been updated. Visit our app to see the latest prices.",
  },
  promotion: {
    type: "promotion",
    title: "Special Offer",
    body: "Don't miss out on our latest deals and promotions!",
    emailSubject: "Fresh Market - Special Offers Just for You!",
    emailBody: "We have exciting new offers and promotions available. Visit our app to explore the deals.",
    smsBody: "Fresh Market: Special offers available now! Check our app for exclusive deals.",
  },
}

export class NotificationService {
  // Send push notification
  static async sendPushNotification(
    subscription: PushSubscription | null,
    payload: {
      title: string
      body: string
      icon?: string
      badge?: string
      data?: any
    },
  ): Promise<boolean> {
    if (!subscription) {
      console.log("No push subscription available")
      return false
    }

    try {
      // In production, this would send to your push service
      console.log("Sending push notification:", payload)

      // Mock successful send
      return true
    } catch (error) {
      console.error("Failed to send push notification:", error)
      return false
    }
  }

  // Send email notification
  static async sendEmailNotification(email: string, subject: string, body: string): Promise<boolean> {
    try {
      // In production, integrate with email service like Resend or SendGrid
      console.log("Sending email notification:", { email, subject, body })

      // Mock successful send
      return true
    } catch (error) {
      console.error("Failed to send email notification:", error)
      return false
    }
  }

  // Send SMS notification
  static async sendSMSNotification(phone: string, message: string): Promise<boolean> {
    try {
      // In production, integrate with SMS service like Twilio
      console.log("Sending SMS notification:", { phone, message })

      // Mock successful send
      return true
    } catch (error) {
      console.error("Failed to send SMS notification:", error)
      return false
    }
  }

  // Send order status notification
  static async sendOrderStatusNotification(
    order: Order,
    templateKey: string,
    pushSubscription?: PushSubscription | null,
  ): Promise<void> {
    const template = notificationTemplates[templateKey]
    if (!template) {
      console.error("Notification template not found:", templateKey)
      return
    }

    const notification: Notification = {
      id: `notif-${Date.now()}`,
      customer_id: order.customer_id,
      type: template.type,
      title: template.title,
      message: template.body.replace("{orderId}", order.id),
      sent_at: new Date().toISOString(),
      read: false,
    }

    // Store notification
    notifications.push(notification)

    // Send push notification
    if (pushSubscription) {
      await this.sendPushNotification(pushSubscription, {
        title: template.title,
        body: template.body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: { orderId: order.id, type: "order_update" },
      })
    }

    // Send email notification
    if (order.customer_email && template.emailSubject && template.emailBody) {
      await this.sendEmailNotification(
        order.customer_email,
        template.emailSubject,
        template.emailBody.replace("{orderId}", order.id).replace("{customerName}", order.customer_name),
      )
    }

    // Send SMS notification
    if (template.smsBody) {
      await this.sendSMSNotification(order.customer_phone, template.smsBody.replace("{orderId}", order.id))
    }
  }

  // Send promotional notification
  static async sendPromotionalNotification(
    title: string,
    message: string,
    customers: { phone: string; email?: string }[],
    pushSubscriptions: PushSubscription[] = [],
  ): Promise<void> {
    const notification: Notification = {
      id: `promo-${Date.now()}`,
      type: "promotion",
      title,
      message,
      sent_at: new Date().toISOString(),
      read: false,
    }

    notifications.push(notification)

    // Send push notifications
    for (const subscription of pushSubscriptions) {
      await this.sendPushNotification(subscription, {
        title,
        body: message,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: { type: "promotion" },
      })
    }

    // Send email and SMS to customers
    for (const customer of customers) {
      if (customer.email) {
        await this.sendEmailNotification(customer.email, title, message)
      }
      await this.sendSMSNotification(customer.phone, message)
    }
  }

  // Get notifications for customer
  static getCustomerNotifications(customerId?: string): Notification[] {
    return notifications
      .filter((n) => !customerId || n.customer_id === customerId)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
  }

  // Mark notification as read
  static markAsRead(notificationId: string): void {
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }
}
