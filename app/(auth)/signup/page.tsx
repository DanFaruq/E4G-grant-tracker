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
    const tokenHash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    if (!tokenHash || type !== "invite") {
      setTokenError("Invalid invite link. Please ask your admin to send a new invitation.")
      setVerifying(false)
      return
    }

    const supabase = createClient()
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: "invite" })
      .then(({ error }) => {
        if (error) {
          setTokenError(
            error.message.includes("expired")
              ? "This invite link has expired. Please ask your admin to send a new invitation."
              : `Invalid invite: ${error.message}`
          )
        }
      })
      .finally(() => setVerifying(false))
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

    toast.success("Welcome to E4G Grants!")
    router.push("/dashboard")
    router.refresh()
  }

  if (verifying) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying your invite link…</p>
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
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="h-10"
        />
      </div>

      <Button type="submit" className="w-full h-10 gap-2 font-semibold" disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Create account
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set up your account</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          You've been invited. Enter your details to get started.
        </p>
      </div>
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  )
}
