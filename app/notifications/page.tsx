"use client"

import { useState, useEffect } from "react"
import { Bell, TrendingUp, Info, Check } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { supabase } from "../lib/supabase"

interface Notification { id: string; type: string; title: string; message: string; read: boolean; created_at: string }

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export default function NotificationsPage() {
  const { user, isGuest } = useAuth()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "trend_alert">("all")

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

  const filtered = filter === "all" ? notifs : filter === "unread" ? notifs.filter(n => !n.read) : notifs.filter(n => n.type === "trend_alert")
  const unreadCount = notifs.filter(n => !n.read).length

  if (loading) return (
    <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
      <h2 style={{ marginBottom: "16px" }}>Notifications</h2>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "64px", marginBottom: "8px", borderRadius: "12px" }} />)}
    </main></PageTransition>
  )

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 16px" }}>
          <h2 style={{ marginBottom: "4px" }}>Notifications</h2>
          {unreadCount > 0 && <p style={{ fontSize: "13px", color: "var(--green-accent)" }}>{unreadCount} unread</p>}
        </div>

        <div style={{ display: "flex", gap: "6px", padding: "0 20px 16px" }}>
          {(["all", "unread", "trend_alert"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`pill ${filter === f ? "active" : ""}`} style={{ fontSize: "12px", padding: "4px 12px" }}>
              {f === "all" ? "All" : f === "unread" ? "Unread" : "Trends"}
            </button>
          ))}
        </div>

        {isGuest || filtered.length === 0 ? (
          <div className="empty-state">
            <Bell size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>{isGuest ? "Sign in to see notifications" : "No notifications yet"}</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{isGuest ? "Create an account to get personalized alerts" : "You will be notified about trending items and updates"}</p>
          </div>
        ) : (
          <StaggerContainer>
            {filtered.map(n => (
              <StaggerItem key={n.id}>
                <div onClick={() => !n.read && markRead(n.id)} style={{ display: "flex", gap: "12px", padding: "14px 20px", borderBottom: "1px solid var(--border)", cursor: n.read ? "default" : "pointer", background: n.read ? "transparent" : "var(--green-light)", minHeight: "56px" }}>
                  <div style={{ flexShrink: 0, marginTop: "2px" }}>
                    {n.type === "trend_alert" ? <TrendingUp size={16} style={{ color: "var(--green-accent)" }} /> : <Info size={16} style={{ color: "var(--text-faint)" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{n.message}</p>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>{timeAgo(n.created_at)}</span>
                    {n.read && <Check size={12} style={{ color: "var(--text-faint)" }} />}
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
