"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  User, Mail, Calendar, Hash, LogOut, Crown, CreditCard, RotateCcw,
  Bell, BellOff, Moon, Globe, Download, Trash2, Shield, FileText,
  Star, Share2, Bug, Lightbulb, HelpCircle, Info, ChevronRight,
  Check, X, Copy, Sparkles,
} from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import { useTheme } from "../components/ThemeProvider"
import { useAuth } from "../components/AuthProvider"
import { useCurrency } from "../components/CurrencyProvider"
import CurrencySelector from "../components/CurrencySelector"
import { supabase } from "../lib/supabase"
import { getProfile as getDbProfile, updateProfile as updateDbProfile } from "../lib/db"
import {
  getProfile, updateProfile, getPlan, setPlan, getReferralCode,
  getNotifPrefs, setNotifPrefs, clearHistory, signOut as localSignOut,
  type PlanTier, type NotifPrefs,
} from "../lib/storage"

type SubModal = null | { plan: PlanTier; period: "weekly" | "monthly" | "yearly" }
type ConfirmModal = null | "history" | "closet" | "account"

const PRO_FEATURES = [
  "Unlimited scans", "Full price comparison", "Damage detector", "Authenticity checker",
  "Brand identifier", "Vintage & collectibles detector", "Demand meter & live prices",
  "My Closet with earnings", "Full scan history", "Share listings", "Watchlist",
  "Community feed", "Follow sellers", "Hidden gem finder", "Referral bonus scans",
  "Pro badge on listings", "Weekly market report",
]

const BIZ_EXTRAS = [
  "Business P&L tracking", "Tax estimates", "Multi account manager",
  "Bulk scan up to 50 items", "Room cleanout PDF report", "Cross-platform listing manager",
  "Performance analytics", "Account health scores", "Quick cross-post",
  "Priority support", "Early access to features",
]

const PLAN_COMPARE = [
  { feature: "Monthly scans", free: "5", pro: "Unlimited", biz: "Unlimited" },
  { feature: "Price comparison", free: "Basic", pro: "Full (5 platforms)", biz: "Full (5 platforms)" },
  { feature: "AI damage detection", free: false, pro: true, biz: true },
  { feature: "Authenticity checker", free: false, pro: true, biz: true },
  { feature: "Demand meter", free: false, pro: true, biz: true },
  { feature: "Watchlist & feed", free: false, pro: true, biz: true },
  { feature: "Business analytics", free: false, pro: false, biz: true },
  { feature: "Multi account manager", free: false, pro: false, biz: true },
  { feature: "Bulk scan", free: false, pro: false, biz: true },
  { feature: "Cross-platform posting", free: false, pro: false, biz: true },
]

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button className={`toggle ${on ? "on" : ""}`} onClick={onChange}>
      <div className="toggle-knob" />
    </button>
  )
}

