"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Check, Upload, Camera, X, Plus, Aperture } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../components/AuthProvider"
import { addToHistory, saveBulkReport, isPro, getBonusScans, type BulkReportItem } from "../lib/storage"
import { saveScan } from "../lib/db"

const FREE_SCAN_LIMIT = 5
const STORAGE_KEY = "flipt-scan-count"
const MAX_BULK = 20

function getScanCount(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10)
}

function incrementScanCount(): number {
  const count = getScanCount() + 1
  localStorage.setItem(STORAGE_KEY, String(count))
  return count
}

const SCAN_STEPS = [
  "Identifying your item...",
  "Checking 5 resale platforms...",
  "Calculating the best price...",
  "Almost ready...",
]

const CONDITIONS = ["Poor", "Fair", "Good", "Excellent"]

export default function Scan() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isBulk = searchParams.get("bulk") === "true"

  const [preview, setPreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string>("image/jpeg")
  const [loading, setLoading] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualName, setManualName] = useState("")
  const [fallbackTips, setFallbackTips] = useState<string[]>([])
  const [manualLoading, setManualLoading] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [showPaywall, setShowPaywall] = useState(false)
  const [condition, setCondition] = useState<string>("Good")
  const [extraImages, setExtraImages] = useState<Array<{ data: string; mediaType: string; preview: string }>>([])
  const extraInputRef = useRef<HTMLInputElement>(null)
  const [bulkFiles, setBulkFiles] = useState<Array<{ file: File; preview: string; base64: string; mediaType: string }>>([])
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkTotal, setBulkTotal] = useState(0)
  const [bulkScanning, setBulkScanning] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const count = getScanCount()
    setScanCount(count)
    if (count >= FREE_SCAN_LIMIT && !isPro()) setShowPaywall(true)
  }, [])

  // Smooth progress animation — faster curve for Sonnet (~6s target)
  useEffect(() => {
    if (loading) {
      setScanProgress(0)
      let current = 0
      progressRef.current = setInterval(() => {
        // Fast start, slow toward end — feels responsive
        const speed = current < 50 ? 1.2 + Math.random() * 0.8 : current < 80 ? 0.5 + Math.random() * 0.4 : 0.15
        current = Math.min(current + speed, 95)
        setScanProgress(current)
      }, 100)
      return () => { if (progressRef.current) clearInterval(progressRef.current) }
    } else {
      if (progressRef.current) clearInterval(progressRef.current)
      setScanProgress(0)
    }
  }, [loading])

  // Cycle through scan steps — tuned for Sonnet (~5-8s total)
  useEffect(() => {
    if (!loading) return
    setScanStep(0)
    const timers = [
      setTimeout(() => setScanStep(1), 1500),
      setTimeout(() => setScanStep(2), 3500),
      setTimeout(() => setScanStep(3), 6000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [loading])

  function processFile(file: File) {
    setPreview(URL.createObjectURL(file))
    setError(null)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      // 800px max for speed — still plenty of detail for AI identification
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h)
        // 0.75 quality — smaller payload, faster upload
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
        setImageData(dataUrl.split(",")[1])
        setMediaType("image/jpeg")
      }
    }
    img.src = URL.createObjectURL(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleExtraImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || extraImages.length >= 2) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1]
      setExtraImages(prev => [...prev, { data: base64, mediaType: file.type || "image/jpeg", preview: URL.createObjectURL(file) }])
    }
    reader.readAsDataURL(file)
  }

  function removeExtraImage(idx: number) {
    setExtraImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleIdentify() {
    if (!imageData) return
    if (scanCount >= FREE_SCAN_LIMIT && !isPro()) { setShowPaywall(true); return }
    setLoading(true)
    setError(null)
    try {
      const allImages = [{ data: imageData, mediaType }]
      for (const img of extraImages) allImages.push({ data: img.data, mediaType: img.mediaType })

      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: allImages, mediaType, condition }),
      })
      setScanProgress(100)
      const data = await res.json()

      if (data.fallback) {
        setFallbackTips(data.tips || [])
        setShowManualEntry(true)
        setError(data.error || "We had trouble with this image.")
        setLoading(false)
        return
      }
      if (data.error && !data.item) throw new Error(data.error)

      const newCount = incrementScanCount()
      setScanCount(newCount)

      const historyEntry = addToHistory({
        item: data.item, valueLow: data.valueLow, valueHigh: data.valueHigh,
        platform: data.platform, title: data.title, description: data.description, imageUrl: preview,
      })

      let dbScanId: string | null = null
      if (user) {
        const { data: dbScan } = await saveScan(user.id, {
          item_name: data.item, brand: data.brand?.name, condition,
          estimated_value_low: data.valueLow, estimated_value_high: data.valueHigh,
          best_platform: data.platform, listing_title: data.title,
          listing_description: data.description, image_url: preview || undefined, ai_response: data,
        })
        if (dbScan) dbScanId = dbScan.id
      }

      sessionStorage.setItem("flipt-result", JSON.stringify(data))
      sessionStorage.setItem("flipt-result-id", historyEntry.id)
      if (dbScanId) sessionStorage.setItem("flipt-db-scan-id", dbScanId)
      if (imageData) sessionStorage.setItem("flipt-scan-image-data", imageData)
      sessionStorage.setItem("flipt-scan-media-type", mediaType)
      if (preview) sessionStorage.setItem("flipt-image", preview)
      router.push("/results")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong."
      if (err instanceof TypeError && (msg.includes("Failed to fetch") || msg.includes("Load failed") || msg.includes("NetworkError"))) {
        setError("Scan failed — your ad blocker may be interfering. Try disabling it, or enter the item name below.")
        setShowManualEntry(true)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleManualIdentify() {
    if (!manualName.trim()) return
    setManualLoading(true)
    setError(null)
    try {
      const allImages = imageData ? [{ data: imageData, mediaType }] : []
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: allImages.length > 0 ? allImages : undefined, image: imageData, mediaType, condition, correctedName: manualName }),
      })
      const data = await res.json()
      if (data.item || data.valueLow) {
        sessionStorage.setItem("flipt-result", JSON.stringify(data))
        if (preview) sessionStorage.setItem("flipt-image", preview)
        router.push("/results")
      } else {
        setError("Could not get pricing. Please try a more specific name.")
      }
    } catch { setError("Something went wrong. Please try again.") }
    setManualLoading(false)
  }

  function handleBulkFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, MAX_BULK)
    if (!files.length) return
    setError(null)
    const promises = files.map(file => new Promise<typeof bulkFiles[number]>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve({ file, preview: URL.createObjectURL(file), base64: (reader.result as string).split(",")[1], mediaType: file.type || "image/jpeg" })
      reader.readAsDataURL(file)
    }))
    Promise.all(promises).then(setBulkFiles)
  }

  async function handleBulkScan() {
    if (!bulkFiles.length) return
    setBulkScanning(true); setBulkProgress(0); setBulkTotal(bulkFiles.length); setError(null)
    const results: BulkReportItem[] = []
    for (let i = 0; i < bulkFiles.length; i++) {
      const bf = bulkFiles[i]
      try {
        const res = await fetch("/api/identify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: bf.base64, mediaType: bf.mediaType, condition }) })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error)
        incrementScanCount()
        results.push({ item: data.item, valueLow: data.valueLow, valueHigh: data.valueHigh, platform: data.platform, title: data.title, description: data.description, imageUrl: bf.preview, condition })
      } catch {
        results.push({ item: `Item ${i + 1} (scan failed)`, valueLow: 0, valueHigh: 0, platform: "N/A", title: "", description: "", imageUrl: bf.preview, condition })
      }
      setBulkProgress(i + 1)
    }
    saveBulkReport(results)
    setBulkScanning(false)
    router.push("/report")
  }

  const remaining = Math.max(0, FREE_SCAN_LIMIT - scanCount)

  // ── PAYWALL ──
  if (showPaywall) {
    return (
      <main className="scan-paywall">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="scan-paywall-icon"><Lock size={32} /></div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, textAlign: "center", marginBottom: "8px" }}>You&apos;ve used all {FREE_SCAN_LIMIT} free scans</h1>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", textAlign: "center", maxWidth: "340px", lineHeight: 1.6, margin: "0 auto 28px" }}>Upgrade to Flipt Pro for unlimited scans and keep turning your clutter into cash.</p>
          <div className="paywall-card" style={{ maxWidth: "360px", width: "100%", textAlign: "center", margin: "0 auto" }}>
            <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Flipt Pro</p>
            <p className="gradient-text" style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1.2 }}>$4.99</p>
            <p style={{ fontSize: "14px", color: "var(--text-faint)", marginBottom: "4px" }}>per month</p>
            <p style={{ fontSize: "12px", color: "var(--green-accent)", fontWeight: 600, marginBottom: "24px" }}>or $39.99/year — save 33%</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", textAlign: "left" }}>
              {["Unlimited scans", "Priority AI analysis", "Full scan history", "Multi-photo support"].map(f => (
                <li key={f} style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={14} style={{ color: "var(--green-accent)" }} />{f}
                </li>
              ))}
            </ul>
            <button className="btn-primary" style={{ width: "100%", borderRadius: "14px" }} onClick={() => router.push("/settings")}>Upgrade to Pro</button>
          </div>
          <button onClick={() => { setShowPaywall(false); router.push("/") }} style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: "14px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer", marginTop: "16px" }}>Back to Home</button>
        </motion.div>
      </main>
    )
  }

  // ── BULK MODE ──
  if (isBulk) {
    return (
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "48px 24px 100px", gap: "28px", background: "#0a0f0a", color: "#fff" }}>
        <h2 style={{ textAlign: "center" }}>Bulk Scan</h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>Upload up to {MAX_BULK} photos for a full room cleanout report.</p>
        <div style={{ display: "flex", gap: "8px" }}>
          {CONDITIONS.map(c => (
            <button key={c} onClick={() => setCondition(c)} className="scan-condition-pill" data-active={condition === c}>{c}</button>
          ))}
        </div>
        {!bulkScanning && (
          <>
            <button onClick={() => bulkInputRef.current?.click()} className="scan-upload-zone" style={{ maxWidth: "400px", aspectRatio: "auto", padding: "40px 24px" }}>
              <Upload size={32} style={{ color: "rgba(255,255,255,0.3)", marginBottom: "8px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{bulkFiles.length ? `${bulkFiles.length} photos selected` : "Tap to select photos"}</p>
            </button>
            <input ref={bulkInputRef} type="file" accept="image/*" multiple onChange={handleBulkFiles} style={{ display: "none" }} />
          </>
        )}
        {bulkFiles.length > 0 && !bulkScanning && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "6px", width: "100%", maxWidth: "400px" }}>
            {bulkFiles.map((bf, i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                <img src={bf.preview} alt={`Item ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
        {bulkScanning && (
          <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
              <div style={{ height: "100%", width: `${(bulkProgress / bulkTotal) * 100}%`, background: "var(--green-accent)", transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>Scanning {bulkProgress} of {bulkTotal}...</p>
          </div>
        )}
        {bulkFiles.length > 0 && !bulkScanning && (
          <button onClick={handleBulkScan} className="btn-primary glow" style={{ padding: "16px 32px" }}>Scan {bulkFiles.length} Items</button>
        )}
        {error && <p style={{ color: "#e74c3c", fontSize: "13px", textAlign: "center", maxWidth: "360px" }}>{error}</p>}
        <button onClick={() => router.push("/scan")} className="btn-sm ghost" style={{ color: "rgba(255,255,255,0.4)" }}>Switch to Single Scan</button>
      </main>
    )
  }

  // ── FULL-SCREEN SCANNING OVERLAY ──
  const scanOverlay = loading && preview && (
    <AnimatePresence>
      <motion.div
        key="scan-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="scan-overlay"
      >
        {/* Photo background */}
        <div className="scan-overlay-photo">
          <img src={preview} alt="Scanning" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div className="scan-overlay-gradient" />
        </div>

        {/* Scanning effects */}
        <div className="scan-overlay-effects">
          {/* Sweep line */}
          <motion.div
            className="scan-sweep-line"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Detection boxes */}
          <motion.div className="scan-detect-box" style={{ top: "20%", left: "15%", width: "30%", height: "25%" }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9] }}
            transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 3 }} />
          <motion.div className="scan-detect-box" style={{ top: "45%", right: "10%", width: "35%", height: "20%" }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9] }}
            transition={{ duration: 2, delay: 2.5, repeat: Infinity, repeatDelay: 3 }} />
          <motion.div className="scan-detect-box" style={{ bottom: "25%", left: "20%", width: "25%", height: "15%" }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9] }}
            transition={{ duration: 2, delay: 4, repeat: Infinity, repeatDelay: 3 }} />
        </div>

        {/* Status text */}
        <div className="scan-overlay-status">
          <AnimatePresence mode="wait">
            <motion.p
              key={scanStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="scan-overlay-text"
            >
              {SCAN_STEPS[scanStep]}
            </motion.p>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="scan-overlay-progress">
            <motion.div
              className="scan-overlay-progress-fill"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="scan-overlay-percent">{Math.round(scanProgress)}%</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )

  // ── SINGLE SCAN MODE ──
  return (
    <>
      {scanOverlay}
      <main className="scan-page">
        {/* Scan counter pill */}
        {!isPro() && (
          <motion.div
            className="scan-counter-pill"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Aperture size={12} />
            {remaining} scan{remaining !== 1 ? "s" : ""} left this month
          </motion.div>
        )}

        {/* Viewfinder area - 60% of screen */}
        <div className="scan-viewfinder-container">
          <div
            className="scan-viewfinder"
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="scan-viewfinder-img" />
                <button onClick={(e) => { e.stopPropagation(); setPreview(null); setImageData(null); setExtraImages([]) }} className="scan-viewfinder-clear" aria-label="Clear photo">
                  <X size={18} />
                </button>
              </>
            ) : (
              <div className="scan-viewfinder-empty">
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Camera size={40} style={{ color: "rgba(255,255,255,0.2)" }} />
                </motion.div>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", marginTop: "8px" }}>Point your camera at any item</p>
              </div>
            )}

            {/* Corner brackets with pulse */}
            {["tl", "tr", "bl", "br"].map(pos => (
              <motion.div
                key={pos}
                className={`scan-corner scan-corner-${pos}`}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}

            {/* Scanning line */}
            {!preview && (
              <motion.div
                className="scan-line"
                animate={{ top: ["5%", "95%", "5%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
        </div>

        {/* Multi-photo slots */}
        {imageData && (
          <div className="scan-photo-slots">
            <div className="scan-photo-slot main">
              <img src={preview!} alt="Main" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <span className="scan-photo-label">Main</span>
            </div>
            {extraImages.map((img, i) => (
              <div key={i} className="scan-photo-slot">
                <img src={img.preview} alt={`Angle ${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => removeExtraImage(i)} className="scan-photo-remove" aria-label="Remove photo"><X size={10} /></button>
                <span className="scan-photo-label">{i === 0 ? "Back" : "Detail"}</span>
              </div>
            ))}
            {extraImages.length < 2 && (
              <button onClick={() => extraInputRef.current?.click()} className="scan-photo-slot add" aria-label="Add another photo">
                <Plus size={18} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span className="scan-photo-label">Add</span>
              </button>
            )}
            <p className="scan-photo-tip">More angles = better accuracy</p>
          </div>
        )}

        {/* Condition pills */}
        <div className="scan-condition-row">
          <p className="scan-section-label">Condition</p>
          <div className="scan-condition-pills">
            {CONDITIONS.map(c => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className="scan-condition-pill"
                data-active={condition === c}
                aria-label={`Set condition to ${c}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="scan-actions">
          <button
            onClick={handleIdentify}
            disabled={!imageData || loading}
            className="scan-identify-btn"
            aria-label="Identify this item"
          >
            {loading ? (
              <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff", width: "18px", height: "18px" }} />
            ) : (
              "Identify This Item"
            )}
          </button>

          <div className="scan-secondary-btns">
            <button onClick={() => cameraInputRef.current?.click()} className="scan-secondary-btn" aria-label="Take photo with camera">
              <Camera size={16} /> Take Photo
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="scan-secondary-btn" aria-label="Upload a photo">
              <Upload size={16} /> Upload Photo
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
        <input ref={extraInputRef} type="file" accept="image/*" onChange={handleExtraImage} style={{ display: "none" }} />

        {/* Error state */}
        {error && !showManualEntry && (
          <motion.div className="scan-error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p>{error}</p>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button onClick={() => { setError(null); handleIdentify() }} className="btn-sm primary">Try Again</button>
              <button onClick={() => setShowManualEntry(true)} className="btn-sm ghost" style={{ color: "rgba(255,255,255,0.6)" }}>Enter Manually</button>
            </div>
          </motion.div>
        )}

        {/* Manual entry */}
        {showManualEntry && (
          <motion.div className="scan-manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>What is this item?</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>Type the item name and we&apos;ll look it up for you.</p>
            {fallbackTips.length > 0 && (
              <div style={{ marginBottom: "12px", padding: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>Tips for next time:</p>
                {fallbackTips.map((tip, i) => <p key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>• {tip}</p>)}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={manualName} onChange={e => setManualName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleManualIdentify()}
                placeholder="e.g. KitchenAid Stand Mixer"
                className="scan-manual-input"
                autoFocus
              />
              <button onClick={handleManualIdentify} disabled={manualLoading || !manualName.trim()} className="btn-sm primary" style={{ flexShrink: 0 }}>
                {manualLoading ? "..." : "Go"}
              </button>
            </div>
            <button onClick={() => { setShowManualEntry(false); setError(null); setFallbackTips([]) }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: "var(--font-body)", cursor: "pointer", marginTop: "8px" }}>Cancel</button>
          </motion.div>
        )}
      </main>
    </>
  )
}
