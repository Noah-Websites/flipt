"use client"

import { useState, useEffect } from "react"
import { Check, X, Download } from "lucide-react"
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from "../components/Motion"
import ThemeToggle from "../components/ThemeToggle"
import {
  getBizItems, addBizItem, updateBizItem, removeBizItem,
  getBizExpenses, addBizExpense, removeBizExpense,
  type BizItem, type BizExpense,
} from "../lib/storage"

export default function Business() {
  const [items, setItems] = useState<BizItem[]>([])
  const [expenses, setExpenses] = useState<BizExpense[]>([])
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<"profit" | "expenses" | "summary">("profit")

  // Form state
  const [itemName, setItemName] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [expDesc, setExpDesc] = useState("")
  const [expAmount, setExpAmount] = useState("")

  // Sell modal
  const [sellingId, setSellingId] = useState<string | null>(null)
  const [salePrice, setSalePrice] = useState("")

  useEffect(() => {
    setItems(getBizItems())
    setExpenses(getBizExpenses())
    setMounted(true)
  }, [])

  function refresh() {
    setItems(getBizItems())
    setExpenses(getBizExpenses())
  }

  function handleAddItem() {
    if (!itemName || !purchasePrice) return
    addBizItem({ name: itemName, purchasePrice: parseFloat(purchasePrice), salePrice: null, date: new Date().toISOString(), sold: false })
    setItemName(""); setPurchasePrice("")
    refresh()
  }

  function handleSell(id: string) {
    const price = parseFloat(salePrice)
    if (isNaN(price)) return
    updateBizItem(id, { salePrice: price, sold: true })
    setSellingId(null); setSalePrice("")
    refresh()
  }

  function handleAddExpense() {
    if (!expDesc || !expAmount) return
    addBizExpense({ description: expDesc, amount: parseFloat(expAmount), date: new Date().toISOString() })
    setExpDesc(""); setExpAmount("")
    refresh()
  }

  // Calculations
  const totalRevenue = items.filter(i => i.sold).reduce((s, i) => s + (i.salePrice ?? 0), 0)
  const totalCost = items.reduce((s, i) => s + i.purchasePrice, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = totalRevenue - totalCost - totalExpenses
  // Canadian self-employment: ~15% CPP + income tax (~20.5% for first bracket) ≈ ~30% effective
  const estimatedTax = Math.max(0, netProfit * 0.30)

  function handleExportCsv() {
    let csv = "Type,Name/Description,Purchase Price,Sale Price,Date\n"
    items.forEach(i => {
      csv += `Item,"${i.name}",${i.purchasePrice},${i.sold ? i.salePrice : ""},${i.date.split("T")[0]}\n`
    })
    expenses.forEach(e => {
      csv += `Expense,"${e.description}",${e.amount},,${e.date.split("T")[0]}\n`
    })
    csv += `\nSummary\nTotal Revenue,${totalRevenue}\nTotal Cost of Goods,${totalCost}\nTotal Expenses,${totalExpenses}\nNet Profit,${netProfit.toFixed(2)}\nEstimated Tax (30%),${estimatedTax.toFixed(2)}\n`

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "flipt-business-report.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  if (!mounted) return null

  const TABS = [
    { key: "profit" as const, label: "Profit Tracker" },
    { key: "expenses" as const, label: "Expenses" },
    { key: "summary" as const, label: "P&L Summary" },
  ]

  return (
    <PageTransition>
      <ThemeToggle />
      <main style={{ minHeight: "100vh", background: "#0a0d12", padding: "0 0 120px" }}>

        {/* Header */}
        <div style={{ padding: "32px 20px 20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "#00b894", marginBottom: "6px" }}>Business Dashboard</p>
          <h2 style={{ marginBottom: "4px" }}>Business Mode</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Revenue, expenses, and tax tracking</p>
        </div>

        {/* Quick stats */}
        <FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "0 20px 20px" }}>
            <div style={{ background: "#111418", border: "1px solid #1a2028", borderRadius: "14px", padding: "16px" }}>
              <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00b894", marginBottom: "4px" }}>Revenue</p>
              <p style={{ fontFamily: "monospace", fontSize: "24px", fontWeight: 700, color: "#00b894" }}>${totalRevenue.toFixed(0)}</p>
            </div>
            <div style={{ background: "#111418", border: "1px solid #1a2028", borderRadius: "14px", padding: "16px" }}>
              <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "4px" }}>Net Profit</p>
              <p style={{ fontFamily: "monospace", fontSize: "24px", fontWeight: 700, color: netProfit >= 0 ? "#00b894" : "var(--red)" }}>${netProfit.toFixed(0)}</p>
            </div>
            <div style={{ background: "#111418", border: "1px solid #1a2028", borderRadius: "14px", padding: "16px" }}>
              <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "4px" }}>Expenses</p>
              <p style={{ fontFamily: "monospace", fontSize: "24px", fontWeight: 700 }}>${totalExpenses.toFixed(0)}</p>
            </div>
            <div style={{ background: "#111418", border: "1px solid #1a2028", borderRadius: "14px", padding: "16px" }}>
              <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "4px" }}>Est. Tax</p>
              <p style={{ fontFamily: "monospace", fontSize: "24px", fontWeight: 700, color: "#e74c3c" }}>${estimatedTax.toFixed(0)}</p>
            </div>
          </div>
        </FadeUp>

        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0 20px 16px" }}>
        <div className="tab-bar" style={{ background: "#111418", borderColor: "#1a2028" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: "700",
                fontFamily: "inherit",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background: tab === t.key ? "#00b894" : "transparent",
                color: tab === t.key ? "#000" : "var(--text-secondary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        </div>

        <div style={{ width: "100%", padding: "0 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* ===== PROFIT TRACKER ===== */}
          {tab === "profit" && (
            <>
              {/* Quick stats */}
              <div style={{ display: "flex", gap: "10px" }}>
                <div className="stat-card highlight">
                  <p className="card-label" style={{ marginBottom: "2px" }}>Net Profit</p>
                  <p className="gradient-text" style={{ fontSize: "24px", fontWeight: "800" }}>${netProfit.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                  <p className="card-label" style={{ marginBottom: "2px" }}>Items</p>
                  <p style={{ fontSize: "24px", fontWeight: "800" }}>{items.length}</p>
                </div>
              </div>

              {/* Add item form */}
              <div className="card" style={{ padding: "16px" }}>
                <p className="card-label">Log New Item</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input placeholder="Item name" value={itemName} onChange={e => setItemName(e.target.value)} className="biz-input" style={{ flex: 2, minWidth: "120px" }} />
                  <input placeholder="$ Cost" type="number" min="0" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="biz-input" style={{ flex: 1, minWidth: "80px" }} />
                  <button onClick={handleAddItem} className="btn-sm primary">Add</button>
                </div>
              </div>

              {/* Items list */}
              {items.length > 0 && (
                <div className="card" style={{ padding: "0", overflow: "hidden" }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Item</th><th>Cost</th><th>Sold</th><th></th></tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: "600" }}>{item.name}</td>
                          <td>${item.purchasePrice.toFixed(2)}</td>
                          <td>
                            {item.sold ? (
                              <span style={{ color: "var(--green-accent)", fontWeight: "700" }}>${item.salePrice?.toFixed(2)}</span>
                            ) : sellingId === item.id ? (
                              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                <input type="number" min="0" step="0.01" placeholder="$" value={salePrice} onChange={e => setSalePrice(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSell(item.id)} className="biz-input" style={{ width: "70px", padding: "4px 8px", fontSize: "13px" }} autoFocus />
                                <button onClick={() => handleSell(item.id)} className="btn-sm primary" style={{ padding: "4px 8px", fontSize: "11px" }}><Check size={12} /></button>
                              </div>
                            ) : (
                              <button onClick={() => setSellingId(item.id)} className="btn-sm ghost" style={{ padding: "3px 10px", fontSize: "11px" }}>Mark Sold</button>
                            )}
                          </td>
                          <td>
                            <button onClick={() => { removeBizItem(item.id); refresh() }} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}><X size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ===== EXPENSES ===== */}
          {tab === "expenses" && (
            <>
              <div className="stat-card">
                <p className="card-label" style={{ marginBottom: "2px" }}>Total Expenses</p>
                <p style={{ fontSize: "24px", fontWeight: "800", color: "#d64545" }}>${totalExpenses.toFixed(2)}</p>
              </div>

              <div className="card" style={{ padding: "16px" }}>
                <p className="card-label">Log Expense</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input placeholder="e.g. Shipping boxes" value={expDesc} onChange={e => setExpDesc(e.target.value)} className="biz-input" style={{ flex: 2, minWidth: "120px" }} />
                  <input placeholder="$ Amount" type="number" min="0" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="biz-input" style={{ flex: 1, minWidth: "80px" }} />
                  <button onClick={handleAddExpense} className="btn-sm primary">Add</button>
                </div>
              </div>

              {expenses.length > 0 && (
                <div className="card" style={{ padding: "0", overflow: "hidden" }}>
                  <table className="data-table">
                    <thead><tr><th>Description</th><th>Amount</th><th>Date</th><th></th></tr></thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e.id}>
                          <td style={{ fontWeight: "600" }}>{e.description}</td>
                          <td>${e.amount.toFixed(2)}</td>
                          <td style={{ fontSize: "12px", color: "var(--text-faint)" }}>{new Date(e.date).toLocaleDateString("en-CA")}</td>
                          <td>
                            <button onClick={() => { removeBizExpense(e.id); refresh() }} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}><X size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ===== P&L SUMMARY ===== */}
          {tab === "summary" && (
            <>
              <div className="card">
                <p className="card-label">Monthly Profit &amp; Loss</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {[
                    { label: "Total Revenue", value: totalRevenue, green: true },
                    { label: "Cost of Goods", value: -totalCost, green: false },
                    { label: "Operating Expenses", value: -totalExpenses, green: false },
                  ].map(({ label, value, green }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>{label}</span>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: green ? "var(--green-accent)" : value < 0 ? "#d64545" : "var(--text)" }}>
                        {value >= 0 ? "+" : ""}${value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "2px solid var(--border)" }}>
                    <span style={{ fontSize: "16px", fontWeight: "800" }}>Net Profit</span>
                    <span className="gradient-text" style={{ fontSize: "20px", fontWeight: "800" }}>${netProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Tax estimate */}
              <div className="card" style={{ background: "var(--green-light)" }}>
                <p className="card-label">Canadian Tax Estimate</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.5 }}>
                  Based on self-employment income: ~15% CPP contributions + ~15% federal/provincial income tax on first bracket.
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                  <div>
                    <p style={{ fontSize: "12px", color: "var(--text-faint)", fontWeight: "600" }}>Estimated Tax Owed (~30%)</p>
                    <p style={{ fontSize: "24px", fontWeight: "800", color: netProfit > 0 ? "#d64545" : "var(--text-faint)" }}>
                      ${estimatedTax.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", color: "var(--text-faint)", fontWeight: "600" }}>After Tax</p>
                    <p className="gradient-text" style={{ fontSize: "24px", fontWeight: "800" }}>
                      ${(netProfit - estimatedTax).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "8px" }}>
                  This is an estimate only. Consult a tax professional for accurate filing.
                </p>
              </div>

              {/* Export */}
              <button onClick={handleExportCsv} className="btn-primary" style={{ width: "100%" }}>
                <Download size={16} /> Export to CSV
              </button>
            </>
          )}
        </div>
      </main>
    </PageTransition>
  )
}
