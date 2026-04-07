"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Camera, LogIn, Search, Trash2, X } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { useCurrency } from "../components/CurrencyProvider"
import { getHistory, clearHistory, type ScanHistoryItem } from "../lib/storage"
import { getScans, clearScans } from "../lib/db"

interface ScanRow {
  id: string; item_name: string; brand?: string; estimated_value_low: number; estimated_value_high: number;
  best_platform?: string; image_url?: string; created_at: string; listing_title?: string; listing_description?: string;
  ai_response?: Record<string, unknown>;
}

function groupByDate(items: ScanRow[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)
  const monthAgo = new Date(today.getTime() - 30 * 86400000)

  const groups: { label: string; items: ScanRow[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "This Month", items: [] },
    { label: "Older", items: [] },
  ]

  for (const item of items) {
    const d = new Date(item.created_at)
    if (d >= today) groups[0].items.push(item)
    else if (d >= yesterday) groups[1].items.push(item)
    else if (d >= weekAgo) groups[2].items.push(item)
    else if (d >= monthAgo) groups[3].items.push(item)
    else groups[4].items.push(item)
  }

  return groups.filter(g => g.items.length > 0)
}

export default function History() {
  const router = useRouter()
  const { user, isGuest } = useAuth()
  const { formatPrice } = useCurrency()
  const [items, setItems] = useState<ScanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  useEffect(() => {
    async function load() {
      if (user) {
        const { data } = await getScans(user.id)
        if (data && data.length > 0) { setItems(data as ScanRow[]); setLoading(false); return }
      }
      const local = getHistory()
      setItems(local.map(l => ({
        id: l.id, item_name: l.item, estimated_value_low: l.valueLow, estimated_value_high: l.valueHigh,
        best_platform: l.platform, image_url: l.imageUrl || undefined, created_at: l.scannedAt,
        listing_title: l.title, listing_description: l.description,
      })))
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(i => i.item_name.toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q))
  }, [items, search])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])
  const totalValue = items.reduce((s, i) => s + Math.round((i.estimated_value_low + i.estimated_value_high) / 2), 0)

  async function handleClear() {
    if (user) await clearScans(user.id)
    clearHistory()
    setItems([])
    setShowConfirmClear(false)
  }

  function handleView(item: ScanRow) {
    const result = item.ai_response || {
      item: item.item_name, valueLow: item.estimated_value_low, valueHigh: item.estimated_value_high,
      platform: item.best_platform || "", title: item.listing_title || "", description: item.listing_description || "",
    }
    sessionStorage.setItem("flipt-result", JSON.stringify(result))
    sessionStorage.setItem("flipt-result-id", item.id)
    if (item.image_url) sessionStorage.setItem("flipt-image", item.image_url)
    router.push("/results")
  }

  if (loading) {
    return (
      <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
        <h2 style={{ marginBottom: "20px" }}>Scan History</h2>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "80px", marginBottom: "8px", borderRadius: "14px" }} />)}
      </main></PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Scan History</h2>
          {items.length > 0 && <button onClick={() => setShowConfirmClear(true)} className="btn-sm danger" style={{ fontSize: "12px" }}><Trash2 size={12} /> Clear</button>}
        </div>

        {/* Total value */}
        {items.length > 0 && (
          <FadeUp>
            <div style={{ margin: "0 20px 12px", padding: "14px 18px", background: "var(--green-light)", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Scanned Value</p>
                <p style={{ fontSize: "24px", fontWeight: 800, color: "var(--green-accent)" }}>{formatPrice(totalValue)}</p>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{items.length} item{items.length !== 1 ? "s" : ""}</p>
            </div>
          </FadeUp>
        )}

        {/* Search */}
        {items.length > 3 && (
          <div style={{ padding: "0 20px 12px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "34px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input type="text" placeholder="Search scans..." value={search} onChange={e => setSearch(e.target.value)} className="input search" />
          </div>
        )}

        {isGuest && items.length === 0 ? (
          <div className="empty-state">
            <LogIn size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>Sign in to see your history</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Your scans will be saved to your account</p>
            <button onClick={() => router.push("/signup")} className="btn-sm primary" style={{ marginTop: "8px" }}>Sign In</button>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <Camera size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>No scans yet</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Scan your first item to see it here</p>
            <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>Scan an Item</button>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "12px 20px 6px" }}>{group.label}</p>
              {group.items.map(item => (
                <div key={item.id} className="history-card" onClick={() => handleView(item)} style={{ cursor: "pointer" }}>
                  {item.image_url && (
                    <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
                      <img src={item.image_url} alt={item.item_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.3, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item_name}</p>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--green-accent)", marginBottom: "2px" }}>
                      {formatPrice(item.estimated_value_low)} – {formatPrice(item.estimated_value_high)}
                    </p>
                    {item.best_platform && <span className="platform-badge">{item.best_platform.split(/[,.—–]/)[0].trim()}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Clear confirmation */}
        {showConfirmClear && (
          <div className="confirm-dialog" onClick={() => setShowConfirmClear(false)}>
            <div className="confirm-dialog-box" onClick={e => e.stopPropagation()}>
              <Trash2 size={24} style={{ color: "var(--red)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>Clear all scan history?</p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>This cannot be undone.</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowConfirmClear(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleClear} className="btn-sm danger" style={{ flex: 1, background: "var(--red)", color: "#fff", border: "none", padding: "12px" }}>Clear All</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
