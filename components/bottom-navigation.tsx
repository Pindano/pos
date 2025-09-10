"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, ShoppingCart, Package, User, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const navigationItems = [
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
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "Profile",
    href: "/auth/login",
    icon: User,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const { getTotalItems } = useCartStore()

  // Don't show bottom nav on admin pages
  if (pathname.startsWith("/admin")) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden">
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
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.showBadge && totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center">
                    {totalItems > 99 ? "99+" : totalItems}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1 truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
