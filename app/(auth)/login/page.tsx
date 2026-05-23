"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowRight, Loader2, Mail } from "lucide-react"

type Mode = "password" | "magic"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>("password")

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error("Enter your email first")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      const isRateLimit =
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("too many") ||
        error.status === 429
      toast.error(
        isRateLimit
          ? "Too many emails sent. Please wait a few minutes, then try again — or sign in with your password instead."
          : error.message
      )
    } else {
      toast.success("Magic link sent — check your inbox")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-7">
      {/* Header — staggered entrance */}
      <div className="animate-fade-up stagger-1">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Sign in to your E4G account to continue
        </p>
      </div>

      <form
        onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
        className="space-y-4"
      >
        {/* Email field */}
        <div className="space-y-1.5 animate-fade-up stagger-2">
          <Label htmlFor="email" className="text-sm font-medium transition-colors">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-10 transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
          />
        </div>

        {/* Password field — slides in when mode = password */}
        {mode === "password" && (
          <div className="space-y-1.5 animate-fade-up">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-10 transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
            />
          </div>
        )}

        {/* Submit button — arrow slides on hover */}
        <div className="animate-fade-up stagger-3 pt-1">
          <Button
            type="submit"
            className="w-full h-10 gap-2 font-semibold group transition-all duration-200 active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "password" ? (
              <>
                Sign in
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            ) : (
              <>
                <Mail className="size-4 transition-transform duration-200 group-hover:scale-110" />
                Send magic link
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative animate-fade-up stagger-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="animate-fade-up stagger-5">
        <Button
          variant="outline"
          className="w-full h-10 font-medium transition-all duration-200 active:scale-[0.98]"
          onClick={() => setMode(mode === "password" ? "magic" : "password")}
          type="button"
        >
          {mode === "password" ? "Use magic link instead" : "Sign in with password"}
        </Button>
      </div>
    </div>
  )
}
