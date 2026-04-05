"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { UserPlus, UserMinus, Clock, Star, Zap, Package } from "lucide-react"
import { PageTransition } from "../../components/Motion"
import { getFeed, isFollowing, followSeller, unfollowSeller, type FeedPost } from "../../lib/storage"

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

import { getProductImage } from "../../lib/images"

function getItemImg(item: string, index: number = 0) {
  return getProductImage(item, index)
}

export default function SellerProfile() {
  const params = useParams()
  const code = params.id as string
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [following, setFollowing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const all = getFeed().filter(p => p.userCode === code)
    setPosts(all)
    setFollowing(isFollowing(code))
    setMounted(true)
  }, [code])

  const seller = useMemo(() => {
    if (!posts.length) return null
    return { name: posts[0].userName, code }
  }, [posts, code])

  function handleFollow() {
    if (!seller) return
    if (following) { unfollowSeller(code); setFollowing(false) }
    else { followSeller(code, seller.name); setFollowing(true) }
  }

  if (!mounted) return null

  const totalValue = posts.reduce((s, p) => s + p.value, 0)
  const earnBadge = totalValue >= 1000 ? "$1,000+ earned" : totalValue >= 500 ? "$500+ earned" : totalValue >= 100 ? "$100+ earned" : "New seller"

  return (
    <PageTransition>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <div className="seller-avatar-lg">
            {seller ? getInitials(seller.name) : "??"}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "22px", fontWeight: "800" }}>{seller?.name || "Unknown Seller"}</p>
            <p style={{ fontSize: "13px", color: "var(--text-faint)" }}>@{code}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <div className="stat-card" style={{ minWidth: "100px" }}>
            <Package size={16} style={{ color: "var(--text-faint)", margin: "0 auto 4px" }} />
            <p style={{ fontSize: "20px", fontWeight: "800" }}>{posts.length}</p>
            <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>Items</p>
          </div>
          <div className="stat-card highlight" style={{ minWidth: "100px" }}>
            <Star size={16} style={{ color: "var(--green-accent)", margin: "0 auto 4px" }} />
            <p className="gradient-text" style={{ fontSize: "14px", fontWeight: "800" }}>{earnBadge}</p>
            <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>Est. Sales</p>
          </div>
          <div className="stat-card" style={{ minWidth: "100px" }}>
            <Zap size={16} style={{ color: "var(--text-faint)", margin: "0 auto 4px" }} />
            <p style={{ fontSize: "20px", fontWeight: "800" }}>&lt;2h</p>
            <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>Avg Reply</p>
          </div>
        </div>

        <button onClick={handleFollow} className={following ? "btn-secondary" : "btn-primary"} style={{ padding: "12px 32px", gap: "8px" }}>
          {following ? <><UserMinus size={16} /> Unfollow</> : <><UserPlus size={16} /> Follow</>}
        </button>

        {/* Listings grid */}
        {posts.length > 0 && (
          <div style={{ width: "100%", maxWidth: "480px" }}>
            <p className="card-label" style={{ marginBottom: "10px" }}>Active Listings</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
              {posts.map(post => (
                <div key={post.id} className="card" style={{ padding: "0", overflow: "hidden" }}>
                  <div style={{ aspectRatio: "1", background: "var(--bg)", overflow: "hidden" }}>
                    <img src={post.imageUrl || getItemImg(post.item)} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                  </div>
                  <div style={{ padding: "10px" }}>
                    <p style={{ fontSize: "12px", fontWeight: "700", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                    <p className="gradient-text" style={{ fontSize: "15px", fontWeight: "800", marginTop: "2px" }}>${post.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {posts.length === 0 && (
          <div className="empty-state">
            <Package size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "15px", fontWeight: "600" }}>No listings found</p>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
