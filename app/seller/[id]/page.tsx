"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { UserPlus, UserMinus, Clock, Star, Package, Share2 } from "lucide-react"
import { PageTransition } from "../../components/Motion"
import { useAuth } from "../../components/AuthProvider"
import { useCurrency } from "../../components/CurrencyProvider"
import { supabase } from "../../lib/supabase"
import { followUser, unfollowUser } from "../../lib/db"
import { getProductImage } from "../../lib/images"
import { getFeed, isFollowing as isFollowingLocal, followSeller, unfollowSeller, type FeedPost } from "../../lib/storage"

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

interface SellerProfile {
  id?: string; display_name?: string; plan?: string; created_at?: string;
}
interface ListingRow { id: string; item_name: string; asking_price: number; image_url?: string }

export default function SellerProfile() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const code = params.id as string
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [listings, setListings] = useState<ListingRow[]>([])
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  // Fallback to localStorage data
  const [localPosts, setLocalPosts] = useState<FeedPost[]>([])

  useEffect(() => {
    async function load() {
      // Try Supabase first (code could be a user ID or referral code)
      let profileData: SellerProfile | null = null
      let listingData: ListingRow[] = []

      // Try by referral code
      const { data: byCode } = await supabase.from("profiles").select("*").eq("referral_code", code).single()
      if (byCode) {
        profileData = byCode as SellerProfile
        const { data: l } = await supabase.from("marketplace_listings").select("id, item_name, asking_price, image_url").eq("user_id", byCode.id).eq("status", "active").limit(20)
        listingData = (l || []) as ListingRow[]
      } else {
        // Try by user ID
        const { data: byId } = await supabase.from("profiles").select("*").eq("id", code).single()
        if (byId) {
          profileData = byId as SellerProfile
          const { data: l } = await supabase.from("marketplace_listings").select("id, item_name, asking_price, image_url").eq("user_id", code).eq("status", "active").limit(20)
          listingData = (l || []) as ListingRow[]
        }
      }

      setProfile(profileData)
      setListings(listingData)

      // Check follow status
      if (user && profileData?.id) {
        const { data: fw } = await supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", profileData.id).single()
        setFollowing(!!fw)
      } else {
        setFollowing(isFollowingLocal(code))
      }

      // Fallback to localStorage
      if (!profileData) {
        const all = getFeed().filter(p => p.userCode === code)
        setLocalPosts(all)
      }

      setLoading(false)
    }
    load()
  }, [code, user])

  async function handleFollow() {
    if (profile?.id && user) {
      if (following) { await unfollowUser(user.id, profile.id); setFollowing(false) }
      else { await followUser(user.id, profile.id); setFollowing(true) }
    } else {
      if (following) { unfollowSeller(code); setFollowing(false) }
      else { followSeller(code, profile?.display_name || localPosts[0]?.userName || "User"); setFollowing(true) }
    }
  }

  if (loading) return <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
    <div className="skeleton" style={{ height: "200px", borderRadius: "14px" }} />
  </main></PageTransition>

  const sellerName = profile?.display_name || localPosts[0]?.userName || "Seller"
  const itemCount = listings.length || localPosts.length
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null

  return (
    <PageTransition>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div className="seller-avatar-lg">{getInitials(sellerName)}</div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "22px", fontWeight: 800 }}>{sellerName}</p>
            {memberSince && <p style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "2px" }}>Member since {memberSince}</p>}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <div className="stat-card" style={{ minWidth: "90px" }}>
            <Package size={16} style={{ color: "var(--text-faint)", margin: "0 auto 4px" }} />
            <p style={{ fontSize: "20px", fontWeight: 800 }}>{itemCount}</p>
            <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>Items</p>
          </div>
          <div className="stat-card" style={{ minWidth: "90px" }}>
            <Clock size={16} style={{ color: "var(--text-faint)", margin: "0 auto 4px" }} />
            <p style={{ fontSize: "20px", fontWeight: 800 }}>&lt;2h</p>
            <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>Avg Reply</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleFollow} className={following ? "btn-secondary" : "btn-primary"} style={{ padding: "10px 28px", gap: "6px" }}>
            {following ? <><UserMinus size={16} /> Unfollow</> : <><UserPlus size={16} /> Follow</>}
          </button>
          <button onClick={() => { if (navigator.share) navigator.share({ title: `${sellerName} on Flipt`, url: window.location.href }); else navigator.clipboard.writeText(window.location.href) }} className="btn-secondary" style={{ width: "48px", padding: 0, justifyContent: "center" }} aria-label="Share profile"><Share2 size={16} /></button>
        </div>

        {/* Listings */}
        {listings.length > 0 && (
          <div style={{ width: "100%", maxWidth: "480px" }}>
            <p className="card-label" style={{ marginBottom: "10px" }}>Active Listings</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {listings.map((l, i) => (
                <div key={l.id} className="photo-card" style={{ cursor: "pointer" }} onClick={() => router.push(`/marketplace/${l.id}`)}>
                  <img src={l.image_url || getProductImage(l.item_name, i)} alt={l.item_name} className="photo-card-img" />
                  <div className="photo-card-body">
                    <p style={{ fontSize: "12px", fontWeight: 700, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.item_name}</p>
                    <p style={{ fontSize: "15px", fontWeight: 800, color: "var(--green-accent)", marginTop: "2px" }}>{formatPrice(l.asking_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback to localStorage posts */}
        {localPosts.length > 0 && listings.length === 0 && (
          <div style={{ width: "100%", maxWidth: "480px" }}>
            <p className="card-label" style={{ marginBottom: "10px" }}>Items</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {localPosts.map((post, i) => (
                <div key={post.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ aspectRatio: "1", background: "var(--bg)", overflow: "hidden" }}>
                    <img src={post.imageUrl || getProductImage(post.item, i)} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "10px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                    <p style={{ fontSize: "15px", fontWeight: 800, color: "var(--green-accent)", marginTop: "2px" }}>{formatPrice(post.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {itemCount === 0 && (
          <div className="empty-state">
            <Package size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "15px", fontWeight: 600 }}>No listings yet</p>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
