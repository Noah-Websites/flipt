"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, UserMinus, Package } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import { getFollowing, unfollowSeller, getFeed, type FollowedSeller, type FeedPost } from "../lib/storage"

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function timeAgo(iso: string) {
  const hr = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (hr < 1) return "just now"
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export default function Following() {
  const router = useRouter()
  const [sellers, setSellers] = useState<(FollowedSeller & { posts: FeedPost[] })[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const following = getFollowing()
    const feed = getFeed()
    const enriched = following.map(s => ({ ...s, posts: feed.filter(p => p.userCode === s.code).slice(0, 3) }))
    setSellers(enriched)
    setMounted(true)
  }, [])

  function handleUnfollow(code: string) {
    unfollowSeller(code)
    setSellers(prev => prev.filter(s => s.code !== code))
  }

  if (!mounted) return null

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 20px" }}>
          <h2 style={{ marginBottom: "4px" }}>Following</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{sellers.length} seller{sellers.length !== 1 ? "s" : ""}</p>
        </div>

        {sellers.length === 0 ? (
          <div className="empty-state">
            <Users size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "15px", fontWeight: "600" }}>Not following anyone yet</p>
            <p style={{ fontSize: "13px", color: "var(--text-faint)" }}>Follow sellers from the feed to see their latest listings here.</p>
            <button onClick={() => router.push("/feed")} className="btn-sm primary" style={{ marginTop: "8px" }}>Browse Feed</button>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {sellers.map(seller => (
              <div key={seller.code} className="card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <button onClick={() => router.push(`/seller/${seller.code}`)} className="feed-avatar" style={{ cursor: "pointer", border: "none" }}>
                    {getInitials(seller.name)}
                  </button>
                  <div style={{ flex: 1 }}>
                    <button onClick={() => router.push(`/seller/${seller.code}`)} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", color: "var(--text)", cursor: "pointer", padding: 0 }}>
                      {seller.name}
                    </button>
                    <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>@{seller.code}</p>
                  </div>
                  <button onClick={() => handleUnfollow(seller.code)} className="btn-sm ghost" style={{ padding: "4px 10px", gap: "4px" }}>
                    <UserMinus size={12} /> Unfollow
                  </button>
                </div>

                {seller.posts.length > 0 ? (
                  <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                    {seller.posts.map(post => (
                      <div key={post.id} style={{ minWidth: "120px", background: "var(--bg)", borderRadius: "10px", padding: "10px", border: "1px solid var(--border-subtle)" }}>
                        <p style={{ fontSize: "12px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}>{post.title}</p>
                        <p className="gradient-text" style={{ fontSize: "14px", fontWeight: "800" }}>${post.value}</p>
                        <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{timeAgo(post.postedAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>No recent listings</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </PageTransition>
  )
}
