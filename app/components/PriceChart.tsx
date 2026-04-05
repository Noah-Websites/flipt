"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useTheme } from "./ThemeProvider"

interface PricePoint { month: string; price: number }

export default function PriceChart({ data }: { data: PricePoint[] }) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const grid = isDark ? "#333028" : "#e8e2d9"
  const text = isDark ? "#6b6560" : "#a8a29e"
  const bg = isDark ? "#1e1c19" : "#ffffff"
  const border = isDark ? "#333028" : "#e8e2d9"
  const line = isDark ? "#5aab75" : "#3d7a54"

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: text, fontWeight: 500 }} tickLine={false} axisLine={{ stroke: grid }} />
        <YAxis tick={{ fontSize: 12, fill: text, fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
        <Tooltip
          contentStyle={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: "12px", fontSize: "13px", fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          formatter={(value) => [`$${value}`, "Avg Price"]}
          labelStyle={{ color: text, fontWeight: 600, marginBottom: 4 }}
        />
        <Line type="monotone" dataKey="price" stroke={line} strokeWidth={2} dot={{ r: 3, fill: line, strokeWidth: 0 }} activeDot={{ r: 5, fill: line, stroke: bg, strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
