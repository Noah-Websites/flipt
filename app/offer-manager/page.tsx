"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Copy, Check, AlertTriangle, ThumbsUp, ThumbsDown, Loader2, Clock, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PageTransition, FadeUp } from "../components/Motion"
import { useAuth } from "../components/AuthProvider"
import { LockedPage } from "../components/UpgradeModal"
import { useSubscription } from "../lib/useSubscription"
import { useCurrency } from "../components/CurrencyProvider"

const PLATFORMS = ["Kijiji", "Facebook Marketplace", "eBay", "Poshmark", "Craigslist"]
const CONDITIONS = ["Like New", "Good", "Fair", "Poor"]
const HISTORY_KEY = "flipt-offer-history"

interface OfferResult {
  detectedOffer: number | null; assessment: string; percentBelowAsking: number; percentBelowFMV: number;
  counterOffer: number; counterReasoning: string;
  responses: { firm: string; flexible: string; quickSale: string };
  buyerAnalysis: { intent: string; urgencySignals: string[]; redFlags: string[]; recommendedNextStep: string };
  tips: string[];
}

interface HistoryEntry { id: string; itemName: string; theirOffer: number | null; counterOffer: number; date: string }

export default function OfferManager() {
  const router = useRouter()
  const { user } = useAuth()
  const { canAccess } = useSubscription(user?.id)
  const { formatPrice } = useCurrency()

  const [itemName, setItemName] = useState("")
  const [askingPrice, setAskingPrice] = useState("")
  const [fairMarketValue, setFairMarketValue] = useState("")
  const [condition, setCondition] = useState("Good")
  const [platform, setPlatform] = useState("Kijiji")
  const [buyerMessage, setBuyerMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OfferResult | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")) } catch {}
    // Pre-fill from last scan if available
    try {
      const lastScan = sessionStorage.getItem("flipt-result")
      if (lastScan) {
        const data = JSON.parse(lastScan)
        if (data.item) setItemName(data.item)
        if (data.fairMarketPrice) setFairMarketValue(String(data.fairMarketPrice))
        if (data.patientPrice) setAskingPrice(String(data.patientPrice))
      }
    } catch {}
  }, [])

  function cp(text: string, label: string) {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(null), 2000)
  }

  async function handleAnalyse() {
    if (!itemName.trim() || !askingPrice || !buyerMessage.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch("/api/offer-manager", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, askingPrice: parseFloat(askingPrice), fairMarketValue: parseFloat(fairMarketValue || askingPrice), condition, platform, buyerMessage }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data as OfferResult)
      // Save to history
      const entry: HistoryEntry = { id: Date.now().toString(), itemName, theirOffer: data.detectedOffer, counterOffer: data.counterOffer, date: new Date().toISOString() }
      const updated = [entry, ...history].slice(0, 10)
      setHistory(updated)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setLoading(false)
  }

  if (!canAccess("business_mode")) {
    return (
      <PageTransition><main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 16px" }}><h2>Offer Manager</h2></div>
        <LockedPage title="Offer Manager is a Business feature" description="Analyze buyer offers, get counter-offer suggestions, and never leave money on the table" plan="business" onUpgrade={() => router.push("/settings")} />
      </main></PageTransition>
    )
  }

  const assessColor = result?.assessment === "Reasonable" ? "var(--green-accent)" : result?.assessment === "Low" ? "var(--gold)" : "var(--red)"

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 8px" }}>
          <h2 style={{ marginBottom: "4px" }}>Offer Manager</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Never leave money on the table again</p>
        </div>

        <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Item Details */}
          <div className="card">
            <p className="card-label">Item Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input placeholder="Item name" value={itemName} onChange={e => setItemName(e.target.value)} className="input" />
              <div style={{ display: "flex", gap: "8px" }}>
                <input placeholder="Your asking price ($)" type="number" value={askingPrice} onChange={e => setAskingPrice(e.target.value)} className="input" style={{ flex: 1 }} />
                <input placeholder="Fair market value ($)" type="number" value={fairMarketValue} onChange={e => setFairMarketValue(e.target.value)} className="input" style={{ flex: 1 }} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <select value={condition} onChange={e => setCondition(e.target.value)} className="input" style={{ flex: 1 }}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="input" style={{ flex: 1 }}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Buyer Message */}
          <div className="card">
            <p className="card-label">Buyer&apos;s Message</p>
            <textarea placeholder="Paste the buyer's message here..." value={buyerMessage} onChange={e => setBuyerMessage(e.target.value)} className="input" style={{ minHeight: "100px", resize: "vertical" }} />
          </div>

          <button onClick={handleAnalyse} disabled={loading || !itemName || !askingPrice || !buyerMessage} className="btn-primary" style={{ width: "100%" }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 0.6s linear infinite" }} /> Analysing...</> : <><MessageSquare size={16} /> Analyse Offer</>}
          </button>

          {error && <p style={{ color: "var(--red)", fontSize: "13px", textAlign: "center" }}>{error}</p>}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Assessment */}
                <div className="card" style={{ borderLeft: `3px solid ${assessColor}` }}>
                  <p className="card-label">Offer Assessment</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      {result.detectedOffer != null && <p style={{ fontSize: "24px", fontWeight: 800 }}>{formatPrice(result.detectedOffer)}</p>}
                      <p style={{ fontSize: "14px", fontWeight: 700, color: assessColor }}>{result.assessment}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{result.percentBelowAsking}% below asking</p>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{result.percentBelowFMV}% below FMV</p>
                    </div>
                  </div>
                </div>

                {/* Counter Offer */}
                <div className="card" style={{ background: "var(--green-light)" }}>
                  <p className="card-label">Recommended Counter Offer</p>
                  <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--green-accent)", marginBottom: "6px" }}>{formatPrice(result.counterOffer)}</p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{result.counterReasoning}</p>
                </div>

                {/* Response Scripts */}
                <div className="card">
                  <p className="card-label">Response Scripts</p>
                  {([
                    { key: "firm", label: "Firm", desc: "Hold close to asking" },
                    { key: "flexible", label: "Flexible", desc: "Willing to negotiate" },
                    { key: "quickSale", label: "Quick Sale", desc: "Prioritize speed" },
                  ] as const).map(({ key, label, desc }) => (
                    <div key={key} style={{ padding: "12px 0", borderBottom: key !== "quickSale" ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 700 }}>{label}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{desc}</p>
                        </div>
                        <button onClick={() => cp(result.responses[key], key)} className={`btn-copy ${copied === key ? "copied" : ""}`} style={{ fontSize: "11px", padding: "4px 10px" }}>
                          {copied === key ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                        </button>
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, background: "var(--surface-alt)", padding: "10px 12px", borderRadius: "8px" }}>{result.responses[key]}</p>
                    </div>
                  ))}
                </div>

                {/* Buyer Analysis */}
                <div className="card">
                  <p className="card-label">Buyer Analysis</p>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span className={`pill ${result.buyerAnalysis.intent === "Serious Buyer" ? "green" : result.buyerAnalysis.intent === "Lowballer" ? "red" : "gold"}`} style={{ fontSize: "12px" }}>
                      {result.buyerAnalysis.intent === "Serious Buyer" ? <ThumbsUp size={11} /> : result.buyerAnalysis.intent === "Lowballer" ? <ThumbsDown size={11} /> : null}
                      {result.buyerAnalysis.intent}
                    </span>
                  </div>
                  {result.buyerAnalysis.urgencySignals.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)", marginBottom: "4px" }}>URGENCY SIGNALS</p>
                      {result.buyerAnalysis.urgencySignals.map((s, i) => <p key={i} style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>• {s}</p>)}
                    </div>
                  )}
                  {result.buyerAnalysis.redFlags.length > 0 && (
                    <div style={{ marginBottom: "8px", padding: "8px 10px", background: "rgba(224,82,82,0.06)", borderRadius: "8px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--red)", marginBottom: "4px" }}>RED FLAGS</p>
                      {result.buyerAnalysis.redFlags.map((f, i) => <p key={i} style={{ fontSize: "12px", color: "var(--red)" }}>• {f}</p>)}
                    </div>
                  )}
                  <p style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600, marginTop: "8px" }}>{result.buyerAnalysis.recommendedNextStep}</p>
                </div>

                {/* Tips */}
                {result.tips.length > 0 && (
                  <div className="card">
                    <p className="card-label">Negotiation Tips</p>
                    {result.tips.map((tip, i) => (
                      <p key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, padding: "3px 0", display: "flex", gap: "8px" }}>
                        <span style={{ color: "var(--green-accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span> {tip}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <p className="card-label">Recent Analyses</p>
              {history.map(h => (
                <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600 }}>{h.itemName}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Their offer: {h.theirOffer ? formatPrice(h.theirOffer) : "N/A"} · Counter: {formatPrice(h.counterOffer)}
                    </p>
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>{new Date(h.date).toLocaleDateString("en-CA")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  )
}
