"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PushNotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }

    // Check for existing subscription
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub)
        })
      })
    }
  }, [])

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not supported",
        description: "This browser doesn't support notifications.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        await subscribeToPush()
        toast({
          title: "Notifications enabled",
          description: "You'll now receive order updates and promotions.",
        })
      } else {
        toast({
          title: "Notifications blocked",
          description: "You can enable them later in your browser settings.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      toast({
        title: "Error",
        description: "Failed to enable notifications.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // In production, use your VAPID public key
      const vapidPublicKey = "your-vapid-public-key"

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      setSubscription(subscription)

      // Send subscription to server
      // await fetch('/api/push-subscription', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription)
      // })

      console.log("Push subscription:", subscription)
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
    }
  }

  const unsubscribeFromPush = async () => {
    if (!subscription) return

    setIsLoading(true)

    try {
      await subscription.unsubscribe()
      setSubscription(null)

      toast({
        title: "Notifications disabled",
        description: "You won't receive push notifications anymore.",
      })
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error)
      toast({
        title: "Error",
        description: "Failed to disable notifications.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (permission) {
      case "granted":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Enabled
          </Badge>
        )
      case "denied":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        )
      default:
        return <Badge variant="secondary">Not Set</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Get notified about order updates, delivery status, and special offers.
        </p>

        {permission === "default" && (
          <Button onClick={requestPermission} disabled={isLoading} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
        )}

        {permission === "granted" && subscription && (
          <Button
            variant="outline"
            onClick={unsubscribeFromPush}
            disabled={isLoading}
            className="w-full bg-transparent"
          >
            <BellOff className="h-4 w-4 mr-2" />
            Disable Notifications
          </Button>
        )}

        {permission === "denied" && (
          <div className="text-sm text-muted-foreground">
            <p>Notifications are blocked. To enable them:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Click the lock icon in your address bar</li>
              <li>Change notifications to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
