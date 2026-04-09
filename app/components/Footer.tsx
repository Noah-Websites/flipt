"use client"

import { useRouter } from "next/navigation"

export default function Footer() {
  const router = useRouter()

  const linkStyle = {
    background: "none", border: "none", fontFamily: "var(--font-body)",
    fontSize: "12px", fontWeight: 500 as const, color: "var(--text-faint)",
    cursor: "pointer", textDecoration: "underline" as const, textUnderlineOffset: "2px",
  }

  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "32px 24px 120px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "14px",
      background: "var(--surface-alt)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "16px", fontWeight: 700, color: "#fff" }}>F</span>
        </div>
        <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "20px", fontWeight: 700, color: "var(--text-secondary)" }}>
          Flipt
        </p>
      </div>

      <p style={{ fontSize: "13px", color: "var(--text-faint)" }}>
        Turn your clutter into cash.
      </p>

      {/* Social links */}
      <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
        {[
          { label: "Reddit", href: "https://www.reddit.com/user/FliptAppOfficial" },
          { label: "Instagram", href: "https://www.instagram.com/flipt.app" },
          { label: "TikTok", href: "https://www.tiktok.com/@flipt.app" },
          { label: "X", href: "https://www.x.com/fliptofficial" },
        ].map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-faint)", textDecoration: "none", transition: "color 0.15s" }}>
            {s.label}
          </a>
        ))}
      </div>

      {/* App store badges */}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <div style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "10px", fontWeight: 600, color: "var(--text-faint)", textAlign: "center" }}>
          App Store — Coming Soon
        </div>
        <div style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "10px", fontWeight: 600, color: "var(--text-faint)", textAlign: "center" }}>
          Google Play — Coming Soon
        </div>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "24px", marginTop: "4px" }}>
        <button onClick={() => router.push("/privacy")} style={linkStyle}>Privacy Policy</button>
        <button onClick={() => router.push("/terms")} style={linkStyle}>Terms of Service</button>
      </div>

      <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "4px" }}>
        &copy; 2026 Flipt Technologies Inc.
      </p>
      <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>
        Built with love in Ottawa, Canada
      </p>
    </footer>
  )
}
