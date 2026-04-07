"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard, DollarSign, Megaphone, Box, Settings, Bot,
  TrendingUp, TrendingDown, Users, Scan, ChevronRight, Check, X,
  Shield, Database, CreditCard, Lock, AlertCircle, Play, Clock,
  Plus, ArrowUp, ArrowDown, Minus, Activity, Zap, MessageSquare,
  FileText, Eye, Heart, Send, Loader2, RefreshCw,
} from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts"

const PASSWORD = "FliptCEO2026"
const AUTH_KEY = "flipt-ceo-auth"

// ===== Mock data =====
const MRR_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `Mar ${i + 1}`,
  mrr: 1800 + Math.floor(i * 18 + Math.random() * 40),
}))

// No more hardcoded proposals — all data comes from Supabase

// Removed: ACTIVITY_FEED — all activity comes from Supabase agent_activity table

const TRANSACTIONS = [
  // Will be replaced with real Stripe data in future
  { user: "sarah.m@gmail.com", plan: "Pro Monthly", amount: 4.99, time: "12 min ago" },
  { user: "james.t@outlook.com", plan: "Business Yearly", amount: 119.99, time: "34 min ago" },
  { user: "emma.k@yahoo.com", plan: "Pro Yearly", amount: 39.99, time: "1 hr ago" },
  { user: "omar.h@gmail.com", plan: "Pro Monthly", amount: 4.99, time: "2 hr ago" },
  { user: "lisa.c@icloud.com", plan: "Business Monthly", amount: 14.99, time: "3 hr ago" },
]

// Removed: CONTENT_QUEUE — marketing content comes from Supabase agent_proposals table

const FEATURES = [
  { name: "Search in scan history", source: "User Request", impact: 9, complexity: "Low", status: "In Progress" },
  { name: "Price alert notifications", source: "Competitor", impact: 8, complexity: "Medium", status: "Proposed" },
  { name: "Multi-photo scanning", source: "User Request", impact: 8, complexity: "High", status: "Proposed" },
  { name: "Saved listing templates", source: "AI Suggestion", impact: 7, complexity: "Low", status: "Proposed" },
  { name: "Barcode/UPC scanning", source: "User Request", impact: 7, complexity: "Medium", status: "Proposed" },
  { name: "In-app messaging for marketplace", source: "User Request", impact: 9, complexity: "High", status: "Backlog" },
  { name: "AR item overlay", source: "AI Suggestion", impact: 6, complexity: "High", status: "Backlog" },
]

const SHIPPED = [
  { name: "Currency selector", date: "Apr 5" },
  { name: "Supabase auth + Google login", date: "Apr 4" },
  { name: "Stripe subscriptions", date: "Apr 4" },
  { name: "AI damage detection", date: "Apr 3" },
  { name: "Flipt marketplace", date: "Apr 3" },
]

const TICKETS = [
  { id: "T-1042", user: "mike.r@gmail.com", subject: "Scan not identifying vintage watch correctly", priority: "Medium", time: "25 min ago" },
  { id: "T-1041", user: "priya.j@outlook.com", subject: "Can't connect eBay account", priority: "High", time: "1 hr ago" },
  { id: "T-1040", user: "alex.b@icloud.com", subject: "Price estimate seems too low for my MacBook", priority: "Low", time: "3 hr ago" },
]

const AGENTS = [
  { name: "CTO Agent", role: "Engineering & Infrastructure", status: "Working" as const, lastActive: "2 min ago", current: "Deploying search bar to staging environment", actions: 47 },
  { name: "CMO Agent", role: "Marketing & Growth", status: "Working" as const, lastActive: "8 min ago", current: "Creating TikTok content calendar for next week", actions: 35 },
  { name: "CPO Agent", role: "Product & Strategy", status: "Active" as const, lastActive: "15 min ago", current: "Analyzing user feedback for feature prioritization", actions: 28 },
  { name: "Support Agent", role: "Customer Support", status: "Active" as const, lastActive: "1 hr ago", current: "Monitoring support ticket queue", actions: 62 },
  { name: "Data Agent", role: "Analytics & Reporting", status: "Sleeping" as const, lastActive: "6 hr ago", current: "Scheduled: Daily metrics report at 6AM", actions: 19 },
  { name: "Finance Agent", role: "Revenue & Billing", status: "Sleeping" as const, lastActive: "8 hr ago", current: "Scheduled: Weekly revenue reconciliation", actions: 12 },
]

