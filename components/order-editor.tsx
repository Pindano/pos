"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  DollarSign,
  AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface AdditionalCharge {
  id: string
  name: string
  amount: number
  description?: string
}

interface Product {
  id: string
  name: string
  price: number
  category?: string
}

interface OrderEditorProps {
  order: any
  initialItems: OrderItem[]
  availableProducts: Product[]
  onOrderUpdate?: () => void // Optional callback for parent component to refresh data
}

export function OrderEditor({ order, initialItems, availableProducts, onOrderUpdate }: OrderEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [items, setItems] = useState<OrderItem[]>(initialItems)
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([])
  const [newCharge, setNewCharge] = useState({ name: "", amount: 0, description: "" })
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const supabase = createClient()

  // Load fresh data from database
  const loadOrderData = async () => {
    try {
      // Load order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true })

      if (itemsError) throw itemsError
      setItems(itemsData || [])

      // Load additional charges
      const { data: chargesData, error: chargesError } = await supabase
        .from("order_additional_charges")
        .select("*")
        .eq("order_id", order.id)

      if (chargesError) throw chargesError
      setAdditionalCharges(chargesData || [])
    } catch (error) {
      console.error("Error loading order data:", error)
    }
  }

  // Load additional charges on mount
  useEffect(() => {
    loadAdditionalCharges()
  }, [])

  const loadAdditionalCharges = async () => {
    try {
      const { data, error } = await supabase
        .from("order_additional_charges")
        .select("*")
        .eq("order_id", order.id)

      if (error) throw error
      setAdditionalCharges(data || [])
    } catch (error) {
      console.error("Error loading additional charges:", error)
    }
  }

  // Calculate totals
  const itemsTotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const chargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
  const grandTotal = itemsTotal + chargesTotal

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    console.log("Updating quantity:", { itemId, newQuantity })

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newTotalPrice = item.unit_price * newQuantity
        console.log("New item:", { ...item, quantity: newQuantity, total_price: newTotalPrice })
        return { ...item, quantity: newQuantity, total_price: newTotalPrice }
      }
      return item
    }))
    setHasChanges(true)
  }

  // Update item price
  const updateItemPrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return
    console.log("Updating price:", { itemId, newPrice })
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newTotalPrice = newPrice * item.quantity
        console.log("New item:", { ...item, unit_price: newPrice, total_price: newTotalPrice })
        return { ...item, unit_price: newPrice, total_price: newTotalPrice }
      }
      return item
    }))
    setHasChanges(true)
  }

  // Remove item
  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    setHasChanges(true)
  }

  // Add new item
  const addNewItem = () => {
    const product = availableProducts.find(p => p.id === selectedProduct)
    if (!product) return

    const newItem: OrderItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      total_price: product.price
    }

    setItems(prev => [...prev, newItem])
    setSelectedProduct("")
    setHasChanges(true)
  }

  // Add additional charge
  const addAdditionalCharge = () => {
    if (!newCharge.name || newCharge.amount <= 0) {
      toast.error("Please enter a valid charge name and amount")
      return
    }

    const charge: AdditionalCharge = {
      id: `temp-${Date.now()}`,
      name: newCharge.name,
      amount: newCharge.amount,
      description: newCharge.description
    }

    setAdditionalCharges(prev => [...prev, charge])
    setNewCharge({ name: "", amount: 0, description: "" })
    setHasChanges(true)
  }

  // Remove additional charge
  const removeAdditionalCharge = (chargeId: string) => {
    setAdditionalCharges(prev => prev.filter(charge => charge.id !== chargeId))
    setHasChanges(true)
  }

  // Save all changes
  const saveChanges = async () => {
    setIsLoading(true)
    try {
      // Delete existing items
      await supabase.from("order_items").delete().eq("order_id", order.id)
      
      // Insert updated items
      const itemsToInsert = items.map(item => ({
        order_id: order.id,
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

      // Handle additional charges
      await supabase.from("order_additional_charges").delete().eq("order_id", order.id)
      
      if (additionalCharges.length > 0) {
        const chargesToInsert = additionalCharges.map(charge => ({
          order_id: order.id,
          name: charge.name,
          amount: charge.amount,
          description: charge.description
        }))
        
        const { error: chargesError } = await supabase
          .from("order_additional_charges")
          .insert(chargesToInsert)

        if (chargesError) throw chargesError
      }

      // Update order total
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          total_amount: grandTotal,
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id)

      if (orderError) throw orderError

      toast.success("Order updated successfully!")
      setIsEditing(false)
      setHasChanges(false)
      
      // Option 1: Reload fresh data from database instead of page refresh
      await loadOrderData()
      
      // Option 2: Call parent callback to refresh data if provided
      if (onOrderUpdate) {
        onOrderUpdate()
      }
      
      // Option 3: Remove page reload entirely - the state is already updated above
      // window.location.reload() // Remove this line
      
    } catch (error) {
      console.error("Error saving changes:", error)
      toast.error("Failed to save changes")
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setItems(initialItems)
    setAdditionalCharges([])
    loadAdditionalCharges()
    setIsEditing(false)
    setHasChanges(false)
    setNewCharge({ name: "", amount: 0, description: "" })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Items
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={isLoading || !hasChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No items found</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Ksh {item.unit_price.toFixed(2)} each
                  </p>
                </div>
                
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price input */}
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Remove button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="font-medium">Qty: {item.quantity}</p>
                    <p className="text-sm font-bold">KSh {item.total_price.toFixed(2)}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Add new item section */}
            {isEditing && (
              <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select product to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - KSh {product.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addNewItem}
                    disabled={!selectedProduct}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Additional Charges Section */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Additional Charges
              </h4>
              
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{charge.name}</p>
                    {charge.description && (
                      <p className="text-sm text-muted-foreground">{charge.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">KSh {charge.amount.toFixed(2)}</span>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAdditionalCharge(charge.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add new charge form */}
              {isEditing && (
                <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="charge-name">Charge Name</Label>
                      <Input
                        id="charge-name"
                        placeholder="e.g., Delivery Fee"
                        value={newCharge.name}
                        onChange={(e) => setNewCharge(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="charge-amount">Amount</Label>
                      <Input
                        id="charge-amount"
                        type="number"
                        placeholder="0.00"
                        value={newCharge.amount || ""}
                        onChange={(e) => setNewCharge(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="charge-description">Description (Optional)</Label>
                    <Textarea
                      id="charge-description"
                      placeholder="Additional details..."
                      value={newCharge.description}
                      onChange={(e) => setNewCharge(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={addAdditionalCharge}
                    disabled={!newCharge.name || newCharge.amount <= 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Charge
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Items Subtotal:</span>
                <span>KSh {itemsTotal.toFixed(2)}</span>
              </div>
              {chargesTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Additional Charges:</span>
                  <span>KSh {chargesTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>KSh {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Changes indicator */}
            {hasChanges && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>You have unsaved changes</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}