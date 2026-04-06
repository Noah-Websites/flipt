"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
      <AlertTriangle size={36} style={{ color: "var(--red)", marginBottom: "16px" }} />
      <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Something went wrong</h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "320px", marginBottom: "24px", lineHeight: 1.5 }}>
        An unexpected error occurred. Please try again or go back to the home page.
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={reset} className="btn-primary" style={{ padding: "12px 24px", fontSize: "14px", gap: "6px" }}>
          <RefreshCw size={16} /> Try Again
        </button>
        <button onClick={() => window.location.href = "/"} className="btn-secondary" style={{ padding: "12px 24px", fontSize: "14px", gap: "6px" }}>
          <Home size={16} /> Home
        </button>
      </div>
    </div>
  )
}
