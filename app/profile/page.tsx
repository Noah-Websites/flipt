"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Settings, Share2, Package, Rss, Edit3, LogIn, Camera, Users, UserMinus, Gift, Check } from "lucide-react"
import { PageTransition, FadeUp } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { useCurrency } from "../components/CurrencyProvider"
import { getProfile, updateProfile, getUserListings, getFeedPosts, getScans } from "../lib/db"
import { getProductImage } from "../lib/images"
import {
  getHistory, type ScanHistoryItem,
  getFollowing, unfollowSeller, getFeed, type FollowedSeller, type FeedPost,
  getReferralCode, getReferralCount, getBonusScans,
} from "../lib/storage"

interface DbProfile { display_name?: string; plan?: string; created_at?: string; avatar_color?: string }
interface ListingRow { id: string; item_name: string; asking_price: number; image_url?: string; created_at: string }
interface PostRow { id: string; item_name: string; selling_price?: number; image_url?: string; created_at: string }
interface ScanRow { id: string; item_name: string; estimated_value_low: number; estimated_value_high: number; best_platform?: string; image_url?: string; created_at: string; ai_response?: Record<string, unknown> }

type ProfileTab = "overview" | "history" | "following" | "referrals"

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

export default function MyProfile() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isGuest } = useAuth()
  const { formatPrice } = useCurrency()

  const initialTab = (searchParams.get("tab") as ProfileTab) || "overview"
  const [tab, setTab] = useState<ProfileTab>(initialTab)
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [listings, setListings] = useState<ListingRow[]>([])
  const [posts, setPosts] = useState<PostRow[]>([])
  const [scans, setScans] = useState<ScanRow[]>([])
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [loading, setLoading] = useState(true)

  // Following state (localStorage)
  const [sellers, setSellers] = useState<(FollowedSeller & { posts: FeedPost[] })[]>([])

  // Referral state (localStorage)
  const [refCode, setRefCode] = useState("")
  const [refCount, setRefCount] = useState(0)
  const [bonusScans, setBonusScans] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const [{ data: p }, { data: l }, { data: f }, { data: s }] = await Promise.all([
        getProfile(user.id),
        getUserListings(user.id),
        getFeedPosts(50),
        getScans(user.id),
      ])
      setProfile(p as DbProfile)
      setListings((l || []) as ListingRow[])
      setPosts(((f || []) as PostRow[]).filter(fp => (fp as unknown as { user_id?: string }).user_id === user.id))
      setScans((s || []) as ScanRow[])

      // Load localStorage data
      const following = getFollowing()
      const feed = getFeed()
      setSellers(following.map(sel => ({ ...sel, posts: feed.filter(fp => fp.userCode === sel.code).slice(0, 3) })))
      setRefCode(getReferralCode())
      setRefCount(getReferralCount())
      setBonusScans(getBonusScans())

      setLoading(false)
    }
    load()
  }, [user])

  // Sync tab from URL
  useEffect(() => {
    const t = searchParams.get("tab") as ProfileTab
    if (t && ["overview", "history", "following", "referrals"].includes(t)) setTab(t)
  }, [searchParams])

  async function handleSaveName() {
    if (!user || !editName.trim()) return
    await updateProfile(user.id, { display_name: editName.trim() })
    setProfile(prev => prev ? { ...prev, display_name: editName.trim() } : prev)
    setEditing(false)
  }

  function handleShare() {
    const url = `${window.location.origin}/profile/${user?.id}`
    if (navigator.share) navigator.share({ title: "My Flipt Profile", url }).catch(() => {})
    else navigator.clipboard.writeText(url)
  }

  function handleUnfollow(code: string) {
    unfollowSeller(code)
    setSellers(prev => prev.filter(s => s.code !== code))
  }

  function handleViewScan(item: ScanRow) {
    const result = item.ai_response || { item: item.item_name, valueLow: item.estimated_value_low, valueHigh: item.estimated_value_high, platform: item.best_platform || "", title: "", description: "" }
    sessionStorage.setItem("flipt-result", JSON.stringify(result))
    sessionStorage.setItem("flipt-result-id", item.id)
    if (item.image_url) sessionStorage.setItem("flipt-image", item.image_url)
    router.push("/results")
  }

  const refLink = typeof window !== "undefined" ? `${window.location.origin}/?ref=${refCode}` : ""

  if (isGuest) {
    return (
      <PageTransition><main className="empty-state" style={{ minHeight: "100vh" }}>
        <LogIn size={32} style={{ color: "var(--text-faint)" }} />
        <p style={{ fontSize: "16px", fontWeight: 600 }}>Sign in to see your profile</p>
        <button onClick={() => router.push("/signup")} className="btn-sm primary">Sign In</button>
      </main></PageTransition>
    )
  }

  if (loading) return <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
    <div className="skeleton" style={{ height: "200px", borderRadius: "14px", marginBottom: "16px" }} />
  </main></PageTransition>

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User"
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        {/* Cover */}
        <div className="profile-cover">
          <div style={{ position: "absolute", top: "16px", right: "16px", display: "flex", gap: "8px" }}>
            <button onClick={handleShare} style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)" }} aria-label="Share profile"><Share2 size={16} /></button>
            <button onClick={() => router.push("/settings")} style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)" }} aria-label="Settings"><Settings size={16} /></button>
          </div>
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="profile-avatar" style={{ background: profile?.avatar_color || "var(--green)" }}>{initials}</div>
          {editing ? (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSaveName()} className="input" style={{ width: "200px", textAlign: "center" }} autoFocus />
              <button onClick={handleSaveName} className="btn-sm primary">Save</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
              <p style={{ fontSize: "22px", fontWeight: 800 }}>{displayName}</p>
              <button onClick={() => { setEditName(displayName); setEditing(true) }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }} aria-label="Edit name"><Edit3 size={14} /></button>
            </div>
          )}
          {memberSince && <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>Member since {memberSince}</p>}
          {profile?.plan && profile.plan !== "free" && <span className={`plan-badge ${profile.plan}`} style={{ marginTop: "6px" }}>{profile.plan}</span>}
        </div>

        {/* Tabs */}
        <div className="profile-tabs" style={{ marginTop: "16px" }}>
          {(["overview", "history", "following", "referrals"] as const).map(t => (
            <button key={t} className={`profile-tab ${tab === t ? "active" : ""}`} onClick={() => { setTab(t); router.replace(`/profile?tab=${t}`, { scroll: false }) }}>
              {t === "overview" ? "Overview" : t === "history" ? "History" : t === "following" ? "Following" : "Referrals"}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        {tab === "overview" && (
          <div style={{ padding: "16px 20px" }}>
            <div className="profile-stats" style={{ marginBottom: "20px" }}>
              <div className="profile-stat"><p className="profile-stat-val">{listings.length}</p><p className="profile-stat-label">Listings</p></div>
              <div className="profile-stat"><p className="profile-stat-val">{scans.length}</p><p className="profile-stat-label">Scans</p></div>
              <div className="profile-stat"><p className="profile-stat-val">{sellers.length}</p><p className="profile-stat-label">Following</p></div>
            </div>
            {listings.length > 0 && (
              <>
                <p className="card-label" style={{ marginBottom: "8px" }}>Recent Listings</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  {listings.slice(0, 4).map((l, i) => (
                    <div key={l.id} className="photo-card" style={{ cursor: "pointer" }} onClick={() => router.push(`/marketplace/${l.id}`)}>
                      <img src={l.image_url || getProductImage(l.item_name, i)} alt={l.item_name} className="photo-card-img" />
                      <div className="photo-card-body">
                        <p style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.item_name}</p>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--gold)" }}>{formatPrice(l.asking_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {tab === "history" && (
          <div style={{ padding: "8px 0" }}>
            {scans.length === 0 ? (
              <div className="empty-state">
                <Camera size={32} style={{ color: "var(--text-faint)" }} />
                <p style={{ fontSize: "16px", fontWeight: 600 }}>No scans yet</p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Scan your first item to see it here</p>
                <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>Scan an Item</button>
              </div>
            ) : (
              scans.map(item => (
                <div key={item.id} className="history-card" onClick={() => handleViewScan(item)} style={{ cursor: "pointer" }}>
                  {item.image_url && (
                    <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
                      <img src={item.image_url} alt={item.item_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.3, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item_name}</p>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold)", marginBottom: "2px" }}>
                      {formatPrice(item.estimated_value_low)} – {formatPrice(item.estimated_value_high)}
                    </p>
                    {item.best_platform && <span className="platform-badge">{item.best_platform.split(/[,.—–]/)[0].trim()}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== FOLLOWING TAB ===== */}
        {tab === "following" && (
          <div style={{ padding: "16px 20px" }}>
            {sellers.length === 0 ? (
              <div className="empty-state">
                <Users size={32} style={{ color: "var(--text-faint)" }} />
                <p style={{ fontSize: "15px", fontWeight: 600 }}>Not following anyone yet</p>
                <p style={{ fontSize: "13px", color: "var(--text-faint)" }}>Follow sellers from the feed to see their latest listings here</p>
                <button onClick={() => router.push("/feed")} className="btn-sm primary" style={{ marginTop: "8px" }}>Browse Feed</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sellers.map(seller => (
                  <div key={seller.code} className="card" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button onClick={() => router.push(`/seller/${seller.code}`)} className="feed-avatar" style={{ cursor: "pointer", border: "none" }}>{getInitials(seller.name)}</button>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "15px", fontWeight: 700 }}>{seller.name}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>@{seller.code}</p>
                      </div>
                      <button onClick={() => handleUnfollow(seller.code)} className="btn-sm ghost" style={{ padding: "4px 10px", gap: "4px" }}>
                        <UserMinus size={12} /> Unfollow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== REFERRALS TAB ===== */}
        {tab === "referrals" && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <div className="stat-card highlight" style={{ flex: 1 }}>
                <p className="card-label" style={{ marginBottom: "4px" }}>Friends Referred</p>
                <p style={{ fontSize: "28px", fontWeight: 800 }}>{refCount}</p>
              </div>
              <div className="stat-card" style={{ flex: 1 }}>
                <p className="card-label" style={{ marginBottom: "4px" }}>Bonus Scans</p>
                <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--gold)" }}>{bonusScans}</p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: "16px" }}>
              <p className="card-label">Your Referral Link</p>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", wordBreak: "break-all", marginBottom: "14px" }}>
                {refLink}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="btn-sm primary" style={{ flex: 1 }}>
                  {copied ? <><Check size={14} /> Copied</> : "Copy Link"}
                </button>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out Flipt — it scans your stuff and tells you what it's worth! Get 5 free scans: ${refLink}`)}`, "_blank")} className="share-btn whatsapp" style={{ flex: 1, justifyContent: "center" }}>
                  Share on WhatsApp
                </button>
              </div>
            </div>

            <div className="card">
              <p className="card-label">How It Works</p>
              {[
                { step: "1", text: "Share your unique link with friends" },
                { step: "2", text: "They get 5 free scans when they sign up" },
                { step: "3", text: "You earn 3 bonus scans per referral" },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--gold-gradient)", color: "#060d0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, flexShrink: 0 }}>{step}</div>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
