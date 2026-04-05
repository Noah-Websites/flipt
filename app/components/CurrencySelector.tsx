"use client"

import { useState, useMemo } from "react"
import { Search, Check } from "lucide-react"
import { CURRENCIES, POPULAR_CODES, type Currency } from "../lib/currency"

interface Props {
  selected: string
  onSelect: (code: string) => void
  onDone: () => void
  fullScreen?: boolean
}

export default function CurrencySelector({ selected, onSelect, onDone, fullScreen = false }: Props) {
  const [search, setSearch] = useState("")

  const popular = useMemo(() => CURRENCIES.filter(c => POPULAR_CODES.includes(c.code)), [])
  const filtered = useMemo(() => {
    if (!search.trim()) return CURRENCIES
    const q = search.toLowerCase()
    return CURRENCIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.symbol.includes(q)
    )
  }, [search])

  const showPopular = !search.trim()

  function handleSelect(code: string) {
    onSelect(code)
  }

  const containerStyle = fullScreen
    ? { minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" as const }
    : { background: "var(--bg)", display: "flex", flexDirection: "column" as const, maxHeight: "80vh" }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ padding: "32px 20px 16px", flexShrink: 0 }}>
        {fullScreen && (
          <>
            <h2 style={{ marginBottom: "6px" }}>What&apos;s your currency?</h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>We&apos;ll show all prices in your local currency</p>
          </>
        )}
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
          <input
            type="text"
            placeholder="Search currencies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input search"
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {showPopular && (
          <>
            <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", padding: "8px 20px" }}>Popular</p>
            {popular.map(c => (
              <CurrencyRow key={c.code} currency={c} selected={selected === c.code} onSelect={handleSelect} />
            ))}
            <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", padding: "16px 20px 8px" }}>All Currencies</p>
          </>
        )}
        {filtered.map(c => (
          <CurrencyRow key={c.code} currency={c} selected={selected === c.code} onSelect={handleSelect} />
        ))}
        {filtered.length === 0 && (
          <p style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>No currencies found</p>
        )}
      </div>

      {/* Continue button */}
      <div style={{ padding: "16px 20px 32px", flexShrink: 0 }}>
        <button onClick={onDone} className="btn-primary full">
          Continue
        </button>
      </div>
    </div>
  )
}

function CurrencyRow({ currency, selected, onSelect }: { currency: Currency; selected: boolean; onSelect: (code: string) => void }) {
  return (
    <button
      onClick={() => onSelect(currency.code)}
      style={{
        display: "flex", alignItems: "center", gap: "14px", width: "100%",
        padding: "12px 20px", background: selected ? "var(--green-light)" : "none",
        border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
        fontFamily: "var(--font-body)", textAlign: "left", minHeight: "52px",
        transition: "background 0.1s ease",
      }}
    >
      <span style={{ fontSize: "24px", width: "32px", textAlign: "center" }}>{currency.flag}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>{currency.name}</p>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{currency.code} · {currency.symbol}</p>
      </div>
      {selected && <Check size={18} style={{ color: "var(--green-accent)", flexShrink: 0 }} />}
    </button>
  )
}
