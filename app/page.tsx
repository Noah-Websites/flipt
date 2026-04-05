"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Settings, ChevronRight, Scan, TrendingUp, BarChart3, FileText } from "lucide-react"
import ThemeToggle from "./components/ThemeToggle"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "./components/Motion"
import { getReferralCount, addReferral } from "./lib/storage"

const WINS = [
  { name: "Sarah M.", item: "Nike Air Max 90", price: 180, ago: "2m" },
  { name: "James T.", item: "MacBook Pro 14\"", price: 890, ago: "5m" },
  { name: "Emma K.", item: "Vintage Tiffany Lamp", price: 220, ago: "12m" },
  { name: "Omar H.", item: "Canada Goose Parka", price: 475, ago: "18m" },
  { name: "Lisa C.", item: "Dyson Airwrap", price: 340, ago: "25m" },
  { name: "Mike R.", item: "PS5 + 2 Controllers", price: 420, ago: "31m" },
]

const FEATURES = [
  { icon: <Scan size={20} />, title: "AI Identification", desc: "Instant item recognition from any photo" },
  { icon: <BarChart3 size={20} />, title: "Live Market Prices", desc: "Compare across 5 platforms at once" },
  { icon: <FileText size={20} />, title: "Instant Listings", desc: "Ready-to-post title and description" },
]

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref && !localStorage.getItem("flipt-ref-visited")) {
      localStorage.setItem("flipt-ref-visited", ref)
      addReferral()
    }
    // Animate counter
    let frame: number
    const target = 847293
    const duration = 2000
    const start = performance.now()
    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setTotalValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [searchParams])

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", paddingBottom: "100px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "24px", fontWeight: 700, color: "var(--text)" }}>Flipt</p>
          <button onClick={() => router.push("/settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "8px" }}>
            <Settings size={20} />
          </button>
        </div>

        {/* Hero stat */}
        <FadeUp>
          <section style={{ padding: "48px 20px 32px", textAlign: "center" }}>
            <p className="stat-label" style={{ color: "var(--green-accent)", marginBottom: "8px" }}>Total Value Found Today</p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(48px, 12vw, 72px)", fontWeight: 700, lineHeight: 1, marginBottom: "8px" }}>
              ${totalValue.toLocaleString()}
            </p>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>by Flipt users across Canada</p>
            <div style={{ width: "48px", height: "1px", background: "var(--green-accent)", margin: "24px auto 0", opacity: 0.4 }} />
          </section>
        </FadeUp>

        {/* Recent Wins */}
        <section style={{ marginBottom: "28px" }}>
          <p className="stat-label" style={{ padding: "0 20px", marginBottom: "12px" }}>Recent Wins</p>
          <div className="h-scroll">
            {WINS.map((w, i) => (
              <div key={i} style={{ minWidth: "160px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "14px", flexShrink: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.item}</p>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--green-accent)", fontFamily: "var(--font-heading)", marginBottom: "4px" }}>${w.price}</p>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{w.name} · {w.ago} ago</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scan button */}
        <FadeUp delay={0.15}>
          <div style={{ padding: "0 20px", marginBottom: "28px" }}>
            <button onClick={() => router.push("/scan")} className="btn-primary full glow">
              Scan an Item
            </button>
          </div>
        </FadeUp>

        {/* Features */}
        <StaggerContainer>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {FEATURES.map((f, i) => (
              <StaggerItem key={i}>
                <div className="e2e-row" onClick={() => router.push("/scan")}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green-accent)", flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "15px", fontWeight: 600 }}>{f.title}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{f.desc}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* Trending pills */}
        <section style={{ marginTop: "28px" }}>
          <p className="stat-label" style={{ padding: "0 20px", marginBottom: "10px" }}>Trending in Ottawa</p>
          <div className="h-scroll">
            {["Electronics", "Clothing", "Furniture", "Sports", "Books", "Collectibles", "Home"].map(c => (
              <button key={c} className="pill" onClick={() => router.push("/marketplace")}>{c}</button>
            ))}
          </div>
        </section>
      </main>
      <ThemeToggle />
    </PageTransition>
  )
}
