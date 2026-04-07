"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Heart, Star, Link2, Check, Copy, ExternalLink, ShoppingCart, MapPin, ArrowRight, Shield, Search as SearchIcon, Tag, Clock, Award, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, Activity, Users, Rss, Pencil, X, Share2, Bookmark, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import PriceChart from "../components/PriceChart"
import CollapsibleSection from "../components/CollapsibleSection"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem, ScaleIn, CountUp } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import UpgradeModal, { LockedOverlay } from "../components/UpgradeModal"
import { useSubscription } from "../lib/useSubscription"
import { addClosetItem, createMarketplaceListing, createFeedPost } from "../lib/db"
import { addToCloset, isInCloset, getHistory, createListing, addMarketplaceListing, addFeedPost, type ScanHistoryItem } from "../lib/storage"

interface Comparable { title: string; platform: string; price: number; daysListed: number }
interface PricePoint { month: string; price: number }
interface BestTime { day: string; time: string; reason: string }
interface PlatformComp { platform: string; icon: string; avgPrice: number; priceLow: number; priceHigh: number; avgDaysToSell: number; difficulty: "Easy" | "Medium" | "Hard" }
interface DamageIssue { description: string; severity: "Minor" | "Moderate" | "Significant" }
interface DamageAnalysis { issues: DamageIssue[]; adjustedValueLow: number; adjustedValueHigh: number; hasDamage: boolean }
interface Brand { name: string; confidence: number; cues: string }
interface Authenticity { riskLevel: "Low" | "Medium" | "High"; isCommonlyCounterfeited: boolean; verificationTips: string[]; explanation: string }
interface Vintage { isVintage: boolean; isAntique: boolean; estimatedDecade: string | null; characteristics: string; premiumApplied: boolean; premiumPercentage: number }
interface Collectible { isCollectible: boolean; type: string | null; series: string | null; estimatedGrade: string | null; collectibleValueLow: number | null; collectibleValueHigh: number | null; recommendedPlatforms: string[] }
interface LivePrice { platform: string; avgPrice: number; trend: "up" | "down" | "flat"; activeListings: number }
interface Demand { level: number; category: "Low" | "Medium" | "High"; estimatedDaysToSell: number; activeBuyers: number; trend: "Rising" | "Stable" | "Falling"; trendReason: string }
interface LiveData { livePrices: LivePrice[]; bestPricePlatform: string; demand: Demand }

interface ItemResult {
  item: string; identificationConfidence?: number; valueLow: number; valueHigh: number; platform: string
  title: string; description: string
  quickSalePrice?: number; fairMarketPrice?: number; patientPrice?: number
  priceCurrency?: string; seasonalNote?: string; conditionNote?: string
  conditionAssessment?: string; confidenceReason?: string
  bestPlatform?: string; platformReason?: string
  ebayTitle?: string; ebayDescription?: string
  tips?: string[]; interestingFact?: string
  photoIssue?: string | null; detectedCategory?: string; category?: string
  priceHistory?: PricePoint[]; comparables?: Comparable[]; bestTimeToSell?: BestTime
  platformComparison?: PlatformComp[]
  brand?: Brand; damageAnalysis?: DamageAnalysis; authenticity?: Authenticity
  vintage?: Vintage; collectible?: Collectible
}

const DONATION_CENTRES = [
  { name: "Value Village Orleans", address: "2549 St Joseph Blvd, Orleans, ON K1C 1G1" },
  { name: "Salvation Army Ottawa", address: "171 George St, Ottawa, ON K1N 5W5" },
  { name: "Diabetes Canada Pickup", address: "Free home pickup — schedule online" },
]

const PLATFORM_URLS: Record<string, string> = {
  "Kijiji": "https://www.kijiji.ca", "Facebook Marketplace": "https://www.facebook.com/marketplace",
  "eBay": "https://www.ebay.com", "Poshmark": "https://poshmark.com", "Craigslist": "https://ottawa.craigslist.org",
}

type PriceTier = "quick" | "fair" | "patient"

