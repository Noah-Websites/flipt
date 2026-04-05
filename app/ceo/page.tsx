"use client"

import { useState, useEffect } from "react"
import {
  LayoutDashboard, DollarSign, Megaphone, Box, Settings, Bot,
  TrendingUp, TrendingDown, Users, Scan, ChevronRight, Check, X,
  Shield, Database, CreditCard, Lock, AlertCircle, Play, Clock,
  Plus, ArrowUp, ArrowDown, Minus, Activity, Zap, MessageSquare,
  FileText, Eye, Heart, Send, Loader2,
} from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts"

const PASSWORD = "FliptCEO2026"
const AUTH_KEY = "flipt-ceo-auth"

// ===== Mock data =====
const MRR_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `Mar ${i + 1}`,
  mrr: 1800 + Math.floor(i * 18 + Math.random() * 40),
}))

const PROPOSALS = [
  { id: 1, agent: "CTO Agent", title: "Add search bar to scan history", desc: "Users frequently scroll through long history lists. A search/filter would reduce time to find items by 60%.", impact: "High", complexity: "Simple" },
  { id: 2, agent: "CMO Agent", title: "Post TikTok about hidden gem Pokemon cards", desc: "Script ready: '3 Pokemon cards hiding in your closet worth over $500'. Trending audio selected. Target: 50K views.", impact: "Medium", complexity: "Ready" },
  { id: 3, agent: "CPO Agent", title: "Add price alert notifications", desc: "Push notifications when watched items drop in price. Poshmark and eBay both shipped this last week. We need parity.", impact: "High", complexity: "Medium" },
]

const ACTIVITY_FEED = [
  { time: "2 min ago", agent: "CTO", action: "Deployed scan history search bar to staging" },
  { time: "8 min ago", agent: "CMO", action: "Scheduled Instagram carousel post for 7PM EST" },
  { time: "15 min ago", agent: "CPO", action: "Analyzed 47 user feedback submissions from last week" },
  { time: "22 min ago", agent: "CTO", action: "Fixed image loading issue on marketplace page" },
  { time: "35 min ago", agent: "CMO", action: "Generated 5 TikTok script variations for A/B testing" },
  { time: "1 hr ago", agent: "Support", action: "Resolved 3 support tickets about scan accuracy" },
  { time: "1 hr ago", agent: "CPO", action: "Updated feature backlog priorities based on user data" },
  { time: "2 hr ago", agent: "CTO", action: "Optimized API response time by 23%" },
  { time: "3 hr ago", agent: "CMO", action: "Analyzed competitor Collectr's new pricing page" },
  { time: "4 hr ago", agent: "CPO", action: "Created wireframes for bulk scan improvements" },
]

const TRANSACTIONS = [
  { user: "sarah.m@gmail.com", plan: "Pro Monthly", amount: 5.99, time: "12 min ago" },
  { user: "james.t@outlook.com", plan: "Business Yearly", amount: 119.99, time: "34 min ago" },
  { user: "emma.k@yahoo.com", plan: "Pro Yearly", amount: 47.99, time: "1 hr ago" },
  { user: "omar.h@gmail.com", plan: "Pro Monthly", amount: 5.99, time: "2 hr ago" },
  { user: "lisa.c@icloud.com", plan: "Business Monthly", amount: 14.99, time: "3 hr ago" },
]

const CONTENT_QUEUE = [
  { id: 1, platform: "TikTok", title: "3 Pokemon cards worth $500+ in your closet", type: "Video Script", status: "Awaiting Approval", content: "Hook: 'You probably have $500 sitting in a shoebox right now.' Show 3 cards: 1st Ed Charizard ($420), Holographic Mewtwo ($85), Pikachu Illustrator ($5000). CTA: 'Scan yours free with Flipt.'" },
  { id: 2, platform: "TikTok", title: "I scanned my entire closet and made $2,400", type: "Video Script", status: "Awaiting Approval", content: "Show scanning each item with Flipt. Reveal total value. Show listing process. End with cash in hand." },
  { id: 3, platform: "TikTok", title: "Things in your kitchen worth more than you think", type: "Video Script", status: "Awaiting Approval", content: "KitchenAid mixer ($165), Le Creuset ($180), Vitamix ($200). 'Your kitchen is a goldmine.'" },
  { id: 4, platform: "Instagram", title: "Spring cleaning carousel - 10 items to scan", type: "Carousel", status: "Awaiting Approval", content: "10 slides: winter jacket, old phone, vintage lamp, gaming console, designer bag, running shoes, kitchen appliances, books, sports gear, furniture." },
  { id: 5, platform: "Reddit", title: "I built an AI app that tells you what your stuff is worth", type: "Post", status: "Awaiting Approval", content: "r/SideProject post: 'Hey everyone, I'm Noah from Ottawa. Built Flipt to help people figure out what their stuff is worth using AI...'" },
]

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

type Section = "overview" | "revenue" | "marketing" | "product" | "operations" | "agents"

const NAV: { key: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "revenue", label: "Revenue", icon: DollarSign },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "product", label: "Product", icon: Box },
  { key: "operations", label: "Operations", icon: Settings },
  { key: "agents", label: "Agents", icon: Bot },
]

