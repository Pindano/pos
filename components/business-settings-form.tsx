"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface BusinessSettings {
  id?: string
  business_name: string
  business_address: string
  business_phone: string
  business_email: string
  logo_url: string
  receipt_footer: string
}

interface BusinessSettingsFormProps {
  initialSettings: BusinessSettings | null
}

export function BusinessSettingsForm({ initialSettings }: BusinessSettingsFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<BusinessSettings>({
    business_name: initialSettings?.business_name || "Wambos Veges",
    business_address: initialSettings?.business_address || "Starehe, Nairobi",
    business_phone: initialSettings?.business_phone || "+254715105040",
    business_email: initialSettings?.business_email || "",
    logo_url: initialSettings?.logo_url || "",
    receipt_footer: initialSettings?.receipt_footer || "Thank you for your business!",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (initialSettings?.id) {
        // Update existing settings
        const { error } = await supabase.from("business_settings").update(settings).eq("id", initialSettings.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase.from("business_settings").insert([settings])

        if (error) throw error
      }

      toast({
        title: "Settings updated",
        description: "Business settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            value={settings.business_name}
            onChange={(e) => setSettings((prev) => ({ ...prev, business_name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="business_address">Business Address</Label>
          <Textarea
            id="business_address"
            value={settings.business_address}
            onChange={(e) => setSettings((prev) => ({ ...prev, business_address: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="business_phone">Phone Number</Label>
            <Input
              id="business_phone"
              type="tel"
              value={settings.business_phone}
              onChange={(e) => setSettings((prev) => ({ ...prev, business_phone: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="business_email">Email Address</Label>
            <Input
              id="business_email"
              type="email"
              value={settings.business_email}
              onChange={(e) => setSettings((prev) => ({ ...prev, business_email: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="logo_url">Logo URL (Optional)</Label>
          <Input
            id="logo_url"
            type="url"
            value={settings.logo_url}
            onChange={(e) => setSettings((prev) => ({ ...prev, logo_url: e.target.value }))}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div>
          <Label htmlFor="receipt_footer">Receipt Footer Message</Label>
          <Textarea
            id="receipt_footer"
            value={settings.receipt_footer}
            onChange={(e) => setSettings((prev) => ({ ...prev, receipt_footer: e.target.value }))}
            rows={2}
            placeholder="Thank you for your business!"
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
