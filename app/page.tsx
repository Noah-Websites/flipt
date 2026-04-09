"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Scan, Check, Camera, BarChart3, FileText, ArrowRight } from "lucide-react"
import { addReferral } from "./lib/storage"

gsap.registerPlugin(ScrollTrigger)

/* ===== DATA ===== */
const TICKER_ITEMS = [
  "MacBook Pro — $890 — Ottawa",
  "Nike Air Force 1 — $120 — Toronto",
  "KitchenAid Mixer — $180 — Vancouver",
  "Canada Goose Jacket — $450 — Calgary",
  "PS5 Controller — $55 — Montreal",
  "Vintage LEGO — $220 — Winnipeg",
  "Lululemon Leggings — $65 — Halifax",
  "Dyson Vacuum — $280 — Edmonton",
]

const ACTIVITY_FEED = [
  { city: "Ottawa", item: "MacBook Pro", price: 890 },
  { city: "Toronto", item: "Lululemon jacket", price: 95 },
  { city: "Vancouver", item: "vintage watch", price: 340 },
  { city: "Calgary", item: "hockey cards", price: 180 },
  { city: "Montreal", item: "KitchenAid mixer", price: 175 },
  { city: "Edmonton", item: "Canada Goose parka", price: 420 },
  { city: "Ottawa", item: "Nintendo Switch", price: 230 },
  { city: "Toronto", item: "Dyson V8", price: 210 },
  { city: "Halifax", item: "mountain bike", price: 350 },
  { city: "Winnipeg", item: "LEGO Star Wars set", price: 155 },
]

