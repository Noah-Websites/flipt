"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

interface Props {
  icon: ReactNode
  title: string
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export default function CollapsibleSection({ icon, title, badge, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "var(--text)",
          textAlign: "left",
        }}
      >
        <span style={{ color: "var(--text-muted)", flexShrink: 0, display: "flex" }}>{icon}</span>
        <span style={{ fontSize: "14px", fontWeight: "600", flex: 1, fontFamily: "var(--font-body)" }}>{title}</span>
        {badge && <span style={{ flexShrink: 0 }}>{badge}</span>}
        <ChevronDown
          size={16}
          style={{
            color: "var(--text-faint)",
            flexShrink: 0,
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ paddingTop: "16px" }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
