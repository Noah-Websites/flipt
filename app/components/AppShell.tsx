"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Camera, Tag, FileText, DollarSign, ArrowRight, Check } from "lucide-react"
import { useTheme } from "./ThemeProvider"

const SEEN_KEY = "flipt-onboarded"
const THEME_CHOSEN_KEY = "flipt-theme-chosen"

const SLIDES = [
  { Icon: Camera, heading: "Scan Anything", body: "Point your camera at any item and our AI instantly identifies it and tells you exactly what it\u2019s worth." },
  { Icon: Tag, heading: "Real Market Prices", body: "See exactly what your item is selling for across Kijiji, Facebook Marketplace, eBay, Poshmark and Craigslist all at once." },
  { Icon: FileText, heading: "List in Seconds", body: "Get a ready-to-post listing title and description generated automatically. Copy and paste directly to any platform." },
  { Icon: DollarSign, heading: "Turn Clutter into Cash", body: "Join thousands of Canadians making money from stuff sitting around their home.", last: true },
] as const

type Phase = "loading" | "splash" | "splash-exit" | "onboarding" | "theme-select" | "onboarding-exit" | "fade-to-app" | "app"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [phase, setPhase] = useState<Phase>("loading")
  const [slide, setSlide] = useState(0)
  const [slideKey, setSlideKey] = useState(0)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<"dark" | "light">("dark")

  const skipRoutes = ["/onboarding", "/reset", "/privacy", "/terms", "/signup"]

  useEffect(() => {
    if (skipRoutes.includes(pathname)) {
      setPhase("app")
      return
    }

    const seen = localStorage.getItem(SEEN_KEY) === "true"
    setHasOnboarded(seen)

    setPhase("splash")
    const timer = setTimeout(() => setPhase("splash-exit"), 2000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === "splash-exit") {
      const timer = setTimeout(() => {
        if (hasOnboarded) {
          setPhase("fade-to-app")
        } else {
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

  const goToThemeSelect = useCallback(() => {
    setPhase("theme-select")
    setSelectedTheme(theme)
  }, [theme])

  const finishOnboarding = useCallback(() => {
    // After slides, go to theme select
    goToThemeSelect()
  }, [goToThemeSelect])

  const finishThemeSelect = useCallback(() => {
    // Apply theme choice
    if (selectedTheme !== theme) toggle()
    localStorage.setItem(THEME_CHOSEN_KEY, "true")
    setPhase("onboarding-exit")
    setTimeout(() => {
      localStorage.setItem(SEEN_KEY, "true")
      setPhase("app")
      // Take new users to scan page for their first scan experience
      router.push("/scan")
    }, 400)
  }, [selectedTheme, theme, toggle, router])

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(SEEN_KEY, "true")
    localStorage.setItem(THEME_CHOSEN_KEY, "true")
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

  function handleThemeSelect(t: "dark" | "light") {
    setSelectedTheme(t)
    // Preview the theme immediately
    document.documentElement.setAttribute("data-theme", t)
    localStorage.setItem("flipt-theme", t)
  }

  if (phase === "loading") return null

  // Splash
  if (phase === "splash" || phase === "splash-exit") {
    return (
      <div className={`splash-screen ${phase === "splash-exit" ? "exiting" : ""}`}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "72px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          Flipt
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "16px", fontWeight: 400, color: "rgba(255,255,255,0.7)" }}>
          Turn your clutter into cash
        </p>
      </div>
    )
  }

  // Fade to app
  if (phase === "fade-to-app") {
    return <div style={{ animation: "fadeIn 0.4s ease" }}>{children}</div>
  }

  // Theme selection
  if (phase === "theme-select") {
    return (
      <div className="onboarding-overlay">
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px 0" }}>
          <button onClick={skipOnboarding} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text-faint)", cursor: "pointer", padding: "8px" }}>
            Skip
          </button>
        </div>

        <div className="onboarding-slide">
          <h2 style={{ fontSize: "32px", marginBottom: "8px" }}>How do you like it?</h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginBottom: "24px" }}>Choose your preferred appearance</p>

          <div style={{ display: "flex", gap: "16px", width: "100%", maxWidth: "320px" }}>
            {/* Dark card */}
            <button
              onClick={() => handleThemeSelect("dark")}
              style={{
                flex: 1, background: "#0a0d0a", border: `2px solid ${selectedTheme === "dark" ? "#52b788" : "#1e241e"}`,
                borderRadius: "16px", padding: "24px 16px", cursor: "pointer", textAlign: "center",
                transition: "border-color 0.2s ease", position: "relative",
              }}
            >
              {selectedTheme === "dark" && (
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "22px", height: "22px", borderRadius: "50%", background: "#52b788", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={14} color="#fff" />
                </div>
              )}
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#111411", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "18px", fontWeight: 700, color: "#f0f4f0" }}>F</p>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "#f0f4f0" }}>Dark</p>
            </button>

            {/* Light card */}
            <button
              onClick={() => handleThemeSelect("light")}
              style={{
                flex: 1, background: "#faf8f4", border: `2px solid ${selectedTheme === "light" ? "#2d5a3d" : "#e8e2d9"}`,
                borderRadius: "16px", padding: "24px 16px", cursor: "pointer", textAlign: "center",
                transition: "border-color 0.2s ease", position: "relative",
              }}
            >
              {selectedTheme === "light" && (
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "22px", height: "22px", borderRadius: "50%", background: "#2d5a3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={14} color="#fff" />
                </div>
              )}
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f5f2ec", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "18px", fontWeight: 700, color: "#1c1917" }}>F</p>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "#1c1917" }}>Light</p>
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 32px 48px", display: "flex", justifyContent: "center" }}>
          <button onClick={finishThemeSelect} className="btn-primary" style={{ padding: "18px 48px", fontSize: "16px" }}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Onboarding slides
  if (phase === "onboarding" || phase === "onboarding-exit") {
    const current = SLIDES[slide]
    return (
      <div className={`onboarding-overlay ${phase === "onboarding-exit" ? "exiting" : ""}`}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px 0" }}>
          <button onClick={skipOnboarding} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text-faint)", cursor: "pointer", padding: "8px" }}>
            Skip
          </button>
        </div>

        <div className="onboarding-slide" key={slideKey}>
          <div className="onboarding-icon-wrap">
            <current.Icon size={64} strokeWidth={1.5} style={{ color: "var(--green-accent)" }} />
          </div>
          <h2 style={{ fontSize: "32px" }}>{current.heading}</h2>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "340px", lineHeight: 1.6 }}>
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
            <button onClick={nextSlide} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600, color: "var(--green-accent)", cursor: "pointer", padding: "8px" }}>
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
