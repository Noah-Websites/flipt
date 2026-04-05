"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, LogIn } from "lucide-react"
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

export default function History() {
  const router = useRouter()
  const { user, isGuest } = useAuth()
  const { formatPrice } = useCurrency()
  const [items, setItems] = useState<ScanRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (user) {
        const { data } = await getScans(user.id)
        if (data && data.length > 0) {
          setItems(data as ScanRow[])
          setLoading(false)
          return
        }
      }
      // Fallback to localStorage
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

  async function handleClear() {
    if (user) await clearScans(user.id)
    clearHistory()
    setItems([])
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

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <PageTransition>
        <main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
          <h2 style={{ marginBottom: "20px" }}>Scan History</h2>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "80px", marginBottom: "8px", borderRadius: "14px" }} />)}
        </main>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Scan History</h2>
          {items.length > 0 && <button onClick={handleClear} className="btn-sm danger">Clear</button>}
        </div>

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
          <StaggerContainer>
            {items.map(item => (
              <StaggerItem key={item.id}>
                <div className="history-card" onClick={() => handleView(item)} style={{ cursor: "pointer" }}>
                  {item.image_url && (
                    <div style={{ width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
                      <img src={item.image_url} alt={item.item_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.3, marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item_name}</p>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--green-accent)", marginBottom: "3px" }}>
                      {formatPrice(item.estimated_value_low)} – {formatPrice(item.estimated_value_high)}
                    </p>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {formatDate(item.created_at)}{item.best_platform ? ` · ${item.best_platform.split(/[,.—–]/)[0].trim()}` : ""}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </main>
    </PageTransition>
  )
}
