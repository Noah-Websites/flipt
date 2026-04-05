"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Camera, Tag, FileText, DollarSign, ArrowRight } from "lucide-react"

const SEEN_KEY = "flipt-onboarded"

const SLIDES = [
  { Icon: Camera, heading: "Scan Anything", body: "Point your camera at any item and our AI instantly identifies it and tells you exactly what it\u2019s worth." },
  { Icon: Tag, heading: "Real Market Prices", body: "See exactly what your item is selling for across Kijiji, Facebook Marketplace, eBay, Poshmark and Craigslist all at once." },
  { Icon: FileText, heading: "List in Seconds", body: "Get a ready-to-post listing title and description generated automatically. Copy and paste directly to any platform." },
  { Icon: DollarSign, heading: "Turn Clutter into Cash", body: "Join thousands of Canadians making money from stuff sitting around their home.", last: true },
] as const

type Phase = "loading" | "splash" | "splash-exit" | "onboarding" | "onboarding-exit" | "fade-to-app" | "app"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("loading")
  const [slide, setSlide] = useState(0)
  const [slideKey, setSlideKey] = useState(0)
  const [hasOnboarded, setHasOnboarded] = useState(false)

  const skipRoutes = ["/onboarding", "/reset", "/privacy", "/terms", "/signup"]

  useEffect(() => {
    if (skipRoutes.includes(pathname)) {
      setPhase("app")
      return
    }

    const seen = localStorage.getItem(SEEN_KEY) === "true"
    setHasOnboarded(seen)

    // Always show splash
    setPhase("splash")
    const timer = setTimeout(() => setPhase("splash-exit"), 2000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === "splash-exit") {
      const timer = setTimeout(() => {
        if (hasOnboarded) {
          // Returning user: fade to app
          setPhase("fade-to-app")
        } else {
          // New user: show onboarding
          setPhase("onboarding")
        }
      }, 600)
      return () => clearTimeout(timer)
    }
    if (phase === "fade-to-app") {
      const timer = setTimeout(() => setPhase("app"), 400)
      return () => clearTimeout(timer)
    }
  }, [phase, hasOnboarded])

  const finishOnboarding = useCallback(() => {
    setPhase("onboarding-exit")
    setTimeout(() => {
      localStorage.setItem(SEEN_KEY, "true")
      setPhase("app")
      router.push("/signup")
    }, 400)
  }, [router])

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(SEEN_KEY, "true")
    setPhase("app")
  }, [])

  function nextSlide() {
    if (slide >= SLIDES.length - 1) {
      finishOnboarding()
    } else {
      setSlide(s => s + 1)
      setSlideKey(k => k + 1)
    }
  }

  // Loading — render nothing briefly
  if (phase === "loading") return null

  // Splash screen — always shown
  if (phase === "splash" || phase === "splash-exit") {
    return (
      <div className={`splash-screen ${phase === "splash-exit" ? "exiting" : ""}`}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontStyle: "italic",
          fontSize: "72px",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.02em",
        }}>
          Flipt
        </h1>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "16px",
          fontWeight: 400,
          color: "rgba(255,255,255,0.7)",
        }}>
          Turn your clutter into cash
        </p>
      </div>
    )
  }

  // Fade to app for returning users
  if (phase === "fade-to-app") {
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        {children}
      </div>
    )
  }

  // Onboarding slides — new users only
  if (phase === "onboarding" || phase === "onboarding-exit") {
    const current = SLIDES[slide]
    return (
      <div className={`onboarding-overlay ${phase === "onboarding-exit" ? "exiting" : ""}`}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px 0" }}>
          <button
            onClick={skipOnboarding}
            style={{
              background: "none", border: "none", fontFamily: "var(--font-body)",
              fontSize: "14px", fontWeight: 500, color: "var(--text-faint)",
              cursor: "pointer", padding: "8px",
            }}
          >
            Skip
          </button>
        </div>

        <div className="onboarding-slide" key={slideKey}>
          <div className="onboarding-icon-wrap">
            <current.Icon size={64} strokeWidth={1.5} style={{ color: "var(--green-primary)" }} />
          </div>
          <h2 style={{ fontSize: "32px" }}>{current.heading}</h2>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", maxWidth: "340px", lineHeight: 1.6 }}>
            {current.body}
          </p>
          {"last" in current && current.last && (
            <button onClick={finishOnboarding} className="btn-primary" style={{ marginTop: "8px", padding: "18px 48px", fontSize: "16px" }}>
              Get Started
            </button>
          )}
        </div>

        <div className="onboarding-nav">
          <div className="onboarding-dots">
            {SLIDES.map((_, i) => (
              <div key={i} className={`onboarding-dot ${i === slide ? "active" : ""}`} />
            ))}
          </div>
          {!("last" in current && current.last) && (
            <button
              onClick={nextSlide}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", fontFamily: "var(--font-body)",
                fontSize: "15px", fontWeight: 600, color: "var(--green-primary)",
                cursor: "pointer", padding: "8px",
              }}
            >
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Normal app
  return <>{children}</>
}
