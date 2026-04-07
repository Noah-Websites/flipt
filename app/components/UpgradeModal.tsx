"use client"

import { useRouter } from "next/navigation"
import { X, Lock, Sparkles, Crown } from "lucide-react"

interface Props {
  feature: string
  plan: "pro" | "business"
  onClose: () => void
}

const PLAN_INFO = {
  pro: { name: "Pro", price: "$4.99", period: "month", yearly: "$39.99/year", color: "var(--green-accent)", icon: Sparkles },
  business: { name: "Business", price: "$14.99", period: "month", yearly: "$119.99/year", color: "var(--gold)", icon: Crown },
}

export default function UpgradeModal({ feature, plan, onClose }: Props) {
  const router = useRouter()
  const info = PLAN_INFO[plan]
  const Icon = info.icon

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: "center", paddingTop: "32px" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: "4px" }}>
          <X size={20} />
        </button>

        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: plan === "pro" ? "var(--green-light)" : "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon size={24} style={{ color: info.color }} />
        </div>

        <h3 style={{ fontSize: "22px", marginBottom: "6px" }}>Unlock {feature}</h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "20px", maxWidth: "280px", margin: "0 auto 20px" }}>
          This feature is included in Flipt {info.name}. Upgrade to access it and more.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontWeight: 700, color: info.color }}>{info.price}</span>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>/{info.period}</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>or {info.yearly} <span style={{ fontSize: "11px", fontWeight: 700, color: plan === "pro" ? "var(--green-accent)" : "var(--gold)" }}>Save 33%</span></p>
        </div>

        <button
          onClick={() => { onClose(); router.push("/settings") }}
          style={{
            width: "100%", padding: "16px", fontSize: "15px", fontWeight: 600,
            fontFamily: "var(--font-body)", background: plan === "pro" ? "var(--green)" : "var(--gold)",
            color: "#fff", border: "none", borderRadius: "50px", cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          Upgrade to {info.name}
        </button>
        <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-faint)", cursor: "pointer", padding: "8px" }}>
          Maybe Later
        </button>
      </div>
    </div>
  )
}

// Locked feature overlay for blurred sections
export function LockedOverlay({ label, plan, onClick }: { label: string; plan: "pro" | "business"; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative", borderRadius: "14px", overflow: "hidden", cursor: "pointer",
        background: "var(--surface)", border: "1px solid var(--border)", padding: "24px",
        minHeight: "80px", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Lock size={18} style={{ color: plan === "pro" ? "var(--green-accent)" : "var(--gold)", marginBottom: "6px" }} />
        <p style={{ fontSize: "13px", fontWeight: 600, color: plan === "pro" ? "var(--green-accent)" : "var(--gold)" }}>
          {plan === "pro" ? "Pro" : "Business"} Feature
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{label}</p>
      </div>
    </div>
  )
}

// Full page lock screen
export function LockedPage({ title, description, plan, onUpgrade }: { title: string; description: string; plan: "pro" | "business"; onUpgrade: () => void }) {
  const info = PLAN_INFO[plan]
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "32px 24px", textAlign: "center" }}>
      <Lock size={36} style={{ color: info.color, marginBottom: "16px" }} />
      <h3 style={{ fontSize: "22px", marginBottom: "6px" }}>{title}</h3>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "300px", lineHeight: 1.5, marginBottom: "24px" }}>{description}</p>
      <button
        onClick={onUpgrade}
        style={{
          padding: "16px 40px", fontSize: "15px", fontWeight: 600,
          fontFamily: "var(--font-body)", background: plan === "pro" ? "var(--green)" : "var(--gold)",
          color: "#fff", border: "none", borderRadius: "50px", cursor: "pointer",
        }}
      >
        Upgrade to {info.name} — {info.price}/{info.period}
      </button>
    </div>
  )
}
