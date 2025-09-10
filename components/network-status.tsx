"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)

      // Show status briefly when it changes
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
    }

    // Set initial status
    setIsOnline(navigator.onLine)

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  if (!showStatus && isOnline) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Back Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline Mode
          </>
        )}
      </Badge>
    </div>
  )
}
