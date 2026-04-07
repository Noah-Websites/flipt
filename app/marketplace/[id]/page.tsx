"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AlertCircle, Heart, Share2, Bookmark, Mail, ArrowLeft, ExternalLink, UserPlus } from "lucide-react"
import { PageTransition, FadeUp } from "../../components/Motion"
import { useCurrency } from "../../components/CurrencyProvider"
import { useAuth } from "../../components/AuthProvider"
import { supabase } from "../../lib/supabase"
import { addToWatchlist } from "../../lib/db"
import { getProductImage } from "../../lib/images"

interface ListingDetail {
  id: string; item_name: string; brand?: string; condition?: string; category?: string;
  asking_price: number; estimated_value?: number; description?: string; image_url?: string;
  status?: string; created_at: string; user_id?: string;
  profiles?: { display_name?: string; referral_code?: string };
}

export default function MarketplaceListingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [related, setRelated] = useState<ListingDetail[]>([])

  useEffect(() => {
    async function load() {
      const id = params.id as string
      const { data } = await supabase
        .from("marketplace_listings")
        .select("*, profiles(display_name, referral_code)")
        .eq("id", id)
        .single()
      if (data) {
        setListing(data as ListingDetail)
        // Load related
        const { data: rel } = await supabase
          .from("marketplace_listings")
          .select("*, profiles(display_name, referral_code)")
          .neq("id", id)
          .eq("status", "active")
          .limit(4)
        setRelated((rel || []) as ListingDetail[])
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSave() {
    if (!listing || !user) return
    await addToWatchlist(user.id, listing.id, listing.asking_price)
    setSaved(true)
  }

  function handleShare() {
    if (!listing) return
    const text = `Check out ${listing.item_name} for ${formatPrice(listing.asking_price)} on Flipt!`
    if (navigator.share) {
      navigator.share({ title: listing.item_name, text, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  function handleContact() {
    if (!listing) return
    window.open(`mailto:?subject=Interested in ${listing.item_name}&body=Hi, I saw your listing for ${listing.item_name} (${formatPrice(listing.asking_price)}) on Flipt and I'm interested. Is it still available?`)
  }

  if (loading) {
    return <PageTransition><main style={{ minHeight: "100vh", padding: "32px 20px 120px" }}>
      <div className="skeleton" style={{ height: "300px", borderRadius: "14px", marginBottom: "16px" }} />
      <div className="skeleton" style={{ height: "120px", borderRadius: "14px" }} />
    </main></PageTransition>
  }

  if (!listing) {
    return (
      <PageTransition><main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
        <AlertCircle size={48} style={{ color: "var(--text-faint)" }} />
        <p style={{ fontSize: "18px", fontWeight: 700 }}>Listing not found</p>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>This listing may have been removed.</p>
        <button onClick={() => router.push("/marketplace")} className="btn-sm primary">Browse Marketplace</button>
      </main></PageTransition>
    )
  }

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        {/* Back button */}
        <button onClick={() => router.back()} style={{ position: "absolute", top: "16px", left: "16px", zIndex: 10, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)" }} aria-label="Go back">
          <ArrowLeft size={18} />
        </button>

        {/* Hero image */}
        <div className="listing-detail-hero">
          <img src={listing.image_url || getProductImage(listing.item_name, 0)} alt={listing.item_name} />
        </div>

        <div style={{ padding: "20px 20px 0", maxWidth: "520px", margin: "0 auto" }}>
          {/* Item info */}
          <FadeUp>
            {listing.brand && <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{listing.brand}</p>}
            <h2 style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2, marginBottom: "8px" }}>{listing.item_name}</h2>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "var(--green-accent)", marginBottom: "12px" }}>{formatPrice(listing.asking_price)}</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
              {listing.condition && <span className="platform-badge">{listing.condition}</span>}
              {listing.category && <span className="platform-badge">{listing.category}</span>}
              <span className="platform-badge">{new Date(listing.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </FadeUp>

          {/* Seller info */}
          <div className="listing-seller-card">
            <div className="feed-avatar">{(listing.profiles?.display_name || "S")[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>{listing.profiles?.display_name || "Seller"}</p>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Flipt seller</p>
            </div>
            {listing.user_id && listing.user_id !== user?.id && (
              <button onClick={() => router.push(`/seller/${listing.profiles?.referral_code || listing.user_id}`)} className="btn-sm ghost" style={{ padding: "6px 12px", fontSize: "11px" }}><UserPlus size={12} /> Follow</button>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--text-secondary)" }}>{listing.description}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", padding: "16px 0" }}>
            <button onClick={handleContact} className="btn-primary" style={{ flex: 1 }}><Mail size={16} /> Contact Seller</button>
            <button onClick={handleSave} className="btn-secondary" style={{ width: "52px", padding: 0, justifyContent: "center" }} disabled={saved} aria-label="Save to watchlist">
              <Bookmark size={18} fill={saved ? "var(--green-accent)" : "none"} style={{ color: saved ? "var(--green-accent)" : "var(--text-secondary)" }} />
            </button>
            <button onClick={handleShare} className="btn-secondary" style={{ width: "52px", padding: 0, justifyContent: "center" }} aria-label="Share listing">
              <Share2 size={18} />
            </button>
          </div>

          {/* Related items */}
          {related.length > 0 && (
            <div style={{ paddingTop: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Similar Items</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {related.map((item, idx) => (
                  <div key={item.id} className="photo-card" onClick={() => router.push(`/marketplace/${item.id}`)} style={{ cursor: "pointer" }}>
                    <img src={item.image_url || getProductImage(item.item_name, idx)} alt={item.item_name} className="photo-card-img" />
                    <div className="photo-card-body">
                      <p style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item_name}</p>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--green-accent)" }}>{formatPrice(item.asking_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  )
}
