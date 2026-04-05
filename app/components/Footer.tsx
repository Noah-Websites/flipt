"use client"

import { useRouter } from "next/navigation"

export default function Footer() {
  const router = useRouter()

  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "32px 24px 120px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
      background: "var(--surface-alt)",
    }}>
      <p style={{
        fontFamily: "var(--font-heading)",
        fontStyle: "italic",
        fontSize: "20px",
        fontWeight: 700,
        color: "var(--green-primary)",
      }}>
        Flipt
      </p>
      <p style={{ fontSize: "13px", color: "var(--text-faint)" }}>
        Turn your clutter into cash.
      </p>
      <div style={{ display: "flex", gap: "24px", marginTop: "4px" }}>
        <button
          onClick={() => router.push("/privacy")}
          style={{
            background: "none", border: "none", fontFamily: "var(--font-body)",
            fontSize: "12px", fontWeight: 500, color: "var(--text-faint)",
            cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px",
          }}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => router.push("/terms")}
          style={{
            background: "none", border: "none", fontFamily: "var(--font-body)",
            fontSize: "12px", fontWeight: 500, color: "var(--text-faint)",
            cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px",
          }}
        >
          Terms of Service
        </button>
      </div>
      <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "4px" }}>
        &copy; 2026 Flipt. All rights reserved.
      </p>
    </footer>
  )
}
