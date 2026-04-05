"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Settings, ChevronRight, Scan, BarChart3, FileText, Camera } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "./components/Motion"
import { useCurrency } from "./components/CurrencyProvider"
import { addReferral } from "./lib/storage"
import { supabase } from "./lib/supabase"

const FEATURES = [
  { icon: <Camera size={20} />, title: "AI Identification", desc: "Instant item recognition from any photo" },
  { icon: <BarChart3 size={20} />, title: "Live Market Prices", desc: "Compare across 5 platforms at once" },
  { icon: <FileText size={20} />, title: "Instant Listings", desc: "Ready-to-post title and description" },
]

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatPrice } = useCurrency()
  const [todayValue, setTodayValue] = useState<number | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref && !localStorage.getItem("flipt-ref-visited")) {
      localStorage.setItem("flipt-ref-visited", ref)
      addReferral()
    }

    // Load real total value from today's scans
    async function loadStats() {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { data } = await supabase
          .from("scans")
          .select("estimated_value_low, estimated_value_high")
          .gte("created_at", today.toISOString())

        if (data && data.length > 0) {
          const total = data.reduce((sum: number, s: { estimated_value_low: number; estimated_value_high: number }) => {
            return sum + Math.round((s.estimated_value_low + s.estimated_value_high) / 2)
          }, 0)
          setTodayValue(total)
        } else {
          setTodayValue(0)
        }
      } catch {
        setTodayValue(0)
      }
      setLoadingStats(false)
    }
    loadStats()
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

        {/* Hero */}
        <FadeUp>
          <section style={{ padding: "40px 20px 32px", textAlign: "center" }}>
            {!loadingStats && todayValue != null && todayValue > 0 ? (
              <>
                <p className="stat-label" style={{ color: "var(--green-accent)", marginBottom: "8px" }}>Total Value Found Today</p>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(40px, 12vw, 64px)", fontWeight: 700, lineHeight: 1, marginBottom: "8px" }}>
                  {formatPrice(todayValue)}
                </p>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>by Flipt users across Canada</p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: "clamp(32px, 8vw, 48px)", lineHeight: 1.15, marginBottom: "12px", maxWidth: "480px", margin: "0 auto 12px" }}>
                  Turn your clutter into cash.
                </h1>
                <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "360px", margin: "0 auto" }}>
                  One photo at a time. AI-powered resale pricing for Canadians.
                </p>
              </>
            )}
            <div style={{ width: "48px", height: "1px", background: "var(--green-accent)", margin: "28px auto 0", opacity: 0.3 }} />
          </section>
        </FadeUp>

        {/* Scan button */}
        <FadeUp delay={0.15}>
          <div style={{ padding: "0 20px", marginBottom: "32px" }}>
            <button onClick={() => router.push("/scan")} className="btn-primary full glow">
              <Scan size={20} /> Scan an Item
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
      </main>
    </PageTransition>
  )
}
