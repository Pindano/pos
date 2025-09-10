import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BusinessSettingsForm } from "@/components/business-settings-form"

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  // Fetch business settings
  const { data: businessSettings, error } = await supabase.from("business_settings").select("*").single()

  if (error) {
    console.error("Error fetching business settings:", error)
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessSettingsForm initialSettings={businessSettings} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
