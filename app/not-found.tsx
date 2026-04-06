"use client"

import { useRouter } from "next/navigation"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "120px", fontWeight: 700, color: "var(--border)", lineHeight: 1 }}>404</p>
      <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Page not found</h2>
      <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "320px", marginBottom: "28px" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => router.back()} className="btn-secondary" style={{ padding: "12px 24px", fontSize: "14px", gap: "6px" }}>
          <ArrowLeft size={16} /> Go Back
        </button>
        <button onClick={() => router.push("/")} className="btn-primary" style={{ padding: "12px 24px", fontSize: "14px", gap: "6px" }}>
          <Home size={16} /> Home
        </button>
      </div>
    </div>
  )
}
