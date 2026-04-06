"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Settings, ChevronRight, Camera, BarChart3, FileText, Scan, ArrowRight, Check } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, WordReveal, CountUp, ScaleIn, SlideIn } from "./components/Motion"
import { useCurrency } from "./components/CurrencyProvider"
import { addReferral } from "./lib/storage"
import { supabase } from "./lib/supabase"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatPrice } = useCurrency()
  const [todayValue, setTodayValue] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref && !localStorage.getItem("flipt-ref-visited")) { localStorage.setItem("flipt-ref-visited", ref); addReferral() }
    // Load real stats
    async function load() {
      try {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const { data } = await supabase.from("scans").select("estimated_value_low, estimated_value_high").gte("created_at", today.toISOString())
        if (data && data.length > 0) {
          setTodayValue(data.reduce((s: number, d: { estimated_value_low: number; estimated_value_high: number }) => s + Math.round((d.estimated_value_low + d.estimated_value_high) / 2), 0))
        }
      } catch {}
      setLoaded(true)
    }
    load()
  }, [searchParams])

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", paddingBottom: "100px" }}>

        {/* === HERO === */}
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Animated gradient background */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, #0f2a18 0%, #0a0d0a 70%)", animation: "gradientShift 8s ease infinite alternate" }} />
          {/* Floating particles */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                width: "2px", height: "2px", borderRadius: "50%",
                background: "rgba(82,183,136,0.3)",
                left: `${10 + (i * 7) % 80}%`,
                bottom: `${-10 + (i * 13) % 20}%`,
                animation: `floatUp ${8 + i * 2}s linear infinite`,
                animationDelay: `${i * 0.7}s`,
              }} />
            ))}
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Logo */}
            <ScaleIn>
              <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "48px", fontWeight: 700, color: "var(--green-accent)", marginBottom: "24px" }}>Flipt</p>
            </ScaleIn>

            {/* Tagline */}
            <h1 style={{ fontSize: "clamp(32px, 7vw, 56px)", fontFamily: "var(--font-heading)", lineHeight: 1.1, maxWidth: "600px", marginBottom: "16px" }}>
              <WordReveal text="Turn your clutter into cash" />
            </h1>

            <FadeUp delay={0.8}>
              <p style={{ fontSize: "18px", color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto 32px" }}>
                AI-powered resale pricing for Canadians.
              </p>
            </FadeUp>

            <FadeUp delay={1.1}>
              <button onClick={() => router.push("/scan")} className="btn-primary full glow" style={{ maxWidth: "320px", margin: "0 auto" }}>
                <Scan size={20} /> Scan Your First Item
              </button>
            </FadeUp>
          </div>

          {/* Settings icon */}
          <button onClick={() => router.push("/settings")} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "8px", zIndex: 2 }}>
            <Settings size={20} />
          </button>
        </section>

        {/* === STATS === */}
        {loaded && todayValue > 0 && (
          <section style={{ padding: "48px 20px", textAlign: "center" }}>
            <FadeUp>
              <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green-accent)", marginBottom: "8px" }}>Total Value Found Today</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(36px, 10vw, 64px)", fontWeight: 700 }}>
                <CountUp value={todayValue} prefix="$" />
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>by Flipt users across Canada</p>
            </FadeUp>
          </section>
        )}

        {/* === FEATURES SHOWCASE === */}
        <section style={{ padding: "32px 0" }}>
          {[
            { icon: <Camera size={28} />, title: "Scan Anything", desc: "Point your camera at any item. Our AI identifies it instantly, tells you exactly what it's worth, and generates a ready-to-post listing in seconds.", num: "01" },
            { icon: <BarChart3 size={28} />, title: "Real Market Prices", desc: "See live prices across Kijiji, Facebook Marketplace, eBay, Poshmark, and Craigslist — all at once. Know the best platform before you list.", num: "02" },
            { icon: <FileText size={28} />, title: "List in Seconds", desc: "Get a professional title and description generated automatically. Just copy and paste to any platform. Optimized for quick sales.", num: "03" },
          ].map((f, i) => (
            <div key={i} style={{ padding: "48px 20px", borderTop: "1px solid var(--border)" }}>
              <div style={{ maxWidth: "480px", margin: "0 auto" }}>
                <FadeUp delay={0.1}>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "64px", fontWeight: 700, color: "var(--border)", lineHeight: 1, marginBottom: "16px" }}>{f.num}</p>
                </FadeUp>
                <SlideIn direction={i % 2 === 0 ? "left" : "right"}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", color: "var(--green-accent)" }}>
                    {f.icon}
                    <h2 style={{ fontSize: "28px" }}>{f.title}</h2>
                  </div>
                </SlideIn>
                <FadeUp delay={0.2}>
                  <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
                </FadeUp>
              </div>
            </div>
          ))}
        </section>

        {/* === HOW IT WORKS === */}
        <section style={{ padding: "48px 20px" }}>
          <FadeUp>
            <h2 style={{ fontSize: "32px", textAlign: "center", marginBottom: "32px" }}>How It Works</h2>
          </FadeUp>
          <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            <StaggerContainer stagger={0.15}>
              {[
                { step: "01", title: "Take a Photo", desc: "Snap a photo of anything you want to sell" },
                { step: "02", title: "Get Instant Pricing", desc: "AI identifies the item and compares prices across 5 platforms" },
                { step: "03", title: "List and Sell", desc: "Copy the generated listing and post it anywhere" },
              ].map((s, i) => (
                <StaggerItem key={i}>
                  <div style={{ display: "flex", gap: "16px", padding: "20px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700, color: "var(--green-accent)" }}>{s.step}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{s.title}</p>
                      <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{s.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* === PRICING === */}
        <section style={{ padding: "48px 20px" }}>
          <FadeUp>
            <h2 style={{ fontSize: "32px", textAlign: "center", marginBottom: "8px" }}>Simple Pricing</h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center", marginBottom: "32px" }}>Start free. Upgrade when you are ready.</p>
          </FadeUp>
          <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", gap: "12px" }}>
            <ScaleIn delay={0.1}>
              <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>Free</p>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700, marginBottom: "12px" }}>$0</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>5 scans per month</p>
                <button onClick={() => router.push("/scan")} className="btn-secondary" style={{ width: "100%", padding: "10px", fontSize: "13px" }}>Get Started</button>
              </div>
            </ScaleIn>
            <ScaleIn delay={0.2}>
              <div style={{ flex: 1, background: "var(--green-light)", border: "1px solid var(--green-accent)", borderRadius: "16px", padding: "24px", textAlign: "center", position: "relative" }}>
                <div style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", background: "var(--green-accent)", color: "#000", fontSize: "10px", fontWeight: 700, padding: "2px 10px", borderRadius: "50px" }}>Popular</div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--green-accent)", marginBottom: "4px" }}>Pro</p>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700, marginBottom: "12px" }}>$5.99<span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>/mo</span></p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Unlimited scans</p>
                <button onClick={() => router.push("/settings")} className="btn-primary" style={{ width: "100%", padding: "10px", fontSize: "13px" }}>Upgrade</button>
              </div>
            </ScaleIn>
          </div>
        </section>

        {/* === FINAL CTA === */}
        <section style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px" }}>
          <div>
            <ScaleIn>
              <h2 style={{ fontSize: "clamp(28px, 6vw, 44px)", maxWidth: "500px", marginBottom: "24px" }}>Ready to find out what your stuff is worth?</h2>
            </ScaleIn>
            <FadeUp delay={0.3}>
              <button onClick={() => router.push("/scan")} className="btn-primary glow" style={{ padding: "18px 48px", fontSize: "16px" }}>
                <Scan size={20} /> Scan an Item <ArrowRight size={16} />
              </button>
            </FadeUp>
          </div>
        </section>
      </main>
    </PageTransition>
  )
}
