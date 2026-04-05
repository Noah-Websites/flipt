"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Rss, Heart, Package } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem } from "../components/Motion"
import { useCurrency } from "../components/CurrencyProvider"
import { getFeedPosts as getDbFeedPosts } from "../lib/db"
import { getProductImage } from "../lib/images"

interface FeedPost {
  id: string; item_name: string; selling_price?: number; platform?: string;
  image_url?: string; caption?: string; likes: number; created_at: string;
  profiles?: { display_name?: string; referral_code?: string };
}

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

export default function Feed() {
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await getDbFeedPosts(50)
      setPosts((data || []) as FeedPost[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <PageTransition>
        <main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
          <h2 style={{ marginBottom: "20px" }}>Feed</h2>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "300px", marginBottom: "12px", borderRadius: "14px" }} />)}
        </main>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 16px" }}>
          <h2>Feed</h2>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <Rss size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>No posts yet</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Share what you are selling</p>
            <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>Scan an Item</button>
          </div>
        ) : (
          <StaggerContainer>
            {posts.map((post, idx) => {
              const sellerName = post.profiles?.display_name || "User"
              return (
                <StaggerItem key={post.id}>
                  <div className="feed-post">
                    <div className="feed-header">
                      <div className="feed-avatar">{getInitials(sellerName)}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "14px", fontWeight: 600 }}>{sellerName}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{timeAgo(post.created_at)}</p>
                      </div>
                      {post.platform && <span className="platform-badge">{post.platform}</span>}
                    </div>

                    <img
                      src={post.image_url || getProductImage(post.item_name || "item", idx)}
                      alt={post.item_name}
                      className="feed-img"
                    />

                    <div className="feed-body">
                      <p style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{post.item_name}</p>
                      {post.selling_price != null && (
                        <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--green-accent)" }}>{formatPrice(post.selling_price)}</p>
                      )}
                      {post.caption && <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{post.caption}</p>}
                    </div>

                    <div className="feed-actions">
                      <button className="like-btn">
                        <Heart size={16} /> {post.likes || 0}
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        )}
      </main>
    </PageTransition>
  )
}
