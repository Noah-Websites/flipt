"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Check, ImagePlus, Upload, Camera } from "lucide-react"
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

interface BulkFile {
  file: File
  preview: string
  base64: string
  mediaType: string
}

export default function Scan() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isBulk = searchParams.get("bulk") === "true"

  const [preview, setPreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string>("image/jpeg")
  const [loading, setLoading] = useState(false)
  const [scanStep, setScanStep] = useState(0) // 0-4 for progress
  const [error, setError] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [showPaywall, setShowPaywall] = useState(false)
  const [condition, setCondition] = useState<string>("Good")
  // Multi-image state
  const [extraImages, setExtraImages] = useState<Array<{ data: string; mediaType: string; preview: string }>>([])
  const extraInputRef = useRef<HTMLInputElement>(null)

  // Bulk state
  const [bulkFiles, setBulkFiles] = useState<BulkFile[]>([])
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkTotal, setBulkTotal] = useState(0)
  const [bulkScanning, setBulkScanning] = useState(false)

  const CONDITIONS = ["Poor", "Fair", "Good", "Excellent"]

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const count = getScanCount()
    setScanCount(count)
    if (count >= FREE_SCAN_LIMIT) setShowPaywall(true)
  }, [])

  function processFile(file: File) {
    setPreview(URL.createObjectURL(file))
    setError(null)

    // Compress image using Canvas
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const MAX = 1200 // max dimension
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
        setImageData(dataUrl.split(",")[1])
        setMediaType("image/jpeg")
        // Show size
        const sizeKB = Math.round(dataUrl.length * 0.75 / 1024)
        if (sizeKB > 5000) setError(`Image is ${(sizeKB / 1024).toFixed(1)}MB — compressing for faster scan.`)
      }
    }
    img.src = URL.createObjectURL(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleBulkFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, MAX_BULK)
    if (!files.length) return
    setError(null)

    const promises = files.map(file => new Promise<BulkFile>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve({
          file,
          preview: URL.createObjectURL(file),
          base64: (reader.result as string).split(",")[1],
          mediaType: file.type || "image/jpeg",
        })
      }
      reader.readAsDataURL(file)
    }))

    Promise.all(promises).then(setBulkFiles)
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

  async function handleIdentify() {
    if (!imageData) return
    if (scanCount >= FREE_SCAN_LIMIT) { setShowPaywall(true); return }

    setLoading(true)
    setScanStep(1) // Uploading
    setError(null)
    try {
      const allImages = [{ data: imageData, mediaType }]
      for (const img of extraImages) allImages.push({ data: img.data, mediaType: img.mediaType })

      // Progress simulation (steps advance on timers while API runs)
      const stepTimers = [
        setTimeout(() => setScanStep(2), 2000),  // Analyzing
        setTimeout(() => setScanStep(3), 6000),  // Researching
        setTimeout(() => setScanStep(4), 12000), // Preparing
      ]

      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: allImages, mediaType, condition }),
      })

      // Clear timers
      stepTimers.forEach(clearTimeout)
      setScanStep(4)

      const data = await res.json()

      // Handle fallback / failure cases
      if (data.fallback || (!res.ok && data.error)) {
        throw new Error(data.error || "Could not analyze this image. Please try again.")
      }
      if (data.error && !data.item) {
        throw new Error(data.error)
      }

      // Handle photo quality warnings (still continue if we got results)
      if (data.photoIssue) {
        setError(data.photoIssue)
        if (!data.item) { setLoading(false); return }
      }

      const newCount = incrementScanCount()
      setScanCount(newCount)

      // Save to localStorage (fallback)
      const historyEntry = addToHistory({
        item: data.item, valueLow: data.valueLow, valueHigh: data.valueHigh,
        platform: data.platform, title: data.title, description: data.description, imageUrl: preview,
      })

      // Save to Supabase if logged in
      let dbScanId: string | null = null
      if (user) {
        const { data: dbScan } = await saveScan(user.id, {
          item_name: data.item,
          brand: data.brand?.name,
          condition,
          estimated_value_low: data.valueLow,
          estimated_value_high: data.valueHigh,
          best_platform: data.platform,
          listing_title: data.title,
          listing_description: data.description,
          image_url: preview || undefined,
          ai_response: data,
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
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
      setScanStep(0)
    }
  }

  async function handleBulkScan() {
    if (!bulkFiles.length) return
    setBulkScanning(true)
    setBulkProgress(0)
    setBulkTotal(bulkFiles.length)
    setError(null)

    const results: BulkReportItem[] = []

    for (let i = 0; i < bulkFiles.length; i++) {
      const bf = bulkFiles[i]
      try {
        const res = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: bf.base64, mediaType: bf.mediaType, condition }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error)

        incrementScanCount()
        results.push({
          item: data.item, valueLow: data.valueLow, valueHigh: data.valueHigh,
          platform: data.platform, title: data.title, description: data.description,
          imageUrl: bf.preview, condition,
        })
      } catch {
        results.push({
          item: `Item ${i + 1} (scan failed)`, valueLow: 0, valueHigh: 0,
          platform: "N/A", title: "", description: "", imageUrl: bf.preview, condition,
        })
      }
      setBulkProgress(i + 1)
    }

    saveBulkReport(results)
    setBulkScanning(false)
    router.push("/report")
  }

  const remaining = Math.max(0, FREE_SCAN_LIMIT - scanCount)
  const progress = (remaining / FREE_SCAN_LIMIT) * 100

  if (showPaywall) {
    return (
      <>
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "48px 24px", gap: "28px" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={32} style={{ color: "var(--text-muted)" }} />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", textAlign: "center" }}>You&apos;ve used all 5 free scans</h1>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", textAlign: "center", maxWidth: "340px", lineHeight: 1.6 }}>Upgrade to Flipt Pro for unlimited scans and keep turning your clutter into cash.</p>
          <div className="paywall-card" style={{ maxWidth: "360px", width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: "12px", fontWeight: "800", color: "var(--green-accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Flipt Pro</p>
            <p className="gradient-text" style={{ fontSize: "52px", fontWeight: "800", lineHeight: 1.2, margin: "8px 0" }}>$4.99</p>
            <p style={{ fontSize: "14px", color: "var(--text-faint)", marginBottom: "28px" }}>per month</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", textAlign: "left" }}>
              {["Unlimited scans", "Priority AI analysis", "Listing history", "Multi-photo support"].map(f => (
                <li key={f} style={{ fontSize: "15px", fontWeight: "500", color: "var(--text)", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={14} style={{ color: "var(--green-accent)" }} />{f}
                </li>
              ))}
            </ul>
            <button className="btn-primary" style={{ width: "100%", borderRadius: "14px" }}>Upgrade to Pro</button>
          </div>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: "14px", fontWeight: "600", fontFamily: "inherit", cursor: "pointer" }}>Back to Home</button>
        </main>
      </>
    )
  }

  // BULK MODE
  if (isBulk) {
    return (
      <>
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "48px 24px 100px", gap: "28px" }}>
          <h2 style={{ textAlign: "center" }}>
            Bulk Scan
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", textAlign: "center" }}>
            Upload up to {MAX_BULK} photos for a full room cleanout report.
          </p>

          {/* Condition */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <p className="card-label" style={{ marginBottom: 0 }}>Condition for all items</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {CONDITIONS.map(c => (
                <button key={c} onClick={() => setCondition(c)} className={condition === c ? "condition-chip active" : "condition-chip"}>{c}</button>
              ))}
            </div>
          </div>

          {/* Upload area */}
          {!bulkScanning && (
            <>
              <button onClick={() => bulkInputRef.current?.click()} className="upload-box" style={{ maxWidth: "400px", aspectRatio: "auto", padding: "40px 24px" }}>
                <div style={{ textAlign: "center" }}>
                  <Upload size={32} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                  <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-muted)" }}>
                    {bulkFiles.length ? `${bulkFiles.length} photo${bulkFiles.length > 1 ? "s" : ""} selected` : "Tap to select photos"}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-faint)", marginTop: "4px" }}>Select multiple files at once</p>
                </div>
              </button>
              <input ref={bulkInputRef} type="file" accept="image/*" multiple onChange={handleBulkFiles} style={{ display: "none" }} />
            </>
          )}

          {/* Thumbnails */}
          {bulkFiles.length > 0 && !bulkScanning && (
            <div className="bulk-grid">
              {bulkFiles.map((bf, i) => (
                <div key={i} className="bulk-thumb">
                  <img src={bf.preview} alt={`Item ${i + 1}`} />
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {bulkScanning && (
            <div className="bulk-progress">
              <div className="bulk-progress-track">
                <div className="bulk-progress-fill" style={{ width: `${(bulkProgress / bulkTotal) * 100}%` }} />
              </div>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-muted)" }}>
                <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderColor: "var(--border)", borderTopColor: "var(--green-accent)" }} />
                Scanning {bulkProgress} of {bulkTotal} items...
              </p>
            </div>
          )}

          {/* Start button */}
          {bulkFiles.length > 0 && !bulkScanning && (
            <button onClick={handleBulkScan} className="btn-primary">
              Scan {bulkFiles.length} Item{bulkFiles.length > 1 ? "s" : ""}
            </button>
          )}

          {error && (
            <p style={{ color: "#d64545", fontSize: "14px", fontWeight: "600", textAlign: "center", maxWidth: "360px", padding: "12px 20px", background: "rgba(214,69,69,0.08)", borderRadius: "12px", border: "1px solid rgba(214,69,69,0.15)" }}>{error}</p>
          )}

          <button onClick={() => router.push("/scan")} className="btn-sm ghost">Switch to Single Scan</button>
        </main>
      </>
    )
  }

  // SINGLE MODE - Dark camera viewfinder UI
  const cornerStyle = (pos: string): React.CSSProperties => ({
    position: "absolute",
    width: "32px", height: "32px",
    borderColor: "var(--green-accent)",
    borderStyle: "solid", borderWidth: 0,
    animation: "cornerFocus 0.5s ease-out",
    ...(pos === "tl" ? { top: 0, left: 0, borderTopWidth: "3px", borderLeftWidth: "3px", borderTopLeftRadius: "8px" } : {}),
    ...(pos === "tr" ? { top: 0, right: 0, borderTopWidth: "3px", borderRightWidth: "3px", borderTopRightRadius: "8px" } : {}),
    ...(pos === "bl" ? { bottom: 0, left: 0, borderBottomWidth: "3px", borderLeftWidth: "3px", borderBottomLeftRadius: "8px" } : {}),
    ...(pos === "br" ? { bottom: 0, right: 0, borderBottomWidth: "3px", borderRightWidth: "3px", borderBottomRightRadius: "8px" } : {}),
  })

  return (
    <>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", background: "#0a0f0a", color: "#fff", padding: "0 0 120px", gap: "0" }}>

        {/* Scan counter bar at top */}
        {!isPro() && (
          <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,0.06)" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--green-accent)", borderRadius: "0 2px 2px 0", transition: "width 0.5s ease" }} />
          </div>
        )}

        <div style={{ padding: "32px 24px", textAlign: "center", width: "100%" }}>
          <h2 style={{ fontSize: "32px", color: "#fff", marginBottom: "8px" }}>What are you selling?</h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
            {isPro() ? "Unlimited scans" : `${remaining} of ${FREE_SCAN_LIMIT} free scans remaining`}
          </p>
        </div>

        {/* Upload zone with viewfinder brackets */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: "relative", width: "calc(100% - 48px)", maxWidth: "340px", aspectRatio: "1",
            borderRadius: "16px", overflow: "hidden", cursor: "pointer",
            background: preview ? "transparent" : "rgba(255,255,255,0.03)",
            border: preview ? "none" : "1px solid rgba(255,255,255,0.08)",
            margin: "0 24px",
          }}
        >
          {preview ? (
            <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <>
              {/* Scan line animation */}
              <div style={{ position: "absolute", left: "12px", right: "12px", height: "1px", background: "linear-gradient(90deg, transparent, var(--green-accent), transparent)", animation: "scanLine 3s ease-in-out infinite", opacity: 0.5 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Camera size={32} style={{ color: "rgba(255,255,255,0.3)" }} />
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>Tap to upload</p>
              </div>
            </>
          )}
          {/* Corner brackets */}
          <div style={cornerStyle("tl")} />
          <div style={cornerStyle("tr")} />
          <div style={cornerStyle("bl")} />
          <div style={cornerStyle("br")} />
        </div>

        {/* Condition selector */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "24px 24px 0" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)" }}>Condition</p>
          <div style={{ display: "flex", gap: "8px" }}>
            {CONDITIONS.map(c => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                style={{
                  padding: "10px 20px", fontSize: "13px", fontWeight: 500,
                  fontFamily: "var(--font-body)", borderRadius: "50px",
                  border: condition === c ? "none" : "1px solid rgba(255,255,255,0.12)",
                  background: condition === c ? "var(--green-accent)" : "transparent",
                  color: condition === c ? "#fff" : "rgba(255,255,255,0.5)",
                  cursor: "pointer", transition: "all 0.2s ease",
                  boxShadow: condition === c ? "0 0 16px rgba(90,171,117,0.3)" : "none",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-image: add more photos */}
        {imageData && extraImages.length < 2 && (
          <div style={{ padding: "0 24px" }}>
            <button onClick={() => extraInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "rgba(255,255,255,0.5)", fontSize: "13px", fontFamily: "var(--font-body)", cursor: "pointer", width: "100%", maxWidth: "340px", justifyContent: "center" }}>
              <Camera size={14} /> Add another angle ({extraImages.length + 1}/3 photos)
            </button>
            {extraImages.length > 0 && (
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                {extraImages.map((img, i) => (
                  <div key={i} style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <img src={img.preview} alt={`Photo ${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
        <input ref={extraInputRef} type="file" accept="image/*" onChange={handleExtraImage} style={{ display: "none" }} />

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "calc(100% - 48px)", maxWidth: "340px", padding: "24px 0" }}>
          <button
            onClick={handleIdentify}
            disabled={!imageData || loading}
            className="btn-primary glow"
            style={{
              width: "100%", padding: "18px", fontSize: "16px",
              opacity: !imageData || loading ? 0.4 : 1,
            }}
          >
            {loading && <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }} />}
            {loading
              ? (scanStep === 1 ? "Uploading image..." : scanStep === 2 ? "Analyzing item..." : scanStep === 3 ? "Researching prices..." : "Preparing results...")
              : "Identify This Item"}
          </button>

          {/* Progress bar during scan */}
          {loading && (
            <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--green-accent)", transition: "width 0.5s ease", width: `${scanStep * 25}%` }} />
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={() => cameraInputRef.current?.click()} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50px", padding: "10px 20px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, fontFamily: "var(--font-body)", cursor: "pointer", transition: "all 0.2s ease" }}>
              Take Photo
            </button>
            <button onClick={() => router.push("/scan?bulk=true")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50px", padding: "10px 20px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, fontFamily: "var(--font-body)", cursor: "pointer", transition: "all 0.2s ease" }}>
              Bulk Scan
            </button>
          </div>
        </div>

        {error && (
          <div style={{ margin: "0 24px", padding: "16px 20px", background: "rgba(214,69,69,0.1)", borderRadius: "12px", border: "1px solid rgba(214,69,69,0.2)", maxWidth: "340px", textAlign: "center" }}>
            <p style={{ color: "#e74c3c", fontSize: "13px", fontWeight: 500, marginBottom: "10px" }}>{error}</p>
            <button onClick={() => { setError(null); handleIdentify() }} className="btn-sm primary" style={{ fontSize: "12px" }}>
              Try Again
            </button>
          </div>
        )}
      </main>
    </>
  )
}
