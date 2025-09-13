"use client"

import { useState, useEffect } from "react"
import { useProductStore, useCartStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Plus, Minus, Search, Store, Bell, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { AuthButton } from "@/components/auth-button"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const { addItem, items, getTotalItems } = useCartStore()
  const { 
    getProducts, 
    getProductsByCategory, 
    searchProducts, 
    fetchProducts, 
    isLoading,
    error 
  } = useProductStore()

  // 🔧 Added retry function for failed loads
  const handleRetry = async () => {
    try {
      await fetchProducts()
    } catch (error) {
      console.error("Retry failed:", error)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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

  // 🔧 Better loading state
  if (isLoading && getProducts().length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-6 w-6 text-primary" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                  Wambo's Vegetables
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-2">
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
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Loading products...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 🔧 Better error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-6 w-6 text-primary" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                  Wambo's Vegetables
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-2">
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
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load products</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={handleRetry} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                Wambo's Vegetables
              </h1>
              
            </div>
            <div className="hidden md:flex items-center gap-2">
              <AuthButton />
              <Link href="/notifications">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </Link>
              {/* 🔧 Added refresh button */}
              
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

      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
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
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
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
                    <p className="text-2xl font-bold text-primary">KSh {product.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per {product.unit}</p>
                  </div>
                  <Badge variant={product.stock_quantity > 10 ? "default" : "outline"}>
                    {product.stock_quantity > 0 ? "in stock" : "out of stock"}
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addItem(product, 1)}
                        disabled={!product.is_available || product.stock_quantity === 0}
                      >
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
                      {!product.is_available || product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 🔧 Enhanced empty state */}
        {products.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `No products found matching "${searchQuery}".`
                  : selectedCategory !== "all"
                    ? `No products found in the "${selectedCategory}" category.`
                    : "No products available at the moment."
                }
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <div className="flex gap-2 justify-center">
                  {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  )}
                  {selectedCategory !== "all" && (
                    <Button variant="outline" onClick={() => setSelectedCategory("all")}>
                      Show All Categories
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 🔧 Show loading overlay when refreshing with existing data */}
        {isLoading && getProducts().length > 0 && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card>
              <CardContent className="flex items-center gap-3 py-6">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <p>Refreshing products...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}