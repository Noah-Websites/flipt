"use client"

import { useState, useEffect, useMemo } from "react"
import { Link2, Unlink, ExternalLink, Eye, MessageSquare, Package, Search, Check, Copy, ChevronUp, ChevronDown, Lightbulb, BarChart3 } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import ThemeToggle from "../components/ThemeToggle"
import { useTheme } from "../components/ThemeProvider"
import {
  getConnectedAccounts, connectAccount, disconnectAccount,
  getAccountListings, updateAccountListing, removeAccountListings, crossPostListing,
  type ConnectedAccount, type AccountListing, type PlatformName,
} from "../lib/storage"

const PLATFORMS: PlatformName[] = ["Kijiji", "Facebook Marketplace", "eBay", "Poshmark", "Craigslist"]

const HEALTH_TIPS: Record<string, string[]> = {
  low: ["Respond to buyer messages within 1 hour", "Add more photos to your listings", "Lower prices on items listed 14+ days"],
  mid: ["Post at peak hours (7-9 PM) for more views", "Cross-post to other platforms", "Update listing descriptions monthly"],
  high: ["Keep it up! Your account is performing well", "Consider Flipt Pro for priority placement"],
}

type Tab = "accounts" | "listings" | "analytics"
type SortKey = "item" | "platform" | "price" | "views" | "daysListed" | "status"

function HealthRing({ score }: { score: number }) {
  const r = 22; const c = 2 * Math.PI * r; const offset = c - (score / 100) * c
  const color = score >= 70 ? "var(--green-accent)" : score >= 40 ? "#ca8a04" : "#d64545"
  return (
    <div className="health-ring">
      <svg viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="health-ring-value" style={{ color }}>{score}</span>
    </div>
  )
}

