"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, Trash2, Bell, BellOff, TrendingDown, Package } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, SlideIn } from "../components/Motion"
import { getWatchlist, removeFromWatchlist, toggleWatchlistNotify, type WatchlistItem } from "../lib/storage"
import { useAuth } from "../components/AuthProvider"
import { LockedPage } from "../components/UpgradeModal"
import { useSubscription } from "../lib/useSubscription"

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return "Today"
  if (d === 1) return "Yesterday"
  return `${d}d ago`
}

export default function Watchlist() {
  const router = useRouter()
  const { user } = useAuth()
  const { canAccess } = useSubscription(user?.id)
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setItems(getWatchlist()); setMounted(true) }, [])

  function refresh() { setItems(getWatchlist()) }

  function handleRemove(id: string) { removeFromWatchlist(id); refresh() }
  function handleToggleNotify(id: string) { toggleWatchlistNotify(id); refresh() }

  if (!mounted) return null

  if (!canAccess("watchlist")) {
    return (
      <PageTransition>
        <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
          <div style={{ padding: "32px 20px 16px" }}><h2>Watchlist</h2></div>
          <LockedPage title="Watchlist is a Pro feature" description="Save items and track price changes across all platforms" plan="pro" onUpgrade={() => router.push("/settings")} />
        </main>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ marginBottom: "4px" }}>Watchlist</h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{items.length} item{items.length !== 1 ? "s" : ""} saved</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <Bookmark size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "15px", fontWeight: "600" }}>Your watchlist is empty</p>
            <p style={{ fontSize: "13px", color: "var(--text-faint)", maxWidth: "280px" }}>
              Bookmark items from the marketplace or feed to track their prices here.
            </p>
            <button onClick={() => router.push("/marketplace")} className="btn-sm primary" style={{ marginTop: "8px" }}>Browse Marketplace</button>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map(item => {
              const priceDrop = item.price < item.savedPrice
              const dropAmount = item.savedPrice - item.price
              return (
                <div key={item.id} className="card" style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", background: "var(--bg)", border: "1px solid var(--border-subtle)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Package size={20} style={{ color: "var(--text-faint)" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: "700", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                        <span className="gradient-text" style={{ fontSize: "18px", fontWeight: "800" }}>${item.price}</span>
                        {priceDrop && (
                          <span className="price-drop-badge">
                            <TrendingDown size={10} /> -${dropAmount}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        <span className="platform-badge">{item.platform}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>Saved {timeAgo(item.savedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "10px" }}>
                    <button onClick={() => handleToggleNotify(item.id)} className="btn-sm ghost" style={{ padding: "4px 10px", gap: "4px", fontSize: "11px" }}>
                      {item.notify ? <><BellOff size={12} /> Mute</> : <><Bell size={12} /> Notify</>}
                    </button>
                    <button onClick={() => handleRemove(item.id)} className="btn-sm danger" style={{ padding: "4px 10px", gap: "4px", fontSize: "11px" }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </PageTransition>
  )
}
