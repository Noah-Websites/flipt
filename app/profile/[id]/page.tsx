"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { UserPlus, UserMinus, Share2, Package, Rss } from "lucide-react"
import { PageTransition } from "../../components/Motion"
import { useAuth } from "../../components/AuthProvider"
import { useCurrency } from "../../components/CurrencyProvider"
import { supabase } from "../../lib/supabase"
import { followUser, unfollowUser } from "../../lib/db"
import { getProductImage } from "../../lib/images"

interface Profile { id: string; display_name?: string; plan?: string; created_at?: string; avatar_color?: string }
interface ListingRow { id: string; item_name: string; asking_price: number; image_url?: string }
interface PostRow { id: string; item_name: string; image_url?: string }

export default function PublicProfile() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<ListingRow[]>([])
  const [posts, setPosts] = useState<PostRow[]>([])
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"listings" | "posts">("listings")

  useEffect(() => {
    async function load() {
      const uid = params.id as string
      const [{ data: p }, { data: l }, { data: f }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase.from("marketplace_listings").select("id, item_name, asking_price, image_url").eq("user_id", uid).eq("status", "active").limit(20),
        supabase.from("feed_posts").select("id, item_name, image_url").eq("user_id", uid).limit(30),
      ])
      setProfile(p as Profile)
      setListings((l || []) as ListingRow[])
      setPosts((f || []) as PostRow[])
      // Check if following
      if (user && user.id !== uid) {
        const { data: fw } = await supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", uid).single()
        setFollowing(!!fw)
      }
      setLoading(false)
    }
    load()
  }, [params.id, user])

  async function handleFollow() {
    if (!user) return
    const uid = params.id as string
    if (following) { await unfollowUser(user.id, uid); setFollowing(false) }
    else { await followUser(user.id, uid); setFollowing(true) }
  }

  if (loading) return <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
    <div className="skeleton" style={{ height: "200px", borderRadius: "14px" }} />
  </main></PageTransition>

  if (!profile) return <PageTransition><main className="empty-state" style={{ minHeight: "100vh" }}>
    <p style={{ fontSize: "16px", fontWeight: 600 }}>Profile not found</p>
    <button onClick={() => router.push("/")} className="btn-sm primary">Go Home</button>
  </main></PageTransition>

  const displayName = profile.display_name || "User"
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  const memberSince = profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""
  const isOwnProfile = user?.id === profile.id

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div className="profile-cover" />
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="profile-avatar" style={{ background: profile.avatar_color || "var(--green)" }}>{initials}</div>
          <p style={{ fontSize: "22px", fontWeight: 800, marginTop: "12px" }}>{displayName}</p>
          {memberSince && <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>Member since {memberSince}</p>}

          <div className="profile-stats" style={{ margin: "20px 0" }}>
            <div className="profile-stat"><p className="profile-stat-val">{listings.length}</p><p className="profile-stat-label">Listings</p></div>
            <div className="profile-stat"><p className="profile-stat-val">{posts.length}</p><p className="profile-stat-label">Posts</p></div>
          </div>

          {!isOwnProfile && (
            <button onClick={handleFollow} className={following ? "btn-secondary" : "btn-primary"} style={{ padding: "10px 28px", gap: "6px", marginBottom: "16px" }}>
              {following ? <><UserMinus size={16} /> Unfollow</> : <><UserPlus size={16} /> Follow</>}
            </button>
          )}
        </div>

        <div className="profile-tabs">
          <button className={`profile-tab ${tab === "listings" ? "active" : ""}`} onClick={() => setTab("listings")}>Listings</button>
          <button className={`profile-tab ${tab === "posts" ? "active" : ""}`} onClick={() => setTab("posts")}>Posts</button>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {tab === "listings" && (
            listings.length === 0 ? (
              <div className="empty-state"><Package size={24} style={{ color: "var(--text-faint)" }} /><p style={{ fontSize: "14px" }}>No listings</p></div>
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
              <div className="empty-state"><Rss size={24} style={{ color: "var(--text-faint)" }} /><p style={{ fontSize: "14px" }}>No posts</p></div>
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
