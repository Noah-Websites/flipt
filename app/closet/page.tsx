"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Archive, Check, Pencil, Trash2, ShoppingCart, Download, ArrowUpDown, Filter, X, TrendingUp, DollarSign, BarChart3, Package, Bookmark, Bell, BellOff, TrendingDown } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, CountUp } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { LockedPage } from "../components/UpgradeModal"
import { useSubscription } from "../lib/useSubscription"
import { useCurrency } from "../components/CurrencyProvider"
import { getCloset, updateClosetItem, removeFromCloset, getWatchlist, removeFromWatchlist, toggleWatchlistNotify, type ClosetItem, type ClosetStatus, type WatchlistItem } from "../lib/storage"

const STATUSES: ClosetStatus[] = ["Storing", "Listed", "Sold", "Donated"]
const SORT_OPTIONS = [
  { key: "date", label: "Date Added" },
  { key: "value-high", label: "Value: High" },
  { key: "value-low", label: "Value: Low" },
] as const
type SortKey = typeof SORT_OPTIONS[number]["key"]

type ClosetTab = "closet" | "watchlist"

export default function Closet() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { canAccess } = useSubscription(user?.id)
  const { formatPrice } = useCurrency()
  const initialTab = searchParams.get("tab") === "watchlist" ? "watchlist" : "closet"
  const [activeTab, setActiveTab] = useState<ClosetTab>(initialTab)
  const [items, setItems] = useState<ClosetItem[]>([])
  const [watchItems, setWatchItems] = useState<WatchlistItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [editingSold, setEditingSold] = useState<string | null>(null)
  const [soldPriceInput, setSoldPriceInput] = useState("")
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editNameVal, setEditNameVal] = useState("")
  const [filter, setFilter] = useState<ClosetStatus | "All">("All")
  const [sort, setSort] = useState<SortKey>("date")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { setItems(getCloset()); setWatchItems(getWatchlist()); setMounted(true) }, [])

  function refresh() { setItems(getCloset()) }

  const filtered = useMemo(() => {
    let list = [...items]
    if (filter !== "All") list = list.filter(i => i.status === filter)
    if (sort === "value-high") list.sort((a, b) => b.valueHigh - a.valueHigh)
    else if (sort === "value-low") list.sort((a, b) => a.valueLow - b.valueLow)
    return list
  }, [items, filter, sort])

  function handleStatusChange(id: string, status: ClosetStatus) {
    if (status === "Sold") { setEditingSold(id); setSoldPriceInput("") }
    else { updateClosetItem(id, { status, soldPrice: null }); refresh() }
  }

  function handleSoldPriceSubmit(id: string) {
    const price = parseFloat(soldPriceInput)
    if (isNaN(price) || price < 0) return
    updateClosetItem(id, { status: "Sold", soldPrice: price })
    setEditingSold(null); refresh()
  }

  function handleRemove(id: string) {
    removeFromCloset(id); setDeleteConfirm(null); refresh()
  }

  function handleEditName(id: string) {
    if (!editNameVal.trim()) return
    updateClosetItem(id, { item: editNameVal.trim() })
    setEditingItem(null); refresh()
  }

  function handleExportCSV() {
    const headers = "Item,Condition,Status,Value Low,Value High,Sold Price,Platform\n"
    const rows = items.map(i => `"${i.item}","${i.condition}","${i.status}",${i.valueLow},${i.valueHigh},${i.soldPrice || ""},${i.platform}`).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "flipt-closet.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const totalEarned = items.filter(i => i.status === "Sold" && i.soldPrice !== null).reduce((s, i) => s + (i.soldPrice ?? 0), 0)
  const unsoldItems = items.filter(i => i.status !== "Sold" && i.status !== "Donated")
  const unsoldValueLow = unsoldItems.reduce((s, i) => s + i.valueLow, 0)
  const unsoldValueHigh = unsoldItems.reduce((s, i) => s + i.valueHigh, 0)
  const soldCount = items.filter(i => i.status === "Sold").length
  const conversionRate = items.length > 0 ? Math.round((soldCount / items.length) * 100) : 0

  if (!mounted) return null

  if (!canAccess("closet")) {
    return (
      <PageTransition><main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 16px" }}><h2>My Closet</h2></div>
        <LockedPage title="Your closet is a Pro feature" description="Track inventory, mark items as sold, see earnings, and export your data" plan="pro" onUpgrade={() => router.push("/settings")} />
      </main></PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "16px" }}>
        <h2>{activeTab === "closet" ? "My Closet" : "Watchlist"}</h2>

        {/* Tab bar */}
        <div className="profile-tabs" style={{ width: "100%", maxWidth: "520px" }}>
          <button className={`profile-tab ${activeTab === "closet" ? "active" : ""}`} onClick={() => { setActiveTab("closet"); router.replace("/closet", { scroll: false }) }}>My Closet</button>
          <button className={`profile-tab ${activeTab === "watchlist" ? "active" : ""}`} onClick={() => { setActiveTab("watchlist"); router.replace("/closet?tab=watchlist", { scroll: false }) }}>Watchlist</button>
        </div>

        {/* ===== WATCHLIST TAB ===== */}
        {activeTab === "watchlist" && (
          !canAccess("watchlist") ? (
            <LockedPage title="Watchlist is a Pro feature" description="Save items and track price changes across all platforms" plan="pro" onUpgrade={() => router.push("/settings")} />
          ) : watchItems.length === 0 ? (
            <div className="empty-state">
              <Bookmark size={32} style={{ color: "var(--text-faint)" }} />
              <p style={{ fontSize: "15px", fontWeight: 600 }}>Your watchlist is empty</p>
              <p style={{ fontSize: "13px", color: "var(--text-faint)", maxWidth: "280px" }}>Bookmark items from the marketplace or feed to track their prices here</p>
              <button onClick={() => router.push("/marketplace")} className="btn-sm primary" style={{ marginTop: "8px" }}>Browse Marketplace</button>
            </div>
          ) : (
            <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {watchItems.map(item => {
                const priceDrop = item.price < item.savedPrice
                const dropAmount = item.savedPrice - item.price
                return (
                  <div key={item.id} className="card" style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", background: "var(--bg)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} style={{ color: "var(--text-faint)" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                          <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--gold)" }}>${item.price}</span>
                          {priceDrop && <span className="price-drop-badge"><TrendingDown size={10} /> -${dropAmount}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <span className="platform-badge">{item.platform}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "10px" }}>
                      <button onClick={() => { toggleWatchlistNotify(item.id); setWatchItems(getWatchlist()) }} className="btn-sm ghost" style={{ padding: "4px 10px", gap: "4px", fontSize: "11px" }}>
                        {item.notify ? <><BellOff size={12} /> Mute</> : <><Bell size={12} /> Notify</>}
                      </button>
                      <button onClick={() => { removeFromWatchlist(item.id); setWatchItems(getWatchlist()) }} className="btn-sm danger" style={{ padding: "4px 10px", gap: "4px", fontSize: "11px" }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ===== CLOSET TAB ===== */}
        {activeTab === "closet" && <>

        {/* Earnings dashboard */}
        {items.length > 0 && (
          <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div className="stat-card highlight" style={{ flex: 1 }}>
                <DollarSign size={16} style={{ color: "var(--green-accent)", margin: "0 auto 4px" }} />
                <p className="card-label" style={{ marginBottom: "2px" }}>Total Earned</p>
                <p className="gradient-text" style={{ fontSize: "24px", fontWeight: 800 }}>{formatPrice(totalEarned)}</p>
              </div>
              <div className="stat-card" style={{ flex: 1 }}>
                <Package size={16} style={{ color: "var(--text-secondary)", margin: "0 auto 4px" }} />
                <p className="card-label" style={{ marginBottom: "2px" }}>In Your Closet</p>
                <p style={{ fontSize: "16px", fontWeight: 700 }}>{formatPrice(unsoldValueLow)} – {formatPrice(unsoldValueHigh)}</p>
                <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{unsoldItems.length} item{unsoldItems.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div className="stat-card" style={{ flex: 1 }}>
                <TrendingUp size={16} style={{ color: "var(--text-secondary)", margin: "0 auto 4px" }} />
                <p className="card-label" style={{ marginBottom: "2px" }}>Conversion Rate</p>
                <p style={{ fontSize: "18px", fontWeight: 800 }}>{conversionRate}%</p>
                <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{soldCount} of {items.length} sold</p>
              </div>
              <div className="stat-card" style={{ flex: 1 }}>
                <BarChart3 size={16} style={{ color: "var(--text-secondary)", margin: "0 auto 4px" }} />
                <p className="card-label" style={{ marginBottom: "2px" }}>If All Sold</p>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--green-accent)" }}>{formatPrice(unsoldValueHigh + totalEarned)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Sort */}
        {items.length > 0 && (
          <div style={{ width: "100%", maxWidth: "520px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
              {(["All", ...STATUSES] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)} className={`mp-filter-chip ${filter === s ? "active" : ""}`} style={{ fontSize: "12px", padding: "4px 12px" }}>{s}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {SORT_OPTIONS.map(s => (
                <button key={s.key} onClick={() => setSort(s.key)} className={`mp-filter-chip ${sort === s.key ? "active" : ""}`} style={{ fontSize: "11px", padding: "4px 10px" }}>{s.label}</button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={handleExportCSV} className="btn-sm ghost" style={{ padding: "4px 10px", fontSize: "11px" }}><Download size={12} /> CSV</button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-state">
            <Archive size={28} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>Your closet is empty</p>
            <p style={{ fontSize: "14px", color: "var(--text-faint)", maxWidth: "280px" }}>Scan an item and tap &ldquo;Add to Closet&rdquo; to start tracking your inventory.</p>
            <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>Scan an Item</button>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map(item => (
              <div key={item.id} className="closet-card">
                <div style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
                  {item.imageUrl && (
                    <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border-subtle, var(--border))" }}>
                      <img src={item.imageUrl} alt={item.item} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingItem === item.id ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input value={editNameVal} onChange={e => setEditNameVal(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEditName(item.id)} className="input" style={{ flex: 1, padding: "6px 10px", fontSize: "13px", minHeight: "32px" }} autoFocus />
                        <button onClick={() => handleEditName(item.id)} className="btn-sm primary" style={{ padding: "4px 10px" }}><Check size={12} /></button>
                        <button onClick={() => setEditingItem(null)} className="btn-sm ghost" style={{ padding: "4px 8px" }}><X size={12} /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item}</p>
                        <button onClick={() => { setEditingItem(item.id); setEditNameVal(item.item) }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "2px" }} aria-label="Edit name"><Pencil size={11} /></button>
                      </div>
                    )}
                    <p className="gradient-text" style={{ fontSize: "15px", fontWeight: 800, marginTop: "2px" }}>{formatPrice(item.valueLow)} – {formatPrice(item.valueHigh)}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{item.condition} · {item.platform.split(/[,.—–]/)[0].trim()}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <select value={editingSold === item.id ? "Sold" : item.status} onChange={e => handleStatusChange(item.id, e.target.value as ClosetStatus)} className="status-select" aria-label="Change status">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {item.status === "Sold" && item.soldPrice !== null && editingSold !== item.id && (
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green-accent)" }}>Sold {formatPrice(item.soldPrice!)}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => { router.push("/marketplace") }} className="btn-sm ghost" style={{ padding: "4px 8px", fontSize: "10px" }} aria-label="List on marketplace"><ShoppingCart size={12} /></button>
                    <button onClick={() => setDeleteConfirm(item.id)} className="btn-sm danger" style={{ padding: "4px 8px", fontSize: "10px" }} aria-label="Delete item"><Trash2 size={12} /></button>
                  </div>
                </div>

                {editingSold === item.id && (
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px", padding: "10px", background: "var(--bg)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600, lineHeight: "32px" }}>$</span>
                    <input type="number" min="0" step="0.01" placeholder="Sold price" value={soldPriceInput} onChange={e => setSoldPriceInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSoldPriceSubmit(item.id)} className="sold-input" autoFocus />
                    <button onClick={() => handleSoldPriceSubmit(item.id)} className="btn-sm primary" style={{ padding: "4px 12px" }}>Save</button>
                    <button onClick={() => { setEditingSold(null); updateClosetItem(item.id, { status: "Storing" }); refresh() }} className="btn-sm ghost" style={{ padding: "4px 10px" }}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        </>}

        {/* Delete confirmation */}
        {deleteConfirm && (
          <div className="confirm-dialog" onClick={() => setDeleteConfirm(null)}>
            <div className="confirm-dialog-box" onClick={e => e.stopPropagation()}>
              <Trash2 size={24} style={{ color: "var(--red)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>Remove this item?</p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>This will remove the item from your closet.</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={() => handleRemove(deleteConfirm)} style={{ flex: 1, padding: "12px", background: "var(--red)", color: "#fff", border: "none", borderRadius: "50px", fontFamily: "var(--font-body)", fontWeight: 600, cursor: "pointer" }}>Remove</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