type Section = "overview" | "revenue" | "marketing" | "product" | "operations" | "agents" | "office"

const NAV: { key: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "revenue", label: "Revenue", icon: DollarSign },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "product", label: "Product", icon: Box },
  { key: "operations", label: "Operations", icon: Settings },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "office", label: "Office", icon: LayoutDashboard },
]

export default function CEODashboard() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState("")
  const [pwError, setPwError] = useState(false)
  const [section, setSection] = useState<Section>("overview")
  // Removed: mock proposals and content state — using dbProposals and marketingContent from Supabase
  const [mounted, setMounted] = useState(false)
  const [dbProposals, setDbProposals] = useState<Array<{ id: string; agent_name: string; title: string; description: string; impact_rating: string; complexity: string; proposal_type: string; status: string; content: unknown }>>([])
  const [dbActivity, setDbActivity] = useState<Array<{ agent_name: string; action: string; created_at: string }>>([])
  const [briefing, setBriefing] = useState<string | null>(null)
  const [agentRunning, setAgentRunning] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // Real metrics
  const [metrics, setMetrics] = useState({ totalUsers: 0, proUsers: 0, bizUsers: 0, freeUsers: 0, scansToday: 0, mrr: 0, newUsersToday: 0, pendingCount: 0 })
  const [marketingContent, setMarketingContent] = useState<Array<{ id: string; title: string; description: string; agent_name: string; impact_rating: string; complexity: string; content?: { platform?: string } }>>([])
  const [featureProposals, setFeatureProposals] = useState<Array<{ id: string; title: string; description: string; impact_rating: string; complexity: string }>>([])

  const loadDashboardData = useCallback(async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)

    // User counts by plan
    const { data: profiles } = await sb.from("profiles").select("plan, created_at")
    const allProfiles = profiles || []
    const proCount = allProfiles.filter(p => p.plan === "pro").length
    const bizCount = allProfiles.filter(p => p.plan === "business").length
    const freeCount = allProfiles.filter(p => !p.plan || p.plan === "free").length
    const newToday = allProfiles.filter(p => new Date(p.created_at) >= today).length
    const mrr = proCount * 4.99 + bizCount * 14.99

    // Scans today
    const { count: scansToday } = await sb.from("scans").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString())

    // Pending proposals count
    const { count: pendingCount } = await sb.from("agent_proposals").select("*", { count: "exact", head: true }).eq("status", "pending")

    setMetrics({ totalUsers: allProfiles.length, proUsers: proCount, bizUsers: bizCount, freeUsers: freeCount, scansToday: scansToday || 0, mrr: Math.round(mrr * 100) / 100, newUsersToday: newToday, pendingCount: pendingCount || 0 })

    // Pending proposals (all types)
    const { data: props } = await sb.from("agent_proposals").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(20)
    if (props) setDbProposals(props)

    // Marketing content
    const { data: mktg } = await sb.from("agent_proposals").select("*").eq("proposal_type", "marketing_content").eq("status", "pending").order("created_at", { ascending: false })
    if (mktg) setMarketingContent(mktg)

    // Feature proposals
    const { data: feats } = await sb.from("agent_proposals").select("*").eq("proposal_type", "feature").eq("status", "pending").order("created_at", { ascending: false })
    if (feats) setFeatureProposals(feats)

    // Activity
    const { data: acts } = await sb.from("agent_activity").select("*").order("created_at", { ascending: false }).limit(20)
    if (acts) setDbActivity(acts)

    // Briefing
    const { data: brief } = await sb.from("agent_activity").select("details").eq("status", "morning_briefing").order("created_at", { ascending: false }).limit(1)
    if (brief?.[0]?.details) setBriefing(brief[0].details)
  }, [])

  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY) === "true") setAuthed(true)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (authed) loadDashboardData()
  }, [authed, loadDashboardData])

  function showToastMsg(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function runAgent(name: string, path: string) {
    setAgentRunning(name)
    try {
      await fetch(path)
      await loadDashboardData()
      showToastMsg(`${name} completed`)
    } catch { showToastMsg(`${name} failed`) }
    setAgentRunning(null)
  }

  async function approveProposal(id: string) {
    await sb.from("agent_proposals").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id)
    setDbProposals(prev => prev.filter(p => p.id !== id))
    showToastMsg("Proposal approved")
  }

  async function rejectProposal(id: string) {
    await sb.from("agent_proposals").update({ status: "rejected", rejected_at: new Date().toISOString() }).eq("id", id)
    setDbProposals(prev => prev.filter(p => p.id !== id))
    showToastMsg("Proposal rejected")
  }

  function handleLogin() {
    if (pw === PASSWORD) {
      localStorage.setItem(AUTH_KEY, "true")
      setAuthed(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  if (!mounted) return null

  // Login screen
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0d0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>
          <Lock size={32} style={{ color: "#52b788", margin: "0 auto 16px" }} />
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", color: "#f0f4f0", marginBottom: "8px" }}>Flipt HQ</h2>
          <p style={{ fontSize: "14px", color: "#6b7c6b", marginBottom: "24px" }}>Internal dashboard access</p>
          {pwError && <p style={{ fontSize: "13px", color: "#e05252", marginBottom: "12px", fontWeight: 600 }}>Access Denied</p>}
          <input
            type="password" placeholder="Enter password" value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false) }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "14px 20px", background: "#111411", border: `1px solid ${pwError ? "#e05252" : "#1e241e"}`, borderRadius: "12px", color: "#f0f4f0", fontFamily: "var(--font-body)", fontSize: "15px", marginBottom: "12px", outline: "none" }}
          />
          <button onClick={handleLogin} style={{ width: "100%", padding: "14px", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
            Access Dashboard
          </button>
        </div>
      </div>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  const S = { bg: "#0a0d0a", surface: "#111411", border: "#1e241e", green: "#52b788", greenDark: "#2d6a4f", text: "#f0f4f0", muted: "#6b7c6b", faint: "#3d4a3d" }

  const StatCard = ({ label, value, trend, trendVal }: { label: string; value: string; trend: "up" | "down" | "flat"; trendVal: string }) => (
    <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px" }}>
      <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: S.muted, marginBottom: "8px" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "32px", fontWeight: 700, color: S.text, lineHeight: 1 }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
        {trend === "up" ? <ArrowUp size={12} style={{ color: S.green }} /> : trend === "down" ? <ArrowDown size={12} style={{ color: "#e05252" }} /> : <Minus size={12} style={{ color: S.muted }} />}
        <span style={{ fontSize: "12px", fontWeight: 600, color: trend === "up" ? S.green : trend === "down" ? "#e05252" : S.muted }}>{trendVal}</span>
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "var(--font-body)" }}>

      {/* Sidebar */}
      <aside style={{ width: "220px", background: S.surface, borderRight: `1px solid ${S.border}`, padding: "24px 12px", flexShrink: 0, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "22px", fontWeight: 700, color: S.green, padding: "0 12px", marginBottom: "24px" }}>Flipt HQ</p>
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => key === "office" ? window.location.href = "/ceo/office" : setSection(key)}
              style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                background: section === key ? "rgba(82,183,136,0.1)" : "transparent",
                border: "none", borderRadius: "10px", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: section === key ? 600 : 400,
                color: section === key ? S.green : S.muted, transition: "all 0.15s ease", width: "100%", textAlign: "left",
              }}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.removeItem(AUTH_KEY); setAuthed(false) }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "none", border: "none", color: S.faint, fontSize: "13px", fontFamily: "var(--font-body)", cursor: "pointer" }}>
          <Lock size={14} /> Lock Dashboard
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 32px 48px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "13px", color: S.muted, marginBottom: "4px" }}>{dateStr}</p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "28px" }}>{greeting}, Noah</h2>
        </div>

        {toast && <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 300, background: S.surface, border: `1px solid ${S.border}`, borderRadius: "10px", padding: "12px 20px", fontSize: "14px", color: S.green, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>{toast}</div>}

        {/* ===== OVERVIEW ===== */}
        {section === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Morning briefing */}
            {briefing && (
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: S.green, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Morning Briefing</p>
                <p style={{ fontSize: "14px", color: S.text, lineHeight: 1.6, whiteSpace: "pre-line" }}>{briefing}</p>
              </div>
            )}

            {/* Agent controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => runAgent("All Agents", "/api/agents/run-all")} disabled={!!agentRunning} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                {agentRunning ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : <Play size={14} />}
                {agentRunning ? `Running ${agentRunning}...` : "Run All Agents"}
              </button>
              <button onClick={() => runAgent("Morning Briefing", "/api/agents/morning-briefing")} disabled={!!agentRunning} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", color: S.muted, border: `1px solid ${S.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                <RefreshCw size={14} /> Generate Briefing
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
              <StatCard label="Monthly Recurring Revenue" value={`$${metrics.mrr.toFixed(2)}`} trend={metrics.mrr > 0 ? "up" : "flat"} trendVal={metrics.mrr > 0 ? `${metrics.proUsers} Pro + ${metrics.bizUsers} Biz` : "No subscribers yet"} />
              <StatCard label="Total Users" value={String(metrics.totalUsers)} trend={metrics.newUsersToday > 0 ? "up" : "flat"} trendVal={metrics.newUsersToday > 0 ? `+${metrics.newUsersToday} today` : "No new users today"} />
              <StatCard label="Scans Today" value={String(metrics.scansToday)} trend={metrics.scansToday > 0 ? "up" : "flat"} trendVal={metrics.scansToday > 0 ? "Active scanning" : "No scans yet today"} />
              <StatCard label="Pending Proposals" value={String(metrics.pendingCount)} trend={metrics.pendingCount > 0 ? "up" : "flat"} trendVal={metrics.pendingCount > 0 ? "Awaiting your review" : "All caught up"} />
            </div>

            {/* Real proposals from DB */}
            {dbProposals.length > 0 && (
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Proposals from Agents ({dbProposals.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {dbProposals.map(p => (
                    <div key={p.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: S.green, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.agent_name}</span>
                          <p style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>{p.title}</p>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <span style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "50px", background: p.impact_rating === "High" ? "rgba(82,183,136,0.1)" : "rgba(201,168,76,0.1)", color: p.impact_rating === "High" ? S.green : "#c9a84c" }}>{p.impact_rating} Impact</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "14px", color: S.muted, lineHeight: 1.5, marginBottom: "14px", whiteSpace: "pre-line" }}>{p.description?.slice(0, 300)}</p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => approveProposal(p.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}><Check size={14} /> Approve</button>
                        <button onClick={() => rejectProposal(p.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}><X size={14} /> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no proposals */}
            {dbProposals.length === 0 && (
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "32px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: S.muted }}>No pending proposals. Run agents to generate new ideas.</p>
              </div>
            )}

            {/* Real Activity from DB */}
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Agent Activity Log</p>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", overflow: "hidden" }}>
                {dbActivity.length > 0 ? dbActivity.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: i < dbActivity.length - 1 ? `1px solid ${S.border}` : "none" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: S.green, textTransform: "uppercase", width: "80px", flexShrink: 0 }}>{a.agent_name}</span>
                    <p style={{ fontSize: "14px", flex: 1 }}>{a.action}</p>
                    <span style={{ fontSize: "11px", color: S.faint, flexShrink: 0 }}>{new Date(a.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                )) : (
                  <div style={{ padding: "24px", textAlign: "center" }}>
                    <p style={{ fontSize: "13px", color: S.muted }}>No agent activity yet. Run agents to see activity here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== REVENUE ===== */}
        {section === "revenue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <button onClick={() => runAgent("CFO Agent", "/api/agents/cfo/revenue")} disabled={!!agentRunning} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "transparent", color: S.muted, border: `1px solid ${S.border}`, borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                <RefreshCw size={12} /> Refresh Revenue
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "12px" }}>
              <StatCard label="MRR" value={`$${metrics.mrr.toFixed(2)}`} trend={metrics.mrr > 0 ? "up" : "flat"} trendVal={metrics.mrr > 0 ? `${metrics.proUsers + metrics.bizUsers} paid` : "No revenue yet"} />
              <StatCard label="ARR" value={`$${(metrics.mrr * 12).toFixed(0)}`} trend={metrics.mrr > 0 ? "up" : "flat"} trendVal="Projected annually" />
              <StatCard label="New Today" value={String(metrics.newUsersToday)} trend={metrics.newUsersToday > 0 ? "up" : "flat"} trendVal={metrics.newUsersToday > 0 ? "New signups" : "No new users"} />
              <StatCard label="Total Users" value={String(metrics.totalUsers)} trend="flat" trendVal={`${metrics.freeUsers} free`} />
              <StatCard label="Scans Today" value={String(metrics.scansToday)} trend={metrics.scansToday > 0 ? "up" : "flat"} trendVal="Item scans" />
            </div>

            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "20px" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>MRR Growth (Last 30 Days)</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={MRR_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: S.faint }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: S.faint }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "10px", fontSize: "13px" }} />
                  <Line type="monotone" dataKey="mrr" stroke={S.green} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>{metrics.freeUsers}</p>
                <p style={{ fontSize: "12px", color: S.muted }}>Free Users</p>
              </div>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-heading)", color: S.green }}>{metrics.proUsers}</p>
                <p style={{ fontSize: "12px", color: S.muted }}>Pro Subscribers</p>
              </div>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "#c9a84c" }}>{metrics.bizUsers}</p>
                <p style={{ fontSize: "12px", color: S.muted }}>Business Subscribers</p>
              </div>
            </div>

            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Recent Transactions</p>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", overflow: "hidden" }}>
                {TRANSACTIONS.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: i < TRANSACTIONS.length - 1 ? `1px solid ${S.border}` : "none" }}>
                    <p style={{ flex: 1, fontSize: "14px" }}>{t.user}</p>
                    <span style={{ fontSize: "12px", color: S.muted }}>{t.plan}</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: S.green }}>${t.amount}</span>
                    <span style={{ fontSize: "11px", color: S.faint }}>{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== MARKETING ===== */}
        {section === "marketing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <button onClick={() => runAgent("CMO Agent", "/api/agents/cmo/content")} disabled={!!agentRunning} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                {agentRunning === "CMO Agent" ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : <Plus size={14} />}
                Generate New Content
              </button>
            </div>

            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Content Awaiting Approval ({marketingContent.length})</p>
              {marketingContent.length === 0 ? (
                <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "32px", textAlign: "center" }}>
                  <p style={{ fontSize: "14px", color: S.muted }}>No content pending — click Generate New Content to create some</p>
                </div>
              ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {marketingContent.map(c => {
                  const plat = c.content?.platform || "Content"
                  return (
                  <div key={c.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ padding: "2px 8px", fontSize: "10px", fontWeight: 600, borderRadius: "50px", background: plat === "TikTok" ? "rgba(82,183,136,0.1)" : plat === "Instagram" ? "rgba(193,53,132,0.1)" : "rgba(255,87,34,0.1)", color: plat === "TikTok" ? S.green : plat === "Instagram" ? "#c13584" : "#ff5722" }}>{plat}</span>
                        </div>
                        <p style={{ fontSize: "15px", fontWeight: 700 }}>{c.title}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: S.muted, lineHeight: 1.6, marginBottom: "14px", background: S.bg, padding: "12px", borderRadius: "8px", whiteSpace: "pre-line" }}>{c.description?.slice(0, 400)}</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => approveProposal(c.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => rejectProposal(c.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                  )
                })}
                {/* Empty handled above */}
              </div>
              )}
            </div>
          </div>
        )}

        {/* ===== PRODUCT ===== */}
        {section === "product" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <button onClick={() => runAgent("CTO Agent", "/api/agents/cto/research")} disabled={!!agentRunning} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                {agentRunning === "CTO Agent" ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : <Plus size={14} />}
                Run CTO Research
              </button>
              <button onClick={() => runAgent("CPO Agent", "/api/agents/cpo/research")} disabled={!!agentRunning} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", color: S.muted, border: `1px solid ${S.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                Run Product Research
              </button>
            </div>

            {/* Real proposals from agents */}
            {featureProposals.length > 0 && (
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Agent Feature Proposals ({featureProposals.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {featureProposals.map(f => (
                    <div key={f.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700 }}>{f.title}</p>
                        <span style={{ padding: "2px 8px", fontSize: "10px", fontWeight: 600, borderRadius: "50px", background: f.impact_rating === "High" ? "rgba(82,183,136,0.1)" : "rgba(201,168,76,0.1)", color: f.impact_rating === "High" ? S.green : "#c9a84c" }}>{f.impact_rating}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: S.muted, lineHeight: 1.5 }}>{f.description?.slice(0, 200)}</p>
                      <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                        <button onClick={() => approveProposal(f.id)} style={{ padding: "6px 12px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>Approve</button>
                        <button onClick={() => rejectProposal(f.id)} style={{ padding: "6px 12px", background: "transparent", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)", borderRadius: "6px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {featureProposals.length === 0 && (
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "32px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: S.muted }}>No feature proposals yet — run the CTO Research agent to generate ideas</p>
              </div>
            )}

            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Feature Backlog (Static)</p>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 60px 80px 100px", gap: "8px", padding: "10px 18px", borderBottom: `1px solid ${S.border}` }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: S.faint }}>Feature</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: S.faint }}>Source</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: S.faint }}>Impact</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: S.faint }}>Effort</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: S.faint }}>Status</span>
                </div>
                {FEATURES.map((f, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 60px 80px 100px", gap: "8px", padding: "12px 18px", borderBottom: i < FEATURES.length - 1 ? `1px solid ${S.border}` : "none", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{f.name}</span>
                    <span style={{ fontSize: "12px", color: S.muted }}>{f.source}</span>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: f.impact >= 8 ? "rgba(82,183,136,0.1)" : "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: f.impact >= 8 ? S.green : "#c9a84c" }}>{f.impact}</div>
                    <span style={{ fontSize: "12px", color: S.muted }}>{f.complexity}</span>
                    <span style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "50px", background: f.status === "In Progress" ? "rgba(82,183,136,0.1)" : f.status === "Proposed" ? "rgba(201,168,76,0.1)" : S.bg, color: f.status === "In Progress" ? S.green : f.status === "Proposed" ? "#c9a84c" : S.muted, textAlign: "center" }}>{f.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Recently Shipped</p>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", overflow: "hidden" }}>
                {SHIPPED.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: i < SHIPPED.length - 1 ? `1px solid ${S.border}` : "none" }}>
                    <Check size={14} style={{ color: S.green }} />
                    <p style={{ flex: 1, fontSize: "14px" }}>{s.name}</p>
                    <span style={{ fontSize: "12px", color: S.faint }}>{s.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== OPERATIONS ===== */}
        {section === "operations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>System Health</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
                {[
                  { name: "API", icon: Zap, status: "Healthy", uptime: "99.98%" },
                  { name: "Database", icon: Database, status: "Healthy", uptime: "99.99%" },
                  { name: "Payments", icon: CreditCard, status: "Healthy", uptime: "100%" },
                  { name: "Auth", icon: Shield, status: "Healthy", uptime: "99.97%" },
                ].map((s, i) => (
                  <div key={i} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: S.green }} />
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600 }}>{s.name}</p>
                      <p style={{ fontSize: "11px", color: S.muted }}>{s.uptime} uptime</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Support Tickets ({TICKETS.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {TICKETS.map(t => (
                  <div key={t.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
                    <MessageSquare size={16} style={{ color: S.muted, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600 }}>{t.subject}</p>
                      <p style={{ fontSize: "12px", color: S.muted }}>{t.user} · {t.time}</p>
                    </div>
                    <span style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "50px", background: t.priority === "High" ? "rgba(224,82,82,0.08)" : t.priority === "Medium" ? "rgba(201,168,76,0.1)" : S.bg, color: t.priority === "High" ? "#e05252" : t.priority === "Medium" ? "#c9a84c" : S.muted }}>{t.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== AGENTS ===== */}
        {section === "agents" && (() => {
          const agentConfigs = [
            { name: "CTO Research Agent", role: "Feature ideas and technical research", path: "/api/agents/cto/research", dbName: "CTO Agent" },
            { name: "CMO Content Agent", role: "Social media content generation", path: "/api/agents/cmo/content", dbName: "CMO Agent" },
            { name: "CFO Revenue Agent", role: "Revenue monitoring and metrics", path: "/api/agents/cfo/revenue", dbName: "CFO Agent" },
            { name: "CPO Product Agent", role: "Competitor and market research", path: "/api/agents/cpo/research", dbName: "CPO Agent" },
            { name: "Trend Spotter Agent", role: "Trending resale items detection", path: "/api/agents/trend-spotter", dbName: "Trend Spotter" },
            { name: "Support Agent", role: "Customer support templates", path: "/api/agents/coo/support", dbName: "Support Agent" },
          ]
          return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <button onClick={() => runAgent("All Agents", "/api/agents/run-all")} disabled={!!agentRunning} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer", alignSelf: "flex-start" }}>
              {agentRunning ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : <Play size={14} />}
              {agentRunning ? `Running ${agentRunning}...` : "Run All Agents"}
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {agentConfigs.map((a, i) => {
                const lastActivity = dbActivity.find(act => act.agent_name === a.dbName)
                const lastTime = lastActivity ? new Date(lastActivity.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never run"
                return (
                <div key={i} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>{a.name}</p>
                      <p style={{ fontSize: "12px", color: S.muted }}>{a.role}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: lastActivity ? S.green : S.faint }} />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: lastActivity ? S.green : S.faint }}>{lastActivity ? "Active" : "Idle"}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: S.muted, marginBottom: "12px", lineHeight: 1.4 }}>{lastActivity ? lastActivity.action : "No activity yet — click Run Now"}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: S.faint }}>Last: {lastTime}</span>
                    <button onClick={() => runAgent(a.name, a.path)} disabled={!!agentRunning} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                      {agentRunning === a.name ? <Loader2 size={12} style={{ animation: "spin 0.6s linear infinite" }} /> : <Play size={12} />} Run
                    </button>
                  </div>
                </div>
              )})}
            </div>

            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Activity Log</p>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", overflow: "hidden" }}>
                {dbActivity.length > 0 ? dbActivity.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 18px", borderBottom: i < dbActivity.length - 1 ? `1px solid ${S.border}` : "none" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: S.green, textTransform: "uppercase", width: "80px", flexShrink: 0 }}>{a.agent_name}</span>
                    <p style={{ fontSize: "13px", flex: 1, color: S.text }}>{a.action}</p>
                    <span style={{ fontSize: "11px", color: S.faint, flexShrink: 0 }}>{new Date(a.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                )) : (
                  <div style={{ padding: "24px", textAlign: "center" }}>
                    <p style={{ fontSize: "13px", color: S.muted }}>No agent activity yet — run an agent to see logs here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        })()}
      </main>
    </div>
  )
}
