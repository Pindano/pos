"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bell, Check, Mail, Gift, AlertCircle } from "lucide-react"
import { NotificationService } from "@/lib/notifications"
import type { Notification } from "@/lib/types"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    const allNotifications = NotificationService.getCustomerNotifications()
    setNotifications(allNotifications)
    setUnreadCount(allNotifications.filter((n) => !n.read).length)
  }

  const markAsRead = (notificationId: string) => {
    NotificationService.markAsRead(notificationId)
    loadNotifications()
  }

  const markAllAsRead = () => {
    notifications.forEach((n) => {
      if (!n.read) {
        NotificationService.markAsRead(n.id)
      }
    })
    loadNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_confirmation":
      case "status_update":
        return <AlertCircle className="h-4 w-4" />
      case "price_update":
        return <Mail className="h-4 w-4" />
      case "promotion":
        return <Gift className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order_confirmation":
        return "text-green-600"
      case "status_update":
        return "text-blue-600"
      case "price_update":
        return "text-orange-600"
      case "promotion":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="bg-transparent">
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <div className={`flex items-start gap-3 p-3 rounded-lg ${!notification.read ? "bg-muted/50" : ""}`}>
                  <div className={`p-2 rounded-full bg-muted ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.sent_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.read && (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {notification.type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
