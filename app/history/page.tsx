"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import ThemeToggle from "../components/ThemeToggle"
import { getHistory, clearHistory, type ScanHistoryItem } from "../lib/storage"

export default function History() {
  const router = useRouter()
  const [items, setItems] = useState<ScanHistoryItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(getHistory())
    setMounted(true)
  }, [])

  function handleClear() {
    clearHistory()
    setItems([])
  }

  function handleView(item: ScanHistoryItem) {
    sessionStorage.setItem("flipt-result", JSON.stringify({
      item: item.item,
      valueLow: item.valueLow,
      valueHigh: item.valueHigh,
      platform: item.platform,
      title: item.title,
      description: item.description,
    }))
    sessionStorage.setItem("flipt-result-id", item.id)
    if (item.imageUrl) sessionStorage.setItem("flipt-image", item.imageUrl)
    router.push("/results")
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (!mounted) return null

  return (
    <PageTransition>
      <ThemeToggle />
      <main style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "32px 16px 120px",
        gap: "24px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "520px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h2>Scan History</h2>
          {items.length > 0 && (
            <button onClick={handleClear} className="btn-sm danger">
              Clear History
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={28} style={{ color: "var(--text-faint)" }} />
            </div>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>No scans yet</p>
            <p style={{ fontSize: "14px", color: "var(--text-faint)" }}>
              Items you scan will appear here.
            </p>
            <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>
              Scan Your First Item
            </button>
          </div>
        ) : (
          <div style={{
            width: "100%",
            maxWidth: "520px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {items.map(item => (
              <div key={item.id} className="history-card">
                {item.imageUrl && (
                  <div style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <img
                      src={item.imageUrl}
                      alt={item.item}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    lineHeight: 1.3,
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {item.item}
                  </p>
                  <p className="gradient-text" style={{ fontSize: "16px", fontWeight: "800", marginBottom: "4px" }}>
                    ${item.valueLow} &ndash; ${item.valueHigh}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>
                      {formatDate(item.scannedAt)} &middot; {item.platform.split(/[,.—–]/)[0].trim()}
                    </span>
                    <button onClick={() => handleView(item)} className="btn-sm ghost" style={{ padding: "5px 12px", fontSize: "12px" }}>
                      View Results
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </PageTransition>
  )
}
