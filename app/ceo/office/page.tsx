"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const AUTH_KEY = "flipt-ceo-auth"
const PASSWORD = "FliptCEO2026"

// ===== TYPES =====
interface Agent {
  id: string; name: string; title: string; dept: string; floor: number
  x: number; y: number; // grid position on floor
  color: string; hair: string; outfit: string
  status: "working" | "idle" | "meeting" | "walking"
  animFrame: number; bobOffset: number; lookDir: "down" | "left" | "right" | "up"
  tasks: number
}

interface ActivityEntry { agent_name: string; action: string; created_at: string }

// ===== AGENT DATA =====
const AGENTS: Agent[] = [
  // Floor 1 - Executive
  { id: "noah", name: "Noah", title: "CEO & Founder", dept: "Executive", floor: 1, x: 2, y: 3, color: "#c9a84c", hair: "#e8c86a", outfit: "#1a1a1a", status: "working", animFrame: 0, bobOffset: 0, lookDir: "down", tasks: 0 },
  { id: "sophie", name: "Sophie Mitchell", title: "CFO Agent", dept: "Finance", floor: 1, x: 8, y: 3, color: "#2d5a3d", hair: "#8b4513", outfit: "#1a2744", status: "working", animFrame: 0, bobOffset: 0.5, lookDir: "down", tasks: 0 },
  { id: "oliver", name: "Oliver", title: "Finance Analyst", dept: "Finance", floor: 1, x: 9, y: 4, color: "#2d5a3d", hair: "#1a1a1a", outfit: "#1a2744", status: "idle", animFrame: 0, bobOffset: 1.2, lookDir: "left", tasks: 0 },
  { id: "james", name: "James Thompson", title: "COO Agent", dept: "Operations", floor: 1, x: 14, y: 3, color: "#52b788", hair: "#6b4226", outfit: "#4a4a4a", status: "working", animFrame: 0, bobOffset: 0.8, lookDir: "down", tasks: 0 },
  { id: "ava", name: "Ava", title: "Ops Specialist", dept: "Operations", floor: 1, x: 15, y: 4, color: "#52b788", hair: "#1a1a1a", outfit: "#4a4a4a", status: "idle", animFrame: 0, bobOffset: 1.5, lookDir: "right", tasks: 0 },

  // Floor 2 - Technology
  { id: "marcus", name: "Marcus Webb", title: "CTO Agent", dept: "Technology", floor: 2, x: 8, y: 3, color: "#52b788", hair: "#1a1a1a", outfit: "#2d6a4f", status: "working", animFrame: 0, bobOffset: 0, lookDir: "down", tasks: 0 },
  { id: "zoe", name: "Zoe", title: "Frontend Engineer", dept: "Technology", floor: 2, x: 5, y: 2, color: "#9b59b6", hair: "#9b59b6", outfit: "#6c3483", status: "working", animFrame: 0, bobOffset: 0.7, lookDir: "down", tasks: 0 },
  { id: "ethan", name: "Ethan", title: "Backend Engineer", dept: "Technology", floor: 2, x: 11, y: 2, color: "#7f8c8d", hair: "#6b4226", outfit: "#5d6d7e", status: "idle", animFrame: 0, bobOffset: 1.1, lookDir: "left", tasks: 0 },
  { id: "luna", name: "Luna", title: "AI Engineer", dept: "Technology", floor: 2, x: 5, y: 5, color: "#3498db", hair: "#2980b9", outfit: "#1a1a1a", status: "working", animFrame: 0, bobOffset: 0.3, lookDir: "right", tasks: 0 },
  { id: "kai", name: "Kai", title: "DevOps Engineer", dept: "Technology", floor: 2, x: 11, y: 5, color: "#f1c40f", hair: "#e8c86a", outfit: "#f39c12", status: "idle", animFrame: 0, bobOffset: 1.8, lookDir: "down", tasks: 0 },

  // Floor 3 - Marketing & Product
  { id: "alex", name: "Alex Chen", title: "CMO Agent", dept: "Marketing", floor: 3, x: 3, y: 3, color: "#e74c3c", hair: "#1a1a1a", outfit: "#c0392b", status: "working", animFrame: 0, bobOffset: 0, lookDir: "down", tasks: 0 },
  { id: "maya", name: "Maya", title: "Content Creator", dept: "Marketing", floor: 3, x: 4, y: 4, color: "#e67e22", hair: "#6b4226", outfit: "#d35400", status: "idle", animFrame: 0, bobOffset: 0.9, lookDir: "down", tasks: 0 },
  { id: "jordan", name: "Jordan", title: "Social Media", dept: "Marketing", floor: 3, x: 2, y: 5, color: "#3498db", hair: "#e8c86a", outfit: "#2471a3", status: "idle", animFrame: 0, bobOffset: 1.4, lookDir: "right", tasks: 0 },
  { id: "charlotte", name: "Charlotte Lee", title: "CPO Agent", dept: "Product", floor: 3, x: 13, y: 3, color: "#f0f0f0", hair: "#1a1a1a", outfit: "#ecf0f1", status: "working", animFrame: 0, bobOffset: 0.2, lookDir: "down", tasks: 0 },
  { id: "noahk", name: "Noah Kim", title: "Product Designer", dept: "Product", floor: 3, x: 14, y: 4, color: "#d4a76a", hair: "#6b4226", outfit: "#c9a84c", status: "idle", animFrame: 0, bobOffset: 1.0, lookDir: "left", tasks: 0 },
  { id: "victor", name: "Victor", title: "Trend Spotter Agent", dept: "Special", floor: 3, x: 8, y: 6, color: "#5d6d7e", hair: "#bdc3c7", outfit: "#2c3e50", status: "idle", animFrame: 0, bobOffset: 0.6, lookDir: "down", tasks: 0 },
]

