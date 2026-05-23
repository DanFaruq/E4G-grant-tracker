"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowRight, Loader2, AlertCircle } from "lucide-react"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenError, setTokenError] = useState<string | null>(null)

  useEffect(() => {
    async function initSession() {
      const supabase = createClient()

      // ── Supabase sends invite tokens in three different formats depending on
      //    the project's auth settings. Try each in priority order.

      // 1. Hash fragment: #access_token=X&refresh_token=Y  (most common for invites)
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : ""
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) {
          setTokenError(`Invite link error: ${error.message}`)
        }
        setVerifying(false)
        return
      }

      // 2. PKCE code: ?code=X  (newer Supabase default with flowType: 'pkce')
      const code = searchParams.get("code")
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setTokenError(`Invite link error: ${error.message}`)
        }
        setVerifying(false)
        return
      }

      // 3. OTP token: ?token_hash=X&type=invite
      const tokenHash = searchParams.get("token_hash")
      const type = searchParams.get("type")
      if (tokenHash && type === "invite") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "invite",
        })
        if (error) {
          setTokenError(
            error.message.toLowerCase().includes("expired")
              ? "This invite link has expired. Ask your admin to send a new invitation."
              : `Invite error: ${error.message}`
          )
        }
        setVerifying(false)
        return
      }

      // 4. Already have an active session (page refresh after completing step 1-3)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setVerifying(false)
        return
      }

      setTokenError("Invalid invite link. Please ask your admin to send a new invitation.")
      setVerifying(false)
    }

    initSession()
  }, [searchParams])

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName },
    })
    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any).update({ full_name: fullName }).eq("id", user.id)
    }

    toast.success("Welcome to E4G Team Management!")
    router.push("/dashboard")
    router.refresh()
  }

  if (verifying) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying your invite…</p>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{tokenError}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
          Back to login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSetup} className="space-y-4">
      <div className="space-y-1.5 animate-fade-up stagger-2">
        <Label htmlFor="fullName" className="text-sm font-medium">Full name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          className="h-10 transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
        />
      </div>
      <div className="space-y-1.5 animate-fade-up stagger-3">
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="h-10 transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
        />
      </div>
      <div className="animate-fade-up stagger-4 pt-1">
        <Button
          type="submit"
          className="w-full h-10 gap-2 font-semibold group transition-all duration-200 active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Create account
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="space-y-7">
      <div className="animate-fade-up stagger-1">
        <h1 className="text-2xl font-bold tracking-tight">Set up your account</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          You've been invited. Enter your details to get started.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  )
}
