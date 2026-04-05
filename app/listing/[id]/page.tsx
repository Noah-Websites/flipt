"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AlertCircle, Check } from "lucide-react"
import ThemeToggle from "../../components/ThemeToggle"
import { PageTransition } from "../../components/Motion"
import { getListing, isPro, type ListingItem } from "../../lib/storage"

export default function ListingPage() {
  const params = useParams()
  const [listing, setListing] = useState<ListingItem | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = params.id as string
    const found = getListing(id)
    setListing(found ?? null)
    setMounted(true)
  }, [params.id])

  if (!mounted) return null

  if (!listing) {
    return (
      <PageTransition>
        <ThemeToggle />
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
          <AlertCircle size={48} style={{ color: "var(--text-faint)" }} />
          <p style={{ fontSize: "18px", fontWeight: "700" }}>Listing not found</p>
          <p style={{ fontSize: "14px", color: "var(--text-faint)" }}>This listing may have expired or been removed.</p>
        </main>
      </PageTransition>
    )
  }

  const askingPrice = Math.round((listing.valueLow + listing.valueHigh) / 2)

  return (
    <PageTransition>
      <ThemeToggle />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "24px" }}>
        <div className="listing-card-preview">
          {listing.imageUrl && (
            <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: "14px", overflow: "hidden", marginBottom: "20px", border: "1px solid var(--border-subtle)" }}>
              <img src={listing.imageUrl} alt={listing.item} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px", lineHeight: 1.3 }}>
            {listing.title}
          </h2>

          <p className="gradient-text" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "12px" }}>
            ${askingPrice}
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <span className="platform-badge">{listing.condition}</span>
            <span className="platform-badge">{listing.platform.split(/[,.—–]/)[0].trim()}</span>
            {isPro() && <span className="pro-badge"><Check size={12} /> Verified Flipt Pro Seller</span>}
          </div>

          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text-muted)", marginBottom: "20px" }}>
            {listing.description}
          </p>

          <div style={{ padding: "16px", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <p className="card-label">Interested?</p>
            <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-muted)" }}>
              Contact seller to arrange pickup or delivery.
            </p>
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>
          Listed with Flipt
        </p>
      </main>
    </PageTransition>
  )
}
