"use client"

import { useState, useEffect } from "react"
import { Gem, Search, Check, Loader2, Sparkles } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import ThemeToggle from "../components/ThemeToggle"

interface GemItem { name: string; category: string; whyValuable: string; avgValue: number; valueLow: number; valueHigh: number; bestPlatform: string; surpriseFactor: "Low" | "Medium" | "High" }
interface SearchResult { item: string; worthSelling: boolean; avgValue: number; valueLow: number; valueHigh: number; bestPlatform: string; verdict: string }

const CHECKLIST_KEY = "flipt-gem-checklist"
function getChecklist(): string[] { if (typeof window === "undefined") return []; const r = localStorage.getItem(CHECKLIST_KEY); return r ? JSON.parse(r) : [] }
function toggleChecklist(name: string): string[] { const l = getChecklist(); const i = l.indexOf(name); if (i >= 0) l.splice(i, 1); else l.push(name); localStorage.setItem(CHECKLIST_KEY, JSON.stringify(l)); return [...l] }

export default function Gems() {
  const [gems, setGems] = useState<GemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [checklist, setChecklist] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setChecklist(getChecklist()); setMounted(true) }, [])

  async function loadGems() { setLoading(true); try { const r = await fetch("/api/gems"); const d = await r.json(); if (d.gems) setGems(d.gems) } catch {} setLoading(false) }
  async function handleSearch() { if (!search.trim()) return; setSearching(true); setSearchResult(null); try { const r = await fetch("/api/gems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: search }) }); const d = await r.json(); if (!d.error) setSearchResult(d) } catch {} setSearching(false) }

  if (!mounted) return null

  const gold = "#c9a84c"
  const goldLight = "rgba(201,168,76,0.08)"
  const goldBorder = "rgba(201,168,76,0.2)"

  return (
    <PageTransition>
      <ThemeToggle />
      <main style={{ minHeight: "100vh", background: "#0d0b08", padding: "0 0 120px" }}>

        {/* Header */}
        <div style={{ padding: "32px 20px 24px", textAlign: "center" }}>
          <Gem size={28} style={{ color: gold, margin: "0 auto 12px" }} />
          <h2 style={{ color: gold, marginBottom: "6px" }}>Hidden Gems</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Valuable items hiding in your home</p>
        </div>

        {/* Search */}
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: gold, marginBottom: "8px" }}>Check any item</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
              <input type="text" placeholder="Type any household item..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} className="input search" />
            </div>
            <button onClick={handleSearch} disabled={searching || !search.trim()} className="btn-sm primary" style={{ background: gold, minWidth: "64px" }}>
              {searching ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : "Check"}
            </button>
          </div>

          {searchResult && (
            <FadeUp>
              <div style={{ marginTop: "12px", padding: "16px", background: searchResult.worthSelling ? goldLight : "rgba(224,82,82,0.06)", border: `1px solid ${searchResult.worthSelling ? goldBorder : "rgba(224,82,82,0.15)"}`, borderRadius: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <p style={{ fontSize: "16px", fontWeight: 700 }}>{searchResult.item}</p>
                  <span className={`badge ${searchResult.worthSelling ? "gold" : "red"}`}>{searchResult.worthSelling ? "Worth Selling" : "Not Worth It"}</span>
                </div>
                {searchResult.worthSelling && <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-heading)", color: gold, marginBottom: "4px" }}>${searchResult.valueLow} – ${searchResult.valueHigh}</p>}
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{searchResult.verdict}</p>
              </div>
            </FadeUp>
          )}
        </div>

        {/* Gems list */}
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={14} style={{ color: gold }} />
              <p style={{ fontSize: "13px", fontWeight: 600, color: gold }}>Gems to Check</p>
            </div>
            {checklist.length > 0 && <span style={{ fontSize: "12px", color: gold, fontWeight: 600 }}>{checklist.length} found</span>}
          </div>

          {gems.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Gem size={36} style={{ color: gold, opacity: 0.3, margin: "0 auto 14px" }} />
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>AI-curated list of surprisingly valuable items</p>
              <button onClick={loadGems} className="btn-primary" style={{ background: gold, color: "#0d0b08" }}>Discover Hidden Gems</button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <span className="spinner" style={{ borderTopColor: gold }} />
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px" }}>Searching for hidden gems...</p>
            </div>
          )}

          {gems.length > 0 && (
            <StaggerContainer>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {gems.map((gem, i) => {
                  const isChecked = checklist.includes(gem.name)
                  return (
                    <StaggerItem key={i}>
                      <div style={{
                        background: isChecked ? goldLight : "var(--surface)", border: `1px solid ${isChecked ? gold : goldBorder}`,
                        borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "6px",
                        borderLeft: `3px solid ${gold}`, cursor: "pointer", transition: "all 0.15s ease",
                      }} onClick={() => setChecklist(toggleChecklist(gem.name))}>
                        <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>{gem.name}</p>
                        <p style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-heading)", color: gold }}>${gem.avgValue}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>{gem.whyValuable}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                          <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>{gem.bestPlatform}</span>
                          {isChecked && <Check size={14} style={{ color: gold }} />}
                        </div>
                      </div>
                    </StaggerItem>
                  )
                })}
              </div>
            </StaggerContainer>
          )}
        </div>
      </main>
    </PageTransition>
  )
}
