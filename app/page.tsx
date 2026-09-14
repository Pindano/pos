import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Store, Lock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <Store className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter">Wambo's Vegetables</h1>
          <p className="text-muted-foreground">
            Point of Sale & Order Management System
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Authorized Personnel Only</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              This system is restricted to administrators and staff members for managing orders and inventory.
            </p>

            <Link href="/admin">
              <Button className="w-full" size="lg">
                Access Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}