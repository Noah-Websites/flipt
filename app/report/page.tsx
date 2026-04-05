"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import ThemeToggle from "../components/ThemeToggle"
import { PageTransition } from "../components/Motion"
import { getBulkReport, bulkAddToCloset, type BulkReportItem } from "../lib/storage"

export default function Report() {
  const router = useRouter()
  const [items, setItems] = useState<BulkReportItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [addedToCloset, setAddedToCloset] = useState(false)

  useEffect(() => {
    const report = getBulkReport()
    if (!report.length) { router.push("/scan?bulk=true"); return }
    setItems(report)
    setMounted(true)
  }, [router])

  const totalLow = items.reduce((s, i) => s + i.valueLow, 0)
  const totalHigh = items.reduce((s, i) => s + i.valueHigh, 0)

  function handleAddAll() {
    bulkAddToCloset(items)
    setAddedToCloset(true)
  }

  function handleDownloadPdf() {
    // Generate a printable version
    const content = items.map(i =>
      `${i.item}\nCondition: ${i.condition}\nEstimated Value: $${i.valueLow} – $${i.valueHigh}\nBest Platform: ${i.platform.split(/[,.—–]/)[0].trim()}\n`
    ).join("\n---\n\n")

    const full = `FLIPT — Room Cleanout Report\n${"=".repeat(35)}\n\nTotal Estimated Value: $${totalLow} – $${totalHigh}\nItems Scanned: ${items.length}\n\n${"=".repeat(35)}\n\n${content}`

    const blob = new Blob([full], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "flipt-cleanout-report.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!mounted) return null

  return (
    <PageTransition>
      <ThemeToggle />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "32px 16px 120px", gap: "24px" }}>
        <h2>Room Cleanout Report</h2>

        <p style={{ fontSize: "15px", color: "var(--text-muted)" }}>
          {items.length} item{items.length !== 1 ? "s" : ""} scanned
        </p>

        {/* Total value */}
        <div className="card value-card" style={{ width: "100%", maxWidth: "520px", textAlign: "center" }}>
          <p className="card-label">Total Estimated Value</p>
          <p className="gradient-text" style={{ fontSize: "38px", fontWeight: "800" }}>
            ${totalLow} &ndash; ${totalHigh}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={handleDownloadPdf} className="btn-sm ghost">
            Download Report
          </button>
          {!addedToCloset ? (
            <button onClick={handleAddAll} className="btn-sm primary">
              Add All to Closet
            </button>
          ) : (
            <button onClick={() => router.push("/closet")} className="btn-sm ghost" style={{ color: "var(--green-accent)", borderColor: "var(--green-accent)" }}>
              <Check size={14} style={{ color: "var(--green-accent)" }} /> Added — View Closet
            </button>
          )}
        </div>

        {/* Items list */}
        <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((item, i) => (
            <div key={i} className="report-row">
              {item.imageUrl && (
                <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border-subtle)" }}>
                  <img src={item.imageUrl} alt={item.item} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: "700", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.item}
                </p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
                  <span className="platform-badge">{item.condition}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>
                    {item.platform.split(/[,.—–]/)[0].trim()}
                  </span>
                </div>
              </div>
              <p className="gradient-text" style={{ fontSize: "16px", fontWeight: "800", flexShrink: 0 }}>
                ${item.valueLow}–${item.valueHigh}
              </p>
            </div>
          ))}
        </div>

        <button onClick={() => router.push("/scan?bulk=true")} className="btn-primary" style={{ marginTop: "8px" }}>
          Scan More Items
        </button>
      </main>
    </PageTransition>
  )
}
