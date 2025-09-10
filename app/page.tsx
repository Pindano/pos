"use client"

import { useState, useEffect } from "react"
import { useProductStore, useCartStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Plus, Minus, Search, Store, Bell } from "lucide-react"
import Link from "next/link"
import { AuthButton } from "@/components/auth-button"

export default function HomePage() {

const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const { addItem, items, getTotalItems } = useCartStore()
  const { getProducts, getProductsByCategory, searchProducts, fetchProducts, isLoading } = useProductStore()  // <- Add fetchProducts here

  // Add this useEffect to fetch data on component mount
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])  // Dependency on fetchProducts ensures it re-runs if the store changes (rare, but safe)

  const products = searchQuery
    ? searchProducts(searchQuery)
    : selectedCategory === "all"
      ? getProducts()
      : getProductsByCategory(selectedCategory)


  const categories = ["all", "vegetables", "fruits", "grains"]

  const getCartQuantity = (productId: string) => {
    const item = items.find((item) => item.product.id === productId)
    return item ? item.quantity : 0
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Wambos Veges</h1>
            </div>
            <div className="flex items-center gap-2">
              <AuthButton />
              <Link href="/notifications">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" size="sm" className="relative bg-transparent">
                  <ShoppingCart className="h-4 w-4" />
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 px-1 text-xs">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
      {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>  {/* Simple spinner */}
            <p className="mt-2 text-muted-foreground">Loading products...</p>
          </div>
        ) : (
          <>
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Products Grid */}
              
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-sm">{product.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">Kes {product.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per {product.unit}</p>
                  </div>
                  <Badge variant={product.stock_quantity > 10 ? "default" : "destructive"}>
                    in stock
                  </Badge>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <div className="flex items-center gap-2 w-full">
                  {getCartQuantity(product.id) > 0 ? (
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentQty = getCartQuantity(product.id)
                          if (currentQty > 1) {
                            addItem(product, -1)
                          } else {
                            useCartStore.getState().removeItem(product.id)
                          }
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="flex-1 text-center font-medium">{getCartQuantity(product.id)}</span>
                      <Button variant="outline" size="sm" onClick={() => addItem(product, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => addItem(product, 1)}
                      className="w-full"
                      disabled={!product.is_available || product.stock_quantity === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found matching your search.</p>
          </div>
        )}
      </>
)}
      </main>
    
    </div>
      
  )
}
