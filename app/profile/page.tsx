"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Settings, Share2, Camera, Package, DollarSign, Users as UsersIcon, Rss, Edit3, LogIn } from "lucide-react"
import { PageTransition, FadeUp } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { useCurrency } from "../components/CurrencyProvider"
import { getProfile, updateProfile, getUserListings, getFeedPosts } from "../lib/db"
import { getProductImage } from "../lib/images"

interface Profile { display_name?: string; plan?: string; created_at?: string; avatar_color?: string }
interface ListingRow { id: string; item_name: string; asking_price: number; image_url?: string; created_at: string }
interface PostRow { id: string; item_name: string; selling_price?: number; image_url?: string; created_at: string }

type ProfileTab = "listings" | "posts" | "sold"

export default function MyProfile() {
  const router = useRouter()
  const { user, isGuest } = useAuth()
  const { formatPrice } = useCurrency()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<ListingRow[]>([])
  const [posts, setPosts] = useState<PostRow[]>([])
  const [tab, setTab] = useState<ProfileTab>("listings")
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const [{ data: p }, { data: l }, { data: f }] = await Promise.all([
        getProfile(user.id),
        getUserListings(user.id),
        getFeedPosts(50),
      ])
      setProfile(p as Profile)
      setListings((l || []) as ListingRow[])
      setPosts(((f || []) as PostRow[]).filter(fp => (fp as unknown as { user_id?: string }).user_id === user.id))
      setLoading(false)
    }
    load()
  }, [user])

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

          {/* Stats */}
          <div className="profile-stats" style={{ marginTop: "20px", marginBottom: "20px" }}>
            <div className="profile-stat">
              <p className="profile-stat-val">{listings.length}</p>
              <p className="profile-stat-label">Listings</p>
            </div>
            <div className="profile-stat">
              <p className="profile-stat-val">{posts.length}</p>
              <p className="profile-stat-label">Posts</p>
            </div>
            <div className="profile-stat">
              <p className="profile-stat-val">0</p>
              <p className="profile-stat-label">Followers</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${tab === "listings" ? "active" : ""}`} onClick={() => setTab("listings")}>Listings</button>
          <button className={`profile-tab ${tab === "posts" ? "active" : ""}`} onClick={() => setTab("posts")}>Posts</button>
        </div>

        {/* Tab content */}
        <div style={{ padding: "16px 20px" }}>
          {tab === "listings" && (
            listings.length === 0 ? (
              <div className="empty-state"><Package size={24} style={{ color: "var(--text-faint)" }} /><p style={{ fontSize: "14px", fontWeight: 600 }}>No listings yet</p></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {listings.map((l, i) => (
                  <div key={l.id} className="photo-card" style={{ cursor: "pointer" }} onClick={() => router.push(`/marketplace/${l.id}`)}>
                    <img src={l.image_url || getProductImage(l.item_name, i)} alt={l.item_name} className="photo-card-img" />
                    <div className="photo-card-body">
                      <p style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.item_name}</p>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--green-accent)" }}>{formatPrice(l.asking_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === "posts" && (
            posts.length === 0 ? (
              <div className="empty-state"><Rss size={24} style={{ color: "var(--text-faint)" }} /><p style={{ fontSize: "14px", fontWeight: 600 }}>No posts yet</p></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px" }}>
                {posts.map((p, i) => (
                  <div key={p.id} style={{ aspectRatio: "1", overflow: "hidden" }}>
                    <img src={p.image_url || getProductImage(p.item_name, i)} alt={p.item_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </PageTransition>
  )
}
