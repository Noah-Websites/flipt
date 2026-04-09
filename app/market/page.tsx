"use client"

import { useState, useEffect, useCallback } from "react"
import { TrendingUp, Lightbulb, Check, RefreshCw, Loader2, Lock, BarChart3, Clock, Sparkles, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, SlideIn, CountUp } from "../components/Motion"
import { getMarketEmail, setMarketEmail } from "../lib/storage"
import { useAuth } from "../components/AuthProvider"
import { useSubscription } from "../lib/useSubscription"
import { supabase } from "../lib/supabase"

interface TrendItem {
  name: string; why_trending: string; avg_price: number; best_platform: string; demand: string; price_change: string
}

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

const GATE_FEATURES = [
  { icon: TrendingUp, text: "Weekly trending items in your city" },
  { icon: BarChart3, text: "Platform performance data" },
  { icon: Clock, text: "Best time to sell reports" },
  { icon: Sparkles, text: "AI-powered market predictions" },
  { icon: Globe, text: "Canadian resale market insights" },
]

export default function Market() {
  const router = useRouter()
  const { user } = useAuth()
  const { canAccess, plan } = useSubscription(user?.id)
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [trending, setTrending] = useState<TrendItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadTrending = useCallback(async () => {
    const timer = setTimeout(() => setLoading(false), 2000)
    try {
      const { data } = await supabase
        .from("agent_activity")
        .select("details, created_at")
        .eq("agent_name", "Trend Spotter Agent")
        .like("action", "Market report:%")
        .order("created_at", { ascending: false })
        .limit(1)

      if (data && data[0]?.details) {
        try {
          const items = JSON.parse(data[0].details)
          if (Array.isArray(items)) {
            setTrending(items)
            setLastUpdated(data[0].created_at)
          }
        } catch { /* parse error */ }
      }
    } catch { /* supabase error */ }
    clearTimeout(timer)
    setLoading(false)
  }, [])

  useEffect(() => {
    const saved = getMarketEmail()
    if (saved) setSubscribed(true)
    setMounted(true)
    loadTrending()
  }, [loadTrending])

  async function refreshData() {
    setRefreshing(true)
    await loadTrending()
    setRefreshing(false)
  }

  function handleSubscribe() {
    if (!email.includes("@")) return
    setMarketEmail(email)
    setSubscribed(true)
  }

  if (!mounted) return null

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  // ===== BUSINESS GATE =====
  if (!canAccess("market_report")) {
    return (
      <PageTransition>
        <main style={{ minHeight: "100vh", padding: "0 0 120px", position: "relative", overflow: "hidden" }}>

          {/* Blurred preview behind the gate */}
          <div style={{ position: "absolute", inset: 0, filter: "blur(8px)", opacity: 0.4, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ padding: "32px 20px 20px", borderBottom: "2px solid #c9a84c" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Flipt Market</p>
              <p style={{ fontSize: "12px", color: "#c9a84c", fontWeight: 500 }}>{dateStr}</p>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="trending-item" style={{ opacity: 0.6 }}>
                  <div className="trending-rank">{i}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: "14px", width: `${60 + i * 5}%`, background: "var(--surface-alt)", borderRadius: "4px", marginBottom: "6px" }} />
                    <div style={{ height: "10px", width: "80%", background: "var(--surface-alt)", borderRadius: "4px", marginBottom: "6px" }} />
                    <div style={{ display: "flex", gap: "6px" }}>
                      <div style={{ height: "18px", width: "60px", background: "var(--surface-alt)", borderRadius: "50px" }} />
                      <div style={{ height: "18px", width: "40px", background: "var(--surface-alt)", borderRadius: "50px" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ height: "20px", width: "50px", background: "var(--surface-alt)", borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade prompt overlay */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "48px 24px", textAlign: "center" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ maxWidth: "400px", width: "100%" }}
            >
              {/* Lock icon */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{
                  width: "80px", height: "80px", borderRadius: "24px",
                  background: "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Lock size={32} style={{ color: "#c9a84c" }} />
              </motion.div>

              {/* Heading */}
              <h2 style={{
                fontFamily: "var(--font-heading)", fontSize: "32px", fontWeight: 700,
                lineHeight: 1.15, marginBottom: "12px",
              }}>
                Market Intelligence
              </h2>

              {/* Subheading */}
              <p style={{
                fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6,
                marginBottom: "32px", maxWidth: "340px", margin: "0 auto 32px",
              }}>
                Get weekly trending items, platform performance data, and market insights — exclusive to Business subscribers.
              </p>

              {/* Feature list */}
              <div style={{
                display: "flex", flexDirection: "column", gap: "12px",
                textAlign: "left", marginBottom: "32px",
                padding: "20px 24px",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "16px",
              }}>
                {GATE_FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "8px",
                      background: "rgba(201,168,76,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: "#c9a84c" }} />
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <motion.button
                onClick={() => router.push("/settings#subscription")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", padding: "18px 32px", fontSize: "16px", fontWeight: 700,
                  fontFamily: "var(--font-body)",
                  background: "linear-gradient(135deg, #c9a84c 0%, #d4b85a 50%, #c9a84c 100%)",
                  color: "#000", border: "none", borderRadius: "16px", cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(201,168,76,0.3), 0 0 0 1px rgba(201,168,76,0.1)",
                  transition: "box-shadow 0.2s ease",
                }}
              >
                Upgrade to Business
              </motion.button>

              {/* Pricing note */}
              <p style={{
                fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px",
              }}>
                $14.99/month or $119.99/year
              </p>

              {/* Current plan indicator */}
              <p style={{
                fontSize: "11px", color: "var(--text-faint)", marginTop: "16px",
              }}>
                You&apos;re currently on the <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{plan}</span> plan
              </p>
            </motion.div>
          </div>
        </main>
      </PageTransition>
    )
  }

  // ===== FULL MARKET REPORT (Business subscribers) =====
  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>

        {/* Masthead */}
        <div style={{ padding: "32px 20px 20px", borderBottom: "2px solid #c9a84c" }}>
          <FadeUp>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Flipt Market</p>
            <p style={{ fontSize: "12px", color: "#c9a84c", fontWeight: 500 }}>{dateStr}</p>
          </FadeUp>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Refresh controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Trending Items
              </p>
              {lastUpdated && <p style={{ fontSize: "10px", color: "var(--text-faint)" }}>Updated {timeAgo(lastUpdated)}</p>}
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="btn-sm ghost"
              style={{ gap: "6px", fontSize: "11px" }}
            >
              {refreshing ? <Loader2 size={12} style={{ animation: "spin 0.6s linear infinite" }} /> : <RefreshCw size={12} />}
              {refreshing ? "Fetching..." : "Refresh"}
            </button>
          </div>

          {/* Loading skeleton */}
          {loading && trending.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: "72px", borderRadius: "14px" }} />
              ))}
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", marginTop: "8px" }}>
                Fetching live market data...
              </p>
            </div>
          )}

          {/* Trending items - REAL DATA */}
          {trending.length > 0 && (
            <StaggerContainer stagger={0.1}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {trending.map((item, i) => (
                  <StaggerItem key={i}>
                    <div className="trending-item">
                      <div className="trending-rank">{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", lineHeight: 1.4 }}>{item.why_trending}</p>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                          <span className="platform-badge">{item.best_platform}</span>
                          <span className={`badge ${item.demand === "High" ? "green" : "gold"}`}>{item.demand}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--green-accent)" }}>
                          ${item.avg_price}
                        </p>
                        {item.price_change && item.price_change !== "stable" && (
                          <span style={{ fontSize: "11px", fontWeight: 600, color: item.price_change.startsWith("+") ? "var(--green-accent)" : "var(--red)" }}>
                            {item.price_change}
                          </span>
                        )}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          )}

          {/* No data state */}
          {!loading && trending.length === 0 && !refreshing && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <TrendingUp size={28} style={{ color: "var(--text-faint)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>No market data yet</p>
              <button onClick={refreshData} className="btn-sm primary">Fetch Market Data</button>
            </div>
          )}

          {/* Tip */}
          <FadeUp>
            <div style={{ background: "var(--green-light)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Lightbulb size={14} style={{ color: "var(--green-accent)" }} />
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Seller Tip</p>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.6 }}>
                Items trending this week often sell 20-30% faster than usual. Check if you have any of these items and list them now for the best price.
              </p>
            </div>
          </FadeUp>

          {/* Newsletter */}
          <FadeUp>
            <div className="newsletter-box">
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Get This Report Weekly</p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Free market insights every Monday</p>
              {!subscribed ? (
                <div className="newsletter-input-row">
                  <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubscribe()} className="input" style={{ fontSize: "13px" }} />
                  <button onClick={handleSubscribe} className="btn-sm primary">Subscribe</button>
                </div>
              ) : (
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--green-accent)", marginTop: "12px" }}>
                  <Check size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Subscribed
                </p>
              )}
            </div>
          </FadeUp>
        </div>
      </main>
    </PageTransition>
  )
}
