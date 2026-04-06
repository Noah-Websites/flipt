"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Lightbulb, Check, MapPin, RefreshCw, Flame } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, SlideIn, CountUp } from "../components/Motion"
import { getMarketEmail, setMarketEmail, getCloset } from "../lib/storage"

const TRENDING = [
  { name: "AirPods Pro 2nd Gen", avgPrice: 145, change: "+12%", hot: true },
  { name: "Lululemon Align Leggings", avgPrice: 62, change: "+8%", hot: true },
  { name: "Nintendo Switch OLED", avgPrice: 265, change: "+5%", hot: false },
  { name: "Canada Goose Jacket", avgPrice: 420, change: "+18%", hot: true },
  { name: "Dyson V15 Detect", avgPrice: 380, change: "+3%", hot: false },
]

const HOUSEHOLD_PRICES = [
  { item: "Used iPhone 14", low: 350, high: 500 },
  { item: "KitchenAid Stand Mixer", low: 120, high: 200 },
  { item: "IKEA Kallax Shelf", low: 30, high: 60 },
  { item: "Peloton Bike", low: 600, high: 900 },
  { item: "Herman Miller Chair", low: 400, high: 700 },
]

const PLATFORMS = [
  { name: "Facebook Marketplace", note: "Best for furniture & local pickup", volume: "High" },
  { name: "eBay", note: "Best for electronics & collectibles", volume: "High" },
  { name: "Kijiji", note: "Best for Canadian sellers, low fees", volume: "Medium" },
  { name: "Poshmark", note: "Best for clothing & accessories", volume: "Medium" },
]

interface HotItem {
  name: string; category: string; avgPrice: number; demandLevel: "Low" | "Medium" | "High"
  priceChange: string; whyTrending: string
}

export default function Market() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hotItems, setHotItems] = useState<HotItem[]>([])
  const [hotLoading, setHotLoading] = useState(false)
  const [hotLastUpdated, setHotLastUpdated] = useState<string | null>(null)
  const [closetItems, setClosetItems] = useState<string[]>([])

  useEffect(() => {
    const saved = getMarketEmail()
    if (saved) setSubscribed(true)
    setClosetItems(getCloset().map(c => c.item.toLowerCase()))
    setMounted(true)
  }, [])

  async function loadHotItems() {
    setHotLoading(true)
    try {
      const res = await fetch("/api/hot-items")
      const data = await res.json()
      if (data.items) {
        setHotItems(data.items)
        setHotLastUpdated(data.lastUpdated || "just now")
      }
    } catch { /* ignore */ }
    setHotLoading(false)
  }

  function hasInCloset(itemName: string) {
    const q = itemName.toLowerCase()
    return closetItems.some(c => c.includes(q) || q.includes(c))
  }

  function handleSubscribe() {
    if (!email.includes("@")) return
    setMarketEmail(email)
    setSubscribed(true)
  }

  if (!mounted) return null

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", background: "#0d0a08", padding: "0 0 120px" }}>

        {/* Newspaper masthead */}
        <div style={{ padding: "32px 20px 20px", borderBottom: "2px solid #c9a84c" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Flipt Market</p>
          <p style={{ fontSize: "12px", color: "#c9a84c", fontWeight: 500, letterSpacing: "0.04em" }}>Weekly Report · April 1–7, 2026 · Ottawa Edition</p>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Hot Right Now in Ottawa */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Flame size={16} style={{ color: "var(--green-accent)" }} />
                <p style={{ fontSize: "14px", fontWeight: "800" }}>Hot Right Now in Ottawa</p>
              </div>
              {hotLastUpdated && <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>Updated {hotLastUpdated}</span>}
            </div>

            {hotItems.length === 0 && !hotLoading && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <MapPin size={24} style={{ color: "var(--text-faint)", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>AI-powered trending items in your city</p>
                <button onClick={loadHotItems} className="btn-sm primary">Load Ottawa Trends</button>
              </div>
            )}

            {hotLoading && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <span className="spinner" style={{ borderColor: "var(--border)", borderTopColor: "var(--green-accent)", width: "16px", height: "16px", borderWidth: "2px" }} />
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>Analyzing Ottawa market...</p>
              </div>
            )}

            {hotItems.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {hotItems.map((item, i) => (
                  <div key={i} className="hot-item-card">
                    <div className="trending-rank">{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px", flexWrap: "wrap" }}>
                        <span className="platform-badge">{item.category}</span>
                        <span className={`difficulty-pill ${item.demandLevel.toLowerCase()}`}>{item.demandLevel}</span>
                        {hasInCloset(item.name) && <span className="difficulty-pill easy" style={{ fontSize: "10px" }}>In your closet</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p className="gradient-text" style={{ fontSize: "16px", fontWeight: "800" }}>${item.avgPrice}</p>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: item.priceChange.startsWith("+") ? "var(--green-accent)" : "#d64545" }}>{item.priceChange}</span>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button onClick={loadHotItems} className="btn-sm ghost" style={{ padding: "4px 12px", fontSize: "11px", gap: "4px" }} disabled={hotLoading}>
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Trending */}
          <div>
            <p className="card-label" style={{ paddingLeft: "4px", marginBottom: "10px" }}>
              <TrendingUp size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Trending Items This Week
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {TRENDING.map((item, i) => (
                <div key={i} className="trending-item">
                  <div className="trending-rank">{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: "700" }}>{item.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>Avg ${item.avgPrice}</p>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--green-accent)" }}>{item.change}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Household prices */}
          <div className="card">
            <p className="card-label">Common Item Prices</p>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead><tr><th>Item</th><th>Low</th><th>High</th></tr></thead>
                <tbody>
                  {HOUSEHOLD_PRICES.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: "600" }}>{item.item}</td>
                      <td>${item.low}</td>
                      <td className="gradient-text" style={{ fontWeight: "700" }}>${item.high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Platforms */}
          <div className="card">
            <p className="card-label">Platform Performance</p>
            {PLATFORMS.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < PLATFORMS.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "700" }}>{p.name}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>{p.note}</p>
                </div>
                <span className="platform-badge">{p.volume}</span>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="best-time-card">
            <p className="card-label"><Lightbulb size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Seller Tip of the Week</p>
            <p style={{ fontSize: "15px", lineHeight: 1.6 }}>
              Spring cleaning season is here — furniture and home decor sell 40% faster in April.
              List bulky items now before summer when buyers focus on outdoor gear. Price competitively
              and include measurements in your listing for faster sales.
            </p>
          </div>

          {/* Newsletter */}
          <div className="newsletter-box">
            <p style={{ fontSize: "16px", fontWeight: "800", marginBottom: "4px" }}>Get This Report Weekly</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Free market insights delivered every Monday.</p>
            {!subscribed ? (
              <div className="newsletter-input-row">
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubscribe()} className="biz-input" style={{ fontSize: "13px" }} />
                <button onClick={handleSubscribe} className="btn-sm primary">Subscribe</button>
              </div>
            ) : (
              <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--green-accent)", marginTop: "12px" }}>
                <Check size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Subscribed — check your inbox on Monday
              </p>
            )}
          </div>
        </div>
      </main>
    </PageTransition>
  )
}