// ===== DAY/NIGHT CYCLE =====
function getTimeOfDay(): "morning" | "afternoon" | "sunset" | "night" {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return "morning"
  if (h >= 12 && h < 18) return "afternoon"
  if (h >= 18 && h < 22) return "sunset"
  return "night"
}

const PALETTES = {
  morning: { bg: "#f5f0e8", wall: "#e8e0d4", floor: "#d4cbb8", accent: "#2d6a4f", sky: "#87CEEB", light: "rgba(255,255,220,0.3)" },
  afternoon: { bg: "#f0ebe0", wall: "#e5ddd0", floor: "#d0c4b0", accent: "#2d6a4f", sky: "#5dade2", light: "rgba(255,255,200,0.2)" },
  sunset: { bg: "#2a1f1a", wall: "#3d2e24", floor: "#1e1610", accent: "#e67e22", sky: "#e74c3c", light: "rgba(255,140,60,0.15)" },
  night: { bg: "#0a0d0a", wall: "#111411", floor: "#080a08", accent: "#52b788", sky: "#0a0a2e", light: "rgba(82,183,136,0.08)" },
}

// ===== PIXEL DRAWING HELPERS =====
function drawPixelChar(ctx: CanvasRenderingContext2D, x: number, y: number, agent: Agent, scale: number, time: number) {
  const s = scale
  const bob = Math.sin((time + agent.bobOffset * 1000) / 500) * 1.5
  const cy = y + bob

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)"
  ctx.fillRect(x - s * 4, y + s * 11, s * 8, s * 2)

  // Body (outfit)
  ctx.fillStyle = agent.outfit
  ctx.fillRect(x - s * 3, cy + s * 4, s * 6, s * 5)

  // Arms typing animation
  const armWiggle = agent.status === "working" ? Math.sin(time / 150) * s : 0
  ctx.fillStyle = agent.outfit
  ctx.fillRect(x - s * 5 + armWiggle, cy + s * 5, s * 2, s * 3)
  ctx.fillRect(x + s * 3 - armWiggle, cy + s * 5, s * 2, s * 3)

  // Skin tone
  ctx.fillStyle = "#fcd5b0"

  // Head
  ctx.fillRect(x - s * 4, cy - s * 4, s * 8, s * 8)

  // Hair
  ctx.fillStyle = agent.hair
  ctx.fillRect(x - s * 4, cy - s * 5, s * 8, s * 4)
  // Hair sides
  ctx.fillRect(x - s * 5, cy - s * 4, s * 1, s * 3)
  ctx.fillRect(x + s * 4, cy - s * 4, s * 1, s * 3)

  // Eyes
  ctx.fillStyle = "#1a1a1a"
  const eyeX = agent.lookDir === "left" ? -1 : agent.lookDir === "right" ? 1 : 0
  ctx.fillRect(x - s * 2 + eyeX * s, cy, s * 1, s * 1)
  ctx.fillRect(x + s * 1 + eyeX * s, cy, s * 1, s * 1)

  // Status light
  ctx.fillStyle = agent.status === "working" ? "#52b788" : agent.status === "meeting" ? "#f1c40f" : "#5d6d7e"
  ctx.beginPath()
  ctx.arc(x, cy - s * 7, s * 1.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, palette: typeof PALETTES.morning) {
  const s = scale
  // Desk surface
  ctx.fillStyle = "#8B7355"
  ctx.fillRect(x - s * 8, y + s * 8, s * 16, s * 4)
  // Desk legs
  ctx.fillStyle = "#6B5340"
  ctx.fillRect(x - s * 7, y + s * 12, s * 2, s * 3)
  ctx.fillRect(x + s * 5, y + s * 12, s * 2, s * 3)
  // Monitor
  ctx.fillStyle = "#2c3e50"
  ctx.fillRect(x - s * 4, y + s * 2, s * 8, s * 6)
  // Screen glow
  ctx.fillStyle = palette.accent + "40"
  ctx.fillRect(x - s * 3, y + s * 3, s * 6, s * 4)
  // Screen content - scrolling lines
  ctx.fillStyle = palette.accent + "80"
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x - s * 2, y + s * 3.5 + i * s * 1.2, s * (3 + Math.random() * 2), s * 0.5)
  }
  // Monitor stand
  ctx.fillStyle = "#4a4a4a"
  ctx.fillRect(x - s * 1, y + s * 8, s * 2, s * 1)
  // Coffee cup
  ctx.fillStyle = "#ecf0f1"
  ctx.fillRect(x + s * 5, y + s * 6, s * 2, s * 2)
  ctx.fillStyle = "#6b4226"
  ctx.fillRect(x + s * 5, y + s * 6, s * 2, s * 1)
}

