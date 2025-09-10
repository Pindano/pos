"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface CheckoutAuthPromptProps {
  customerEmail: string
  onSkip: () => void
}

export function CheckoutAuthPrompt({ customerEmail, onSkip }: CheckoutAuthPromptProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email: customerEmail,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/orders`,
        },
      })
      if (error) throw error

      // Continue with checkout after account creation
      onSkip()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Create Account (Optional)</CardTitle>
        <CardDescription>
          Create an account to track your orders and save your information for future purchases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="checkout-email">Email</Label>
            <Input id="checkout-email" type="email" value={customerEmail} disabled className="bg-muted" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkout-password">Password</Label>
            <Input
              id="checkout-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkout-confirm-password">Confirm Password</Label>
            <Input
              id="checkout-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !password || !confirmPassword} className="flex-1">
              {isLoading ? "Creating Account..." : "Create Account & Continue"}
            </Button>
            <Button type="button" variant="outline" onClick={onSkip}>
              Skip
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