export default function Results() {
  const router = useRouter()
  const { user } = useAuth()
  const { canAccess } = useSubscription(user?.id)
  const [upgradeModal, setUpgradeModal] = useState<{ feature: string; plan: "pro" | "business" } | null>(null)
  const [result, setResult] = useState<ItemResult | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [inCloset, setInCloset] = useState(false)
  const [scanId, setScanId] = useState<string | null>(null)
  const [listedOnMarket, setListedOnMarket] = useState(false)
  const [postedToFeed, setPostedToFeed] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editNameVal, setEditNameVal] = useState("")
  const [correcting, setCorrecting] = useState(false)
  const [correctionInput, setCorrectionInput] = useState("")
  const [showCorrectionBanner, setShowCorrectionBanner] = useState(true)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveTime, setLiveTime] = useState<string | null>(null)
  const [priceTier, setPriceTier] = useState<PriceTier>("fair")

  const fetchLivePrices = useCallback(async (itemName: string) => {
    setLiveLoading(true)
    try {
      const res = await fetch("/api/live-prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemName }) })
      const data = await res.json()
      if (!data.error) { setLiveData(data); setLiveTime("just now") }
    } catch { /* ignore */ }
    setLiveLoading(false)
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem("flipt-result")
    const storedImage = sessionStorage.getItem("flipt-image")
    const storedId = sessionStorage.getItem("flipt-result-id")
    if (!stored) { router.push("/scan"); return }
    setResult(JSON.parse(stored))
    if (storedImage) setImageUrl(storedImage)
    if (storedId) { setScanId(storedId); setInCloset(isInCloset(storedId)) }
  }, [router])

  function cp(text: string, label: string) {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(null), 2000)
  }

  async function handleAddToCloset() {
    if (!result) return
    if (scanId) { const h = getHistory().find((i: ScanHistoryItem) => i.id === scanId); if (h) { addToCloset(h); setInCloset(true) } }
    if (user) {
      const dbScanId = sessionStorage.getItem("flipt-db-scan-id")
      await addClosetItem(user.id, { scan_id: dbScanId || undefined, item_name: result.item, brand: result.brand?.name, condition: "Good", estimated_value: Math.round((result.valueLow + result.valueHigh) / 2), image_url: imageUrl || undefined, status: "storing" })
      setInCloset(true)
    }
  }

  async function handleListOnMarket() {
    if (!result) return
    addMarketplaceListing({ item: result.item, title: result.title, description: result.description, imageUrl, condition: "Good", askingPrice: Math.round((result.valueLow + result.valueHigh) / 2), aiValueLow: result.valueLow, aiValueHigh: result.valueHigh, platform: result.platform.split(/[,.—–]/)[0].trim(), category: "Other" })
    if (user) {
      const dbScanId = sessionStorage.getItem("flipt-db-scan-id")
      await createMarketplaceListing(user.id, { scan_id: dbScanId || undefined, item_name: result.item, brand: result.brand?.name, condition: "Good", category: "Other", asking_price: Math.round((result.valueLow + result.valueHigh) / 2), estimated_value: Math.round((result.valueLow + result.valueHigh) / 2), description: result.description, image_url: imageUrl || undefined })
    }
    setListedOnMarket(true)
  }

  async function handlePostToFeed() {
    if (!result) return
    addFeedPost({ item: result.item, title: result.title, imageUrl, value: Math.round((result.valueLow + result.valueHigh) / 2), platform: result.platform.split(/[,.—–]/)[0].trim(), category: "Other" })
    if (user) {
      const dbScanId = sessionStorage.getItem("flipt-db-scan-id")
      await createFeedPost(user.id, { scan_id: dbScanId || undefined, item_name: result.item, selling_price: Math.round((result.valueLow + result.valueHigh) / 2), platform: result.platform.split(/[,.—–]/)[0].trim(), image_url: imageUrl || undefined })
    }
    setPostedToFeed(true)
  }

  async function reanalyzeWithName(correctedName: string) {
    if (!correctedName.trim()) return
    setReanalyzing(true)
    try {
      const imageData = sessionStorage.getItem("flipt-scan-image-data")
      const mediaType = sessionStorage.getItem("flipt-scan-media-type") || "image/jpeg"
      if (imageData) {
        const res = await fetch("/api/identify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: imageData, mediaType, condition: "Good", correctedName }) })
        const data = await res.json()
        if (!data.error) { data.item = correctedName; setResult(data); sessionStorage.setItem("flipt-result", JSON.stringify(data)); setShowCorrectionBanner(false); setCorrecting(false); setEditingName(false) }
      }
    } catch { /* ignore */ }
    setReanalyzing(false)
  }

  function fullText() {
    if (!result) return ""
    return `${result.title}\n\n${result.description}\n\nAsking Price: $${Math.round((result.valueLow + result.valueHigh) / 2)}\nCondition: Good\n\nListed with Flipt`
  }

  function handleShare() {
    if (!result) return
    if (navigator.share) {
      navigator.share({ title: result.title, text: result.description, url: window.location.href }).catch(() => {})
    } else {
      cp(fullText(), "shared")
    }
  }

  if (!result) return <main style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}><span className="spinner" /></main>

  const hasDamage = result.damageAnalysis?.hasDamage
  const displayLow = hasDamage ? result.damageAnalysis!.adjustedValueLow : result.valueLow
  const displayHigh = hasDamage ? result.damageAnalysis!.adjustedValueHigh : result.valueHigh
  const isLowValue = result.valueHigh < 10
  const confidence = result.identificationConfidence || 0
  const confLevel = confidence >= 80 ? "High" : confidence >= 60 ? "Medium" : "Low"
  const confColor = confidence >= 80 ? "var(--green-accent)" : confidence >= 60 ? "#c9a84c" : "var(--red)"
  const tierPrice = priceTier === "quick" ? (result.quickSalePrice || displayLow) : priceTier === "patient" ? (result.patientPrice || displayHigh) : (result.fairMarketPrice || Math.round((displayLow + displayHigh) / 2))

  return (
    <PageTransition>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "0 0 120px" }}>

        {/* Confidence bar at very top */}
        {result.identificationConfidence != null && (
          <div style={{ width: "100%", padding: "8px 20px", display: "flex", alignItems: "center", gap: "8px", background: "var(--surface)" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: confColor, flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{confLevel} confidence {result.confidenceReason ? `— ${result.confidenceReason}` : ""}</span>
          </div>
        )}

        {/* Hero photo with item name overlay */}
        {imageUrl && (
          <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", position: "relative" }}>
            <img src={imageUrl} alt={result.item} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "60px 20px 20px", background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
              {result.brand && result.brand.name !== "Unknown Brand" && result.brand.name !== "Unknown" && (
                <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{result.brand.name}</p>
              )}
              <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1.2, fontFamily: "var(--font-heading)" }}>{result.item}</h2>
              {result.vintage?.isVintage && <span className="vintage-badge" style={{ marginTop: "6px" }}><Clock size={10} /> Vintage</span>}
            </div>
          </div>
        )}

        <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "12px", padding: "16px 16px 0" }}>

          {/* Price tier tabs */}
          <FadeUp>
            <div className="card value-card" style={{ padding: "20px" }}>
              <div className="price-tabs" style={{ marginBottom: "16px" }}>
                <button className={`price-tab ${priceTier === "quick" ? "active" : ""}`} onClick={() => setPriceTier("quick")}>Quick Sale</button>
                <button className={`price-tab ${priceTier === "fair" ? "active" : ""}`} onClick={() => setPriceTier("fair")}>Fair Market</button>
                <button className={`price-tab ${priceTier === "patient" ? "active" : ""}`} onClick={() => setPriceTier("patient")}>Patient Seller</button>
              </div>
              <AnimatePresence mode="wait">
                <motion.p key={priceTier} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} style={{ fontSize: "42px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--green-accent)", textAlign: "center" }}>
                  ${tierPrice}
                </motion.p>
              </AnimatePresence>
              {hasDamage && <p style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", marginTop: "4px" }}>Adjusted for condition</p>}
              {result.seasonalNote && <p style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center", marginTop: "8px" }}>{result.seasonalNote}</p>}
              {result.conditionNote && <p style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center", marginTop: "4px" }}>{result.conditionNote}</p>}
            </div>
          </FadeUp>

          {/* Correction banner */}
          {result.identificationConfidence != null && confidence < 80 && showCorrectionBanner && !correcting && (
            <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "14px", padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                <AlertTriangle size={16} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "2px" }} />
                <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.5 }}>Not sure? We&apos;re {confidence}% confident. Does this look right?</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShowCorrectionBanner(false)} className="btn-sm primary" style={{ fontSize: "12px" }}><Check size={12} /> Looks right</button>
                <button onClick={() => setCorrecting(true)} className="btn-sm ghost" style={{ fontSize: "12px" }}>Correct it</button>
              </div>
            </div>
          )}

          {correcting && (
            <div className="card">
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>What is this item?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={correctionInput} onChange={e => setCorrectionInput(e.target.value)} onKeyDown={e => e.key === "Enter" && reanalyzeWithName(correctionInput)} placeholder="e.g. Nike Air Max 90 Size 10" className="input" style={{ flex: 1 }} autoFocus />
                <button onClick={() => reanalyzeWithName(correctionInput)} disabled={reanalyzing || !correctionInput.trim()} className="btn-sm primary">{reanalyzing ? "..." : "Go"}</button>
              </div>
              <button onClick={() => setCorrecting(false)} style={{ background: "none", border: "none", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", marginTop: "6px", fontFamily: "var(--font-body)" }}>Cancel</button>
            </div>
          )}

          {/* Best platform */}
          {result.bestPlatform && result.platformReason && (
            <FadeUp delay={0.1}>
              <div style={{ background: "var(--green-light)", borderRadius: "16px", padding: "16px 20px", border: "1px solid rgba(82,183,136,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Star size={14} style={{ color: "var(--green-accent)" }} />
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Best Platform</p>
                </div>
                <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>{result.bestPlatform}</p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{result.platformReason}</p>
              </div>
            </FadeUp>
          )}

          {/* Platform comparison - horizontal scroll */}
          {result.platformComparison && result.platformComparison.length > 0 && (
            <FadeUp delay={0.15}>
              <p className="card-label" style={{ padding: "0 4px" }}>Sell Across Platforms</p>
              <div className="h-scroll" style={{ padding: "0", gap: "8px" }}>
                {result.platformComparison.map((pc, i) => (
                  <div key={i} style={{ minWidth: "160px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "14px", flexShrink: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{pc.platform}</p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--green-accent)" }}>${pc.avgPrice}</p>
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>~{pc.avgDaysToSell}d</span>
                      <span className={`difficulty-pill ${pc.difficulty.toLowerCase()}`}>{pc.difficulty}</span>
                    </div>
                    <a href={PLATFORM_URLS[pc.platform] || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 700, color: "var(--green-accent)", textDecoration: "none", marginTop: "8px" }}>Sell Here <ArrowRight size={10} /></a>
                  </div>
                ))}
              </div>
            </FadeUp>
          )}

          {/* Collapsible sections */}
          {result.damageAnalysis && (
            <CollapsibleSection icon={<SearchIcon size={16} />} title="Damage Analysis" badge={hasDamage ? <span className="severity-pill moderate">{result.damageAnalysis.issues.length} issue{result.damageAnalysis.issues.length !== 1 ? "s" : ""}</span> : <span className="difficulty-pill easy">Clean</span>} defaultOpen={!!hasDamage}>
              {!hasDamage ? <p style={{ fontSize: "13px", color: "var(--green-accent)", fontWeight: 600 }}>No visible damage detected.</p> : (
                result.damageAnalysis.issues.map((issue, i) => (
                  <div key={i} className="damage-item"><p style={{ fontSize: "13px", flex: 1 }}>{issue.description}</p><span className={`severity-pill ${issue.severity.toLowerCase()}`}>{issue.severity}</span></div>
                ))
              )}
            </CollapsibleSection>
          )}

          {result.authenticity && (
            <CollapsibleSection icon={<Shield size={16} />} title="Authenticity" badge={<span className={`risk-pill ${result.authenticity.riskLevel.toLowerCase()}`}>{result.authenticity.riskLevel} Risk</span>} defaultOpen={result.authenticity.riskLevel === "High"}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px", lineHeight: 1.5 }}>{result.authenticity.explanation}</p>
              {result.authenticity.verificationTips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", padding: "4px 0" }}><Check size={13} style={{ color: "var(--green-accent)", marginTop: "2px", flexShrink: 0 }} /><p style={{ fontSize: "12px", lineHeight: 1.4 }}>{tip}</p></div>
              ))}
            </CollapsibleSection>
          )}

          {result.vintage?.isVintage && (
            <CollapsibleSection icon={<Clock size={16} />} title="Vintage Analysis" badge={<span className="vintage-badge">{result.vintage.estimatedDecade || "Vintage"}</span>}>
              <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
                {result.vintage.estimatedDecade && <div><p style={{ fontSize: "10px", color: "var(--text-faint)", fontWeight: 600 }}>ERA</p><p style={{ fontSize: "18px", fontWeight: 800 }}>{result.vintage.estimatedDecade}</p></div>}
                {result.vintage.premiumApplied && <div><p style={{ fontSize: "10px", color: "var(--text-faint)", fontWeight: 600 }}>PREMIUM</p><p style={{ fontSize: "18px", fontWeight: 800, color: "var(--green-accent)" }}>+{result.vintage.premiumPercentage}%</p></div>}
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{result.vintage.characteristics}</p>
            </CollapsibleSection>
          )}

          {result.collectible?.isCollectible && (
            <CollapsibleSection icon={<Award size={16} />} title="Collectible" badge={<span className="platform-badge">{result.collectible.type}</span>} defaultOpen>
              {result.collectible.series && <p style={{ fontSize: "13px", marginBottom: "6px" }}><strong>Series:</strong> {result.collectible.series}</p>}
              {result.collectible.estimatedGrade && <p style={{ fontSize: "13px", marginBottom: "6px" }}><strong>Grade:</strong> {result.collectible.estimatedGrade}</p>}
              {result.collectible.collectibleValueLow != null && <p className="gradient-text" style={{ fontSize: "20px", fontWeight: 800 }}>${result.collectible.collectibleValueLow} – ${result.collectible.collectibleValueHigh}</p>}
            </CollapsibleSection>
          )}

          {/* Live Market + Demand (Pro gated) */}
          {!canAccess("live_prices") ? (
            <LockedOverlay label="Live prices, demand meter, and market intelligence" plan="pro" onClick={() => setUpgradeModal({ feature: "Live Market Prices", plan: "pro" })} />
          ) : (
            <>
              <CollapsibleSection icon={<Activity size={16} />} title="Live Market Prices" badge={liveData ? <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>Updated {liveTime}</span> : null} defaultOpen>
                {!liveData && !liveLoading && (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>See real-time prices across all platforms.</p>
                    <button onClick={() => fetchLivePrices(result.item)} className="btn-sm primary">Load Live Prices</button>
                  </div>
                )}
                {liveLoading && <div style={{ textAlign: "center", padding: "12px" }}><span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /><p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>Fetching...</p></div>}
                {liveData && liveData.livePrices.map((lp, i) => {
                  const isBest = lp.platform === liveData.bestPricePlatform
                  const TrendIcon = lp.trend === "up" ? TrendingUp : lp.trend === "down" ? TrendingDown : Minus
                  const trendColor = lp.trend === "up" ? "var(--green-accent)" : lp.trend === "down" ? "#d64545" : "var(--text-faint)"
                  return (
                    <div key={i} className={`live-price-row ${isBest ? "best" : ""}`}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700 }}>{lp.platform}{isBest && <span className="difficulty-pill easy" style={{ marginLeft: "6px", fontSize: "9px" }}>Best</span>}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{lp.activeListings} listings</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <TrendIcon size={12} style={{ color: trendColor }} />
                        <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--green-accent)" }}>${lp.avgPrice}</p>
                      </div>
                    </div>
                  )
                })}
              </CollapsibleSection>

              {liveData?.demand && (
                <CollapsibleSection icon={<Users size={16} />} title="Demand Meter" badge={<span className={`difficulty-pill ${liveData.demand.category.toLowerCase()}`}>{liveData.demand.category}</span>} defaultOpen>
                  <div style={{ marginBottom: "14px" }}>
                    <div className="demand-gauge"><div className="demand-needle" style={{ left: `${liveData.demand.level}%` }} /></div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "80px" }}><p style={{ fontSize: "10px", color: "var(--text-faint)", fontWeight: 600 }}>DAYS TO SELL</p><p style={{ fontSize: "18px", fontWeight: 800 }}>~{liveData.demand.estimatedDaysToSell}</p></div>
                    <div style={{ flex: 1, minWidth: "80px" }}><p style={{ fontSize: "10px", color: "var(--text-faint)", fontWeight: 600 }}>BUYERS</p><p style={{ fontSize: "18px", fontWeight: 800 }}>{liveData.demand.activeBuyers.toLocaleString()}</p></div>
                    <div style={{ flex: 1, minWidth: "80px" }}><p style={{ fontSize: "10px", color: "var(--text-faint)", fontWeight: 600 }}>TREND</p><p style={{ fontSize: "18px", fontWeight: 800, color: liveData.demand.trend === "Rising" ? "var(--green-accent)" : liveData.demand.trend === "Falling" ? "#d64545" : "var(--text)" }}>{liveData.demand.trend}</p></div>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{liveData.demand.trendReason}</p>
                </CollapsibleSection>
              )}
            </>
          )}

          {/* Tips */}
          {result.tips && result.tips.length > 0 && (
            <FadeUp delay={0.2}>
              <div className="card">
                <p className="card-label">Selling Tips</p>
                {result.tips.map((tip, i) => (
                  <p key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, padding: "3px 0", display: "flex", gap: "8px" }}>
                    <span style={{ color: "var(--green-accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span> {tip}
                  </p>
                ))}
              </div>
            </FadeUp>
          )}

          {/* Interesting fact */}
          {result.interestingFact && (
            <FadeUp delay={0.25}>
              <div style={{ background: "var(--green-light)", borderRadius: "14px", padding: "14px 18px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Did you know?</p>
                <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.5 }}>{result.interestingFact}</p>
              </div>
            </FadeUp>
          )}

          {/* Donation */}
          {isLowValue && (
            <div className="donation-card">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Heart size={16} style={{ color: "var(--text-secondary)" }} />
                <p style={{ fontSize: "14px", fontWeight: 700 }}>Consider donating</p>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>Items under $10 often cost more to ship than they sell for.</p>
              {DONATION_CENTRES.map((dc, i) => (
                <div key={i} className="donation-centre">
                  <div><p style={{ fontSize: "13px", fontWeight: 700 }}>{dc.name}</p><p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{dc.address}</p></div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dc.name + " " + dc.address)}`} target="_blank" rel="noopener noreferrer" className="btn-sm ghost" style={{ padding: "4px 10px", fontSize: "11px", textDecoration: "none" }}><MapPin size={10} /> Map</a>
                </div>
              ))}
            </div>
          )}

          {/* Price History */}
          {result.priceHistory && result.priceHistory.length > 0 && (
            <div className="chart-card"><p className="card-label" style={{ paddingLeft: "8px" }}>6-Month Price Trend</p><PriceChart data={result.priceHistory} /></div>
          )}

          {/* Listings - Facebook/Kijiji */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <p className="card-label" style={{ marginBottom: 0 }}>Facebook / Kijiji Listing</p>
              <button onClick={() => cp(`${result.title}\n\n${result.description}`, "short")} className={`btn-copy ${copied === "short" ? "copied" : ""}`}>{copied === "short" ? "Copied!" : "Copy"}</button>
            </div>
            <p style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.4, marginBottom: "6px" }}>{result.title}</p>
            <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--text-secondary)" }}>{result.description}</p>
          </div>

          {/* eBay Listing */}
          {(result.ebayTitle || result.ebayDescription) && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <p className="card-label" style={{ marginBottom: 0 }}>eBay Listing</p>
                <button onClick={() => cp(`${result.ebayTitle || result.title}\n\n${result.ebayDescription || result.description}`, "ebay")} className={`btn-copy ${copied === "ebay" ? "copied" : ""}`}>{copied === "ebay" ? "Copied!" : "Copy"}</button>
              </div>
              <p style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.4, marginBottom: "6px" }}>{result.ebayTitle || result.title}</p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--text-secondary)" }}>{result.ebayDescription || result.description}</p>
            </div>
          )}

          {/* AI Disclaimer */}
          <div className="ai-disclaimer">Price estimates are AI-generated and may vary. Always verify on your chosen platform before listing.</div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "8px 0" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              {!inCloset ? (
                <button onClick={handleAddToCloset} className="btn-primary" style={{ flex: 1 }}>Add to Closet</button>
              ) : (
                <button onClick={() => router.push("/closet")} className="btn-secondary" style={{ flex: 1, color: "var(--green-accent)" }}><Check size={14} /> In Closet</button>
              )}
              <button onClick={() => router.push("/scan")} className="btn-secondary" style={{ flex: 1 }}>Scan Another</button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {!listedOnMarket ? (
                <button onClick={handleListOnMarket} className="btn-sm ghost" style={{ flex: 1 }}><ShoppingCart size={14} /> List on Market</button>
              ) : (
                <button onClick={() => router.push("/marketplace")} className="btn-sm ghost" style={{ flex: 1, color: "var(--green-accent)" }}><Check size={14} /> Listed</button>
              )}
              {!postedToFeed ? (
                <button onClick={handlePostToFeed} className="btn-sm ghost" style={{ flex: 1 }}><Rss size={14} /> Post to Feed</button>
              ) : (
                <button onClick={() => router.push("/feed")} className="btn-sm ghost" style={{ flex: 1, color: "var(--green-accent)" }}><Check size={14} /> Posted</button>
              )}
              <button onClick={handleShare} className="btn-sm ghost"><Share2 size={14} /></button>
            </div>
          </div>
        </div>
      </main>
      {upgradeModal && <UpgradeModal feature={upgradeModal.feature} plan={upgradeModal.plan} onClose={() => setUpgradeModal(null)} />}
    </PageTransition>
  )
}
