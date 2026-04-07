"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Rss, Heart, Bookmark, Share2, Flag, MessageCircle } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem } from "../components/Motion"
import { useCurrency } from "../components/CurrencyProvider"
import { useAuth } from "../components/AuthProvider"
import { getFeedPosts as getDbFeedPosts, likeFeedPost } from "../lib/db"
import { getProductImage } from "../lib/images"

interface FeedPost {
  id: string; item_name: string; selling_price?: number; platform?: string;
  image_url?: string; caption?: string; likes: number; created_at: string;
  user_id?: string;
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

type FeedTab = "foryou" | "following"

export default function Feed() {
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const { user } = useAuth()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FeedTab>("foryou")
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(10)
  const [refreshing, setRefreshing] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async () => {
    const { data } = await getDbFeedPosts(100)
    setPosts((data || []) as FeedPost[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  // Load liked/saved from localStorage
  useEffect(() => {
    try {
      const liked = JSON.parse(localStorage.getItem("flipt-liked-posts") || "[]")
      setLikedPosts(new Set(liked))
      const saved = JSON.parse(localStorage.getItem("flipt-saved-posts") || "[]")
      setSavedPosts(new Set(saved))
    } catch {}
  }, [])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(prev => prev + 10)
    }, { threshold: 0.1 })
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [loading])

  async function handleLike(postId: string) {
    const isLiked = likedPosts.has(postId)
    const next = new Set(likedPosts)
    if (isLiked) next.delete(postId)
    else next.add(postId)
    setLikedPosts(next)
    localStorage.setItem("flipt-liked-posts", JSON.stringify([...next]))

    // Update in-memory count
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + (isLiked ? -1 : 1) } : p))
    // Persist to Supabase
    if (!isLiked) await likeFeedPost(postId)
  }

  function handleSave(postId: string) {
    const next = new Set(savedPosts)
    if (next.has(postId)) next.delete(postId)
    else next.add(postId)
    setSavedPosts(next)
    localStorage.setItem("flipt-saved-posts", JSON.stringify([...next]))
  }

  function handleShare(post: FeedPost) {
    const text = `${post.item_name} - ${post.selling_price ? formatPrice(post.selling_price) : ""} on Flipt`
    if (navigator.share) navigator.share({ title: post.item_name, text }).catch(() => {})
    else navigator.clipboard.writeText(text)
  }

  async function handleRefresh() {
    setRefreshing(true)
    setVisibleCount(10)
    await loadPosts()
  }

  // Filter by tab (Following would need follows data from Supabase)
  const filteredPosts = posts // In For You, show all. Following filter would go here.
  const visible = filteredPosts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredPosts.length

  if (loading) {
    return (
      <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
        <h2 style={{ marginBottom: "20px" }}>Feed</h2>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "320px", marginBottom: "12px", borderRadius: "14px" }} />)}
      </main></PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 0" }}>
          <h2 style={{ marginBottom: "4px" }}>Feed</h2>
        </div>

        {/* Tabs */}
        <div className="feed-tab-bar">
          <button className={`feed-tab ${tab === "foryou" ? "active" : ""}`} onClick={() => setTab("foryou")}>For You</button>
          <button className={`feed-tab ${tab === "following" ? "active" : ""}`} onClick={() => setTab("following")}>Following</button>
        </div>

        {/* Pull to refresh */}
        {refreshing && (
          <div style={{ padding: "12px 0", textAlign: "center" }}>
            <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
          </div>
        )}

        {/* Refresh button */}
        {!refreshing && posts.length > 0 && (
          <div style={{ padding: "8px 20px", textAlign: "center" }}>
            <button onClick={handleRefresh} className="btn-sm ghost" style={{ fontSize: "11px", padding: "4px 14px" }}>Refresh Feed</button>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="empty-state">
            <Rss size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>No posts yet</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Share what you&apos;re selling with the community</p>
            <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>Scan an Item</button>
          </div>
        ) : (
          <>
            {visible.map((post, idx) => {
              const sellerName = post.profiles?.display_name || "User"
              const isLiked = likedPosts.has(post.id)
              const isSaved = savedPosts.has(post.id)
              return (
                <div key={post.id} className="feed-post">
                  <div className="feed-header">
                    <div className="feed-avatar" onClick={() => post.profiles?.referral_code && router.push(`/seller/${post.profiles.referral_code}`)} style={{ cursor: "pointer" }}>
                      {getInitials(sellerName)}
                    </div>
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
                    loading="lazy"
                  />

                  <div className="feed-body">
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{post.item_name}</p>
                    {post.selling_price != null && (
                      <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--green-accent)" }}>{formatPrice(post.selling_price)}</p>
                    )}
                    {post.caption && <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{post.caption}</p>}
                  </div>

                  <div className="feed-actions-row">
                    <button onClick={() => handleLike(post.id)} className={`like-btn ${isLiked ? "liked" : ""}`} aria-label={isLiked ? "Unlike" : "Like"}>
                      <Heart size={16} fill={isLiked ? "currentColor" : "none"} /> {post.likes || 0}
                    </button>
                    <button className="like-btn" aria-label="Comments">
                      <MessageCircle size={16} /> 0
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => handleSave(post.id)} className={`bookmark-btn ${isSaved ? "saved" : ""}`} aria-label={isSaved ? "Unsave" : "Save"}>
                      <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => handleShare(post)} className="bookmark-btn" aria-label="Share">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
            {hasMore && <div ref={loaderRef} style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /></div>}
          </>
        )}
      </main>
    </PageTransition>
  )
}