export default function Accounts() {
  const { theme } = useTheme()
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [listings, setListings] = useState<AccountListing[]>([])
  const [tab, setTab] = useState<Tab>("accounts")
  const [mounted, setMounted] = useState(false)

  // Modal states
  const [connectModal, setConnectModal] = useState<PlatformName | null>(null)
  const [crossPostModal, setCrossPostModal] = useState<string | null>(null)
  const [crossPostTargets, setCrossPostTargets] = useState<PlatformName[]>([])

  // Listings table
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("daysListed")
  const [sortAsc, setSortAsc] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    setAccounts(getConnectedAccounts())
    setListings(getAccountListings())
    setMounted(true)
  }, [])

  function refresh() {
    setAccounts(getConnectedAccounts())
    setListings(getAccountListings())
  }

  function handleConnect(p: PlatformName) {
    connectAccount(p); setConnectModal(null); refresh()
  }

  function handleDisconnect(p: PlatformName) {
    disconnectAccount(p); refresh()
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  function handleBulkAction(action: "sold" | "relist" | "delete") {
    const ids = Array.from(selected)
    if (!ids.length) return
    if (action === "delete") { removeAccountListings(ids) }
    else { ids.forEach(id => updateAccountListing(id, { status: action === "sold" ? "Sold" : "Active", daysListed: action === "relist" ? 0 : undefined })) }
    setSelected(new Set()); refresh()
  }

  function handleCrossPost() {
    if (!crossPostModal || !crossPostTargets.length) return
    crossPostListing(crossPostModal, crossPostTargets)
    setCrossPostModal(null); setCrossPostTargets([]); refresh()
  }

  const filteredListings = useMemo(() => {
    let items = [...listings]
    if (search.trim()) { const q = search.toLowerCase(); items = items.filter(l => l.item.toLowerCase().includes(q)) }
    items.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey]
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return items
  }, [listings, search, sortKey, sortAsc])

  const connectedAccounts = accounts.filter(a => a.connected)
  const totalListings = connectedAccounts.reduce((s, a) => s + a.stats.activeListings, 0)
  const totalValue = connectedAccounts.reduce((s, a) => s + a.stats.totalValue, 0)
  const totalMessages = connectedAccounts.reduce((s, a) => s + a.stats.messagesThisWeek, 0)
  const bestPlatform = connectedAccounts.length ? [...connectedAccounts].sort((a, b) => b.stats.viewsThisWeek - a.stats.viewsThisWeek)[0]?.platform : null

  const chartData = connectedAccounts.map(a => ({
    name: a.platform.split(" ")[0],
    days: Math.round(7 + Math.random() * 14),
  }))

  const isDark = theme === "dark"

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null
    return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  if (!mounted) return null

  const TABS: { key: Tab; label: string }[] = [
    { key: "accounts", label: "Accounts" },
    { key: "listings", label: "Listings" },
    { key: "analytics", label: "Analytics" },
  ]

  return (
    <PageTransition>
      <ThemeToggle />

      {/* Connect Modal */}
      {connectModal && (
        <div className="modal-overlay" onClick={() => setConnectModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: "18px", fontWeight: "800", marginBottom: "12px" }}>Connect {connectModal}</p>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "20px" }}>
              To connect your {connectModal} account, you would normally be redirected to {connectModal}&apos;s authorization page.
              For this demo, clicking Connect will simulate a successful connection and populate sample listing data.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => handleConnect(connectModal)} className="btn-primary" style={{ flex: 1, padding: "12px" }}>Connect</button>
              <button onClick={() => setConnectModal(null)} className="btn-secondary" style={{ flex: 1, padding: "12px" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Cross Post Modal */}
      {crossPostModal && (
        <div className="modal-overlay" onClick={() => setCrossPostModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>Cross-Post Listing</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>Select platforms to post this listing to:</p>
            {connectedAccounts.filter(a => {
              const src = listings.find(l => l.id === crossPostModal)
              return src && a.platform !== src.platform
            }).map(a => (
              <div key={a.platform} className="checkbox-row" onClick={() => {
                setCrossPostTargets(prev => prev.includes(a.platform) ? prev.filter(p => p !== a.platform) : [...prev, a.platform])
              }}>
                <div className={`checkbox-box ${crossPostTargets.includes(a.platform) ? "checked" : ""}`}>
                  {crossPostTargets.includes(a.platform) && <Check size={12} color="#fff" />}
                </div>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{a.platform}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={handleCrossPost} disabled={!crossPostTargets.length} className="btn-primary" style={{ flex: 1, padding: "12px" }}>Post to Selected</button>
              <button onClick={() => setCrossPostModal(null)} className="btn-secondary" style={{ flex: 1, padding: "12px" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <main style={{ minHeight: "100vh", background: "#080a0f", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6b8cff", marginBottom: "6px" }}>Control Room</p>
          <h2 style={{ marginBottom: "4px" }}>Connected Accounts</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Manage all your selling platforms</p>
        </div>

        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`tab-item ${tab === t.key ? "active" : ""}`}>{t.label}</button>
          ))}
        </div>

        <div style={{ width: "100%", maxWidth: "580px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* === ACCOUNTS TAB === */}
          {tab === "accounts" && accounts.map(acct => (
            <div key={acct.platform} className={`acct-card ${acct.connected ? "connected" : ""}`}>
              <div className="acct-header">
                <div className="acct-icon"><ExternalLink size={18} style={{ color: "var(--text-muted)" }} /></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "15px", fontWeight: "700" }}>{acct.platform}</p>
                  <span className={`conn-status ${acct.connected ? "on" : "off"}`}>
                    {acct.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                {acct.connected && <HealthRing score={acct.healthScore} />}
                {acct.connected ? (
                  <button onClick={() => handleDisconnect(acct.platform)} className="btn-sm danger" style={{ padding: "6px 12px", gap: "4px" }}>
                    <Unlink size={12} /> Disconnect
                  </button>
                ) : (
                  <button onClick={() => setConnectModal(acct.platform)} className="btn-sm primary" style={{ padding: "6px 14px", gap: "4px" }}>
                    <Link2 size={12} /> Connect
                  </button>
                )}
              </div>

              {acct.connected && (
                <>
                  <div className="acct-stats">
                    <div className="acct-stat">
                      <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>Active Listings</p>
                      <p style={{ fontSize: "18px", fontWeight: "800" }}>{acct.stats.activeListings}</p>
                    </div>
                    <div className="acct-stat">
                      <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>Views This Week</p>
                      <p style={{ fontSize: "18px", fontWeight: "800" }}>{acct.stats.viewsThisWeek}</p>
                    </div>
                    <div className="acct-stat">
                      <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>Messages</p>
                      <p style={{ fontSize: "18px", fontWeight: "800" }}>{acct.stats.messagesThisWeek}</p>
                    </div>
                    <div className="acct-stat">
                      <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>Total Value</p>
                      <p className="gradient-text" style={{ fontSize: "18px", fontWeight: "800" }}>${acct.stats.totalValue}</p>
                    </div>
                  </div>

                  {/* Health tips */}
                  <div style={{ marginTop: "12px", padding: "12px", background: "var(--bg)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <Lightbulb size={12} style={{ color: "var(--text-faint)" }} />
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Improve Your Score</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {acct.healthScore >= 70 ? HEALTH_TIPS.high[0] : acct.healthScore >= 40 ? HEALTH_TIPS.mid[Math.floor(Math.random() * HEALTH_TIPS.mid.length)] : HEALTH_TIPS.low[Math.floor(Math.random() * HEALTH_TIPS.low.length)]}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* === LISTINGS TAB === */}
          {tab === "listings" && (
            <>
              {/* Search + bulk actions */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
                  <input type="text" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} className="biz-input" style={{ paddingLeft: "36px", fontSize: "13px" }} />
                </div>
                {selected.size > 0 && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => handleBulkAction("sold")} className="btn-sm primary" style={{ padding: "6px 10px", fontSize: "11px" }}>Mark Sold ({selected.size})</button>
                    <button onClick={() => handleBulkAction("relist")} className="btn-sm ghost" style={{ padding: "6px 10px", fontSize: "11px" }}>Relist</button>
                    <button onClick={() => handleBulkAction("delete")} className="btn-sm danger" style={{ padding: "6px 10px", fontSize: "11px" }}>Delete</button>
                  </div>
                )}
              </div>

              {/* Column headers */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: "20px" }} />
                <div style={{ width: "36px" }} />
                {([["item", "Item", 1], ["platform", "Platform", 0], ["price", "Price", 0], ["views", "Views", 0], ["daysListed", "Days", 0], ["status", "Status", 0]] as [SortKey, string, number][]).map(([key, label]) => (
                  <button key={key} onClick={() => handleSort(key)} style={{ flex: key === "item" ? 1 : 0, minWidth: key === "item" ? "0" : "55px", background: "none", border: "none", fontFamily: "inherit", fontSize: "11px", fontWeight: "700", color: sortKey === key ? "var(--green-accent)" : "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px", padding: 0 }}>
                    {label} <SortIcon col={key} />
                  </button>
                ))}
                <div style={{ width: "60px" }} />
              </div>

              {/* Listing rows */}
              {filteredListings.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px" }}>
                  <Package size={24} style={{ color: "var(--text-faint)" }} />
                  <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>No listings. Connect an account to get started.</p>
                </div>
              ) : filteredListings.map(l => (
                <div key={l.id} className="listing-row">
                  <div onClick={() => setSelected(prev => { const n = new Set(prev); n.has(l.id) ? n.delete(l.id) : n.add(l.id); return n })} className={`checkbox-box ${selected.has(l.id) ? "checked" : ""}`} style={{ cursor: "pointer", width: "18px", height: "18px" }}>
                    {selected.has(l.id) && <Check size={10} color="#fff" />}
                  </div>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={14} style={{ color: "var(--text-faint)" }} />
                  </div>
                  <p style={{ flex: 1, fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.item}</p>
                  <span className="platform-badge" style={{ minWidth: "55px", textAlign: "center", fontSize: "10px" }}>{l.platform.split(" ")[0]}</span>
                  <p className="gradient-text" style={{ fontSize: "13px", fontWeight: "800", minWidth: "55px" }}>${l.price}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-faint)", minWidth: "55px" }}>{l.views}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-faint)", minWidth: "55px" }}>{l.daysListed}d</p>
                  <span className={`difficulty-pill ${l.status === "Active" ? "easy" : l.status === "Sold" ? "medium" : "hard"}`} style={{ minWidth: "55px", textAlign: "center", fontSize: "10px" }}>{l.status}</span>
                  <button onClick={() => { setCrossPostModal(l.id); setCrossPostTargets([]) }} className="btn-sm ghost" style={{ padding: "3px 8px", fontSize: "10px", gap: "3px", minWidth: "60px" }}>
                    <Copy size={10} /> Cross-Post
                  </button>
                </div>
              ))}
            </>
          )}

          {/* === ANALYTICS TAB === */}
          {tab === "analytics" && (
            <>
              {/* Summary stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                <div className="stat-card">
                  <p className="card-label" style={{ marginBottom: "2px" }}>Total Listings</p>
                  <p style={{ fontSize: "28px", fontWeight: "800" }}>{totalListings}</p>
                </div>
                <div className="stat-card highlight">
                  <p className="card-label" style={{ marginBottom: "2px" }}>Inventory Value</p>
                  <p className="gradient-text" style={{ fontSize: "28px", fontWeight: "800" }}>${totalValue.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                  <p className="card-label" style={{ marginBottom: "2px" }}>Messages This Week</p>
                  <p style={{ fontSize: "28px", fontWeight: "800" }}>{totalMessages}</p>
                </div>
                <div className="stat-card">
                  <p className="card-label" style={{ marginBottom: "2px" }}>Best Platform</p>
                  <p style={{ fontSize: "16px", fontWeight: "800" }}>{bestPlatform || "N/A"}</p>
                </div>
              </div>

              {/* Avg days to sell chart */}
              {chartData.length > 0 && (
                <div className="chart-card">
                  <p className="card-label" style={{ paddingLeft: "8px" }}>Avg Days to Sell by Platform</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#30363d" : "#e4ebe6"} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? "#484f58" : "#8a9a8e", fontWeight: 600 }} tickLine={false} axisLine={{ stroke: isDark ? "#30363d" : "#e4ebe6" }} />
                      <YAxis tick={{ fontSize: 12, fill: isDark ? "#484f58" : "#8a9a8e", fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? "#161b22" : "#ffffff", border: `1px solid ${isDark ? "#30363d" : "#d4ddd6"}`, borderRadius: "10px", fontSize: "13px", fontWeight: 600 }} />
                      <Bar dataKey="days" fill={isDark ? "#2ea043" : "#52b788"} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Platform breakdown */}
              <div className="card">
                <p className="card-label">Connected Platform Breakdown</p>
                {connectedAccounts.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-faint)" }}>Connect accounts to see analytics.</p>
                ) : (
                  connectedAccounts.map((a, i) => (
                    <div key={a.platform} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < connectedAccounts.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <HealthRing score={a.healthScore} />
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: "700" }}>{a.platform}</p>
                          <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>{a.stats.activeListings} listings · {a.stats.viewsThisWeek} views</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="gradient-text" style={{ fontSize: "16px", fontWeight: "800" }}>${a.stats.totalValue}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{a.stats.messagesThisWeek} msgs</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </PageTransition>
  )
}
