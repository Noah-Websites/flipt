"use client"

import { useRouter } from "next/navigation"
import { MessageSquare, BarChart3, ArrowRight, Briefcase } from "lucide-react"
import { PageTransition, FadeUp } from "../components/Motion"

export default function BusinessTools() {
  const router = useRouter()

  return (
    <PageTransition>
      <main style={{ minHeight: "100vh", padding: "0 0 120px" }}>
        <div style={{ padding: "32px 20px 8px" }}>
          <h2 style={{ marginBottom: "4px" }}>Business Tools</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Professional tools for serious sellers</p>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <FadeUp>
            <div
              onClick={() => router.push("/offer-manager")}
              className="card"
              style={{ cursor: "pointer", borderColor: "var(--gold)", borderLeft: "3px solid var(--gold)", padding: "24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--gold-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageSquare size={20} style={{ color: "var(--gold)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>Offer Manager</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Business plan</p>
                </div>
                <ArrowRight size={16} style={{ color: "var(--gold)" }} />
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Analyze buyer offers, get AI-powered counter-offer suggestions, and never leave money on the table
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div
              onClick={() => router.push("/market")}
              className="card"
              style={{ cursor: "pointer", borderColor: "var(--gold)", borderLeft: "3px solid var(--gold)", padding: "24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--gold-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={20} style={{ color: "var(--gold)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>Market Report</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Business plan</p>
                </div>
                <ArrowRight size={16} style={{ color: "var(--gold)" }} />
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Weekly trending items, platform performance data, and AI-powered market intelligence
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div
              onClick={() => router.push("/business")}
              className="card"
              style={{ cursor: "pointer", borderColor: "var(--gold)", borderLeft: "3px solid var(--gold)", padding: "24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--gold-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Briefcase size={20} style={{ color: "var(--gold)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>Business Mode</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Business plan</p>
                </div>
                <ArrowRight size={16} style={{ color: "var(--gold)" }} />
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Track revenue, expenses, profit and loss, estimated taxes, and export reports
              </p>
            </div>
          </FadeUp>
        </div>
      </main>
    </PageTransition>
  )
}
