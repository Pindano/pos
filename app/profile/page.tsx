"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { User, Bell, LogOut, Settings, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { NotificationCenter } from "@/components/notification-center"
import { PushNotificationSetup } from "@/components/push-notification-setup"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  phone?: string
  address?: string
  full_name?: string
  notification_preferences?: {
    push_enabled: boolean
    email_enabled: boolean
    order_updates: boolean
    promotions: boolean
  }
}

interface Notification {
  id: string
  title: string
  message: string
  type: "order" | "promotion" | "system"
  read: boolean
  created_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        await Promise.all([fetchProfile(user.id), fetchNotifications(user.id)])
      }
    } catch (error) {
      console.error("Error checking user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("customers").select("*").eq("id", userId).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
        return
      }

      if (data) {
        setProfile(data)
      } else {
        setProfile({
          id: userId,
          email: user?.email || "",
          phone: "",
          address: "",
          full_name: "",
          notification_preferences: {
            push_enabled: false,
            email_enabled: true,
            order_updates: true,
            promotions: false
          }
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching notifications:", error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const saveProfile = async () => {
    if (!profile || !user) return

    setIsSaving(true)
    try {
      const { error } = await supabase.from("customers").upsert({
        id: user.id,
        email: user.email,
        phone: profile.phone,
        address: profile.address,
        full_name: profile.full_name,
        notification_preferences: profile.notification_preferences,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      })
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Sign In Required</CardTitle>
              <p className="text-muted-foreground">Please sign in to view your profile and notifications.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => router.push("/auth/login")} className="w-full">
                Sign In
              </Button>
              <Button onClick={() => router.push("/auth/signup")} variant="outline" className="w-full">
                Create Account
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Profile & Notifications</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {notifications.filter((n) => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {notifications.filter((n) => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile?.full_name || ""}
                      onChange={(e) => setProfile((prev) => (prev ? { ...prev, full_name: e.target.value } : null))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email || ""} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile?.phone || ""}
                      onChange={(e) => setProfile((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea
                    id="address"
                    value={profile?.address || ""}
                    onChange={(e) => setProfile((prev) => (prev ? { ...prev, address: e.target.value } : null))}
                    placeholder="Enter your delivery address"
                    rows={3}
                  />
                </div>
                <Button onClick={saveProfile} disabled={isSaving} className="w-full md:w-auto">
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={profile?.notification_preferences?.email_enabled || false}
                    onCheckedChange={(checked) => setProfile((prev) => prev ? {
                      ...prev,
                      notification_preferences: { ...prev.notification_preferences, email_enabled: checked }
                    } : null)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                  </div>
                  <Switch
                    checked={profile?.notification_preferences?.order_updates || false}
                    onCheckedChange={(checked) => setProfile((prev) => prev ? {
                      ...prev,
                      notification_preferences: { ...prev.notification_preferences, order_updates: checked }
                    } : null)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Promotions & Offers</Label>
                    <p className="text-sm text-muted-foreground">Receive promotional notifications</p>
                  </div>
                  <Switch
                    checked={profile?.notification_preferences?.promotions || false}
                    onCheckedChange={(checked) => setProfile((prev) => prev ? {
                      ...prev,
                      notification_preferences: { ...prev.notification_preferences, promotions: checked }
                    } : null)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => router.push("/orders")} variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  View Order History
                </Button>
                <Separator />
                <Button onClick={signOut} variant="outline" className="w-full justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* Reuse existing components */}
            <PushNotificationSetup />
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}