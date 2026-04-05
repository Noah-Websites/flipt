"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import ThemeToggle from "../components/ThemeToggle"
import { getReferralCode, getReferralCount, getBonusScans } from "../lib/storage"

export default function Referral() {
  const [code, setCode] = useState("")
  const [count, setCount] = useState(0)
  const [bonus, setBonus] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCode(getReferralCode())
    setCount(getReferralCount())
    setBonus(getBonusScans())
    setMounted(true)
  }, [])

  const link = mounted ? `${window.location.origin}/?ref=${code}` : ""

  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted) return null

  return (
    <PageTransition>
      <ThemeToggle />
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>

        {/* Celebratory header */}
        <div style={{ padding: "40px 20px 28px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(82,183,136,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
          <h2 style={{ position: "relative", marginBottom: "6px" }}>Refer Friends</h2>
          <p style={{ position: "relative", fontSize: "14px", color: "var(--text-secondary)", maxWidth: "320px", margin: "0 auto", lineHeight: 1.5 }}>
            Give 5 free scans, earn 3 bonus for every friend who joins.
          </p>
        </div>

        {/* Stats as achievement badges */}
        <div style={{ display: "flex", gap: "10px", padding: "0 20px 20px" }}>
          <div style={{ flex: 1, background: "var(--green-light)", border: "1px solid rgba(82,183,136,0.15)", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
            <p className="card-label" style={{ marginBottom: "4px" }}>Friends Referred</p>
            <p style={{ fontSize: "28px", fontWeight: "800" }}>{count}</p>
          </div>
          <div style={{ flex: 1, background: "var(--green-light)", border: "1px solid rgba(82,183,136,0.15)", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
            <p className="card-label" style={{ marginBottom: "4px" }}>Bonus Scans</p>
            <p style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--green-accent)" }}>{bonus}</p>
          </div>
        </div>

        {/* Referral code */}
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
          <p className="card-label">Your Referral Link</p>
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-muted)",
            wordBreak: "break-all",
            marginBottom: "14px",
          }}>
            {link}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={copy} className="btn-sm primary" style={{ flex: 1 }}>
              {copied ? <><Check size={14} style={{ color: "var(--green-accent)" }} /> Copied!</> : "Copy Link"}
            </button>
            <button
              onClick={() => {
                const text = `Check out Flipt — it scans your stuff and tells you what it's worth! Get 5 free scans: ${link}`
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
              }}
              className="share-btn whatsapp"
              style={{ flex: 1, justifyContent: "center" }}
            >
              Share on WhatsApp
            </button>
          </div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: "0 20px" }}>
        <div className="card" style={{ width: "100%" }}>
          <p className="card-label">How It Works</p>
          {[
            { step: "1", text: "Share your unique link with friends" },
            { step: "2", text: "They get 5 free scans when they sign up" },
            { step: "3", text: "You earn 3 bonus scans per referral" },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, var(--green-primary), var(--green-accent))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", flexShrink: 0 }}>
                {step}
              </div>
              <p style={{ fontSize: "14px", fontWeight: "500" }}>{text}</p>
            </div>
          ))}
        </div>
        </div>
      </main>
    </PageTransition>
  )
}
