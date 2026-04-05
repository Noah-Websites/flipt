"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Heart, Bookmark, Package } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import ThemeToggle from "../components/ThemeToggle"
import { getFeed, toggleFeedLike, addToWatchlist, isWatchlisted, type FeedPost, type FeedCategory } from "../lib/storage"

const CATS: ("All" | FeedCategory)[] = ["All", "Electronics", "Clothing", "Furniture", "Sports", "Collectibles"]

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

import { getProductImage } from "../lib/images"

function getItemImg(item: string, index: number = 0) {
  return getProductImage(item, index)
}

export default function Feed() {
  const router = useRouter()
  const [feed, setFeed] = useState<FeedPost[]>([])
  const [cat, setCat] = useState<"All" | FeedCategory>("All")
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setFeed(getFeed()); setMounted(true) }, [])

  function handleLike(id: string) {
    toggleFeedLike(id)
    setFeed(getFeed())
  }

  function handleBookmark(post: FeedPost) {
    addToWatchlist({ itemId: post.id, title: post.title, imageUrl: post.imageUrl, price: post.value, platform: post.platform })
    setFeed([...feed]) // re-render
  }

  const filtered = useMemo(() => {
    if (cat === "All") return feed
    return feed.filter(p => p.category === cat)
  }, [feed, cat])

  if (!mounted) return null

  return (
    <PageTransition>
      <ThemeToggle />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MapPin size={16} style={{ color: "var(--green-accent)" }} />
          <h2 style={{ fontSize: "28px" }}>New listings near you</h2>
        </div>
        <p style={{ fontSize: "14px", color: "var(--text-faint)" }}>Ottawa, ON</p>

        <div className="mp-filters" style={{ justifyContent: "center" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`mp-filter-chip ${cat === c ? "active" : ""}`}>{c}</button>
          ))}
        </div>

        <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {filtered.map(post => {
            const watched = isWatchlisted(post.id)
            return (
              <div key={post.id} className="feed-post">
                <div className="feed-header">
                  <button onClick={() => router.push(`/seller/${post.userCode}`)} className="feed-avatar" style={{ cursor: "pointer", border: "none" }}>
                    {getInitials(post.userName)}
                  </button>
                  <div style={{ flex: 1 }}>
                    <button onClick={() => router.push(`/seller/${post.userCode}`)} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: "14px", fontWeight: "700", color: "var(--text)", cursor: "pointer", padding: 0, textAlign: "left" }}>
                      {post.userName}
                    </button>
                    <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>{timeAgo(post.postedAt)}</p>
                  </div>
                  <span className="platform-badge">{post.platform}</span>
                </div>

                <div className="feed-img">
                  {post.imageUrl
                    ? <img src={post.imageUrl} alt={post.title} />
                    : <img src={getItemImg(post.item)} alt={post.title} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                  }
                  {!post.imageUrl && <Package size={32} style={{ color: "var(--text-faint)", position: "absolute" }} />}
                </div>

                <div className="feed-body">
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>{post.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="gradient-text" style={{ fontSize: "20px", fontWeight: "800" }}>${post.value}</span>
                    <span className="platform-badge">{post.category}</span>
                  </div>
                </div>

                <div className="feed-actions">
                  <button onClick={() => handleLike(post.id)} className={`like-btn ${post.liked ? "liked" : ""}`}>
                    <Heart size={16} fill={post.liked ? "currentColor" : "none"} /> {post.likes}
                  </button>
                  <button onClick={() => handleBookmark(post)} className={`bookmark-btn ${watched ? "saved" : ""}`}>
                    <Bookmark size={16} fill={watched ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </PageTransition>
  )
}
