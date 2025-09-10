"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, Package, Truck, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Order } from "@/lib/types"

interface OrderStatusUpdaterProps {
  order: Order
}

const statusOptions = [
  { value: "pending", label: "Pending", icon: Clock, color: "text-yellow-600" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "text-blue-600" },
  { value: "preparing", label: "Preparing", icon: Package, color: "text-orange-600" },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Truck, color: "text-purple-600" },
  { value: "delivered", label: "Delivered", icon: CheckCircle, color: "text-green-600" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-600" },
]

export function OrderStatusUpdater({ order }: OrderStatusUpdaterProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(order.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const currentStatus = statusOptions.find((s) => s.value === order.status)
  const StatusIcon = currentStatus?.icon || Clock

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.status) return

    setIsUpdating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({
          status: selectedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Order status has been updated to ${selectedStatus.replace("_", " ")}.`,
      })

      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${currentStatus?.color}`} />
          Order Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Status:</span>
          <Badge variant="secondary" className={currentStatus?.color}>
            {order.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Update Status:</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => {
                const Icon = status.icon
                return (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${status.color}`} />
                      {status.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleUpdateStatus}
          disabled={isUpdating || selectedStatus === order.status}
          className="w-full"
        >
          {isUpdating ? "Updating..." : "Update Status"}
        </Button>
      </CardContent>
    </Card>
  )
}
