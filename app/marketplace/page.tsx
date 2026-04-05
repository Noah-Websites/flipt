"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, MessageCircle, Bookmark } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import ThemeToggle from "../components/ThemeToggle"
import { getMarketplaceListings, addToWatchlist, isWatchlisted, type MarketplaceListing, type MarketCategory } from "../lib/storage"

const CATEGORIES: ("All" | MarketCategory)[] = ["All", "Electronics", "Clothing", "Furniture", "Sports", "Books", "Other"]
const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low\u2013High" },
  { key: "price-desc", label: "Price: High\u2013Low" },
] as const
type SortKey = typeof SORTS[number]["key"]

import { getProductImage } from "../lib/images"

function getItemImage(item: MarketplaceListing): string {
  if (item.imageUrl) return item.imageUrl
  return getProductImage(item.item, parseInt(item.id.replace(/\D/g, "") || "0", 10))
}

function getPriceBadge(asking: number, low: number, high: number) {
  const mid = (low + high) / 2
  if (asking < mid * 0.9) return { label: "Below Market", cls: "below" }
  if (asking > mid * 1.1) return { label: "Above Market", cls: "above" }
  return { label: "Fair Price", cls: "fair" }
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

export default function Marketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<"All" | MarketCategory>("All")
  const [sort, setSort] = useState<SortKey>("newest")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setListings(getMarketplaceListings())
    setMounted(true)
  }, [])

  const filtered = useMemo(() => {
    let items = [...listings]
    if (category !== "All") items = items.filter(i => i.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i => i.title.toLowerCase().includes(q) || i.item.toLowerCase().includes(q))
    }
    if (sort === "price-asc") items.sort((a, b) => a.askingPrice - b.askingPrice)
    else if (sort === "price-desc") items.sort((a, b) => b.askingPrice - a.askingPrice)
    else items.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    return items
  }, [listings, search, category, sort])

  if (!mounted) return null

  return (
    <PageTransition>
      <ThemeToggle />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "20px" }}>
        <h2>Marketplace</h2>
        <p style={{ fontSize: "15px", color: "var(--text-muted)" }}>
          {listings.length} items for sale
        </p>

        <div style={{ position: "relative", width: "100%", maxWidth: "560px" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
          <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="mp-search" />
        </div>

        <div style={{ width: "100%", maxWidth: "560px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="mp-filters">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`mp-filter-chip ${category === c ? "active" : ""}`}>{c}</button>
            ))}
          </div>
          <div className="mp-filters">
            {SORTS.map(s => (
              <button key={s.key} onClick={() => setSort(s.key)} className={`mp-filter-chip ${sort === s.key ? "active" : ""}`}>{s.label}</button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-faint)", width: "100%", maxWidth: "560px" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={28} style={{ color: "var(--text-faint)" }} /></div>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>No items found</p>
            <p style={{ fontSize: "14px", color: "var(--text-faint)" }}>Try a different search or category.</p>
          </div>
        ) : (
          <div className="mp-grid" style={{ maxWidth: "560px" }}>
            {filtered.map((item, idx) => {
              const badge = getPriceBadge(item.askingPrice, item.aiValueLow, item.aiValueHigh)
              return (
                <div key={item.id} className="mp-card">
                  <div className="mp-card-img">
                    <img
                      src={getItemImage(item)}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  </div>
                  <div className="mp-card-body">
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "600", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span className="gradient-text" style={{ fontSize: "20px", fontWeight: "800" }}>${item.askingPrice}</span>
                      <span className={`mp-price-badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span className="platform-badge">{item.condition}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>
                        AI Value: ${item.aiValueLow}&ndash;${item.aiValueHigh}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>
                        @{item.sellerCode} &middot; {timeAgo(item.postedAt)}
                      </span>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <button
                          onClick={() => { addToWatchlist({ itemId: item.id, title: item.title, imageUrl: null, price: item.askingPrice, platform: item.platform }); setListings([...listings]) }}
                          className={`bookmark-btn ${isWatchlisted(item.id) ? "saved" : ""}`}
                          style={{ padding: "4px" }}
                        >
                          <Bookmark size={14} fill={isWatchlisted(item.id) ? "currentColor" : "none"} />
                        </button>
                        <a
                          href={`mailto:seller@flipt.app?subject=Interested in: ${encodeURIComponent(item.title)}&body=${encodeURIComponent(`Hi, I'm interested in "${item.title}" for $${item.askingPrice}. Is it still available?`)}`}
                          className="btn-sm primary"
                          style={{ padding: "4px 12px", fontSize: "11px", textDecoration: "none", gap: "4px" }}
                        >
                          <MessageCircle size={12} /> Message
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </PageTransition>
  )
}