export default function Settings() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, toggle: toggleTheme } = useTheme()
  const { user, isGuest, signOut: authSignOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState({ name: "", email: "", joinedAt: "" })
  const [plan, setCurrentPlan] = useState<PlanTier>("free")
  const [notifs, setNotifs] = useState<NotifPrefs>({ push: true, weeklyReport: false, priceDrops: true, newListings: true, promo: false })
  const [refCode, setRefCode] = useState("")
  const [editName, setEditName] = useState(false)
  const [nameVal, setNameVal] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const [subModal, setSubModal] = useState<SubModal>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>(null)
  const [copied, setCopied] = useState(false)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const { currency, currencyCode, setCurrencyCode } = useCurrency()

  useEffect(() => {
    async function load() {
      const p = getProfile()
      // Try loading from Supabase database
      if (user) {
        const { data: dbProfile } = await getDbProfile(user.id)
        if (dbProfile) {
          p.email = dbProfile.email || user.email || p.email
          p.name = dbProfile.display_name || p.name
          p.joinedAt = dbProfile.created_at || p.joinedAt
          setRefCode(dbProfile.referral_code || getReferralCode())
          if (dbProfile.plan && dbProfile.plan !== "free") {
            setPlan(dbProfile.plan as PlanTier)
            setCurrentPlan(dbProfile.plan as PlanTier)
          }
        } else {
          // Fallback to auth metadata
          const meta = user.user_metadata || {}
          p.email = user.email || p.email
          p.name = meta.full_name || meta.name || p.name
          p.joinedAt = user.created_at || p.joinedAt
        }
      }
      setProfile(p)
      setNameVal(p.name)
      setCurrentPlan(getPlan())
      setNotifs(getNotifPrefs())
      if (!refCode) setRefCode(getReferralCode())
      setMounted(true)
    }
    load()

    // Handle Stripe redirect
    if (searchParams.get("success") === "true") {
      const newPlan = searchParams.get("plan") as PlanTier
      if (newPlan && (newPlan === "pro" || newPlan === "business")) {
        setPlan(newPlan)
        setCurrentPlan(newPlan)
        showToast(`Welcome to Flipt ${newPlan === "pro" ? "Pro" : "Business"}!`)
      }
      router.replace("/settings")
    }
    if (searchParams.get("cancelled") === "true") {
      showToast("Subscription cancelled — no charge was made")
      router.replace("/settings")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  async function saveName() {
    updateProfile({ name: nameVal })
    setProfile(prev => ({ ...prev, name: nameVal }))
    setEditName(false)
    if (user) {
      await supabase.auth.updateUser({ data: { full_name: nameVal } })
      await updateDbProfile(user.id, { display_name: nameVal })
    }
  }

  function handleNotifToggle(key: keyof NotifPrefs) {
    const updated = { ...notifs, [key]: !notifs[key] }
    setNotifs(updated)
    setNotifPrefs(updated)
  }

  function handlePlanSelect(p: PlanTier, period: "weekly" | "monthly" | "yearly") {
    setSubModal({ plan: p, period })
  }

  const [checkoutLoading, setCheckoutLoading] = useState(false)

  async function handleStripeCheckout() {
    if (!subModal) return
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: subModal.plan,
          period: subModal.period,
          userId: user?.id || "",
          email: user?.email || profile.email || "",
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        showToast(data.error || "Failed to start checkout")
      }
    } catch {
      showToast("Failed to connect to Stripe")
    }
    setCheckoutLoading(false)
  }

  async function handleManageSubscription() {
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email || profile.email, userId: user?.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.error || "Failed to open portal")
    } catch {
      showToast("Failed to connect to Stripe")
    }
  }

  function handleConfirmAction() {
    if (confirmModal === "history") { clearHistory(); showToast("Scan history cleared") }
    else if (confirmModal === "closet") { localStorage.removeItem("flipt-closet"); showToast("Closet data cleared") }
    else if (confirmModal === "account") { localSignOut(); window.location.href = "/" }
    setConfirmModal(null)
  }

  async function handleSignOut() {
    await authSignOut()
    localSignOut()
    window.location.href = "/"
  }

  function copyRef() { navigator.clipboard.writeText(`${window.location.origin}/?ref=${refCode}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (!mounted) return null

  const joinDate = profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "April 2026"
  const initials = (profile.name || profile.email || "G").slice(0, 2).toUpperCase()

  return (
    <PageTransition>

      {/* Currency picker modal */}
      {showCurrencyPicker && (
        <div className="modal-overlay" onClick={() => setShowCurrencyPicker(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: "85vh", padding: 0, overflow: "hidden" }}>
            <CurrencySelector
              selected={currencyCode}
              onSelect={(code) => { setCurrencyCode(code) }}
              onDone={() => setShowCurrencyPicker(false)}
            />
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}

      {/* Subscription Modal */}
      {subModal && (
        <div className="modal-overlay" onClick={() => setSubModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSubModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}><X size={20} /></button>
            </div>
            <span className={`plan-badge ${subModal.plan}`} style={{ fontSize: "12px", padding: "4px 14px", marginBottom: "8px" }}>
              Flipt {subModal.plan === "pro" ? "Pro" : "Business"}
            </span>
            <h3 style={{ fontSize: "20px", margin: "8px 0" }}>
              {subModal.period === "weekly" && (subModal.plan === "pro" ? "$1.99/week" : "$4.99/week")}
              {subModal.period === "monthly" && (subModal.plan === "pro" ? "$5.99/month" : "$14.99/month")}
              {subModal.period === "yearly" && (subModal.plan === "pro" ? "$47.99/year" : "$119.99/year")}
            </h3>

            <div style={{ display: "flex", gap: "6px", justifyContent: "center", margin: "16px 0" }}>
              {(["weekly", "monthly", "yearly"] as const).map(p => (
                <button key={p} onClick={() => setSubModal({ ...subModal, period: p })} className={`mp-filter-chip ${subModal.period === p ? "active" : ""}`} style={{ fontSize: "12px", padding: "6px 14px" }}>
                  {p === "weekly" ? "Weekly" : p === "monthly" ? "Monthly" : "Yearly"}
                  {p === "yearly" && <span style={{ marginLeft: "4px", fontSize: "10px", fontWeight: 700, color: subModal.plan === "pro" ? "var(--green-accent)" : "var(--gold)" }}> Save 33%</span>}
                </button>
              ))}
            </div>

            <div style={{ background: "var(--surface-alt)", borderRadius: "12px", padding: "16px", margin: "16px 0", textAlign: "left" }}>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Secure payment via Stripe. Cancel anytime from your account settings. Billed in CAD.
              </p>
            </div>

            <button onClick={handleStripeCheckout} disabled={checkoutLoading} className="btn-primary" style={{ width: "100%", marginBottom: "8px" }}>
              {checkoutLoading ? "Redirecting to Stripe..." : `Subscribe to ${subModal.plan === "pro" ? "Pro" : "Business"}`}
            </button>
            <button onClick={() => setSubModal(null)} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-faint)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: "center" }}>
            <Trash2 size={32} style={{ color: confirmModal === "account" ? "var(--red)" : "var(--text-faint)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>
              {confirmModal === "history" ? "Clear Scan History?" : confirmModal === "closet" ? "Clear Closet Data?" : "Delete Account?"}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
              {confirmModal === "account"
                ? "This will permanently delete all your data including scan history, closet, watchlist, marketplace listings, and preferences. This cannot be undone."
                : "This action cannot be undone."}
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button onClick={handleConfirmAction} className={confirmModal === "account" ? "btn-sm danger" : "btn-sm primary"} style={{ padding: "10px 24px", fontSize: "14px" }}>
                {confirmModal === "account" ? "Delete Everything" : "Clear Data"}
              </button>
              <button onClick={() => setConfirmModal(null)} className="btn-sm ghost" style={{ padding: "10px 24px", fontSize: "14px" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px" }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>
          <h2 style={{ marginBottom: "24px" }}>Settings</h2>

          {/* ===== ACCOUNT ===== */}
          <div className="settings-section">
            <p className="settings-section-title">Account</p>
            <div className="settings-card">
              {/* Avatar + Name */}
              <div className="settings-row">
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-body)", flexShrink: 0 }}>
                  {initials}
                </div>
                <div className="settings-row-content">
                  {editName ? (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input value={nameVal} onChange={e => setNameVal(e.target.value)} onKeyDown={e => e.key === "Enter" && saveName()} className="biz-input" style={{ padding: "6px 12px", fontSize: "14px", borderRadius: "8px", flex: 1 }} autoFocus />
                      <button onClick={saveName} className="btn-sm primary" style={{ padding: "4px 10px" }}><Check size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setEditName(true)} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600, color: "var(--text)", cursor: "pointer", padding: 0, textAlign: "left" }}>
                      {profile.name || "Add your name"}
                    </button>
                  )}
                  <p className="settings-row-desc">{profile.email || (isGuest ? "Guest User" : "No email")}</p>
                </div>
                <span className={`plan-badge ${plan}`}>{plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Business"}</span>
              </div>
              <div className="settings-row">
                <div className="settings-row-icon"><Calendar size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Member since</p></div>
                <span className="settings-row-value">{joinDate}</span>
              </div>
              <div className="settings-row">
                <div className="settings-row-icon"><Hash size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Referral code</p></div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="settings-row-value" style={{ fontFamily: "monospace", fontSize: "13px" }}>{refCode}</span>
                  <button onClick={copyRef} className="btn-sm ghost" style={{ padding: "2px 8px", fontSize: "11px" }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              {isGuest ? (
                <div className="settings-row clickable" onClick={() => router.push("/signup")}>
                  <div className="settings-row-icon green"><LogOut size={16} /></div>
                  <div className="settings-row-content"><p className="settings-row-label" style={{ color: "var(--green-primary)" }}>Sign In or Create Account</p></div>
                  <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
                </div>
              ) : (
                <div className="settings-row clickable" onClick={handleSignOut}>
                  <div className="settings-row-icon red"><LogOut size={16} /></div>
                  <div className="settings-row-content"><p className="settings-row-label" style={{ color: "var(--red)" }}>Sign Out</p></div>
                </div>
              )}
            </div>
          </div>

          {/* ===== SUBSCRIPTION ===== */}
          <div className="settings-section">
            <p className="settings-section-title">Subscription</p>

            {plan === "free" && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div className="upgrade-card pro-card" style={{ flex: 1, minWidth: "200px" }}>
                  <Sparkles size={24} style={{ margin: "0 auto 8px", opacity: 0.8 }} />
                  <p style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: "4px" }}>Pro</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>$5.99<span style={{ fontSize: "14px", opacity: 0.7 }}>/mo</span></p>
                  <p style={{ fontSize: "12px", opacity: 0.7, marginBottom: "16px" }}>or $47.99/year (save 33%)</p>
                  <button onClick={() => handlePlanSelect("pro", "monthly")} style={{ width: "100%", padding: "10px", borderRadius: "50px", background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                    Upgrade to Pro
                  </button>
                </div>
                <div className="upgrade-card biz-card" style={{ flex: 1, minWidth: "200px" }}>
                  <Crown size={24} style={{ margin: "0 auto 8px", color: "var(--gold)" }} />
                  <p style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: "4px" }}>Business</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>$14.99<span style={{ fontSize: "14px", opacity: 0.7 }}>/mo</span></p>
                  <p style={{ fontSize: "12px", opacity: 0.7, marginBottom: "16px" }}>or $119.99/year (save 33%)</p>
                  <button onClick={() => handlePlanSelect("business", "monthly")} style={{ width: "100%", padding: "10px", borderRadius: "50px", background: "rgba(201,168,76,0.2)", color: "var(--gold)", border: "1px solid rgba(201,168,76,0.4)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                    Upgrade to Business
                  </button>
                </div>
              </div>
            )}

            {plan !== "free" && (
              <div className="settings-card" style={{ marginBottom: "16px" }}>
                <div className="settings-row">
                  <div className={`settings-row-icon ${plan === "pro" ? "green" : "gold"}`}><Crown size={16} /></div>
                  <div className="settings-row-content">
                    <p className="settings-row-label">Flipt {plan === "pro" ? "Pro" : "Business"}</p>
                    <p className="settings-row-desc">Monthly billing</p>
                  </div>
                  <button onClick={handleManageSubscription} className="btn-sm primary" style={{ fontSize: "11px", padding: "4px 10px" }}>Manage</button>
                </div>
              </div>
            )}

            <button onClick={() => showToast("Restore purchases coming soon")} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", marginBottom: "16px" }}>
              Restore Purchases
            </button>

            {/* Comparison table */}
            <div className="settings-card" style={{ padding: "16px", overflow: "auto" }}>
              <table className="plan-table">
                <thead><tr><th style={{ textAlign: "left" }}>Feature</th><th>Free</th><th style={{ color: "var(--green-primary)" }}>Pro</th><th style={{ color: "var(--gold)" }}>Biz</th></tr></thead>
                <tbody>
                  {PLAN_COMPARE.map((r, i) => (
                    <tr key={i}>
                      <td>{r.feature}</td>
                      <td>{typeof r.free === "string" ? r.free : r.free ? <Check size={14} style={{ color: "var(--green-primary)" }} /> : <X size={14} style={{ color: "var(--text-faint)", opacity: 0.4 }} />}</td>
                      <td>{typeof r.pro === "string" ? r.pro : r.pro ? <Check size={14} style={{ color: "var(--green-primary)" }} /> : <X size={14} style={{ color: "var(--text-faint)", opacity: 0.4 }} />}</td>
                      <td>{typeof r.biz === "string" ? r.biz : r.biz ? <Check size={14} style={{ color: "var(--gold)" }} /> : <X size={14} style={{ color: "var(--text-faint)", opacity: 0.4 }} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== NOTIFICATIONS ===== */}
          <div className="settings-section">
            <p className="settings-section-title">Notifications</p>
            <div className="settings-card">
              {([
                { key: "push" as const, label: "Push notifications", icon: Bell },
                { key: "weeklyReport" as const, label: "Weekly market report", icon: Mail },
                { key: "priceDrops" as const, label: "Price drop alerts", icon: Bell },
                { key: "newListings" as const, label: "New listings from followed sellers", icon: Bell },
                { key: "promo" as const, label: "Promotional emails", icon: BellOff },
              ]).map(({ key, label, icon: Icon }) => (
                <div key={key} className="settings-row">
                  <div className="settings-row-icon"><Icon size={16} /></div>
                  <div className="settings-row-content"><p className="settings-row-label">{label}</p></div>
                  <Toggle on={notifs[key]} onChange={() => handleNotifToggle(key)} />
                </div>
              ))}
            </div>
          </div>

          {/* ===== PREFERENCES ===== */}
          <div className="settings-section">
            <p className="settings-section-title">Preferences</p>
            <div className="settings-card">
              <div className="settings-row clickable" onClick={() => setShowCurrencyPicker(true)}>
                <div className="settings-row-icon" style={{ fontSize: "18px" }}>{currency.flag}</div>
                <div className="settings-row-content">
                  <p className="settings-row-label">Currency</p>
                  <p className="settings-row-desc">{currency.name} ({currency.code})</p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row">
                <div className="settings-row-icon"><Moon size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Dark mode</p></div>
                <Toggle on={theme === "dark"} onChange={toggleTheme} />
              </div>
              <div className="settings-row">
                <div className="settings-row-icon"><Globe size={16} /></div>
                <div className="settings-row-content">
                  <p className="settings-row-label">Language</p>
                  <p className="settings-row-desc">More languages coming soon</p>
                </div>
                <span className="settings-row-value">English</span>
              </div>
            </div>
          </div>

          {/* ===== PRIVACY ===== */}
          <div className="settings-section">
            <p className="settings-section-title">Privacy & Data</p>
            <div className="settings-card">
              <div className="settings-row clickable" onClick={() => showToast("Data export coming soon")}>
                <div className="settings-row-icon"><Download size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Download my data</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={() => setConfirmModal("history")}>
                <div className="settings-row-icon"><Trash2 size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Clear scan history</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={() => setConfirmModal("closet")}>
                <div className="settings-row-icon"><Trash2 size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Clear closet data</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={() => setConfirmModal("account")}>
                <div className="settings-row-icon red"><Trash2 size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label" style={{ color: "var(--red)" }}>Delete account</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={() => router.push("/privacy")}>
                <div className="settings-row-icon"><Shield size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Privacy Policy</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={() => router.push("/terms")}>
                <div className="settings-row-icon"><FileText size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Terms of Service</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
            </div>
          </div>

          {/* ===== SUPPORT ===== */}
          <div className="settings-section">
            <p className="settings-section-title">Support</p>
            <div className="settings-card">
              <div className="settings-row clickable" onClick={() => showToast("App Store rating coming soon")}>
                <div className="settings-row-icon green"><Star size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Rate Flipt</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={copyRef}>
                <div className="settings-row-icon green"><Share2 size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Share Flipt with a friend</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={() => window.open("mailto:support@flipt.app", "_blank")}>
                <div className="settings-row-icon"><Bug size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Report a bug</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={() => window.open("mailto:features@flipt.app", "_blank")}>
                <div className="settings-row-icon"><Lightbulb size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Request a feature</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="settings-row clickable" onClick={() => showToast("Help center coming soon")}>
                <div className="settings-row-icon"><HelpCircle size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Help center</p></div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
            </div>
          </div>

          {/* ===== ABOUT ===== */}
          <div className="settings-section">
            <p className="settings-section-title">About</p>
            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-row-icon"><Info size={16} /></div>
                <div className="settings-row-content"><p className="settings-row-label">Version</p></div>
                <span className="settings-row-value">1.0.0</span>
              </div>
              <div className="settings-row">
                <div className="settings-row-icon"><Info size={16} /></div>
                <div className="settings-row-content">
                  <p className="settings-row-label">Built with care in Ottawa, Canada</p>
                  <p className="settings-row-desc">&copy; 2026 Flipt. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </PageTransition>
  )
}
