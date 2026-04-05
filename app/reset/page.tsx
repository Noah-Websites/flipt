"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, RotateCcw } from "lucide-react"

export default function Reset() {
  const router = useRouter()
  const [cleared, setCleared] = useState(false)

  function handleReset() {
    localStorage.clear()
    sessionStorage.clear()
    setCleared(true)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "48px 24px", gap: "24px", textAlign: "center" }}>
      {!cleared ? (
        <>
          <AlertTriangle size={40} style={{ color: "var(--red)" }} />
          <h2>Reset Flipt</h2>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", maxWidth: "340px", lineHeight: 1.6 }}>
            This will clear all your data including scan history, closet, watchlist, marketplace listings, business data, and preferences. This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleReset} className="btn-sm danger" style={{ padding: "12px 24px", fontSize: "14px", gap: "6px" }}>
              <RotateCcw size={14} /> Clear All Data
            </button>
            <button onClick={() => router.push("/")} className="btn-sm ghost" style={{ padding: "12px 24px", fontSize: "14px" }}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <Check size={40} style={{ color: "var(--green-primary)" }} />
          <h2>Data Cleared</h2>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", maxWidth: "340px", lineHeight: 1.6 }}>
            All Flipt data has been cleared. The app will show the first-time experience on next visit.
          </p>
          <button onClick={() => { window.location.href = "/" }} className="btn-primary" style={{ padding: "14px 32px" }}>
            Start Fresh
          </button>
        </>
      )}
    </div>
  )
}
