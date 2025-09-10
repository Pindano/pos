"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Bell, Mail, MessageSquare, Users } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { NotificationService } from "@/lib/notifications"

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [notificationType, setNotificationType] = useState("promotion")
  const [targetAudience, setTargetAudience] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both title and message.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Mock customer data - in production, fetch from database
      const customers = [
        { phone: "+1234567890", email: "customer1@example.com" },
        { phone: "+1234567891", email: "customer2@example.com" },
        { phone: "+1234567892", email: "customer3@example.com" },
      ]

      await NotificationService.sendPromotionalNotification(
        title,
        message,
        customers,
        [], // Push subscriptions would be fetched from database
      )

      toast({
        title: "Notification sent!",
        description: `Successfully sent to ${customers.length} customers.`,
      })

      // Reset form
      setTitle("")
      setMessage("")
      setNotificationType("promotion")
      setTargetAudience("all")
    } catch (error) {
      toast({
        title: "Failed to send",
        description: "There was an error sending the notification.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Notification Center</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Send Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Notification Type</Label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="price_update">Price Update</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="recent">Recent Customers</SelectItem>
                      <SelectItem value="frequent">Frequent Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">{title.length}/50 characters</p>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message"
                  rows={4}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">{message.length}/200 characters</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  This will send notifications via:
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Bell className="h-4 w-4" />
                      <span>Push</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>SMS</span>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSendNotification} disabled={isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? "Sending..." : "Send Notification"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => {
                  setTitle("Fresh Produce Available!")
                  setMessage("New fresh vegetables and fruits have arrived. Order now for the best selection!")
                  setNotificationType("promotion")
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                New Stock Arrival
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => {
                  setTitle("Weekend Special Offers")
                  setMessage("Enjoy special discounts on selected items this weekend. Don't miss out!")
                  setNotificationType("promotion")
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Weekend Promotion
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => {
                  setTitle("Price Updates")
                  setMessage("We've updated prices for some products. Check the app for the latest pricing.")
                  setNotificationType("price_update")
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Price Update Notice
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">89%</p>
                  <p className="text-sm text-muted-foreground">Delivery Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
