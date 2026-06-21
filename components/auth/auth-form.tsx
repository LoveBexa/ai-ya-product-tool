"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function AuthForm({
  mode,
  nextPath = "/start",
}: {
  mode: "login" | "register"
  nextPath?: string
}) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingGoogle, setPendingGoogle] = useState(false)
  const [pendingMagic, setPendingMagic] = useState(false)

  const isRegister = mode === "register"
  const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(nextPath)}`

  async function signInWithGoogle() {
    setError(null)
    setMessage(null)
    setPendingGoogle(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      })
      if (oauthError) setError(oauthError.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.")
    } finally {
      setPendingGoogle(false)
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value.includes("@")) {
      setError("Enter a valid email address.")
      return
    }
    setError(null)
    setMessage(null)
    setPendingMagic(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: value,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      })
      if (otpError) {
        setError(otpError.message)
      } else {
        setMessage("Check your email for a magic link to sign in.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send magic link.")
    } finally {
      setPendingMagic(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2"
        onClick={signInWithGoogle}
        disabled={pendingGoogle || pendingMagic}
      >
        {pendingGoogle ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="email">
          Email magic link
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pendingMagic || pendingGoogle}
        />
        <Button
          type="submit"
          className="h-11 w-full gap-2"
          disabled={pendingMagic || pendingGoogle || !email.trim()}
        >
          {pendingMagic ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {isRegister ? "Send sign-up link" : "Send sign-in link"}
        </Button>
      </form>

      {message && (
        <p className="mt-4 rounded-xl border border-mint/40 bg-mint/10 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-alert-text">{error}</p>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account?" : "New to AIYA?"}{" "}
        <Link
          href={isRegister ? `/login?next=${encodeURIComponent(nextPath)}` : `/register?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-foreground underline underline-offset-2"
        >
          {isRegister ? "Sign in" : "Create account"}
        </Link>
      </p>
    </div>
  )
}