const PRO_FEATURES = ["Unlimited scans", "5 platform comparison", "Damage detection", "Authenticity checks", "Brand identification", "Full scan history"]
const BIZ_FEATURES = ["Everything in Pro", "Offer Manager", "Room Scan", "Sellometer", "Business P&L", "Market intelligence"]

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mainRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const dashRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const [activityIdx, setActivityIdx] = useState(0)

  // Referral tracking
  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref && !localStorage.getItem("flipt-ref-visited")) { localStorage.setItem("flipt-ref-visited", ref); addReferral() }
  }, [searchParams])

  // Activity feed rotation
  useEffect(() => {
    const interval = setInterval(() => setActivityIdx(prev => (prev + 1) % ACTIVITY_FEED.length), 2500)
    return () => clearInterval(interval)
  }, [])

  // ===== GSAP ANIMATIONS =====
  useEffect(() => {
    const ctx = gsap.context(() => {
      // --- SECTION 1: THE REVEAL ---
      const revealTl = gsap.timeline({ defaults: { ease: "power3.out" } })

      revealTl
        .fromTo(".reveal-line", { scaleX: 0 }, { scaleX: 1, duration: 0.6, delay: 0.3 })
        .fromTo(".reveal-title", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }, "+=0.1")
        .to(".reveal-line", { opacity: 0.3, duration: 0.15, yoyo: true, repeat: 1 }, "-=0.1")
        .fromTo(".reveal-word", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.08 }, "+=0.2")
        .fromTo(".reveal-subtitle", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "+=0.3")
        .fromTo(".reveal-cta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "+=0.2")
        .fromTo(".reveal-ticker", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "+=0.2")

      // --- SECTION 2: THE SCANNER (pinned) ---
      if (scannerRef.current) {
        const scanTl = gsap.timeline({
          scrollTrigger: {
            trigger: scannerRef.current,
            start: "top top",
            end: "+=200%",
            pin: true,
            scrub: 0.5,
          }
        })

        scanTl
          // Feature 1: Scan Anything — fade out default, show scan
          .to(".phone-screen-default", { opacity: 0, duration: 0.15 })
          .fromTo(".feat-1", { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 }, "<")
          .to(".phone-screen-1", { opacity: 1, duration: 0.2 }, "<0.1")
          .to({}, { duration: 0.3 }) // hold
          .to(".feat-1", { x: -100, opacity: 0, duration: 0.2 })
          .to(".phone-screen-1", { opacity: 0, duration: 0.15 }, "<")
          // Feature 2: Real Market Prices
          .fromTo(".feat-2", { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 })
          .to(".phone-screen-2", { opacity: 1, duration: 0.2 }, "<0.1")
          .to({}, { duration: 0.3 })
          .to(".feat-2", { x: 100, opacity: 0, duration: 0.2 })
          .to(".phone-screen-2", { opacity: 0, duration: 0.15 }, "<")
          // Feature 3: List in Seconds
          .fromTo(".feat-3", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 })
          .to(".phone-screen-3", { opacity: 1, duration: 0.2 }, "<0.1")
          .to({}, { duration: 0.4 })
      }

      // --- SECTION 3: THE STORY (pinned) ---
      if (storyRef.current) {
        const storyTl = gsap.timeline({
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 0.5,
          }
        })

        storyTl
          // Beat 1: The Find
          .fromTo(".story-photo", { rotation: -8, y: 80, opacity: 0 }, { rotation: -3, y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" })
          .fromTo(".story-question", { opacity: 0 }, { opacity: 1, duration: 0.3 }, "+=0.1")
          .to({}, { duration: 0.2 })
          // Beat 2: The Scan
          .fromTo(".story-scanline", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.3 })
          .to(".story-question", { opacity: 0, duration: 0.1 }, "<")
          .fromTo(".story-price", { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "back.out(1.5)" })
          .to({}, { duration: 0.2 })
          // Beat 3: The Sale
          .fromTo(".story-sold", { scale: 1.5, rotation: -15, opacity: 0 }, { scale: 1, rotation: -8, opacity: 1, duration: 0.25, ease: "back.out(2)" })
          .fromTo(".story-total", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "+=0.2")
          .fromTo(".story-closing", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "+=0.2")
      }

      // --- SECTION 4: DASHBOARD fade-in ---
      if (dashRef.current) {
        gsap.fromTo(".dash-stat", { y: 40, opacity: 0 }, {
          y: 0, opacity: 1, stagger: 0.1, duration: 0.5,
          scrollTrigger: { trigger: dashRef.current, start: "top 70%" }
        })
      }

      // --- SECTION 5: PRICING slide-up ---
      if (pricingRef.current) {
        gsap.fromTo(".pricing-card", { y: 60, opacity: 0 }, {
          y: 0, opacity: 1, stagger: 0.1, duration: 0.5,
          scrollTrigger: { trigger: pricingRef.current, start: "top 70%" }
        })
      }

    }, mainRef)

    return () => ctx.revert()
  }, [])

  const activityItem = ACTIVITY_FEED[activityIdx]

  return (
    <div ref={mainRef}>
      {/* ===== SECTION 1: THE REVEAL ===== */}
      <section ref={revealRef} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", position: "relative", overflow: "hidden", background: "#060d0a" }}>
        {/* Aurora background */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, rgba(45,107,69,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(201,148,58,0.02) 0%, transparent 60%)", backgroundSize: "200% 200%", animation: "aurora 30s ease infinite" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Gold line */}
          <div className="reveal-line" style={{ width: "80px", height: "1px", background: "var(--gold)", marginBottom: "24px", transformOrigin: "center", willChange: "transform" }} />

          {/* FLIPT title */}
          <h1 className="reveal-title" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(80px, 15vw, 120px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "16px", willChange: "transform, opacity" }}>
            FLIPT
          </h1>

          {/* Tagline — word by word */}
          <p style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "var(--font-heading)", fontWeight: 400, color: "var(--text)", marginBottom: "16px", lineHeight: 1.4 }}>
            {["Turn", "your", "clutter", "into", "cash."].map((word, i) => (
              <span key={i} className="reveal-word" style={{ display: "inline-block", marginRight: "8px", willChange: "transform, opacity" }}>
                {word}
              </span>
            ))}
          </p>

          {/* Subtitle */}
          <p className="reveal-subtitle" style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "40px", willChange: "opacity" }}>
            AI-powered resale pricing for Canadians
          </p>

          {/* CTA */}
          <button className="reveal-cta btn-primary glow" onClick={() => router.push("/scan")} style={{ padding: "18px 48px", fontSize: "16px", fontWeight: 700, willChange: "transform, opacity" }}>
            <Scan size={20} /> Scan an Item
          </button>

          <p style={{ fontSize: "13px", color: "var(--text-faint)", marginTop: "16px" }}>First 5 scans free — no credit card needed</p>
        </div>

        {/* Ticker */}
        <div className="reveal-ticker" style={{ position: "absolute", bottom: "24px", left: 0, right: 0, overflow: "hidden", willChange: "opacity" }}>
          <div style={{ display: "flex", animation: "ticker 40s linear infinite", width: "max-content" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} style={{ padding: "0 32px", fontSize: "12px", color: "var(--gold)", opacity: 0.5, whiteSpace: "nowrap", fontWeight: 500 }}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: THE SCANNER (pinned) ===== */}
      <section ref={scannerRef} style={{ height: "100vh", position: "relative", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Phone mockup — CSS only */}
        <div style={{ position: "relative", width: "220px", height: "440px", borderRadius: "36px", border: "3px solid #253d2d", background: "#0c1a12", boxShadow: "0 0 60px rgba(82,176,112,0.08), 0 20px 60px rgba(0,0,0,0.4)", zIndex: 2, flexShrink: 0 }}>
          {/* Notch */}
          <div style={{ position: "absolute", top: "8px", left: "50%", transform: "translateX(-50%)", width: "80px", height: "24px", borderRadius: "12px", background: "#060d0a" }} />
          {/* Screen content */}
          <div style={{ position: "absolute", top: "36px", left: "8px", right: "8px", bottom: "8px", borderRadius: "24px", background: "#060d0a", overflow: "hidden" }}>
            {/* Default: scan interface */}
            <div className="phone-screen-default" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", transition: "opacity 0.3s ease" }}>
              <Camera size={28} style={{ color: "var(--text-faint)" }} />
              <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>Scan anything</span>
              {/* Corner brackets */}
              {[{ top: 16, left: 16, bt: "3px", bl: "3px" }, { top: 16, right: 16, bt: "3px", br: "3px" }, { bottom: 16, left: 16, bb: "3px", bl: "3px" }, { bottom: 16, right: 16, bb: "3px", br: "3px" }].map((s, i) => (
                <div key={i} style={{ position: "absolute", width: "16px", height: "16px", borderColor: "var(--gold)", borderStyle: "solid", borderWidth: 0, ...({ top: s.top, left: s.left, right: s.right, bottom: s.bottom, borderTopWidth: s.bt, borderLeftWidth: s.bl, borderBottomWidth: s.bb, borderRightWidth: s.br } as React.CSSProperties) }} />
              ))}
            </div>
            {/* Screen 1: Scanning */}
            <div className="phone-screen-1" style={{ position: "absolute", inset: 0, background: "rgba(201,148,58,0.05)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }}>
              <div style={{ width: "60%", height: "40%", border: "1px solid var(--gold)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "9px", color: "var(--gold)" }}>Scanning...</span>
              </div>
            </div>
            {/* Screen 2: Results */}
            <div className="phone-screen-2" style={{ position: "absolute", inset: 0, background: "#060d0a", padding: "20px 12px", opacity: 0 }}>
              <div style={{ height: "40%", background: "var(--surface)", borderRadius: "8px", marginBottom: "8px" }} />
              <p style={{ fontSize: "8px", color: "var(--text-faint)", marginBottom: "4px" }}>ESTIMATED VALUE</p>
              <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--gold)", fontFamily: "var(--font-heading)" }}>$85 – $120</p>
            </div>
            {/* Screen 3: Listing */}
            <div className="phone-screen-3" style={{ position: "absolute", inset: 0, background: "#060d0a", padding: "20px 12px", opacity: 0 }}>
              <p style={{ fontSize: "8px", color: "var(--gold)", marginBottom: "4px" }}>YOUR LISTING</p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Bauer Hockey Skates</p>
              <p style={{ fontSize: "8px", color: "var(--text-secondary)", lineHeight: 1.4 }}>Great condition Bauer Supreme skates, size 10. Minor wear on blades.</p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="feat-1" style={{ position: "absolute", left: "5%", top: "50%", transform: "translateY(-50%)", maxWidth: "280px", opacity: 0, willChange: "transform, opacity", zIndex: 3 }}>
          <div className="card" style={{ borderColor: "var(--gold)", borderLeft: "3px solid var(--gold)" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: "8px" }}>Scan Anything</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "12px" }}>Point your camera at any item — AI identifies it instantly</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {["Electronics", "Clothing", "Furniture", "Collectibles", "Sports"].map(t => (
                <span key={t} className="platform-badge">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="feat-2" style={{ position: "absolute", right: "5%", top: "50%", transform: "translateY(-50%)", maxWidth: "280px", opacity: 0, willChange: "transform, opacity", zIndex: 3 }}>
          <div className="card" style={{ borderColor: "var(--gold)", borderLeft: "3px solid var(--gold)" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: "8px" }}>Real Market Prices</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "12px" }}>See what your item sells for across 5 platforms</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[{ p: "Kijiji", v: "$95" }, { p: "eBay", v: "$110" }, { p: "Facebook", v: "$85" }].map(x => (
                <div key={x.p} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{x.p}</span>
                  <span style={{ color: "var(--gold)", fontWeight: 700 }}>{x.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="feat-3" style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", maxWidth: "320px", width: "90%", opacity: 0, willChange: "transform, opacity", zIndex: 3 }}>
          <div className="card" style={{ borderColor: "var(--gold)", borderTop: "3px solid var(--gold)", textAlign: "center" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: "8px" }}>List in Seconds</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>Ready-to-post listing generated automatically</p>
            <button onClick={() => router.push("/scan")} className="btn-primary" style={{ margin: "0 auto" }}>
              Ready to try it? <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: THE STORY (pinned) ===== */}
      <section ref={storyRef} style={{ height: "100vh", position: "relative", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "24px", maxWidth: "400px", width: "100%" }}>

          {/* Polaroid photo card */}
          <div className="story-photo" style={{ background: "#fff", padding: "12px 12px 40px", borderRadius: "4px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", width: "200px", willChange: "transform, opacity" }}>
            <div style={{ width: "100%", aspectRatio: "1", background: "#1a1a1a", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
              <img
                src="https://images.unsplash.com/photo-1580891066394-13884adce58a?w=400&h=400&fit=crop"
                alt="Hockey skates"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.style.display = "flex"; (e.target as HTMLImageElement).parentElement!.style.alignItems = "center"; (e.target as HTMLImageElement).parentElement!.style.justifyContent = "center"; (e.target as HTMLImageElement).parentElement!.style.fontSize = "48px"; (e.target as HTMLImageElement).parentElement!.innerText = "\u26F8\uFE0F" }}
              />
            </div>
            <p style={{ color: "#333", fontSize: "12px", fontWeight: 500, textAlign: "center", marginTop: "12px" }}>Found in the basement</p>
          </div>

          {/* Question */}
          <p className="story-question" style={{ fontSize: "18px", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontStyle: "italic", opacity: 0, willChange: "opacity" }}>
            What is this worth?
          </p>

          {/* Scan line over photo */}
          <div className="story-scanline" style={{ position: "absolute", top: "40%", left: "15%", right: "15%", height: "2px", background: "var(--gold)", boxShadow: "0 0 20px var(--gold)", opacity: 0, willChange: "transform, opacity", transformOrigin: "left" }} />

          {/* Price card */}
          <div className="story-price" style={{ background: "var(--surface)", border: "2px solid var(--gold)", borderRadius: "20px", padding: "20px 28px", textAlign: "center", opacity: 0, willChange: "transform, opacity" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Hockey Skates</p>
            <p style={{ fontSize: "36px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--gold)" }}>$85 – $120</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Best on: Kijiji</p>
          </div>

          {/* SOLD stamp */}
          <div className="story-sold" style={{ position: "absolute", top: "20%", left: "10%", fontSize: "48px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--green-accent)", border: "4px solid var(--green-accent)", borderRadius: "8px", padding: "4px 16px", opacity: 0, willChange: "transform, opacity" }}>
            SOLD
          </div>

          {/* Total earned */}
          <div className="story-total" style={{ textAlign: "center", opacity: 0, willChange: "transform, opacity" }}>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>Sold for $95 in 3 days</p>
            {/* Quick beat items */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "16px" }}>
              {[
                { img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop", label: "Laptop", price: "$340", emoji: "\uD83D\uDCBB" },
                { img: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=200&h=200&fit=crop", label: "Lamp", price: "$65", emoji: "\uD83D\uDCA1" },
                { img: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=200&h=200&fit=crop", label: "Cards", price: "$180", emoji: "\uD83C\uDCCF" },
              ].map((item, i) => (
                <div key={i} style={{ width: "64px", textAlign: "center" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "8px", overflow: "hidden", background: "#1a1a1a", margin: "0 auto 4px", border: "2px solid #fff" }}>
                    <img src={item.img} alt={item.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerText = item.emoji }} />
                  </div>
                  <p style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700 }}>{item.price}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--gold)" }}>Total earned: $680</p>
          </div>

          {/* Closing line */}
          <p className="story-closing" style={{ fontSize: "16px", color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center", opacity: 0, willChange: "opacity" }}>
            All from stuff sitting in one basement.
          </p>
        </div>
      </section>

      {/* ===== SECTION 4: THE DASHBOARD ===== */}
      <section ref={dashRef} style={{ minHeight: "100vh", background: "var(--bg)", padding: "64px 20px 80px", display: "flex", flexDirection: "column", alignItems: "center", gap: "40px" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", maxWidth: "600px", width: "100%" }}>
          {[
            { num: "847", label: "Canadians scanning right now", color: "var(--green-accent)" },
            { num: "$2.3M", label: "Found in clutter this month", color: "var(--gold)" },
            { num: "94%", label: "Scan accuracy rate", color: "var(--green-accent)" },
          ].map((s, i) => (
            <div key={i} className="dash-stat card" style={{ flex: "1 1 160px", textAlign: "center", padding: "28px 20px", willChange: "transform, opacity" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.num}</p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Live activity feed */}
        <div style={{ maxWidth: "400px", width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green-accent)", animation: "goldPulse 2s ease infinite" }} />
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Activity</p>
            </div>
          </div>
          <div style={{ padding: "12px 20px", minHeight: "200px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {ACTIVITY_FEED.slice(activityIdx, activityIdx + 5).concat(ACTIVITY_FEED.slice(0, Math.max(0, activityIdx + 5 - ACTIVITY_FEED.length))).map((a, i) => (
              <div key={`${activityIdx}-${i}`} style={{ display: "flex", alignItems: "center", gap: "10px", opacity: i === 0 ? 1 : 0.7 - i * 0.12, transition: "opacity 0.5s" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>
                  {a.city[0]}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1 }}>
                  Someone in <span style={{ color: "var(--text)" }}>{a.city}</span> found a <span style={{ color: "var(--text)" }}>{a.item}</span> worth <span style={{ color: "var(--gold)", fontWeight: 700 }}>${a.price}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: PRICING ===== */}
      <section ref={pricingRef} style={{ minHeight: "100vh", background: "var(--bg-secondary)", padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontFamily: "var(--font-heading)", textAlign: "center", marginBottom: "12px" }}>Start for free.</h2>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", textAlign: "center", marginBottom: "48px" }}>No credit card needed. First 5 scans on us.</p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", maxWidth: "640px", width: "100%" }}>
          {/* Pro card */}
          <div className="pricing-card" style={{ flex: "1 1 260px", maxWidth: "300px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "32px 24px", borderTop: "3px solid var(--green-accent)", willChange: "transform, opacity" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Pro</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "40px", fontWeight: 700 }}>$4.99</span>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>/month</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--green-accent)", fontWeight: 600, marginBottom: "24px" }}>or $39.99/year — save 33%</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {PRO_FEATURES.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Check size={14} style={{ color: "var(--green-accent)", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/settings")} className="btn-secondary" style={{ width: "100%" }}>Start Free Trial</button>
          </div>

          {/* Business card */}
          <div className="pricing-card" style={{ flex: "1 1 260px", maxWidth: "300px", background: "var(--surface)", border: "1px solid var(--gold)", borderRadius: "20px", padding: "32px 24px", borderTop: "3px solid var(--gold)", boxShadow: "0 0 40px var(--gold-glow)", position: "relative", willChange: "transform, opacity" }}>
            <div style={{ position: "absolute", top: "16px", right: "16px", background: "var(--gold-gradient)", color: "#060d0a", fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "50px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Most Popular</div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Business</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "40px", fontWeight: 700 }}>$14.99</span>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>/month</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--gold)", fontWeight: 600, marginBottom: "24px" }}>or $119.99/year — save 33%</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {BIZ_FEATURES.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Check size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/settings")} className="btn-primary" style={{ width: "100%" }}>Start Free Trial</button>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-faint)", marginTop: "32px", textAlign: "center" }}>
          Join 10,000+ Canadians turning clutter into cash
        </p>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section style={{ minHeight: "50vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ fontSize: "clamp(28px, 6vw, 44px)", fontFamily: "var(--font-heading)", maxWidth: "500px", marginBottom: "32px" }}>
            Ready to find out what your stuff is worth?
          </h2>
          <button onClick={() => router.push("/scan")} className="btn-primary glow" style={{ padding: "20px 48px", fontSize: "16px", fontWeight: 700 }}>
            <Scan size={20} /> Scan an Item <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  )
}
