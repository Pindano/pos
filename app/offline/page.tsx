"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">You're Offline</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            It looks like you're not connected to the internet. Some features may not be available.
          </p>

          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Link href="/" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                Browse Products Offline
              </Button>
            </Link>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>You can still:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Browse cached products</li>
              <li>View your cart</li>
              <li>Check previous orders</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
