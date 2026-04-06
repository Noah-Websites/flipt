"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, X, ArrowLeft, AlertCircle } from "lucide-react"
import { supabase } from "../lib/supabase"
import { updateProfile } from "../lib/storage"
import { saveCurrency, getSavedCurrency } from "../lib/currency"
import { useCurrency } from "../components/CurrencyProvider"
import CurrencySelector from "../components/CurrencySelector"

type View = "buttons" | "email-signup" | "email-signin" | "currency"

export default function Signup() {
  const router = useRouter()
  const { setCurrencyCode } = useCurrency()
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined" && getSavedCurrency() !== "CAD" && localStorage.getItem("flipt-currency")) return "buttons"
    return "buttons"
  })
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState("CAD")

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function handleGoogleSignIn() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  async function handleEmailSignUp() {
    if (!email.includes("@") || password.length < 6) {
      setError("Please enter a valid email and a password with at least 6 characters.")
      return
    }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    if (data.user) {
      updateProfile({ name, email, joinedAt: new Date().toISOString() })
      localStorage.setItem("flipt-onboarded", "true")
      showToast("Welcome to Flipt!")

      // If email confirmation is required
      if (!data.session) {
        showToast("Check your email to confirm your account.")
        setLoading(false)
        return
      }

      setTimeout(() => goToCurrencyOrHome(), 800)
    }
    setLoading(false)
  }

  async function handleEmailSignIn() {
    if (!email.includes("@") || password.length < 1) {
      setError("Please enter your email and password.")
      return
    }
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    localStorage.setItem("flipt-onboarded", "true")
    showToast("Welcome back!")
    setTimeout(() => goToCurrencyOrHome(), 800)
    setLoading(false)
  }

  function goToCurrencyOrHome() {
    if (!localStorage.getItem("flipt-currency")) {
      setView("currency")
    } else {
      router.push("/")
    }
  }

  function handleCurrencyDone() {
    saveCurrency(selectedCurrency)
    setCurrencyCode(selectedCurrency)
    router.push("/")
  }

  function handleGuest() {
    localStorage.setItem("flipt-onboarded", "true")
    goToCurrencyOrHome()
  }

  if (view === "currency") {
    return (
      <CurrencySelector
        selected={selectedCurrency}
        onSelect={(code) => { setSelectedCurrency(code); saveCurrency(code); setCurrencyCode(code) }}
        onDone={handleCurrencyDone}
        fullScreen
        autoAdvance
      />
    )
  }

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      <div className="signup-page">
        <div style={{ marginBottom: "8px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "28px", fontWeight: 700, color: "var(--green-primary)", marginBottom: "24px" }}>
            Flipt
          </p>
          <h2 style={{ fontSize: "36px", marginBottom: "8px" }}>
            {view === "email-signin" ? "Welcome Back" : "Join Flipt"}
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            {view === "email-signin" ? "Sign in to your account." : "Start turning your clutter into cash today."}
          </p>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.12)", borderRadius: "12px", padding: "12px 16px", maxWidth: "320px", width: "100%" }}>
            <AlertCircle size={16} style={{ color: "var(--red)", flexShrink: 0, marginTop: "2px" }} />
            <p style={{ fontSize: "13px", color: "var(--red)", lineHeight: 1.4 }}>{error}</p>
          </div>
        )}

        {/* Button view */}
        {view === "buttons" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
            <button onClick={handleGoogleSignIn} className="signup-btn google">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button onClick={() => { setView("email-signup"); setError(null) }} className="signup-btn email">
              <Mail size={18} />
              Continue with Email
            </button>
          </div>
        )}

        {/* Email sign up form */}
        {view === "email-signup" && (
          <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <button onClick={() => { setView("buttons"); setError(null) }} style={{ display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text-faint)", cursor: "pointer" }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your name</label>
              <input type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} className="biz-input" style={{ borderRadius: "50px", padding: "14px 20px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="biz-input" style={{ borderRadius: "50px", padding: "14px 20px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
              <input type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailSignUp()} className="biz-input" style={{ borderRadius: "50px", padding: "14px 20px" }} />
            </div>
            <button onClick={handleEmailSignUp} disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "4px" }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        )}

        {/* Email sign in form */}
        {view === "email-signin" && (
          <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <button onClick={() => { setView("buttons"); setError(null) }} style={{ display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text-faint)", cursor: "pointer" }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="biz-input" style={{ borderRadius: "50px", padding: "14px 20px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
              <input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailSignIn()} className="biz-input" style={{ borderRadius: "50px", padding: "14px 20px" }} />
            </div>
            <button onClick={handleEmailSignIn} disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "4px" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        )}

        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          {view === "email-signin" ? (
            <>Don&apos;t have an account?{" "}
              <button onClick={() => { setView("email-signup"); setError(null) }} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "var(--green-primary)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => { setView("email-signin"); setError(null) }} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "var(--green-primary)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                Sign in
              </button>
            </>
          )}
        </p>

        <button onClick={handleGuest} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>
          Continue as Guest
        </button>

        {/* Social proof */}
        <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--surface-alt)", borderRadius: "12px", maxWidth: "300px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Join 10,000+ Canadians turning clutter into cash with Flipt
          </p>
        </div>

        <p style={{ fontSize: "11px", color: "var(--text-faint)", maxWidth: "280px", lineHeight: 1.5, marginTop: "8px" }}>
          By continuing, you agree to our{" "}
          <a href="/terms" style={{ color: "var(--text-faint)", textDecoration: "underline" }}>Terms of Service</a>{" "}
          and{" "}
          <a href="/privacy" style={{ color: "var(--text-faint)", textDecoration: "underline" }}>Privacy Policy</a>.
        </p>
      </div>
    </>
  )
}
