"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AlertCircle, Check, Share2, ArrowLeft } from "lucide-react"
import { PageTransition } from "../../components/Motion"
import { useCurrency } from "../../components/CurrencyProvider"
import { getListing, isPro, type ListingItem } from "../../lib/storage"
import { supabase } from "../../lib/supabase"
import { getProductImage } from "../../lib/images"

export default function ListingPage() {
  const params = useParams()
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const [listing, setListing] = useState<ListingItem | null>(null)
  const [dbListing, setDbListing] = useState<Record<string, unknown> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    async function load() {
      const id = params.id as string

      // Try Supabase first
      const { data } = await supabase
        .from("marketplace_listings")
        .select("*, profiles(display_name)")
        .eq("id", id)
        .single()

      if (data) {
        setDbListing(data as Record<string, unknown>)
      } else {
        // Fallback to localStorage
        const found = getListing(id)
        setListing(found ?? null)
      }
      setMounted(true)
    }
    load()
  }, [params.id])

  function handleShare() {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: "Check out this listing on Flipt", url }).catch(() => {})
    else navigator.clipboard.writeText(url)
  }

  if (!mounted) return null

  // Database listing
  if (dbListing) {
    const name = dbListing.item_name as string
    const price = dbListing.asking_price as number
    const desc = dbListing.description as string
    const img = (dbListing.image_url as string) || getProductImage(name, 0)
    const seller = (dbListing.profiles as Record<string, unknown>)?.display_name as string || "Seller"

    return (
      <PageTransition>
        <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
          <button onClick={() => router.back()} style={{ position: "absolute", top: "16px", left: "16px", zIndex: 10, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)" }} aria-label="Go back"><ArrowLeft size={18} /></button>
          <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
            <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ padding: "20px", maxWidth: "520px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2, marginBottom: "8px" }}>{name}</h2>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "var(--green-accent)", marginBottom: "12px" }}>{formatPrice(price)}</p>
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
              {typeof dbListing.condition === "string" && <span className="platform-badge">{dbListing.condition}</span>}
              {typeof dbListing.brand === "string" && <span className="platform-badge">{dbListing.brand}</span>}
            </div>
            <div className="listing-seller-card"><div className="feed-avatar">{seller[0]?.toUpperCase()}</div><div><p style={{ fontSize: "14px", fontWeight: 600 }}>{seller}</p><p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Flipt seller</p></div></div>
            {desc && <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--text-secondary)", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>{desc}</p>}
            <div style={{ display: "flex", gap: "10px", padding: "16px 0" }}>
              <button onClick={handleShare} className="btn-secondary" style={{ flex: 1 }}><Share2 size={16} /> Share</button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-faint)", textAlign: "center" }}>Listed with Flipt</p>
          </div>
        </main>
      </PageTransition>
    )
  }

  // localStorage fallback
  if (!listing) {
    return (
      <PageTransition>
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
          <AlertCircle size={48} style={{ color: "var(--text-faint)" }} />
          <p style={{ fontSize: "18px", fontWeight: 700 }}>Listing not found</p>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>This listing may have expired or been removed.</p>
          <button onClick={() => router.push("/marketplace")} className="btn-sm primary">Browse Marketplace</button>
        </main>
      </PageTransition>
    )
  }

  const askingPrice = Math.round((listing.valueLow + listing.valueHigh) / 2)
  return (
    <PageTransition>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "20px" }}>
        <div className="listing-card-preview">
          {listing.imageUrl && (
            <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
              <img src={listing.imageUrl} alt={listing.item} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px", lineHeight: 1.3 }}>{listing.title}</h2>
          <p className="gradient-text" style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px" }}>{formatPrice(askingPrice)}</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span className="platform-badge">{listing.condition}</span>
            <span className="platform-badge">{listing.platform.split(/[,.—–]/)[0].trim()}</span>
            {isPro() && <span className="pro-badge"><Check size={12} /> Flipt Pro</span>}
          </div>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "20px" }}>{listing.description}</p>
          <button onClick={handleShare} className="btn-secondary" style={{ width: "100%" }}><Share2 size={16} /> Share Listing</button>
        </div>
      </main>
    </PageTransition>
  )
}