export default function CEODashboard() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState("")
  const [pwError, setPwError] = useState(false)
  const [section, setSection] = useState<Section>("overview")
  const [proposals, setProposals] = useState(PROPOSALS)
  const [content, setContent] = useState(CONTENT_QUEUE)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY) === "true") setAuthed(true)
    setMounted(true)
  }, [])

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
              onClick={() => setSection(key)}
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

        {/* ===== OVERVIEW ===== */}
        {section === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
              <StatCard label="Monthly Recurring Revenue" value="$2,340" trend="up" trendVal="+12% vs last month" />
              <StatCard label="Active Users" value="847" trend="up" trendVal="+34 this week" />
              <StatCard label="Scans Today" value="234" trend="up" trendVal="+18% vs yesterday" />
              <StatCard label="Churn Rate" value="2.3%" trend="down" trendVal="-0.4% vs last month" />
            </div>

            {/* Proposals */}
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Awaiting Your Approval</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {proposals.map(p => (
                  <div key={p.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: S.green, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.agent}</span>
                        <p style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>{p.title}</p>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <span style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "50px", background: p.impact === "High" ? "rgba(82,183,136,0.1)" : "rgba(201,168,76,0.1)", color: p.impact === "High" ? S.green : "#c9a84c" }}>{p.impact} Impact</span>
                        <span style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "50px", background: `${S.bg}`, color: S.muted }}>{p.complexity}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "14px", color: S.muted, lineHeight: 1.5, marginBottom: "14px" }}>{p.desc}</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => setProposals(prev => prev.filter(x => x.id !== p.id))} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => setProposals(prev => prev.filter(x => x.id !== p.id))} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {proposals.length === 0 && <p style={{ fontSize: "14px", color: S.muted, padding: "20px 0" }}>All caught up. No pending proposals.</p>}
              </div>
            </div>

            {/* Activity */}
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Recent Activity</p>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", overflow: "hidden" }}>
                {ACTIVITY_FEED.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: i < ACTIVITY_FEED.length - 1 ? `1px solid ${S.border}` : "none" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: S.green, textTransform: "uppercase", width: "60px", flexShrink: 0 }}>{a.agent}</span>
                    <p style={{ fontSize: "14px", flex: 1 }}>{a.action}</p>
                    <span style={{ fontSize: "11px", color: S.faint, flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== REVENUE ===== */}
        {section === "revenue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "12px" }}>
              <StatCard label="MRR" value="$2,340" trend="up" trendVal="+12%" />
              <StatCard label="ARR" value="$28,080" trend="up" trendVal="+12%" />
              <StatCard label="New Today" value="8" trend="up" trendVal="+3 vs avg" />
              <StatCard label="Churned Today" value="1" trend="flat" trendVal="Normal" />
              <StatCard label="Avg LTV" value="$67" trend="up" trendVal="+$4" />
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
                <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>692</p>
                <p style={{ fontSize: "12px", color: S.muted }}>Free Users</p>
              </div>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-heading)", color: S.green }}>128</p>
                <p style={{ fontSize: "12px", color: S.muted }}>Pro Subscribers</p>
              </div>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "#c9a84c" }}>27</p>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
              <StatCard label="TikTok" value="2,340" trend="up" trendVal="+180 this week" />
              <StatCard label="Instagram" value="1,890" trend="up" trendVal="+95 this week" />
              <StatCard label="Reddit" value="450" trend="up" trendVal="+67 from last post" />
              <StatCard label="Twitter/X" value="312" trend="flat" trendVal="Stable" />
            </div>

            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Content Awaiting Approval ({content.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {content.map(c => (
                  <div key={c.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ padding: "2px 8px", fontSize: "10px", fontWeight: 600, borderRadius: "50px", background: c.platform === "TikTok" ? "rgba(82,183,136,0.1)" : c.platform === "Instagram" ? "rgba(193,53,132,0.1)" : "rgba(255,87,34,0.1)", color: c.platform === "TikTok" ? S.green : c.platform === "Instagram" ? "#c13584" : "#ff5722" }}>{c.platform}</span>
                          <span style={{ fontSize: "11px", color: S.faint }}>{c.type}</span>
                        </div>
                        <p style={{ fontSize: "15px", fontWeight: 700 }}>{c.title}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: S.muted, lineHeight: 1.6, marginBottom: "14px", background: S.bg, padding: "12px", borderRadius: "8px" }}>{c.content}</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => setContent(prev => prev.filter(x => x.id !== c.id))} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                        <Check size={14} /> Approve & Post
                      </button>
                      <button onClick={() => setContent(prev => prev.filter(x => x.id !== c.id))} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {content.length === 0 && <p style={{ fontSize: "14px", color: S.muted, padding: "20px 0" }}>Content queue is empty.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ===== PRODUCT ===== */}
        {section === "product" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Feature Backlog</p>
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
        {section === "agents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {AGENTS.map((a, i) => (
                <div key={i} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>{a.name}</p>
                      <p style={{ fontSize: "12px", color: S.muted }}>{a.role}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: a.status === "Working" ? S.green : a.status === "Active" ? "#c9a84c" : S.faint, animation: a.status === "Working" ? "pulseGlow 2s ease infinite" : "none" }} />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: a.status === "Working" ? S.green : a.status === "Active" ? "#c9a84c" : S.faint }}>{a.status}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: S.muted, marginBottom: "12px", lineHeight: 1.4 }}>{a.current}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: S.faint }}>Last active: {a.lastActive} · {a.actions} actions</span>
                    <button style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: S.greenDark, color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                      <Play size={12} /> Run
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Agent Activity Log</p>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", overflow: "hidden" }}>
                {ACTIVITY_FEED.concat(ACTIVITY_FEED).slice(0, 20).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 18px", borderBottom: i < 19 ? `1px solid ${S.border}` : "none" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: S.green, textTransform: "uppercase", width: "60px", flexShrink: 0 }}>{a.agent}</span>
                    <p style={{ fontSize: "13px", flex: 1, color: S.text }}>{a.action}</p>
                    <span style={{ fontSize: "11px", color: S.faint, flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
