"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Download, Package, Check } from "lucide-react"
import { motion } from "framer-motion"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import { useCurrency } from "../components/CurrencyProvider"
import { useAuth } from "../components/AuthProvider"
import { addToCloset } from "../lib/storage"
import { addClosetItem } from "../lib/db"

interface RoomItem {
  item_name: string; condition: string; value_low: number; value_high: number;
  best_platform: string; category: string; confidence: number;
}

export default function RoomReport() {
  const router = useRouter()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const [items, setItems] = useState<RoomItem[]>([])
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [addedToCloset, setAddedToCloset] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = sessionStorage.getItem("flipt-room-scan-result")
    if (!stored) { router.push("/scan"); return }
    try { setItems(JSON.parse(stored)) } catch { router.push("/scan") }
  }, [router])

  const activeItems = items.filter((_, i) => !skipped.has(String(i)))
  const totalLow = activeItems.reduce((s, i) => s + i.value_low, 0)
  const totalHigh = activeItems.reduce((s, i) => s + i.value_high, 0)

  // Group by category
  const categories = activeItems.reduce((acc, item) => {
    const cat = item.category || "Other"
    acc[cat] = (acc[cat] || 0) + Math.round((item.value_low + item.value_high) / 2)
    return acc
  }, {} as Record<string, number>)

  const top3 = [...activeItems].sort((a, b) => b.value_high - a.value_high).slice(0, 3)

  async function handleAddToCloset(item: RoomItem, idx: number) {
    addToCloset({
      id: `room-${Date.now()}-${idx}`, item: item.item_name, valueLow: item.value_low,
      valueHigh: item.value_high, platform: item.best_platform,
      title: item.item_name, description: "", imageUrl: null, scannedAt: new Date().toISOString(),
    })
    if (user) {
      await addClosetItem(user.id, {
        item_name: item.item_name, condition: item.condition,
        estimated_value: Math.round((item.value_low + item.value_high) / 2),
        status: "storing",
      })
    }
    setAddedToCloset(prev => new Set([...prev, String(idx)]))
  }

  async function handleAddAll() {
    for (let i = 0; i < items.length; i++) {
      if (!skipped.has(String(i)) && !addedToCloset.has(String(i))) {
        await handleAddToCloset(items[i], i)
      }
    }
  }

  if (items.length === 0) return null

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        {/* Header */}
        <div style={{ padding: "32px 20px 16px", textAlign: "center" }}>
          <FadeUp>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Room Scan Report</p>
            <h2 style={{ marginBottom: "8px" }}>Your Room Report</h2>
            <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--green-accent)", fontFamily: "var(--font-heading)" }}>
              {formatPrice(totalLow)} – {formatPrice(totalHigh)}
            </p>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{activeItems.length} sellable items found</p>
            <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "4px" }}>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </FadeUp>
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Items Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {items.map((item, i) => {
              const isSkipped = skipped.has(String(i))
              const isAdded = addedToCloset.has(String(i))
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isSkipped ? 0.3 : 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card"
                  style={{ padding: "14px", position: "relative" }}
                >
                  {isSkipped && (
                    <button onClick={() => setSkipped(prev => { const n = new Set(prev); n.delete(String(i)); return n })} style={{ position: "absolute", top: "6px", right: "6px", background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: "10px", fontFamily: "var(--font-body)" }}>Undo</button>
                  )}
                  <p style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.3, marginBottom: "4px" }}>{item.item_name}</p>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--green-accent)", marginBottom: "4px" }}>
                    {formatPrice(item.value_low)} – {formatPrice(item.value_high)}
                  </p>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span className="platform-badge">{item.best_platform}</span>
                    <span className="platform-badge">{item.condition}</span>
                  </div>
                  {!isSkipped && (
                    <div style={{ display: "flex", gap: "4px" }}>
                      {isAdded ? (
                        <span style={{ fontSize: "11px", color: "var(--green-accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}><Check size={10} /> Added</span>
                      ) : (
                        <>
                          <button onClick={() => handleAddToCloset(item, i)} className="btn-sm primary" style={{ flex: 1, padding: "4px 8px", fontSize: "10px" }}><Plus size={10} /> Closet</button>
                          <button onClick={() => setSkipped(prev => new Set([...prev, String(i)]))} className="btn-sm ghost" style={{ padding: "4px 8px", fontSize: "10px" }}><X size={10} /> Skip</button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="card">
            <p className="card-label">Breakdown by Category</p>
            {Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{cat}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--green-accent)" }}>{formatPrice(val)}</span>
              </div>
            ))}
          </div>

          {/* Top 3 */}
          {top3.length > 0 && (
            <div className="card" style={{ background: "var(--green-light)" }}>
              <p className="card-label">Most Valuable Items</p>
              {top3.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--green-accent)" }}>#{i + 1}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{item.item_name}</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--green-accent)" }}>{formatPrice(item.value_high)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ai-disclaimer">
            At current market rates, these items could all sell within 2-4 weeks on the recommended platforms.
          </div>

          {/* Actions */}
          <button onClick={handleAddAll} className="btn-primary" style={{ width: "100%" }}>
            <Package size={16} /> Add All to Closet
          </button>
          <button onClick={() => router.push("/scan")} className="btn-secondary" style={{ width: "100%" }}>
            Scan Another Room
          </button>
        </div>
      </main>
    </PageTransition>
  )
}
