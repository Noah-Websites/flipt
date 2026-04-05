"use client"

import { useRouter } from "next/navigation"
import { X, Sparkles } from "lucide-react"

interface Props {
  feature: string
  plan: "pro" | "business"
  onClose: () => void
}

const PRICES = {
  pro: { monthly: "$5.99/mo", yearly: "$47.99/yr" },
  business: { monthly: "$14.99/mo", yearly: "$119.99/yr" },
}

export default function UpgradeModal({ feature, plan, onClose }: Props) {
  const router = useRouter()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: "center", maxWidth: "380px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: plan === "pro" ? "var(--green-light)" : "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Sparkles size={24} style={{ color: plan === "pro" ? "var(--green-primary)" : "var(--gold)" }} />
        </div>

        <h3 style={{ fontSize: "22px", marginBottom: "8px" }}>Unlock {feature}</h3>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "20px" }}>
          This feature is available on the <strong>Flipt {plan === "pro" ? "Pro" : "Business"}</strong> plan.
          Upgrade to access it and dozens of other powerful selling tools.
        </p>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "16px" }}>
          <span className={`plan-badge ${plan}`} style={{ fontSize: "12px", padding: "4px 12px" }}>
            {plan === "pro" ? "Pro" : "Business"}
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Starting at {PRICES[plan].monthly}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={() => { onClose(); router.push("/settings") }} className="btn-primary" style={{ width: "100%" }}>
            View Plans
          </button>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontFamily: "var(--font-body)",
            fontSize: "14px", fontWeight: 500, color: "var(--text-faint)", cursor: "pointer", padding: "8px",
          }}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
