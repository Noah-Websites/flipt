"use client"

import { useState, useEffect, useCallback } from "react"
import { TrendingUp, Lightbulb, Check, RefreshCw, Loader2 } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, SlideIn, CountUp } from "../components/Motion"
import { getMarketEmail, setMarketEmail } from "../lib/storage"
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

export default function Market() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [trending, setTrending] = useState<TrendItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadTrending = useCallback(async () => {
    // Set a 2s max for loading state
    const timer = setTimeout(() => setLoading(false), 2000)

    try {
      // Load latest trending data from agent_activity
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
    } catch { /* supabase error - page still renders */ }

    clearTimeout(timer)
    setLoading(false)
  }, [])

  useEffect(() => {
    const saved = getMarketEmail()
    if (saved) setSubscribed(true)
    setMounted(true)
    loadTrending()
  }, [loadTrending])

  // No auto-trigger — user clicks Refresh manually

  async function refreshData() {
    setRefreshing(true)
    try {
      const res = await fetch("/api/agents/trend-spotter")
      const data = await res.json()
      if (data.items) {
        setTrending(data.items)
        setLastUpdated(new Date().toISOString())
      }
    } catch { /* ignore */ }
    setRefreshing(false)
  }

  function handleSubscribe() {
    if (!email.includes("@")) return
    setMarketEmail(email)
    setSubscribed(true)
  }

  if (!mounted) return null

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

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
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Free market insights every Monday.</p>
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
