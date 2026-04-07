"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, SlideIn } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { useCurrency } from "../components/CurrencyProvider"
import { getMarketplaceListings as getDbListings } from "../lib/db"
import { getProductImage } from "../lib/images"

const CATEGORIES = ["All", "Electronics", "Clothing", "Furniture", "Sports", "Books", "Kitchen", "Toys", "Other"]
const CONDITIONS = ["All", "Like New", "Good", "Fair"]
const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low–High" },
  { key: "price-desc", label: "Price: High–Low" },
] as const
type SortKey = typeof SORTS[number]["key"]

interface Listing {
  id: string; item_name: string; brand?: string; condition?: string; category?: string;
  asking_price: number; estimated_value?: number; description?: string; image_url?: string;
  status?: string; created_at: string; user_id?: string;
  profiles?: { display_name?: string; referral_code?: string };
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

const PAGE_SIZE = 20

export default function Marketplace() {
  const router = useRouter()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const [allListings, setAllListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [condition, setCondition] = useState("All")
  const [sort, setSort] = useState<SortKey>("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await getDbListings(200)
      setAllListings((data || []) as Listing[])
      setLoading(false)
    }
    load()
    // Load recently viewed
    try {
      const rv = JSON.parse(localStorage.getItem("flipt-recently-viewed") || "[]")
      setRecentlyViewed(rv)
    } catch {}
  }, [])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(prev => prev + PAGE_SIZE)
    }, { threshold: 0.1 })
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [loading])

  const filtered = useMemo(() => {
    let items = [...allListings]
    if (category !== "All") items = items.filter(i => i.category === category)
    if (condition !== "All") items = items.filter(i => (i.condition || "").toLowerCase().includes(condition.toLowerCase()))
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i => i.item_name.toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q))
    }
    if (sort === "price-asc") items.sort((a, b) => a.asking_price - b.asking_price)
    else if (sort === "price-desc") items.sort((a, b) => b.asking_price - a.asking_price)
    else items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return items
  }, [allListings, search, category, condition, sort])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  function handleViewListing(listing: Listing) {
    // Save to recently viewed
    const rv = [listing.id, ...recentlyViewed.filter(id => id !== listing.id)].slice(0, 10)
    setRecentlyViewed(rv)
    localStorage.setItem("flipt-recently-viewed", JSON.stringify(rv))
    router.push(`/listing/${listing.id}`)
  }

  // Featured listings = newest 3
  const featured = allListings.slice(0, 3)

  if (loading) {
    return (
      <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
        <h2 style={{ marginBottom: "20px" }}>Marketplace</h2>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: "200px", marginBottom: "8px", borderRadius: "14px" }} />)}
      </main></PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 12px" }}>
          <h2 style={{ marginBottom: "14px" }}>Marketplace</h2>

          {/* Search */}
          <FadeUp delay={0.05}>
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
              <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="input search" />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </FadeUp>

          {/* Category chips */}
          <SlideIn direction="left">
            <div className="mp-filters" style={{ marginBottom: "8px" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`mp-filter-chip ${category === c ? "active" : ""}`}>{c}</button>
              ))}
            </div>
          </SlideIn>

          {/* Sort + filter toggle */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <div className="mp-filters" style={{ flex: 1 }}>
              {SORTS.map(s => (
                <button key={s.key} onClick={() => setSort(s.key)} className={`mp-filter-chip ${sort === s.key ? "active" : ""}`}>{s.label}</button>
              ))}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-sm ghost" style={{ padding: "6px 12px" }}>
              <SlidersHorizontal size={14} />
            </button>
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div style={{ padding: "10px 0" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Condition</p>
              <div style={{ display: "flex", gap: "6px" }}>
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => setCondition(c)} className={`mp-filter-chip ${condition === c ? "active" : ""}`}>{c}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Featured section */}
        {featured.length > 0 && !search && category === "All" && (
          <div style={{ padding: "0 20px 16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Featured</p>
            <div className="h-scroll" style={{ padding: 0, gap: "10px" }}>
              {featured.map((item, idx) => (
                <div key={item.id} onClick={() => handleViewListing(item)} style={{ minWidth: "220px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ aspectRatio: "16/10", overflow: "hidden" }}>
                    <img src={item.image_url || getProductImage(item.item_name, idx)} alt={item.item_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item_name}</p>
                    <p style={{ fontSize: "16px", fontWeight: 800, color: "var(--green-accent)" }}>{formatPrice(item.asking_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>{search ? "No results found" : "No listings yet"}</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{search ? "Try different keywords" : "Be the first to sell something"}</p>
            <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>Scan to List</button>
          </div>
        ) : (
          <div style={{ padding: "0 20px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</p>
            <div className="photo-grid">
              {visible.map((item, idx) => (
                <div key={item.id} className="photo-card" onClick={() => handleViewListing(item)} style={{ cursor: "pointer" }}>
                  <img src={item.image_url || getProductImage(item.item_name, idx)} alt={item.item_name} className="photo-card-img" />
                  <div className="photo-card-body">
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item_name}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--green-accent)" }}>{formatPrice(item.asking_price)}</p>
                      {item.condition && <span className="platform-badge">{item.condition}</span>}
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "3px" }}>
                      {item.profiles?.display_name || "Seller"} · {timeAgo(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Infinite scroll trigger */}
            {hasMore && <div ref={loaderRef} style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /></div>}
          </div>
        )}
      </main>
    </PageTransition>
  )
}
