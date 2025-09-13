"use client"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Home, ShoppingCart, Package, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const allNavigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Cart",
    href: "/cart",
    icon: ShoppingCart,
    showBadge: true,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: Package,
    requiresAuth: true, // Mark this item as requiring authentication
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const { getTotalItems } = useCartStore()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session?.user)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Don't show bottom nav on admin pages
  if (pathname.startsWith("/admin")) {
    return null
  }

  // Filter navigation items based on auth state
  const navigationItems = allNavigationItems.filter(item => {
    // If the item requires auth and user is not authenticated, don't show it
    if (item.requiresAuth && !isAuthenticated) {
      return false
    }
    return true
  })

  // Don't render until we know the auth state to prevent flash
  if (isAuthenticated === null) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const totalItems = getTotalItems()
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors relative min-w-0 flex-1",
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.showBadge && totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 truncate",
                  isActive ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-400",
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}