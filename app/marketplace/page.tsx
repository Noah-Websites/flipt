"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, MessageCircle, Bookmark, ShoppingBag } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, SlideIn, ScaleIn } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { useCurrency } from "../components/CurrencyProvider"
import { getMarketplaceListings as getDbListings } from "../lib/db"
import { getProductImage } from "../lib/images"

const CATEGORIES = ["All", "Electronics", "Clothing", "Furniture", "Sports", "Books", "Other"]
const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low\u2013High" },
  { key: "price-desc", label: "Price: High\u2013Low" },
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

export default function Marketplace() {
  const router = useRouter()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [sort, setSort] = useState<SortKey>("newest")

  useEffect(() => {
    async function load() {
      const { data } = await getDbListings(100)
      setListings((data || []) as Listing[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let items = [...listings]
    if (category !== "All") items = items.filter(i => i.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i => i.item_name.toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q))
    }
    if (sort === "price-asc") items.sort((a, b) => a.asking_price - b.asking_price)
    else if (sort === "price-desc") items.sort((a, b) => b.asking_price - a.asking_price)
    else items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return items
  }, [listings, search, category, sort])

  if (loading) {
    return (
      <PageTransition>
        <main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
          <h2 style={{ marginBottom: "20px" }}>Marketplace</h2>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: "200px", marginBottom: "8px", borderRadius: "14px" }} />)}
        </main>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 16px" }}>
          <h2 style={{ marginBottom: "16px" }}>Marketplace</h2>

          <FadeUp delay={0.1}>
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
              <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="input search" />
            </div>
          </FadeUp>

          <SlideIn direction="left">
            <div className="mp-filters" style={{ marginBottom: "8px" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`mp-filter-chip ${category === c ? "active" : ""}`}>{c}</button>
              ))}
            </div>
          </SlideIn>
          <div className="mp-filters">
            {SORTS.map(s => (
              <button key={s.key} onClick={() => setSort(s.key)} className={`mp-filter-chip ${sort === s.key ? "active" : ""}`}>{s.label}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={32} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "16px", fontWeight: 600 }}>No listings yet</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Be the first to sell something</p>
            <button onClick={() => router.push("/scan")} className="btn-sm primary" style={{ marginTop: "8px" }}>Scan to List</button>
          </div>
        ) : (
          <div style={{ padding: "0 20px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</p>
            <StaggerContainer>
              <div className="photo-grid">
                {filtered.map((item, idx) => (
                  <StaggerItem key={item.id}>
                    <div className="photo-card">
                      <img
                        src={item.image_url || getProductImage(item.item_name, idx)}
                        alt={item.item_name}
                        className="photo-card-img"
                      />
                      <div className="photo-card-body">
                        <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.item_name}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--green-accent)" }}>{formatPrice(item.asking_price)}</p>
                          {item.condition && <span className="platform-badge">{item.condition}</span>}
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          {item.profiles?.display_name || "Seller"} · {timeAgo(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
