"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Archive, Check } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { LockedPage } from "../components/UpgradeModal"
import { useSubscription } from "../lib/useSubscription"
import { getCloset, updateClosetItem, removeFromCloset, type ClosetItem, type ClosetStatus } from "../lib/storage"

const STATUSES: ClosetStatus[] = ["Storing", "Listed", "Sold", "Donated"]

export default function Closet() {
  const router = useRouter()
  const { user } = useAuth()
  const { canAccess } = useSubscription(user?.id)
  const [items, setItems] = useState<ClosetItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [editingSold, setEditingSold] = useState<string | null>(null)
  const [soldPriceInput, setSoldPriceInput] = useState("")

  useEffect(() => {
    setItems(getCloset())
    setMounted(true)
  }, [])

  function refresh() {
    setItems(getCloset())
  }

  function handleStatusChange(id: string, status: ClosetStatus) {
    if (status === "Sold") {
      setEditingSold(id)
      setSoldPriceInput("")
    } else {
      updateClosetItem(id, { status, soldPrice: null })
      refresh()
    }
  }

  function handleSoldPriceSubmit(id: string) {
    const price = parseFloat(soldPriceInput)
    if (isNaN(price) || price < 0) return
    updateClosetItem(id, { status: "Sold", soldPrice: price })
    setEditingSold(null)
    setSoldPriceInput("")
    refresh()
  }

  function handleRemove(id: string) {
    removeFromCloset(id)
    refresh()
  }

  const totalEarned = items
    .filter(i => i.status === "Sold" && i.soldPrice !== null)
    .reduce((sum, i) => sum + (i.soldPrice ?? 0), 0)

  const unsoldItems = items.filter(i => i.status !== "Sold" && i.status !== "Donated")
  const unsoldValueLow = unsoldItems.reduce((sum, i) => sum + i.valueLow, 0)
  const unsoldValueHigh = unsoldItems.reduce((sum, i) => sum + i.valueHigh, 0)

  if (!mounted) return null

  if (!canAccess("closet")) {
    return (
      <PageTransition>
        <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
          <div style={{ padding: "32px 20px 16px" }}><h2>My Closet</h2></div>
          <LockedPage title="My Closet is a Pro feature" description="Track your inventory, mark items as sold, and see your total earnings" plan="pro" onUpgrade={() => router.push("/settings")} />
        </main>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "32px 16px 120px",
        gap: "24px",
      }}>
        <h2>My Closet</h2>

        {/* Stats row */}
        {items.length > 0 && (
          <div style={{
            width: "100%",
            maxWidth: "520px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}>
            <div className="stat-card highlight">
              <p className="card-label" style={{ marginBottom: "4px" }}>Total Earned with Flipt</p>
              <p className="gradient-text" style={{ fontSize: "28px", fontWeight: "800" }}>
                ${totalEarned.toFixed(2)}
              </p>
            </div>
            <div className="stat-card">
              <p className="card-label" style={{ marginBottom: "4px" }}>Sitting in Your Closet</p>
              <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)" }}>
                ${unsoldValueLow} &ndash; ${unsoldValueHigh}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "2px" }}>
                {unsoldItems.length} item{unsoldItems.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Archive size={28} style={{ color: "var(--text-faint)" }} />
            </div>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>Your closet is empty</p>
            <p style={{ fontSize: "14px", color: "var(--text-faint)", maxWidth: "280px" }}>
              Scan an item and tap &ldquo;Add to My Closet&rdquo; on the results page to start building your inventory.
            </p>
            <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>
              Scan an Item
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
              <div key={item.id} className="closet-card">
                <div style={{ display: "flex", gap: "14px", marginBottom: "12px" }}>
                  {item.imageUrl && (
                    <div style={{
                      width: "64px",
                      height: "64px",
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
                    <p className="gradient-text" style={{ fontSize: "16px", fontWeight: "800", marginBottom: "2px" }}>
                      ${item.valueLow} &ndash; ${item.valueHigh}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>
                      {item.condition} &middot; {item.platform.split(/[,.—–]/)[0].trim()}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <select
                      value={editingSold === item.id ? "Sold" : item.status}
                      onChange={e => handleStatusChange(item.id, e.target.value as ClosetStatus)}
                      className="status-select"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {item.status === "Sold" && item.soldPrice !== null && editingSold !== item.id && (
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--green-accent)" }}>
                        Sold for ${item.soldPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <button onClick={() => handleRemove(item.id)} className="btn-sm danger" style={{ padding: "5px 12px", fontSize: "12px" }}>
                    Remove
                  </button>
                </div>

                {/* Sold price input */}
                {editingSold === item.id && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "12px",
                    padding: "12px",
                    background: "var(--bg)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "600" }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Sold price"
                      value={soldPriceInput}
                      onChange={e => setSoldPriceInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSoldPriceSubmit(item.id)}
                      className="sold-input"
                      autoFocus
                    />
                    <button onClick={() => handleSoldPriceSubmit(item.id)} className="btn-sm primary" style={{ padding: "6px 14px" }}>
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingSold(null); updateClosetItem(item.id, { status: "Storing" }); refresh() }}
                      className="btn-sm ghost"
                      style={{ padding: "6px 12px" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </PageTransition>
  )
}
