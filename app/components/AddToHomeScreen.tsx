"use client"

import { useState, useEffect } from "react"
import { X, Plus, Share } from "lucide-react"

const VISIT_KEY = "flipt-visit-count"
const DISMISSED_KEY = "flipt-a2hs-dismissed"

export default function AddToHomeScreen() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if ((window.navigator as unknown as { standalone?: boolean }).standalone) return

    // Don't show on desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (!isMobile) return

    // Don't show if dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "true") return

    // Count visits
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) + 1
    localStorage.setItem(VISIT_KEY, String(visits))

    // Show after 3rd visit
    if (visits >= 3) {
      setTimeout(() => setShow(true), 2000)
    }
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem(DISMISSED_KEY, "true")
  }

  if (!show) return null

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  return (
    <div style={{
      position: "fixed", bottom: "80px", left: "12px", right: "12px", zIndex: 150,
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px",
      padding: "16px 20px", boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      animation: "fadeIn 0.3s ease",
    }}>
      <button onClick={dismiss} style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: "4px" }} aria-label="Dismiss">
        <X size={16} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "20px", fontWeight: 700, color: "#fff" }}>F</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>Add Flipt to your home screen</p>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {isIOS
              ? <>Tap <Share size={11} style={{ display: "inline", verticalAlign: "middle" }} /> then &ldquo;Add to Home Screen&rdquo;</>
              : <>Tap the menu then &ldquo;Add to Home Screen&rdquo;</>
            }
          </p>
        </div>
      </div>
    </div>
  )
}
