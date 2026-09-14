"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DuplicateOrderButtonProps {
    order: any
    items: any[]
    additionalCharges?: any[]
}

export function DuplicateOrderButton({ order, items, additionalCharges = [] }: DuplicateOrderButtonProps) {
    const [isDuplicating, setIsDuplicating] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDuplicate = async () => {
        setIsDuplicating(true)
        try {
            // 1. Create new order
            const { data: newOrder, error: orderError } = await supabase
                .from("orders")
                .insert({
                    customer_name: order.customer_name,
                    customer_phone: order.customer_phone,
                    customer_email: order.customer_email,
                    customer_address: order.customer_address,
                    notes: order.notes,
                    status: "pending",
                    payment_status: "pending",
                    payment_method: "cash",
                    total_amount: order.total_amount,
                    delivery_address: order.delivery_address
                })
                .select()
                .single()

            if (orderError) throw orderError

            // 2. Insert items
            if (items.length > 0) {
                const itemsToInsert = items.map(item => ({
                    order_id: newOrder.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price
                }))

                const { error: itemsError } = await supabase
                    .from("order_items")
                    .insert(itemsToInsert)

                if (itemsError) throw itemsError
            }

            // 3. Insert additional charges
            // We need to fetch them first if not passed, but for now let's assume they might be passed or we skip them if not critical, 
            // or better, let's fetch them here if we want to be sure, but `items` are passed from parent.
            // The parent `page.tsx` doesn't seem to fetch additional charges explicitly to pass them here yet.
            // Let's fetch them inside here to be safe if we want to duplicate them too.

            const { data: charges } = await supabase
                .from("order_additional_charges")
                .select("*")
                .eq("order_id", order.id)

            if (charges && charges.length > 0) {
                const chargesToInsert = charges.map(charge => ({
                    order_id: newOrder.id,
                    name: charge.name,
                    amount: charge.amount,
                    description: charge.description
                }))

                const { error: chargesError } = await supabase
                    .from("order_additional_charges")
                    .insert(chargesToInsert)

                if (chargesError) throw chargesError
            }

            toast.success("Order duplicated successfully")
            router.push(`/admin/orders/${newOrder.id}`)
        } catch (error) {
            console.error("Error duplicating order:", error)
            toast.error("Failed to duplicate order")
        } finally {
            setIsDuplicating(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isDuplicating}>
            {isDuplicating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Copy className="h-4 w-4 mr-2" />
            )}
            Duplicate Order
        </Button>
    )
}
