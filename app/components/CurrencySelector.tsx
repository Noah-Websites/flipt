"use client"

import { useState, useMemo } from "react"
import { Search, Check } from "lucide-react"
import { CURRENCIES, POPULAR_CODES, type Currency } from "../lib/currency"

interface Props {
  selected: string
  onSelect: (code: string) => void
  onDone: () => void
  fullScreen?: boolean
  autoAdvance?: boolean
}

export default function CurrencySelector({ selected, onSelect, onDone, fullScreen = false, autoAdvance = false }: Props) {
  const [search, setSearch] = useState("")
  const [justSelected, setJustSelected] = useState<string | null>(null)

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
    if (autoAdvance) {
      setJustSelected(code)
      setTimeout(() => {
        onDone()
      }, 500)
    }
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
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>Tap to select — we&apos;ll show all prices in your local currency</p>
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
              <CurrencyRow key={`pop-${c.code}`} currency={c} selected={selected === c.code} justSelected={justSelected === c.code} onSelect={handleSelect} />
            ))}
            <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", padding: "16px 20px 8px" }}>All Currencies</p>
          </>
        )}
        {filtered.map(c => (
          <CurrencyRow key={c.code} currency={c} selected={selected === c.code} justSelected={justSelected === c.code} onSelect={handleSelect} />
        ))}
        {filtered.length === 0 && (
          <p style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>No currencies found</p>
        )}
      </div>

      {/* Continue button only for non-auto-advance (settings modal) */}
      {!autoAdvance && (
        <div style={{ padding: "16px 20px 32px", flexShrink: 0 }}>
          <button onClick={onDone} className="btn-primary full">
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

function CurrencyRow({ currency, selected, justSelected, onSelect }: {
  currency: Currency; selected: boolean; justSelected: boolean; onSelect: (code: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(currency.code)}
      style={{
        display: "flex", alignItems: "center", gap: "14px", width: "100%",
        padding: "14px 20px",
        background: justSelected ? "var(--green-light)" : selected ? "var(--green-light)" : "none",
        border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
        fontFamily: "var(--font-body)", textAlign: "left", minHeight: "56px",
        transition: "background 0.15s ease",
      }}
    >
      <span style={{ fontSize: "26px", width: "36px", textAlign: "center" }}>{currency.flag}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>{currency.name}</p>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{currency.code} · {currency.symbol}</p>
      </div>
      {(selected || justSelected) && (
        <div style={{
          width: "24px", height: "24px", borderRadius: "50%",
          background: "var(--green-accent)", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "transform 0.2s ease",
          transform: justSelected ? "scale(1.1)" : "scale(1)",
        }}>
          <Check size={14} color="#fff" />
        </div>
      )}
    </button>
  )
}
