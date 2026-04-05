"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Heart, Star, Link2, Check, Copy, ExternalLink, ShoppingCart, MapPin, ArrowRight, Shield, Search as SearchIcon, Tag, Clock, Award, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, Activity, Users, Rss, Pencil, X } from "lucide-react"
import PriceChart from "../components/PriceChart"
import CollapsibleSection from "../components/CollapsibleSection"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
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

export default function Results() {
  const router = useRouter()
  const { user } = useAuth()
  const { plan, canAccess, requiredPlan } = useSubscription(user?.id)
  const [upgradeModal, setUpgradeModal] = useState<{ feature: string; plan: "pro" | "business" } | null>(null)
  const [result, setResult] = useState<ItemResult | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [inCloset, setInCloset] = useState(false)
  const [scanId, setScanId] = useState<string | null>(null)
  const [listingUrl, setListingUrl] = useState<string | null>(null)
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

  const fetchLivePrices = useCallback(async (itemName: string) => {
    setLiveLoading(true)
    try {
      const res = await fetch("/api/live-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName }),
      })
      const data = await res.json()
      if (!data.error) {
        setLiveData(data)
        setLiveTime("just now")
      }
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
    // Save to localStorage
    if (scanId) {
      const h = getHistory().find((i: ScanHistoryItem) => i.id === scanId)
      if (h) { addToCloset(h); setInCloset(true) }
    }
    // Save to Supabase
    if (user) {
      const dbScanId = sessionStorage.getItem("flipt-db-scan-id")
      await addClosetItem(user.id, {
        scan_id: dbScanId || undefined,
        item_name: result.item,
        brand: result.brand?.name,
        condition: "Good",
        estimated_value: Math.round((result.valueLow + result.valueHigh) / 2),
        image_url: imageUrl || undefined,
        status: "storing",
      })
      setInCloset(true)
    }
  }

  function handleShareListing() {
    if (!scanId || !result) return
    const h = getHistory().find((i: ScanHistoryItem) => i.id === scanId)
    if (!h) return
    setListingUrl(`${window.location.origin}/listing/${createListing(h, "Good").id}`)
  }

  async function handleListOnMarket() {
    if (!result) return
    // localStorage fallback
    addMarketplaceListing({ item: result.item, title: result.title, description: result.description, imageUrl, condition: "Good", askingPrice: Math.round((result.valueLow + result.valueHigh) / 2), aiValueLow: result.valueLow, aiValueHigh: result.valueHigh, platform: result.platform.split(/[,.—–]/)[0].trim(), category: "Other" })
    // Supabase
    if (user) {
      const dbScanId = sessionStorage.getItem("flipt-db-scan-id")
      await createMarketplaceListing(user.id, {
        scan_id: dbScanId || undefined,
        item_name: result.item,
        brand: result.brand?.name,
        condition: "Good",
        category: "Other",
        asking_price: Math.round((result.valueLow + result.valueHigh) / 2),
        estimated_value: Math.round((result.valueLow + result.valueHigh) / 2),
        description: result.description,
        image_url: imageUrl || undefined,
      })
    }
    setListedOnMarket(true)
  }

  async function reanalyzeWithName(correctedName: string) {
    if (!correctedName.trim()) return
    setReanalyzing(true)
    try {
      const imageData = sessionStorage.getItem("flipt-scan-image-data")
      const mediaType = sessionStorage.getItem("flipt-scan-media-type") || "image/jpeg"
      if (imageData) {
        const res = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageData, mediaType, condition: "Good", correctedName }),
        })
        const data = await res.json()
        if (!data.error) {
          data.item = correctedName
          setResult(data)
          sessionStorage.setItem("flipt-result", JSON.stringify(data))
          setShowCorrectionBanner(false)
          setCorrecting(false)
          setEditingName(false)
        }
      }
    } catch { /* ignore */ }
    setReanalyzing(false)
  }

  function handleSaveEditName() {
    if (editNameVal.trim() && result) {
      reanalyzeWithName(editNameVal.trim())
    }
  }

  function handleSubmitCorrection() {
    if (correctionInput.trim()) {
      reanalyzeWithName(correctionInput.trim())
    }
  }

  function fullText() {
    if (!result) return ""
    return `${result.title}\n\n${result.description}\n\nAsking Price: $${Math.round((result.valueLow + result.valueHigh) / 2)}\nCondition: Good\n\nListed with Flipt`
  }

  if (!result) return <main style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}><span className="spinner" style={{ borderColor: "var(--border)", borderTopColor: "var(--green-accent)" }} /></main>

  const isLowValue = result.valueHigh < 10
  const hasDamage = result.damageAnalysis?.hasDamage
  const displayLow = hasDamage ? result.damageAnalysis!.adjustedValueLow : result.valueLow
  const displayHigh = hasDamage ? result.damageAnalysis!.adjustedValueHigh : result.valueHigh

  return (
    <PageTransition>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "14px" }}>
        <FadeUp>
          <p className="card-label" style={{ marginBottom: "0", textAlign: "center" }}>Scan Results</p>
        </FadeUp>

        {imageUrl && (
          <FadeUp delay={0.1}>
          <div style={{ width: "100%", maxWidth: "400px", aspectRatio: "4/3", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
            <img src={imageUrl} alt="Scanned item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          </FadeUp>
        )}

        <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Brand */}
          {result.brand && result.brand.name !== "Unknown" && (
            <div className="card" style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "32px", marginBottom: "4px" }}>{result.brand.name}</h2>
              <div className="brand-confidence">
                <Tag size={12} /> {result.brand.confidence}% confident
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 }}>{result.brand.cues}</p>
            </div>
          )}

          {/* Item with edit */}
          <div className="card">
            <p className="card-label">Item</p>
            {editingName ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  value={editNameVal}
                  onChange={e => setEditNameVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveEditName()}
                  className="input"
                  style={{ flex: 1, fontSize: "16px", fontWeight: 600 }}
                  autoFocus
                />
                <button onClick={handleSaveEditName} disabled={reanalyzing} className="btn-sm primary" style={{ flexShrink: 0 }}>
                  {reanalyzing ? <span className="spinner" style={{ width: "14px", height: "14px", margin: 0 }} /> : <Check size={14} />}
                </button>
                <button onClick={() => setEditingName(false)} className="btn-sm ghost" style={{ flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h3 style={{ lineHeight: 1.3 }}>{result.item}</h3>
                <button
                  onClick={() => { setEditNameVal(result.item); setEditingName(true) }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px" }}
                  title="Edit item name"
                >
                  <Pencil size={14} />
                </button>
                {result.vintage?.isVintage && <span className="vintage-badge"><Clock size={10} /> Vintage</span>}
                {result.vintage?.isAntique && <span className="vintage-badge"><Clock size={10} /> Antique</span>}
              </div>
            )}
          </div>

          {/* Confidence banner */}
          {result.identificationConfidence != null && result.identificationConfidence < 80 && showCorrectionBanner && !correcting && (
            <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "14px", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                <AlertTriangle size={18} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "2px" }} />
                <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.5 }}>
                  We&apos;re not 100% sure this is correct ({result.identificationConfidence}% confident). Does this look right?
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShowCorrectionBanner(false)} className="btn-sm primary" style={{ fontSize: "13px" }}>
                  <Check size={14} /> Yes, this is correct
                </button>
                <button onClick={() => setCorrecting(true)} className="btn-sm ghost" style={{ fontSize: "13px" }}>
                  No, let me correct it
                </button>
              </div>
            </div>
          )}

          {/* Correction input */}
          {correcting && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px 20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>What is this item?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={correctionInput}
                  onChange={e => setCorrectionInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmitCorrection()}
                  placeholder="e.g. Nike Air Max 90 Size 10"
                  className="input"
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button onClick={handleSubmitCorrection} disabled={reanalyzing || !correctionInput.trim()} className="btn-sm primary" style={{ flexShrink: 0 }}>
                  {reanalyzing ? <span className="spinner" style={{ width: "14px", height: "14px", margin: 0 }} /> : "Re-analyze"}
                </button>
              </div>
              <button onClick={() => setCorrecting(false)} style={{ background: "none", border: "none", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", marginTop: "8px", fontFamily: "var(--font-body)" }}>
                Cancel
              </button>
            </div>
          )}

          {/* Value */}
          <div className="card value-card">
            <p className="card-label">Estimated Resale Value</p>
            {hasDamage ? (
              <div>
                <span className="price-original" style={{ fontSize: "18px" }}>${result.valueLow} – ${result.valueHigh}</span>
                <p className="gradient-text" style={{ fontSize: "34px", fontWeight: "800" }}>${displayLow} – ${displayHigh}</p>
                <p style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "4px" }}>Adjusted for visible damage</p>
              </div>
            ) : (
              <p className="gradient-text" style={{ fontSize: "34px", fontWeight: "800" }}>${displayLow} – ${displayHigh}</p>
            )}
            {result.vintage?.premiumApplied && (
              <p style={{ fontSize: "12px", color: "var(--green-accent)", fontWeight: "600", marginTop: "4px" }}>
                Includes {result.vintage.premiumPercentage}% vintage premium
              </p>
            )}
          </div>

          <div className="ai-disclaimer">
            Price estimates are generated by AI analysis of current market trends and may vary. Always verify prices on your chosen platform before listing. Flipt does not guarantee the accuracy of any valuation.
          </div>

          {/* Gated Pro sections */}
          {!canAccess("live_prices") ? (
            <LockedOverlay label="Live prices, demand meter, damage detection, and more" plan="pro" onClick={() => setUpgradeModal({ feature: "Live Market Prices", plan: "pro" })} />
          ) : (<>

          {/* Live Market Prices */}
          <CollapsibleSection
            icon={<Activity size={16} />}
            title="Live Market Prices"
            badge={liveData ? <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>Updated {liveTime}</span> : null}
            defaultOpen
          >
            {!liveData && !liveLoading && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>See what this item is selling for right now across all platforms.</p>
                <button onClick={() => fetchLivePrices(result.item)} className="btn-sm primary">Load Live Prices</button>
              </div>
            )}
            {liveLoading && (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <span className="spinner" style={{ borderColor: "var(--border)", borderTopColor: "var(--green-accent)", width: "16px", height: "16px", borderWidth: "2px" }} />
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>Fetching live prices...</p>
              </div>
            )}
            {liveData && (
              <>
                {liveData.livePrices.map((lp, i) => {
                  const isBest = lp.platform === liveData.bestPricePlatform
                  const TrendIcon = lp.trend === "up" ? TrendingUp : lp.trend === "down" ? TrendingDown : Minus
                  const trendColor = lp.trend === "up" ? "var(--green-accent)" : lp.trend === "down" ? "#d64545" : "var(--text-faint)"
                  return (
                    <div key={i} className={`live-price-row ${isBest ? "best" : ""}`}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <p style={{ fontSize: "14px", fontWeight: "700" }}>{lp.platform}</p>
                          {isBest && <span className="difficulty-pill easy" style={{ fontSize: "10px", padding: "1px 8px" }}>Best Price</span>}
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>{lp.activeListings} active listings</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <TrendIcon size={14} style={{ color: trendColor }} />
                        <p className="gradient-text" style={{ fontSize: "18px", fontWeight: "800" }}>${lp.avgPrice}</p>
                      </div>
                    </div>
                  )
                })}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button onClick={() => fetchLivePrices(result.item)} className="btn-sm ghost" style={{ padding: "4px 12px", fontSize: "11px", gap: "4px" }} disabled={liveLoading}>
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              </>
            )}
          </CollapsibleSection>

          {/* Demand Meter */}
          {liveData?.demand && (
            <CollapsibleSection icon={<Users size={16} />} title="Demand Meter" badge={<span className={`difficulty-pill ${liveData.demand.category.toLowerCase()}`}>{liveData.demand.category}</span>} defaultOpen>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-faint)" }}>Low</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-faint)" }}>High</span>
                </div>
                <div className="demand-gauge">
                  <div className="demand-needle" style={{ left: `${liveData.demand.level}%` }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                <div style={{ flex: 1, minWidth: "100px" }}>
                  <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>DAYS TO SELL</p>
                  <p style={{ fontSize: "20px", fontWeight: "800" }}>~{liveData.demand.estimatedDaysToSell}</p>
                </div>
                <div style={{ flex: 1, minWidth: "100px" }}>
                  <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>ACTIVE BUYERS</p>
                  <p style={{ fontSize: "20px", fontWeight: "800" }}>{liveData.demand.activeBuyers.toLocaleString()}</p>
                </div>
                <div style={{ flex: 1, minWidth: "100px" }}>
                  <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>TREND</p>
                  <p style={{ fontSize: "20px", fontWeight: "800", color: liveData.demand.trend === "Rising" ? "var(--green-accent)" : liveData.demand.trend === "Falling" ? "#d64545" : "var(--text)" }}>{liveData.demand.trend}</p>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{liveData.demand.trendReason}</p>
            </CollapsibleSection>
          )}

          {liveData && (
            <div className="ai-disclaimer">
              Demand estimates and live pricing data are AI-generated approximations. Actual market conditions may differ. Verify current prices on each platform before making selling decisions.
            </div>
          )}

          {/* === COLLAPSIBLE AI ANALYSIS SECTIONS === */}

          {/* 1. Damage Detector */}
          {result.damageAnalysis && (
            <CollapsibleSection
              icon={<SearchIcon size={16} />}
              title="Condition Analysis"
              badge={
                hasDamage
                  ? <span className="severity-pill moderate">{result.damageAnalysis.issues.length} issue{result.damageAnalysis.issues.length !== 1 ? "s" : ""}</span>
                  : <span className="difficulty-pill easy">No damage</span>
              }
              defaultOpen={hasDamage}
            >
              {!hasDamage ? (
                <p style={{ fontSize: "14px", color: "var(--green-accent)", fontWeight: "600" }}>No visible damage detected. Item appears to be in good condition.</p>
              ) : (
                <div>
                  {result.damageAnalysis.issues.map((issue, i) => (
                    <div key={i} className="damage-item">
                      <p style={{ fontSize: "14px", flex: 1 }}>{issue.description}</p>
                      <span className={`severity-pill ${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 2. Authenticity Checker */}
          {result.authenticity && (
            <CollapsibleSection
              icon={<Shield size={16} />}
              title="Authenticity Analysis"
              badge={<span className={`risk-pill ${result.authenticity.riskLevel.toLowerCase()}`}>{result.authenticity.riskLevel} Risk</span>}
              defaultOpen={result.authenticity.riskLevel === "High"}
            >
              <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.5 }}>{result.authenticity.explanation}</p>
              {result.authenticity.verificationTips.length > 0 && (
                <>
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Verify in person</p>
                  {result.authenticity.verificationTips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "6px 0" }}>
                      <Check size={14} style={{ color: "var(--green-accent)", marginTop: "2px", flexShrink: 0 }} />
                      <p style={{ fontSize: "13px", lineHeight: 1.4 }}>{tip}</p>
                    </div>
                  ))}
                </>
              )}
              {result.authenticity.riskLevel === "High" && (
                <div className="auth-warning">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={14} />
                    Verify authenticity before selling — counterfeit items cannot be sold on any platform.
                  </div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 3. Vintage Detector */}
          {result.vintage && result.vintage.isVintage && (
            <CollapsibleSection
              icon={<Clock size={16} />}
              title="Vintage & Collectible Analysis"
              badge={<span className="vintage-badge">{result.vintage.estimatedDecade || "Vintage"}</span>}
            >
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                {result.vintage.estimatedDecade && (
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>ERA</p>
                    <p style={{ fontSize: "18px", fontWeight: "800" }}>{result.vintage.estimatedDecade}</p>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>CLASSIFICATION</p>
                  <p style={{ fontSize: "18px", fontWeight: "800" }}>{result.vintage.isAntique ? "Antique" : "Vintage"}</p>
                </div>
                {result.vintage.premiumApplied && (
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600" }}>PREMIUM</p>
                    <p style={{ fontSize: "18px", fontWeight: "800", color: "var(--green-accent)" }}>+{result.vintage.premiumPercentage}%</p>
                  </div>
                )}
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5 }}>{result.vintage.characteristics}</p>
            </CollapsibleSection>
          )}

          {/* 4. Collectibles Identifier */}
          {result.collectible?.isCollectible && (
            <CollapsibleSection
              icon={<Award size={16} />}
              title="Collectible Details"
              badge={<span className="platform-badge">{result.collectible.type}</span>}
              defaultOpen
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {result.collectible.series && (
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>Series / Set</p>
                    <p style={{ fontSize: "15px", fontWeight: "700" }}>{result.collectible.series}</p>
                  </div>
                )}
                {result.collectible.estimatedGrade && (
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>Estimated Grade</p>
                    <span className="grade-badge">{result.collectible.estimatedGrade}</span>
                  </div>
                )}
                {result.collectible.collectibleValueLow != null && result.collectible.collectibleValueHigh != null && (
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>Collectible Market Value</p>
                    <p className="gradient-text" style={{ fontSize: "22px", fontWeight: "800" }}>
                      ${result.collectible.collectibleValueLow} – ${result.collectible.collectibleValueHigh}
                    </p>
                  </div>
                )}
                {result.collectible.recommendedPlatforms.length > 0 && (
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Best Platforms for This Collectible</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {result.collectible.recommendedPlatforms.map((p, i) => (
                        <span key={i} className="platform-badge">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Donation Suggestion */}
          {isLowValue && (
            <div className="donation-card">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Heart size={16} style={{ color: "var(--text-muted)" }} />
                <p style={{ fontSize: "15px", fontWeight: "700" }}>Consider donating this item</p>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>Items under $10 often cost more to ship than they sell for.</p>
              {DONATION_CENTRES.map((dc, i) => (
                <div key={i} className="donation-centre">
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "700" }}>{dc.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>{dc.address}</p>
                  </div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dc.name + " " + dc.address)}`} target="_blank" rel="noopener noreferrer" className="btn-sm ghost" style={{ padding: "5px 12px", fontSize: "12px", textDecoration: "none", flexShrink: 0, gap: "4px" }}>
                    <MapPin size={12} /> Directions
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Price History */}
          {result.priceHistory && result.priceHistory.length > 0 && (
            <div className="chart-card">
              <p className="card-label" style={{ paddingLeft: "8px" }}>6-Month Price Trend</p>
              <PriceChart data={result.priceHistory} />
            </div>
          )}

          {/* Best Time to Sell */}
          {result.bestTimeToSell && (
            <div className="best-time-card">
              <p className="card-label">Best Time to Sell</p>
              <div style={{ display: "flex", gap: "16px", marginBottom: "10px", flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600", marginBottom: "2px" }}>DAY</p>
                  <p style={{ fontSize: "18px", fontWeight: "800" }}>{result.bestTimeToSell.day}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: "600", marginBottom: "2px" }}>TIME</p>
                  <p style={{ fontSize: "18px", fontWeight: "800" }}>{result.bestTimeToSell.time}</p>
                </div>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5 }}>{result.bestTimeToSell.reason}</p>
            </div>
          )}

          {/* Platform */}
          <div className="card">
            <p className="card-label">Best Platform to Sell</p>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text-muted)" }}>{result.platform}</p>
          </div>

          {/* Comparables */}
          {result.comparables && result.comparables.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p className="card-label" style={{ paddingLeft: "4px" }}>Similar Items Selling Now</p>
              {result.comparables.map((comp, i) => (
                <div key={i} className="comparable-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", lineHeight: 1.3, marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comp.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="platform-badge">{comp.platform}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>{comp.daysListed}d listed</span>
                    </div>
                  </div>
                  <p className="gradient-text" style={{ fontSize: "18px", fontWeight: "800", flexShrink: 0 }}>${comp.price}</p>
                </div>
              ))}
            </div>
          )}

          {/* Price Comparison */}
          {result.platformComparison && result.platformComparison.length > 0 && (() => {
            const best = [...result.platformComparison!].sort((a, b) => (b.avgPrice * 0.6 + (30 - b.avgDaysToSell) * 2) - (a.avgPrice * 0.6 + (30 - a.avgDaysToSell) * 2))[0]
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p className="card-label" style={{ paddingLeft: "4px" }}>Price Comparison</p>
                <div className="pc-row pc-best" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Star size={12} style={{ color: "var(--green-accent)" }} />
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Best for You</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", flexShrink: 0 }}>
                      <ExternalLink size={16} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "16px", fontWeight: "800" }}>{best.platform}</p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Avg ${best.avgPrice} · ~{best.avgDaysToSell} days</p>
                    </div>
                    <a href={PLATFORM_URLS[best.platform] || "#"} target="_blank" rel="noopener noreferrer" className="btn-sm primary" style={{ textDecoration: "none", padding: "6px 14px", fontSize: "12px" }}>Sell Here</a>
                  </div>
                </div>
                {result.platformComparison!.map((pc, i) => (
                  <div key={i} className="pc-row">
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", flexShrink: 0 }}>
                      <ExternalLink size={14} style={{ color: "var(--text-faint)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: "700" }}>{pc.platform}</p>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "2px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>${pc.priceLow}–${pc.priceHigh}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>~{pc.avgDaysToSell}d</span>
                        <span className={`difficulty-pill ${pc.difficulty.toLowerCase()}`}>{pc.difficulty}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p className="gradient-text" style={{ fontSize: "16px", fontWeight: "800" }}>${pc.avgPrice}</p>
                      <a href={PLATFORM_URLS[pc.platform] || "#"} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", fontWeight: "700", color: "var(--green-accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "2px", justifyContent: "flex-end" }}>Sell <ArrowRight size={10} /></a>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          </>)}
          {/* End gated Pro sections */}

          {/* Listing Title */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <p className="card-label" style={{ marginBottom: 0 }}>Listing Title</p>
              <button onClick={() => cp(result.title, "title")} className={`btn-copy ${copied === "title" ? "copied" : ""}`}>{copied === "title" ? "Copied!" : "Copy"}</button>
            </div>
            <p style={{ fontSize: "16px", fontWeight: "600", lineHeight: 1.5 }}>{result.title}</p>
          </div>

          {/* Listing Description */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <p className="card-label" style={{ marginBottom: 0 }}>Listing Description</p>
              <button onClick={() => cp(result.description, "description")} className={`btn-copy ${copied === "description" ? "copied" : ""}`}>{copied === "description" ? "Copied!" : "Copy"}</button>
            </div>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--text-muted)" }}>{result.description}</p>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: "20px" }}>
            <p className="card-label">Quick Actions</p>
            <div className="share-row">
              <button onClick={() => { window.open("https://www.facebook.com/marketplace/create/item", "_blank"); cp(fullText(), "fb-copied") }} className="share-btn facebook">Post to Marketplace</button>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(fullText())}`, "_blank")} className="share-btn whatsapp">WhatsApp</button>
            </div>
            <div className="share-row" style={{ marginTop: "8px" }}>
              {!listingUrl ? (
                <button onClick={handleShareListing} className="share-btn"><Link2 size={14} /> Create Shareable Link</button>
              ) : (
                <button onClick={() => cp(listingUrl, "link")} className="share-btn" style={copied === "link" ? { borderColor: "var(--green-accent)", color: "var(--green-accent)" } : {}}>
                  {copied === "link" ? <><Check size={14} /> Link Copied!</> : <><Link2 size={14} /> Copy Listing Link</>}
                </button>
              )}
              <button onClick={() => cp(fullText(), "full")} className="share-btn" style={copied === "full" || copied === "fb-copied" ? { borderColor: "var(--green-accent)", color: "var(--green-accent)" } : {}}>
                {copied === "full" ? <><Check size={14} /> Copied!</> : copied === "fb-copied" ? <><Check size={14} /> Copied — Paste in Marketplace</> : <><Copy size={14} /> Copy Full Listing</>}
              </button>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => router.push("/scan")} className="btn-primary">Scan Another Item</button>
          {!inCloset ? (
            <button onClick={handleAddToCloset} className="btn-secondary">Add to My Closet</button>
          ) : (
            <button onClick={() => router.push("/closet")} className="btn-secondary" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}><Check size={14} /> In Closet — View</button>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          {!listedOnMarket ? (
            <button onClick={handleListOnMarket} className="btn-sm ghost"><ShoppingCart size={14} /> List on Marketplace</button>
          ) : (
            <button onClick={() => router.push("/marketplace")} className="btn-sm ghost" style={{ color: "var(--green-accent)", borderColor: "var(--green-accent)" }}><Check size={14} /> On Marketplace</button>
          )}
          {!postedToFeed ? (
            <button onClick={async () => {
              if (!result) return
              addFeedPost({ item: result.item, title: result.title, imageUrl: imageUrl, value: Math.round((result.valueLow + result.valueHigh) / 2), platform: result.platform.split(/[,.—–]/)[0].trim(), category: "Other" })
              if (user) {
                const dbScanId = sessionStorage.getItem("flipt-db-scan-id")
                await createFeedPost(user.id, {
                  scan_id: dbScanId || undefined,
                  item_name: result.item,
                  selling_price: Math.round((result.valueLow + result.valueHigh) / 2),
                  platform: result.platform.split(/[,.—–]/)[0].trim(),
                  image_url: imageUrl || undefined,
                })
              }
              setPostedToFeed(true)
            }} className="btn-sm ghost"><Rss size={14} /> Post to Feed</button>
          ) : (
            <button onClick={() => router.push("/feed")} className="btn-sm ghost" style={{ color: "var(--green-accent)", borderColor: "var(--green-accent)" }}><Check size={14} /> Posted to Feed</button>
          )}
        </div>
      </main>
      {upgradeModal && <UpgradeModal feature={upgradeModal.feature} plan={upgradeModal.plan} onClose={() => setUpgradeModal(null)} />}
    </PageTransition>
  )
}
