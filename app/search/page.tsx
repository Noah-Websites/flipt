"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Package } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem } from "../components/Motion"
import { supabase } from "../lib/supabase"
import { useCurrency } from "../components/CurrencyProvider"

interface SearchResult { id: string; type: "listing" | "scan"; title: string; price?: number; created_at: string }

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatPrice } = useCurrency()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const term = `%${q}%`

    const [{ data: listings }, { data: scans }] = await Promise.all([
      supabase.from("marketplace_listings").select("id, item_name, asking_price, created_at").ilike("item_name", term).limit(10),
      supabase.from("scans").select("id, item_name, estimated_value_low, created_at").ilike("item_name", term).limit(10),
    ])

    const combined: SearchResult[] = [
      ...(listings || []).map(l => ({ id: l.id, type: "listing" as const, title: l.item_name, price: l.asking_price, created_at: l.created_at })),
      ...(scans || []).map(s => ({ id: s.id, type: "scan" as const, title: s.item_name, price: s.estimated_value_low, created_at: s.created_at })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setResults(combined)
    setLoading(false)
  }

  useEffect(() => { if (query) doSearch(query) }, []) // eslint-disable-line

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 16px" }}>
          <h2 style={{ marginBottom: "16px" }}>Search</h2>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input
              type="text" placeholder="Search items, listings..."
              value={query}
              onChange={e => { setQuery(e.target.value); doSearch(e.target.value) }}
              className="input search"
              autoFocus
            />
          </div>
        </div>

        {loading && (
          <div style={{ padding: "20px" }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "56px", marginBottom: "8px", borderRadius: "12px" }} />)}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="empty-state">
            <Search size={28} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "15px", fontWeight: 600 }}>No results for &ldquo;{query}&rdquo;</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Try a different search term</p>
          </div>
        )}

        {results.length > 0 && (
          <StaggerContainer>
            {results.map(r => (
              <StaggerItem key={`${r.type}-${r.id}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer", minHeight: "56px" }}>
                  <Package size={16} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                    <span className="platform-badge">{r.type === "listing" ? "Listing" : "Scan"}</span>
                  </div>
                  {r.price && <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--green-accent)" }}>{formatPrice(r.price)}</p>}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {!query && (
          <div className="empty-state">
            <Search size={28} style={{ color: "var(--text-faint)" }} />
            <p style={{ fontSize: "15px", fontWeight: 600 }}>Search across Flipt</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Find marketplace listings and scan history</p>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
