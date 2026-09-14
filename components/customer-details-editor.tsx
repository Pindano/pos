"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Phone, Mail, MapPin, Edit3, Save, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface CustomerDetails {
    customer_name: string
    customer_phone: string
    customer_email?: string
    customer_address?: string
    notes?: string
}

interface CustomerDetailsEditorProps {
    orderId: string
    initialDetails: CustomerDetails
    onUpdate?: () => void
}

export function CustomerDetailsEditor({ orderId, initialDetails, onUpdate }: CustomerDetailsEditorProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [details, setDetails] = useState<CustomerDetails>(initialDetails)
    const [isLoading, setIsLoading] = useState(false)

    const supabase = createClient()

    const handleSave = async () => {
        if (!details.customer_name || !details.customer_phone) {
            toast.error("Name and Phone are required")
            return
        }

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from("orders")
                .update({
                    customer_name: details.customer_name,
                    customer_phone: details.customer_phone,
                    customer_email: details.customer_email,
                    customer_address: details.customer_address,
                    notes: details.notes
                })
                .eq("id", orderId)

            if (error) throw error

            toast.success("Customer details updated")
            setIsEditing(false)
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error("Error updating customer details:", error)
            toast.error("Failed to update customer details")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setDetails(initialDetails)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Edit Customer Information
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isLoading}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isLoading}>
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={details.customer_name}
                                onChange={(e) => setDetails({ ...details, customer_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                                id="phone"
                                value={details.customer_phone}
                                onChange={(e) => setDetails({ ...details, customer_phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={details.customer_email || ""}
                                onChange={(e) => setDetails({ ...details, customer_email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={details.customer_address || ""}
                                onChange={(e) => setDetails({ ...details, customer_address: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={details.notes || ""}
                            onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Customer Information
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{details.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{details.customer_phone}</span>
                </div>
                {details.customer_email && (
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{details.customer_email}</span>
                    </div>
                )}
                {details.customer_address && (
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{details.customer_address}</span>
                    </div>
                )}
                {details.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Special Instructions:</p>
                        <p className="text-sm">{details.notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
