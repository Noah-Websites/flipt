"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, TrendingUp, Loader2, Sun, Snowflake, Leaf, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from "recharts"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { LockedPage } from "../components/UpgradeModal"
import { useSubscription } from "../lib/useSubscription"
import { useCurrency } from "../components/CurrencyProvider"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

interface SellometerResult {
  itemName: string; bestMonth: string; worstMonth: string; peakPremiumPercent: number;
  monthlyPrices: number[]; currentStatus: "Good" | "Average" | "Bad";
  currentStatusReason: string; daysUntilPeak: number; seasonalReasoning: string;
  currentTips: string[]; whatBuyersWant: string;
  relatedItems: Array<{ name: string; bestMonth: string }>;
}

export default function Sellometer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { canAccess } = useSubscription(user?.id)
  const { formatPrice } = useCurrency()

  const [query, setQuery] = useState(searchParams.get("item") || "")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SellometerResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("item") && canAccess("full_price_comparison")) {
      handleSearch(searchParams.get("item")!)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(item?: string) {
    const q = (item || query).trim()
    if (!q) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch("/api/sellometer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: q }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data as SellometerResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setLoading(false)
  }

  if (!canAccess("full_price_comparison")) {
    return (
      <PageTransition><main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 16px" }}><h2>Seasonal Sellometer</h2></div>
        <LockedPage title="Sellometer is a Pro feature" description="Know exactly when to sell any item for maximum profit with seasonal pricing intelligence" plan="pro" onUpgrade={() => router.push("/settings")} />
      </main></PageTransition>
    )
  }

  const currentMonthIdx = new Date().getMonth()
  const statusColor = result?.currentStatus === "Good" ? "var(--green-accent)" : result?.currentStatus === "Bad" ? "var(--red)" : "var(--gold)"
  const chartData = result?.monthlyPrices.map((price, i) => ({
    month: MONTHS[i], price, isBest: MONTH_FULL[i] === result.bestMonth, isWorst: MONTH_FULL[i] === result.worstMonth, isCurrent: i === currentMonthIdx,
  })) || []
  const bestIdx = chartData.findIndex(d => d.isBest)
  const worstIdx = chartData.findIndex(d => d.isWorst)

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 8px" }}>
          <h2 style={{ marginBottom: "4px" }}>Seasonal Sellometer</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Know exactly when to sell for maximum profit</p>
        </div>

        <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Search */}
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
              <input placeholder="What are you thinking of selling?" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} className="input search" />
            </div>
            <button onClick={() => handleSearch()} disabled={loading || !query.trim()} className="btn-primary" style={{ padding: "0 20px", flexShrink: 0 }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 0.6s linear infinite" }} /> : "Check"}
            </button>
          </div>

          {error && <p style={{ color: "var(--red)", fontSize: "13px", textAlign: "center" }}>{error}</p>}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                {/* Best Time to Sell */}
                <FadeUp>
                  <div className="card" style={{ textAlign: "center" }}>
                    <p className="card-label">Best Time to Sell</p>
                    <p style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--green-accent)", marginBottom: "4px" }}>
                      SELL IN {result.bestMonth.toUpperCase()}
                    </p>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      Items like this sell for <strong style={{ color: "var(--green-accent)" }}>{result.peakPremiumPercent}% more</strong> in {result.bestMonth} vs {result.worstMonth}
                    </p>
                    {/* Month calendar row */}
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
                      {MONTHS.map((m, i) => {
                        const isBest = MONTH_FULL[i] === result.bestMonth
                        const isWorst = MONTH_FULL[i] === result.worstMonth
                        const isCurrent = i === currentMonthIdx
                        return (
                          <div key={m} style={{
                            width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "10px", fontWeight: 700,
                            background: isBest ? "var(--green-accent)" : isWorst ? "var(--red)" : isCurrent ? "var(--surface-alt)" : "transparent",
                            color: isBest ? "#000" : isWorst ? "#fff" : isCurrent ? "var(--text)" : "var(--text-faint)",
                            border: isCurrent && !isBest && !isWorst ? "1px solid var(--border)" : "none",
                          }}>{m}</div>
                        )
                      })}
                    </div>
                  </div>
                </FadeUp>

                {/* Price Chart */}
                <div className="card">
                  <p className="card-label">Price Through the Year</p>
                  <div style={{ width: "100%", height: "200px" }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-faint)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--text-faint)" }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(value) => [`$${value}`, "Price"]} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                        <Line type="monotone" dataKey="price" stroke="var(--green-accent)" strokeWidth={2} dot={false} />
                        {bestIdx >= 0 && <ReferenceDot x={MONTHS[bestIdx]} y={chartData[bestIdx].price} r={6} fill="var(--green-accent)" stroke="var(--surface)" strokeWidth={2} />}
                        {worstIdx >= 0 && <ReferenceDot x={MONTHS[worstIdx]} y={chartData[worstIdx].price} r={6} fill="var(--red)" stroke="var(--surface)" strokeWidth={2} />}
                        <ReferenceDot x={MONTHS[currentMonthIdx]} y={chartData[currentMonthIdx]?.price || 0} r={5} fill="var(--text)" stroke="var(--surface)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Current Status */}
                <div className="card" style={{ borderLeft: `3px solid ${statusColor}` }}>
                  <p className="card-label">Is Now a Good Time to Sell?</p>
                  <p style={{ fontSize: "20px", fontWeight: 800, color: statusColor, marginBottom: "6px" }}>
                    {result.currentStatus === "Good" ? "Great Time to Sell" : result.currentStatus === "Bad" ? "Not the Best Time" : "Average Time to Sell"}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{result.currentStatusReason}</p>
                  {result.daysUntilPeak > 0 && (
                    <p style={{ fontSize: "12px", color: "var(--green-accent)", fontWeight: 600, marginTop: "8px" }}>
                      Peak selling season starts in ~{result.daysUntilPeak} days
                    </p>
                  )}
                </div>

                {/* Current Tips */}
                <div className="card">
                  <p className="card-label">Selling Tips for Right Now</p>
                  {result.currentTips.map((tip, i) => (
                    <p key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, padding: "3px 0", display: "flex", gap: "8px" }}>
                      <span style={{ color: "var(--green-accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span> {tip}
                    </p>
                  ))}
                  {result.whatBuyersWant && (
                    <div style={{ marginTop: "10px", padding: "10px 12px", background: "var(--green-light)", borderRadius: "8px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>What Buyers Want Right Now</p>
                      <p style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.5 }}>{result.whatBuyersWant}</p>
                    </div>
                  )}
                </div>

                {/* Related Items */}
                {result.relatedItems.length > 0 && (
                  <div className="card">
                    <p className="card-label">You Might Also Want to Sell</p>
                    {result.relatedItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < result.relatedItems.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600 }}>{item.name}</p>
                        <span className="pill green" style={{ fontSize: "11px", padding: "2px 10px" }}>Best in {item.bestMonth}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Seasonal Reasoning */}
                <div className="ai-disclaimer">{result.seasonalReasoning}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </PageTransition>
  )
}
