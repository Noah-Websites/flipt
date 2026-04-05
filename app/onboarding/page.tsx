"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Tag, FileText, DollarSign, ArrowRight } from "lucide-react"

const SLIDES = [
  { Icon: Camera, heading: "Scan Anything", body: "Point your camera at any item and our AI instantly identifies it and tells you exactly what it\u2019s worth." },
  { Icon: Tag, heading: "Real Market Prices", body: "See exactly what your item is selling for across Kijiji, Facebook Marketplace, eBay, Poshmark and Craigslist all at once." },
  { Icon: FileText, heading: "List in Seconds", body: "Get a ready-to-post listing title and description generated automatically. Copy and paste directly to any platform." },
  { Icon: DollarSign, heading: "Turn Clutter into Cash", body: "Join thousands of Canadians making money from stuff sitting around their home.", last: true },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const [slideKey, setSlideKey] = useState(0)

  function next() {
    if (slide >= SLIDES.length - 1) {
      router.push("/")
    } else {
      setSlide(s => s + 1)
      setSlideKey(k => k + 1)
    }
  }

  const current = SLIDES[slide]

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px 0" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text-faint)", cursor: "pointer", padding: "8px" }}>
          Close
        </button>
      </div>

      <div className="onboarding-slide" key={slideKey}>
        <div className="onboarding-icon-wrap">
          <current.Icon size={64} strokeWidth={1.5} style={{ color: "var(--green-primary)" }} />
        </div>
        <h2 style={{ fontSize: "32px" }}>{current.heading}</h2>
        <p style={{ fontSize: "16px", color: "var(--text-muted)", maxWidth: "340px", lineHeight: 1.6 }}>{current.body}</p>
        {"last" in current && current.last && (
          <button onClick={() => router.push("/")} className="btn-primary" style={{ marginTop: "8px", padding: "18px 48px", fontSize: "16px" }}>
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
          <button onClick={next} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600, color: "var(--green-primary)", cursor: "pointer", padding: "8px" }}>
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
