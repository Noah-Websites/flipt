"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Package, ShoppingBag, Rss, User, X, Clock, TrendingUp } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem } from "../components/Motion"
import { supabase } from "../lib/supabase"
import { useCurrency } from "../components/CurrencyProvider"

type ResultType = "all" | "listings" | "posts" | "users"
interface SearchResult { id: string; type: "listing" | "post" | "user"; title: string; subtitle?: string; price?: number; image_url?: string; created_at: string }

const TRENDING_SEARCHES = ["Nike", "KitchenAid", "Lululemon", "PS5", "iPhone", "Canada Goose", "Dyson", "LEGO"]
const SUGGESTIONS = ["shoes", "electronics", "furniture", "vintage", "kitchen", "sports", "clothing", "toys"]

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatPrice } = useCurrency()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<ResultType>("all")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try { setRecentSearches(JSON.parse(localStorage.getItem("flipt-recent-searches") || "[]")) } catch {}
    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const term = `%${q}%`

    const [{ data: listings }, { data: posts }, { data: users }] = await Promise.all([
      supabase.from("marketplace_listings").select("id, item_name, asking_price, image_url, created_at").ilike("item_name", term).eq("status", "active").limit(15),
      supabase.from("feed_posts").select("id, item_name, selling_price, image_url, created_at").ilike("item_name", term).limit(10),
      supabase.from("profiles").select("id, display_name, created_at").ilike("display_name", term).limit(5),
    ])

    const combined: SearchResult[] = [
      ...(listings || []).map(l => ({ id: l.id, type: "listing" as const, title: l.item_name, price: l.asking_price, image_url: l.image_url, created_at: l.created_at })),
      ...(posts || []).map(p => ({ id: p.id, type: "post" as const, title: p.item_name, price: p.selling_price, image_url: p.image_url, created_at: p.created_at })),
      ...(users || []).map(u => ({ id: u.id, type: "user" as const, title: u.display_name || "User", subtitle: "Flipt seller", created_at: u.created_at })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setResults(combined)
    setLoading(false)

    // Save to recent
    const recent = [q, ...recentSearches.filter(s => s !== q)].slice(0, 8)
    setRecentSearches(recent)
    localStorage.setItem("flipt-recent-searches", JSON.stringify(recent))
  }, [recentSearches])

  function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  function handleClickResult(r: SearchResult) {
    if (r.type === "listing") router.push(`/marketplace/${r.id}`)
    else if (r.type === "user") router.push(`/profile/${r.id}`)
  }

  function clearRecent() {
    setRecentSearches([])
    localStorage.removeItem("flipt-recent-searches")
  }

  const filtered = filter === "all" ? results : results.filter(r => {
    if (filter === "listings") return r.type === "listing"
    if (filter === "posts") return r.type === "post"
    if (filter === "users") return r.type === "user"
    return true
  })

  const typeIcon = (type: string) => {
    if (type === "listing") return <ShoppingBag size={14} style={{ color: "var(--green-accent)" }} />
    if (type === "post") return <Rss size={14} style={{ color: "var(--text-secondary)" }} />
    return <User size={14} style={{ color: "var(--text-secondary)" }} />
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 12px" }}>
          <h2 style={{ marginBottom: "14px" }}>Search</h2>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search items, listings, people..."
              value={query}
              onChange={e => handleInput(e.target.value)}
              className="input search"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]) }} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Type filter */}
        {results.length > 0 && (
          <div style={{ display: "flex", gap: "6px", padding: "4px 20px 12px" }}>
            {(["all", "listings", "posts", "users"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`mp-filter-chip ${filter === f ? "active" : ""}`} style={{ fontSize: "12px", padding: "4px 12px", textTransform: "capitalize" }}>{f}</button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: "20px" }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "56px", marginBottom: "8px", borderRadius: "12px" }} />)}
          </div>
        )}

        {/* No results */}
        {!loading && query && filtered.length === 0 && (
          <div className="empty-state">
            <Search size={28} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "15px", fontWeight: 600 }}>No results for &ldquo;{query}&rdquo;</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Try different keywords or check spelling</p>
          </div>
        )}

        {/* Results */}
        {filtered.length > 0 && (
          <div>
            {filtered.map(r => (
              <div key={`${r.type}-${r.id}`} onClick={() => handleClickResult(r)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.1s" }}>
                {r.image_url ? (
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
                    <img src={r.image_url} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: "44px", height: "44px", borderRadius: r.type === "user" ? "50%" : "10px", background: r.type === "user" ? "var(--green)" : "var(--surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--border)" }}>
                    {r.type === "user" ? <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>{r.title[0]?.toUpperCase()}</span> : typeIcon(r.type)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    {typeIcon(r.type)}
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "capitalize" }}>{r.type}</span>
                  </div>
                </div>
                {r.price != null && <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--green-accent)", flexShrink: 0 }}>{formatPrice(r.price)}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Empty state with suggestions */}
        {!query && (
          <div style={{ padding: "0 20px" }}>
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Searches</p>
                  <button onClick={clearRecent} style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: "11px", cursor: "pointer", fontFamily: "var(--font-body)" }}>Clear</button>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {recentSearches.map(s => (
                    <button key={s} onClick={() => { setQuery(s); doSearch(s) }} className="pill" style={{ padding: "4px 12px", fontSize: "12px", gap: "4px" }}>
                      <Clock size={10} /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Trending Searches</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {TRENDING_SEARCHES.map(s => (
                  <button key={s} onClick={() => { setQuery(s); doSearch(s) }} className="pill green" style={{ padding: "4px 12px", fontSize: "12px", gap: "4px" }}>
                    <TrendingUp size={10} /> {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Try searching */}
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "10px" }}>Try searching for:</p>
              <p style={{ fontSize: "13px", color: "var(--text-faint)" }}>{SUGGESTIONS.join(", ")}</p>
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