function drawFloor(ctx: CanvasRenderingContext2D, floorNum: number, agents: Agent[], w: number, h: number, time: number, palette: typeof PALETTES.morning) {
  const cellW = w / 18
  const cellH = h / 8

  // Floor background
  ctx.fillStyle = palette.floor
  ctx.fillRect(0, 0, w, h)

  // Wall
  ctx.fillStyle = palette.wall
  ctx.fillRect(0, 0, w, cellH * 1.5)

  // Windows
  for (let i = 0; i < 5; i++) {
    const wx = cellW * (2 + i * 3.2)
    ctx.fillStyle = palette.sky
    ctx.fillRect(wx, cellH * 0.3, cellW * 1.8, cellH * 0.9)
    // Window frame
    ctx.strokeStyle = palette.wall
    ctx.lineWidth = 2
    ctx.strokeRect(wx, cellH * 0.3, cellW * 1.8, cellH * 0.9)
    ctx.beginPath()
    ctx.moveTo(wx + cellW * 0.9, cellH * 0.3)
    ctx.lineTo(wx + cellW * 0.9, cellH * 1.2)
    ctx.stroke()
  }

  // Floor grid lines
  ctx.strokeStyle = palette.bg + "20"
  ctx.lineWidth = 0.5
  for (let i = 0; i < 18; i++) {
    ctx.beginPath()
    ctx.moveTo(i * cellW, 0)
    ctx.lineTo(i * cellW, h)
    ctx.stroke()
  }

  // Light pools
  ctx.fillStyle = palette.light
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.ellipse(cellW * (3 + i * 4), cellH * 4, cellW * 2, cellH * 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Floor label
  ctx.fillStyle = palette.accent
  ctx.font = "bold 11px 'DM Sans', sans-serif"
  ctx.textAlign = "left"
  const labels = ["", "FLOOR 1 — Executive & Finance", "FLOOR 2 — Technology", "FLOOR 3 — Marketing & Product"]
  ctx.fillText(labels[floorNum], 12, 16)

  // Wall decorations
  ctx.fillStyle = palette.accent + "60"
  ctx.font = "9px 'DM Sans', sans-serif"
  if (floorNum === 1) ctx.fillText("FLIPT HQ", cellW * 8 - 20, cellH * 0.9)
  if (floorNum === 2) ctx.fillText("// build things", cellW * 8 - 30, cellH * 0.9)
  if (floorNum === 3) ctx.fillText("TURN CLUTTER INTO CASH", cellW * 7 - 40, cellH * 0.9)

  // Clock
  const now = new Date()
  ctx.fillStyle = palette.accent
  ctx.font = "bold 10px monospace"
  ctx.textAlign = "right"
  ctx.fillText(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), w - 12, 16)
  ctx.textAlign = "left"

  // Plants
  const plantPositions = [cellW * 0.5, cellW * 17]
  for (const px of plantPositions) {
    // Pot
    ctx.fillStyle = "#8B4513"
    ctx.fillRect(px - 6, cellH * 6 + 10, 12, 8)
    // Leaves
    ctx.fillStyle = "#27ae60"
    const sway = Math.sin(time / 2000 + px) * 2
    ctx.beginPath()
    ctx.ellipse(px + sway, cellH * 6, 8, 12, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw desks and agents
  const floorAgents = agents.filter(a => a.floor === floorNum)
  for (const a of floorAgents) {
    const dx = a.x * cellW
    const dy = a.y * cellH
    drawDesk(ctx, dx, dy, 2, palette)
    drawPixelChar(ctx, dx, dy - 4, a, 2, time)

    // Name plate
    ctx.fillStyle = palette.accent + "90"
    ctx.font = "8px 'DM Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(a.name.split(" ")[0], dx, dy + cellH * 2 + 4)
    ctx.textAlign = "left"
  }
}

// ===== MAIN COMPONENT =====
export default function FliptOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState("")
  const [mounted, setMounted] = useState(false)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [agents, setAgents] = useState(AGENTS)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [ticker, setTicker] = useState("Flipt Office — All systems operational")
  const animRef = useRef<number>(0)

  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY) === "true") setAuthed(true)
    setMounted(true)
  }, [])

  // Load real activity
  useEffect(() => {
    if (!authed) return
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.from("agent_activity").select("agent_name, action, created_at").order("created_at", { ascending: false }).limit(10).then(({ data }) => {
      if (data) {
        setActivity(data)
        if (data[0]) setTicker(`${data[0].agent_name}: ${data[0].action}`)
        // Update agent statuses
        setAgents(prev => prev.map(a => {
          const recent = data.find(d => d.agent_name.toLowerCase().includes(a.dept.toLowerCase().slice(0, 3)))
          if (recent) return { ...a, status: "working" as const, tasks: a.tasks + 1 }
          return a
        }))
      }
    })

    // Subscribe to realtime changes
    const channel = sb.channel("office-activity").on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_activity" }, (payload) => {
      const entry = payload.new as ActivityEntry
      setActivity(prev => [entry, ...prev].slice(0, 10))
      setTicker(`${entry.agent_name}: ${entry.action}`)
    }).subscribe()

    return () => { sb.removeChannel(channel) }
  }, [authed])

  // Canvas animation loop
  useEffect(() => {
    if (!authed || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function animate() {
      if (!ctx || !canvas) return
      const w = canvas.width
      const h = canvas.height
      const time = performance.now()
      const tod = getTimeOfDay()
      const palette = PALETTES[tod]

      ctx.clearRect(0, 0, w, h)
      ctx.imageSmoothingEnabled = false // Pixel art crisp

      // Background
      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, w, h)

      // Randomly update agent look direction
      if (Math.random() < 0.002) {
        setAgents(prev => prev.map(a => {
          if (Math.random() < 0.15) {
            const dirs = ["down", "left", "right"] as const
            return { ...a, lookDir: dirs[Math.floor(Math.random() * dirs.length)] }
          }
          return a
        }))
      }

      // Draw current floor
      drawFloor(ctx, currentFloor, agents, w, h, time, palette)

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [authed, currentFloor, agents])

  // Handle canvas resize
  useEffect(() => {
    function resize() {
      if (!canvasRef.current) return
      canvasRef.current.width = Math.min(window.innerWidth, 900)
      canvasRef.current.height = 400
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [authed])

  // Handle canvas click for agent selection
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const cellW = canvas.width / 18
    const cellH = canvas.height / 8

    const floorAgents = agents.filter(a => a.floor === currentFloor)
    for (const a of floorAgents) {
      const ax = a.x * cellW
      const ay = a.y * cellH
      if (Math.abs(clickX - ax) < cellW && Math.abs(clickY - ay) < cellH * 1.5) {
        setSelectedAgent(a)
        return
      }
    }
    setSelectedAgent(null)
  }, [agents, currentFloor])

  if (!mounted) return null

  // Login
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0d0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "24px", color: "#52b788", marginBottom: "16px" }}>Flipt Office</p>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && pw === PASSWORD) { localStorage.setItem(AUTH_KEY, "true"); setAuthed(true) }}} placeholder="Password" style={{ padding: "12px 20px", background: "#111411", border: "1px solid #1e241e", borderRadius: "10px", color: "#f0f4f0", fontFamily: "var(--font-body)", fontSize: "14px", width: "240px" }} />
        </div>
      </div>
    )
  }

  const S = { bg: "#0a0d0a", surface: "#111411", border: "#1e241e", green: "#52b788", text: "#f0f4f0", muted: "#6b7c6b" }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${S.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "20px", color: S.green }}>Flipt Office</p>
          <span style={{ fontSize: "11px", color: S.muted, padding: "2px 8px", border: `1px solid ${S.border}`, borderRadius: "50px" }}>
            {getTimeOfDay() === "night" ? "Night Mode" : getTimeOfDay() === "sunset" ? "Sunset" : "Day Mode"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {[1, 2, 3].map(f => (
            <button key={f} onClick={() => setCurrentFloor(f)} style={{
              padding: "6px 14px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-body)",
              background: currentFloor === f ? S.green : "transparent", color: currentFloor === f ? "#000" : S.muted,
              border: `1px solid ${currentFloor === f ? S.green : S.border}`, borderRadius: "6px", cursor: "pointer",
            }}>
              F{f}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0" }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ imageRendering: "pixelated", cursor: "pointer", display: "block", width: "100%", maxWidth: "900px" }}
        />
      </div>

      {/* Agent popup */}
      {selectedAgent && (
        <div style={{ position: "fixed", bottom: "120px", left: "50%", transform: "translateX(-50%)", background: S.surface, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "18px", width: "280px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 50 }}>
          <button onClick={() => setSelectedAgent(null)} style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", color: S.muted, cursor: "pointer", fontSize: "16px" }}>x</button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: selectedAgent.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-body)" }}>
              {selectedAgent.name[0]}
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 700 }}>{selectedAgent.name}</p>
              <p style={{ fontSize: "12px", color: S.muted }}>{selectedAgent.title}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <span style={{ padding: "2px 8px", fontSize: "10px", fontWeight: 600, borderRadius: "50px", background: selectedAgent.status === "working" ? "rgba(82,183,136,0.15)" : "rgba(107,124,107,0.15)", color: selectedAgent.status === "working" ? S.green : S.muted }}>
              {selectedAgent.status}
            </span>
            <span style={{ padding: "2px 8px", fontSize: "10px", fontWeight: 600, borderRadius: "50px", background: `rgba(82,183,136,0.08)`, color: S.muted }}>{selectedAgent.dept}</span>
          </div>
          <p style={{ fontSize: "12px", color: S.muted }}>{selectedAgent.tasks} tasks completed</p>
        </div>
      )}

      {/* Live ticker */}
      <div style={{ borderTop: `1px solid ${S.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: S.green, animation: "pulseGlow 2s ease infinite" }} />
        <p style={{ fontSize: "12px", color: S.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ticker}
        </p>
      </div>

      {/* Activity log */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${S.border}` }}>
        <p style={{ fontSize: "11px", fontWeight: 600, color: S.green, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Live Activity</p>
        {activity.slice(0, 5).map((a, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", padding: "4px 0", fontSize: "12px" }}>
            <span style={{ color: S.green, fontWeight: 600, width: "80px", flexShrink: 0 }}>{a.agent_name}</span>
            <span style={{ color: S.muted, flex: 1 }}>{a.action}</span>
          </div>
        ))}
        {activity.length === 0 && <p style={{ fontSize: "12px", color: S.muted }}>No activity yet — run agents from /ceo dashboard</p>}
      </div>
    </div>
  )
}
