"use client"

import { useRouter } from "next/navigation"
import { Scan } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <main style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: "48px 24px", textAlign: "center", gap: "20px",
    }}>
      {/* Flipt logo */}
      <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "36px", fontWeight: 700, color: "#fff" }}>F</span>
      </div>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700 }}>
        Looks like this item has already been sold
      </h1>

      <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "340px", lineHeight: 1.6 }}>
        The page you&apos;re looking for doesn&apos;t exist. Maybe it sold faster than expected.
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={() => router.push("/")} className="btn-primary" style={{ padding: "14px 28px" }}>
          Back to Home
        </button>
        <button onClick={() => router.push("/scan")} className="btn-secondary" style={{ padding: "14px 28px", gap: "6px" }}>
          <Scan size={16} /> Scan Something
        </button>
      </div>
    </main>
  )
}
