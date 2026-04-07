"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, TrendingUp, Heart, DollarSign, UserPlus, Info, Check, CheckCheck, Bookmark, ShoppingBag } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { supabase } from "../lib/supabase"

interface Notification {
  id: string; type: string; title: string; message: string; read: boolean; created_at: string;
  link?: string;
}

type NotifFilter = "all" | "unread" | "price" | "social" | "system"

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

function getNotifIcon(type: string) {
  switch (type) {
    case "trend_alert": return { Icon: TrendingUp, cls: "trend" }
    case "price_drop": return { Icon: DollarSign, cls: "price" }
    case "new_follower": return { Icon: UserPlus, cls: "social" }
    case "listing_saved": return { Icon: Bookmark, cls: "social" }
    case "item_sold": return { Icon: ShoppingBag, cls: "trend" }
    case "weekly_summary": return { Icon: Bell, cls: "system" }
    default: return { Icon: Info, cls: "system" }
  }
}

function getFilterCategory(type: string): NotifFilter {
  if (type === "price_drop" || type === "trend_alert") return "price"
  if (type === "new_follower" || type === "listing_saved") return "social"
  return "system"
}

const FILTER_OPTIONS: { key: NotifFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "price", label: "Price Alerts" },
  { key: "social", label: "Social" },
  { key: "system", label: "System" },
]

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isGuest } = useAuth()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<NotifFilter>("all")

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
      setNotifs((data || []) as Notification[])
      setLoading(false)
    }
    load()
  }, [user])

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    if (!user) return
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  function handleNotifClick(n: Notification) {
    if (!n.read) markRead(n.id)
    if (n.link) router.push(n.link)
  }

  const filtered = filter === "all" ? notifs
    : filter === "unread" ? notifs.filter(n => !n.read)
    : notifs.filter(n => getFilterCategory(n.type) === filter)

  const unreadCount = notifs.filter(n => !n.read).length

  if (loading) return (
    <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
      <h2 style={{ marginBottom: "16px" }}>Notifications</h2>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "72px", marginBottom: "8px", borderRadius: "12px" }} />)}
    </main></PageTransition>
  )

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ marginBottom: "4px" }}>Notifications</h2>
            {unreadCount > 0 && <p style={{ fontSize: "13px", color: "var(--green-accent)" }}>{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-sm ghost" style={{ padding: "4px 12px", fontSize: "11px" }}><CheckCheck size={12} /> Mark all read</button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "6px", padding: "8px 20px 12px", overflowX: "auto" }}>
          {FILTER_OPTIONS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`mp-filter-chip ${filter === f.key ? "active" : ""}`} style={{ fontSize: "12px", padding: "4px 12px" }}>
              {f.label}{f.key === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {isGuest || filtered.length === 0 ? (
          <div className="empty-state">
            <Bell size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>{isGuest ? "Sign in to see notifications" : filter === "unread" ? "All caught up!" : "No notifications yet"}</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              {isGuest ? "Create an account to get personalized alerts" : filter === "unread" ? "You have no unread notifications" : "We'll notify you about trending items and price drops"}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map(n => {
              const { Icon, cls } = getNotifIcon(n.type)
              return (
                <div key={n.id} onClick={() => handleNotifClick(n)} style={{ display: "flex", gap: "12px", padding: "14px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: n.read ? "transparent" : "var(--green-light)", transition: "background 0.15s" }}>
                  <div className={`notif-icon ${cls}`}><Icon size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.title}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px", lineHeight: 1.4 }}>{n.message}</p>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>{timeAgo(n.created_at)}</span>
                    {!n.read && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green-accent)" }} />}
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
