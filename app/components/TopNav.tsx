"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getPlan, type PlanTier } from "../lib/storage"

const LINKS = [
  { label: "Home", path: "/" },
  { label: "Scan", path: "/scan" },
  { label: "Feed", path: "/feed" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Profile", path: "/profile" },
  { label: "Settings", path: "/settings" },
]

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [plan, setPlan] = useState<PlanTier>("free")

  useEffect(() => { setPlan(getPlan()) }, [pathname])

  return (
    <header className="top-nav">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={() => router.push("/")} className="top-nav-logo" style={{ background: "none", border: "none", cursor: "pointer" }}>
          Flipt
        </button>
        <span className={`plan-badge ${plan}`}>{plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Business"}</span>
      </div>
      <nav className="top-nav-links">
        {LINKS.map(({ label, path }) => (
          <button key={path} onClick={() => router.push(path)} className={`top-nav-link ${pathname === path ? "active" : ""}`}>
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
