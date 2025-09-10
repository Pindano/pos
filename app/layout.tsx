import type React from "react"
import type { Metadata } from "next"
import type { Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { NetworkStatus } from "@/components/network-status"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Fresh Market POS",
  description: "Order fresh vegetables and groceries for delivery",
  generator: "v0.app",
  manifest: "/manifest.json",
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fresh Market",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Fresh Market POS",
    title: "Fresh Market POS",
    description: "Order fresh vegetables and groceries for delivery",
  },
  twitter: {
    card: "summary",
    title: "Fresh Market POS",
    description: "Order fresh vegetables and groceries for delivery",
  },
}
export const viewport: Viewport = {
  themeColor: 'black',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Fresh Market POS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fresh Market" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />

        <link rel="apple-touch-icon" href="/icon-192x192.jpg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.jpg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.jpg" />
        <link rel="shortcut icon" href="/icon-192x192.jpg" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
        <div className="pb-20 md:pb-0">{children}</div>
          <BottomNavigation />
          <Toaster />
          <PWAInstallPrompt />
          <NetworkStatus />
        </Suspense>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
