"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const AUTH_KEY = "flipt-ceo-auth"
const PASSWORD = "FliptCEO2026"

// ===== TYPES =====
interface Agent {
  id: string; name: string; short: string; title: string; room: string
  homeX: number; homeY: number // home position in room (normalized 0-1)
  hair: string; outfit: string; isLead: boolean
  status: "working" | "idle" | "walking"
  bobOff: number; look: number // 0=down 1=left 2=right 3=up
  // Walk state
  wx: number; wy: number // current world pixel position (set on init)
  targetX: number; targetY: number
  walkFrame: number; walkTimer: number
}

interface ActivityEntry { agent_name: string; action: string; created_at: string }

// ===== LAYOUT - Compact rooms =====
const W = 4 // wall thickness
const ROOMS = [
  { id: "ceo", label: "CEO Office", x: 0, y: 0, w: 160, h: 150 },
  { id: "finance", label: "Finance & Ops", x: 168, y: 0, w: 260, h: 150 },
  { id: "engineering", label: "Engineering", x: 436, y: 0, w: 290, h: 150 },
  { id: "marketing", label: "Marketing", x: 734, y: 0, w: 230, h: 150 },
  { id: "product", label: "Product", x: 972, y: 0, w: 190, h: 150 },
  { id: "special", label: "Special Ops", x: 1170, y: 0, w: 190, h: 150 },
]
const CORRIDOR_Y = 150
const CORRIDOR_H = 40
const BREAK_X = 560 // kitchen/break room position
const OFFICE_W = 1370
const CANVAS_H = 230
const HEADER = 24

// ===== AGENTS =====
function makeAgents(): Agent[] {
  const base = { status: "idle" as const, look: 0, wx: 0, wy: 0, targetX: 0, targetY: 0, walkFrame: 0, walkTimer: 0 }
  const a: Agent[] = [
    { ...base, id: "noah", name: "Noah Potter", short: "Noah", title: "CEO", room: "ceo", homeX: 0.5, homeY: 0.5, hair: "#e8c86a", outfit: "#1a1a1a", isLead: true, bobOff: 0, status: "working" },
    { ...base, id: "sophie", name: "Sophie Mitchell", short: "Sophie", title: "CFO", room: "finance", homeX: 0.15, homeY: 0.3, hair: "#8b4513", outfit: "#1a2744", isLead: true, bobOff: 0.3 },
    { ...base, id: "oliver", name: "Oliver", short: "Oliver", title: "Analyst", room: "finance", homeX: 0.4, homeY: 0.3, hair: "#1a1a1a", outfit: "#1a2744", isLead: false, bobOff: 0.8 },
    { ...base, id: "emma", name: "Emma", short: "Emma", title: "Analyst", room: "finance", homeX: 0.65, homeY: 0.3, hair: "#e8c86a", outfit: "#1a2744", isLead: false, bobOff: 1.2 },
    { ...base, id: "james", name: "James Thompson", short: "James", title: "COO", room: "finance", homeX: 0.15, homeY: 0.7, hair: "#6b4226", outfit: "#4a4a4a", isLead: true, bobOff: 0.5 },
    { ...base, id: "ava", name: "Ava", short: "Ava", title: "Ops", room: "finance", homeX: 0.4, homeY: 0.7, hair: "#1a1a1a", outfit: "#4a4a4a", isLead: false, bobOff: 1.0 },
    { ...base, id: "liam", name: "Liam", short: "Liam", title: "Ops", room: "finance", homeX: 0.65, homeY: 0.7, hair: "#c0392b", outfit: "#4a4a4a", isLead: false, bobOff: 1.5 },
    { ...base, id: "marcus", name: "Marcus Webb", short: "Marcus", title: "CTO", room: "engineering", homeX: 0.5, homeY: 0.45, hair: "#1a1a1a", outfit: "#2d6a4f", isLead: true, bobOff: 0, status: "working" },
    { ...base, id: "zoe", name: "Zoe", short: "Zoe", title: "Frontend", room: "engineering", homeX: 0.2, homeY: 0.25, hair: "#9b59b6", outfit: "#6c3483", isLead: false, bobOff: 0.4, status: "working" },
    { ...base, id: "ethan", name: "Ethan", short: "Ethan", title: "Backend", room: "engineering", homeX: 0.8, homeY: 0.25, hair: "#6b4226", outfit: "#5d6d7e", isLead: false, bobOff: 0.9 },
    { ...base, id: "luna", name: "Luna", short: "Luna", title: "AI Eng", room: "engineering", homeX: 0.2, homeY: 0.7, hair: "#2980b9", outfit: "#1a1a1a", isLead: false, bobOff: 1.3, status: "working" },
    { ...base, id: "kai", name: "Kai", short: "Kai", title: "DevOps", room: "engineering", homeX: 0.8, homeY: 0.7, hair: "#e8c86a", outfit: "#f39c12", isLead: false, bobOff: 1.7 },
    { ...base, id: "alex", name: "Alex Chen", short: "Alex", title: "CMO", room: "marketing", homeX: 0.25, homeY: 0.3, hair: "#1a1a1a", outfit: "#c0392b", isLead: true, bobOff: 0.2, status: "working" },
    { ...base, id: "maya", name: "Maya", short: "Maya", title: "Content", room: "marketing", homeX: 0.6, homeY: 0.3, hair: "#6b4226", outfit: "#d35400", isLead: false, bobOff: 0.7 },
    { ...base, id: "jordan", name: "Jordan", short: "Jordan", title: "Social", room: "marketing", homeX: 0.25, homeY: 0.7, hair: "#e8c86a", outfit: "#2471a3", isLead: false, bobOff: 1.1 },
    { ...base, id: "sam", name: "Sam", short: "Sam", title: "Design", room: "marketing", homeX: 0.6, homeY: 0.7, hair: "#1a1a1a", outfit: "#e91e8c", isLead: false, bobOff: 1.4 },
    { ...base, id: "charlotte", name: "Charlotte Lee", short: "Charlotte", title: "CPO", room: "product", homeX: 0.3, homeY: 0.35, hair: "#1a1a1a", outfit: "#ecf0f1", isLead: true, bobOff: 0.1, status: "working" },
    { ...base, id: "noahk", name: "Noah Kim", short: "Noah K", title: "Designer", room: "product", homeX: 0.7, homeY: 0.35, hair: "#6b4226", outfit: "#c9a84c", isLead: false, bobOff: 0.6 },
    { ...base, id: "mia", name: "Mia", short: "Mia", title: "Research", room: "product", homeX: 0.5, homeY: 0.72, hair: "#e8c86a", outfit: "#b39ddb", isLead: false, bobOff: 1.2 },
    { ...base, id: "victor", name: "Victor", short: "Victor", title: "Trends", room: "special", homeX: 0.3, homeY: 0.3, hair: "#bdc3c7", outfit: "#2c3e50", isLead: false, bobOff: 0.3 },
    { ...base, id: "diana", name: "Diana", short: "Diana", title: "Intel", room: "special", homeX: 0.7, homeY: 0.3, hair: "#1a1a1a", outfit: "#27ae60", isLead: false, bobOff: 0.8 },
    { ...base, id: "bruce", name: "Bruce", short: "Bruce", title: "Ops", room: "special", homeX: 0.3, homeY: 0.7, hair: "#1a1a1a", outfit: "#795548", isLead: false, bobOff: 1.3 },
    { ...base, id: "clark", name: "Clark", short: "Clark", title: "Field", room: "special", homeX: 0.7, homeY: 0.7, hair: "#1a1a1a", outfit: "#1565c0", isLead: false, bobOff: 1.6 },
  ]
  // Set initial world positions
  for (const ag of a) {
    const room = ROOMS.find(r => r.id === ag.room)!
    ag.wx = room.x + W + 14 + ag.homeX * (room.w - W * 2 - 28)
    ag.wy = room.y + HEADER + W + 14 + ag.homeY * (room.h - W * 2 - 36)
    ag.targetX = ag.wx; ag.targetY = ag.wy
  }
  return a
}

// ===== TIME =====
function getMode(): "day" | "sunset" | "night" { const h = new Date().getHours(); return h >= 6 && h < 18 ? "day" : h >= 18 && h < 22 ? "sunset" : "night" }
const P = {
  day: { bg: "#ddd6c8", wall: "#b0a494", floor: "#ccc4b4", accent: "#2d6a4f", glass: "rgba(135,206,235,0.2)", door: "#8b7355", text: "#5a5040", sky: ["#87ceeb", "#b0e0ff"], win: "#a0d0f0" },
  sunset: { bg: "#2a1f1a", wall: "#3d2e24", floor: "#1e1610", accent: "#e67e22", glass: "rgba(255,140,60,0.08)", door: "#5a3a20", text: "#806040", sky: ["#c0392b", "#e67e22"], win: "#d4764a" },
  night: { bg: "#080a08", wall: "#151a15", floor: "#0c0e0c", accent: "#52b788", glass: "rgba(82,183,136,0.05)", door: "#1a2a1a", text: "#3d5a3d", sky: ["#0a0a2e", "#060618"], win: "#0a0f2a" },
}

// ===== DRAW HELPERS =====
function drawChar(c: CanvasRenderingContext2D, x: number, y: number, a: Agent, t: number, small = false) {
  const s = small ? 0.7 : 1
  const bob = a.status !== "walking" ? Math.sin((t + a.bobOff * 1000) / 500) * 1.2 * s : 0
  const cy = y + bob
  const armW = a.status === "working" ? Math.sin(t / 120) * 1.2 * s : 0
  // Walk frame
  const legOff = a.status === "walking" ? Math.sin(t / 100) * 2 * s : 0
  // Shadow
  c.fillStyle = "rgba(0,0,0,0.1)"
  c.fillRect(x - 5 * s, y + 12 * s, 10 * s, 2)
  // Legs
  c.fillStyle = "#4a4a50"
  c.fillRect(x - 3 * s + legOff, cy + 10 * s, 2 * s, 3 * s)
  c.fillRect(x + 1 * s - legOff, cy + 10 * s, 2 * s, 3 * s)
  // Body
  c.fillStyle = a.outfit
  c.fillRect(x - 4 * s, cy + 4 * s, 8 * s, 7 * s)
  // Arms
  c.fillRect(x - 6 * s + armW, cy + 5 * s, 2 * s, 4 * s)
  c.fillRect(x + 4 * s - armW, cy + 5 * s, 2 * s, 4 * s)
  // Head
  c.fillStyle = "#fcd5b0"
  c.fillRect(x - 5 * s, cy - 4 * s, 10 * s, 8 * s)
  // Hair
  c.fillStyle = a.hair
  c.fillRect(x - 5 * s, cy - 5 * s, 10 * s, 4 * s)
  c.fillRect(x - 6 * s, cy - 4 * s, 1 * s, 3 * s)
  c.fillRect(x + 5 * s, cy - 4 * s, 1 * s, 3 * s)
  // Eyes
  c.fillStyle = "#1a1a1a"
  const ex = a.look === 1 ? -1 : a.look === 2 ? 1 : 0
  c.fillRect(x - 2 * s + ex, cy + 0.5 * s, 1.5 * s, 1.5 * s)
  c.fillRect(x + 1 * s + ex, cy + 0.5 * s, 1.5 * s, 1.5 * s)
  // Status dot
  c.fillStyle = a.status === "working" ? "#52b788" : a.status === "walking" ? "#f1c40f" : "#4a4a4a"
  c.beginPath(); c.arc(x, cy - 7 * s, 1.5 * s, 0, Math.PI * 2); c.fill()
}

function drawDesk(c: CanvasRenderingContext2D, x: number, y: number, p: typeof P.day) {
  c.fillStyle = "#7a6345"; c.fillRect(x - 10, y + 10, 20, 4)
  c.fillStyle = "#5a4830"; c.fillRect(x - 8, y + 14, 2, 3); c.fillRect(x + 6, y + 14, 2, 3)
  c.fillStyle = "#2c3e50"; c.fillRect(x - 6, y + 2, 12, 8)
  c.fillStyle = p.accent + "40"; c.fillRect(x - 5, y + 3, 10, 6)
  c.fillStyle = p.accent + "70"
  c.fillRect(x - 3, y + 4, 4 + Math.random() * 3, 0.8)
  c.fillRect(x - 3, y + 6, 3 + Math.random() * 4, 0.8)
  c.fillStyle = "#3a3a3a"; c.fillRect(x - 1, y + 10, 2, 1)
}

function drawWindow(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: typeof P.day, t: number) {
  // Frame
  c.fillStyle = p.wall; c.fillRect(x - 1, y - 1, w + 2, h + 2)
  // Sky gradient
  const grad = c.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, p.sky[0]); grad.addColorStop(1, p.sky[1])
  c.fillStyle = grad; c.fillRect(x, y, w, h)
  // Stars at night
  if (getMode() === "night") {
    c.fillStyle = "#fff"
    for (let i = 0; i < 3; i++) {
      const sx = x + 4 + (i * 7 + Math.sin(t / 3000 + i) * 2) % (w - 4)
      const sy = y + 3 + (i * 5) % (h - 4)
      c.fillRect(sx, sy, 1, 1)
    }
  }
  // Skyline silhouette
  c.fillStyle = getMode() === "night" ? "#0a0f15" : "#8a9a8a"
  const bh = h * 0.3
  c.fillRect(x + 2, y + h - bh, 3, bh)
  c.fillRect(x + 6, y + h - bh * 0.7, 4, bh * 0.7)
  c.fillRect(x + 11, y + h - bh * 1.1, 3, bh * 1.1)
  c.fillRect(x + w - 8, y + h - bh * 0.6, 4, bh * 0.6)
  // Light beam
  c.fillStyle = getMode() === "day" ? "rgba(255,255,200,0.04)" : getMode() === "sunset" ? "rgba(255,160,60,0.03)" : "rgba(100,180,255,0.02)"
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.lineTo(x + w + 8, y + h + 20); c.lineTo(x - 8, y + h + 20); c.fill()
  // Curtains
  c.fillStyle = p.wall; c.fillRect(x, y, 2, h); c.fillRect(x + w - 2, y, 2, h)
}

function drawRoom(c: CanvasRenderingContext2D, room: typeof ROOMS[0], p: typeof P.day, agents: Agent[], t: number, sx: number) {
  const rx = room.x - sx, ry = room.y + HEADER
  if (rx + room.w < -20 || rx > c.canvas.width + 20) return

  // Floor
  c.fillStyle = room.id === "special" ? (getMode() === "night" ? "#080808" : "#1a1410") : p.floor
  c.fillRect(rx + W, ry + W, room.w - W * 2, room.h - W * 2)

  // Walls
  c.fillStyle = p.wall
  c.fillRect(rx, ry, room.w, W) // top
  c.fillRect(rx, ry + room.h - W, room.w, W) // bottom
  c.fillRect(rx, ry, W, room.h) // left
  c.fillRect(rx + room.w - W, ry, W, room.h) // right

  // Glass effect for CEO
  if (room.id === "ceo") { c.fillStyle = p.glass; c.fillRect(rx + W, ry + W, room.w - W * 2, 1); c.fillRect(rx + room.w - W - 1, ry + W, 1, room.h - W * 2) }

  // Door
  const dx = rx + room.w / 2 - 10
  c.fillStyle = p.floor; c.fillRect(dx, ry + room.h - W, 20, W)
  c.fillStyle = p.door; c.fillRect(dx, ry + room.h - W, 2, W); c.fillRect(dx + 18, ry + room.h - W, 2, W)

  // Label
  c.fillStyle = p.text; c.font = "bold 7px 'DM Sans',sans-serif"; c.textAlign = "center"
  c.fillText(room.label, rx + room.w / 2, ry - 2); c.textAlign = "left"

  // Windows (top wall, 2 per room)
  const winW = Math.min(20, room.w / 4)
  drawWindow(c, rx + room.w * 0.25 - winW / 2, ry + W, winW, 14, p, t)
  if (room.w > 180) drawWindow(c, rx + room.w * 0.75 - winW / 2, ry + W, winW, 14, p, t)

  // ===== ROOM SPECIFIC DECORATIONS =====
  if (room.id === "ceo") {
    // Gold nameplate
    c.fillStyle = "#c9a84c"; c.fillRect(rx + room.w / 2 - 24, ry + room.h - W - 8, 48, 6)
    c.fillStyle = "#1a1a1a"; c.font = "bold 4px sans-serif"; c.textAlign = "center"
    c.fillText("Noah Potter - CEO", rx + room.w / 2, ry + room.h - W - 4); c.textAlign = "left"
    // Trophy
    c.fillStyle = "#c9a84c"; c.fillRect(rx + room.w - 20, ry + 20, 6, 8)
    c.fillRect(rx + room.w - 22, ry + 18, 10, 3)
    // Guitar
    c.fillStyle = "#8b4513"; c.fillRect(rx + 10, ry + 30, 3, 25)
    c.fillStyle = "#d4a76a"; c.fillRect(rx + 8, ry + 48, 7, 10)
    // Hockey stick
    c.fillStyle = "#5a3a20"; c.fillRect(rx + room.w - 14, ry + 28, 2, 30)
    // Flipt logo
    c.fillStyle = p.accent; c.font = "bold 8px sans-serif"; c.textAlign = "center"
    c.fillText("FLIPT", rx + room.w / 2, ry + 22); c.textAlign = "left"
    // Plant
    c.fillStyle = "#5a3520"; c.fillRect(rx + 8, ry + room.h - 20, 5, 4)
    c.fillStyle = "#27ae60"; c.beginPath(); c.arc(rx + 10, ry + room.h - 22, 5, 0, Math.PI * 2); c.fill()
  }

  if (room.id === "engineering") {
    // Server rack
    c.fillStyle = "#2c3e50"; c.fillRect(rx + room.w - 18, ry + 20, 10, 30)
    c.fillStyle = getMode() === "night" ? "#52b788" : "#27ae60"
    for (let i = 0; i < 5; i++) c.fillRect(rx + room.w - 16, ry + 22 + i * 6, 2, Math.sin(t / 200 + i) > 0 ? 2 : 0)
    // Whiteboard
    c.fillStyle = "#ecf0f1"; c.fillRect(rx + 12, ry + 18, 30, 18)
    c.fillStyle = "#2c3e50"; c.font = "3px sans-serif"; c.fillText("Architecture", rx + 14, ry + 26)
    // Rubber duck on Marcus's desk
    c.fillStyle = "#f1c40f"; c.fillRect(rx + room.w / 2 + 8, ry + room.h * 0.45 + 8, 4, 3)
    // Pizza box
    c.fillStyle = "#d4a76a"; c.fillRect(rx + room.w - 28, ry + room.h - 18, 12, 8)
  }

  if (room.id === "marketing") {
    // Mood board
    c.fillStyle = "#ecf0f1"; c.fillRect(rx + 12, ry + 18, 24, 16)
    const colors = ["#e74c3c", "#3498db", "#f1c40f", "#27ae60", "#9b59b6", "#e67e22"]
    for (let i = 0; i < 6; i++) { c.fillStyle = colors[i]; c.fillRect(rx + 13 + (i % 3) * 7, ry + 19 + Math.floor(i / 3) * 7, 6, 6) }
    // Ring light
    c.strokeStyle = "#ecf0f1"; c.lineWidth = 1; c.beginPath(); c.arc(rx + room.w - 20, ry + 30, 6, 0, Math.PI * 2); c.stroke()
    // Bean bag
    c.fillStyle = "#e74c3c"; c.beginPath(); c.ellipse(rx + room.w - 20, ry + room.h - 16, 8, 5, 0, 0, Math.PI * 2); c.fill()
  }

  if (room.id === "finance") {
    // Safe
    c.fillStyle = "#5d6d7e"; c.fillRect(rx + room.w - 18, ry + room.h - 20, 12, 14)
    c.fillStyle = "#c9a84c"; c.fillRect(rx + room.w - 14, ry + room.h - 14, 3, 3)
    // Charts on wall
    c.fillStyle = "#ecf0f1"; c.fillRect(rx + 12, ry + 18, 22, 14)
    c.fillStyle = "#27ae60"
    for (let i = 0; i < 5; i++) c.fillRect(rx + 14 + i * 4, ry + 28 - (3 + i * 2), 2, 3 + i * 2)
  }

  if (room.id === "product") {
    // Kanban board
    c.fillStyle = "#ecf0f1"; c.fillRect(rx + 10, ry + 18, 30, 18)
    c.fillStyle = "#f1c40f"; c.fillRect(rx + 12, ry + 22, 5, 4)
    c.fillStyle = "#52b788"; c.fillRect(rx + 19, ry + 22, 5, 4)
    c.fillStyle = "#e74c3c"; c.fillRect(rx + 26, ry + 22, 5, 4)
    c.fillStyle = "#f1c40f"; c.fillRect(rx + 12, ry + 28, 5, 4)
    c.fillStyle = "#3498db"; c.fillRect(rx + 19, ry + 28, 5, 4)
    // Post-its
    c.fillStyle = "#f1c40f"; c.fillRect(rx + room.w - 22, ry + 20, 6, 6)
    c.fillStyle = "#ff69b4"; c.fillRect(rx + room.w - 14, ry + 22, 6, 6)
  }

  if (room.id === "special") {
    // World map
    c.fillStyle = "#1a3a5a"; c.fillRect(rx + 10, ry + 18, 28, 16)
    c.fillStyle = "#27ae60"; c.fillRect(rx + 14, ry + 22, 4, 3); c.fillRect(rx + 22, ry + 20, 6, 4); c.fillRect(rx + 30, ry + 24, 4, 5)
    // Pins
    c.fillStyle = "#e74c3c"; c.fillRect(rx + 16, ry + 23, 2, 2); c.fillRect(rx + 25, ry + 21, 2, 2)
    // Blinds on windows (drawn over)
    c.fillStyle = p.wall + "80"
    c.fillRect(rx + room.w * 0.25 - 10, ry + W, 20, 10)
  }

  // Desks and sitting agents
  const ra = agents.filter(a => a.room === room.id && a.status !== "walking")
  for (const a of ra) {
    const ax = room.x - sx + W + 14 + a.homeX * (room.w - W * 2 - 28)
    const ay = room.y + HEADER + W + 14 + a.homeY * (room.h - W * 2 - 36)
    drawDesk(c, ax, ay, p)
    drawChar(c, ax, ay - 4, a, t)
    // Nameplate
    c.fillStyle = a.isLead ? "#c9a84c" : p.text
    c.font = `${a.isLead ? "bold " : ""}5px 'DM Sans',sans-serif`
    c.textAlign = "center"; c.fillText(a.short, ax, ay + 20); c.textAlign = "left"
  }
}

// ===== COMPONENT =====
export default function FliptOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState("")
  const [mounted, setMounted] = useState(false)
  const [scrollX, setScrollX] = useState(300)
  const [agents, setAgents] = useState<Agent[]>(() => makeAgents())
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [ticker, setTicker] = useState("Flipt Office — All systems operational")
  const [canvasW, setCanvasW] = useState(800)
  const animRef = useRef<number>(0)

  useEffect(() => { if (localStorage.getItem(AUTH_KEY) === "true") setAuthed(true); setMounted(true) }, [])

  useEffect(() => {
    function resize() { const w = Math.min(window.innerWidth, 1200); setCanvasW(w); if (canvasRef.current) { canvasRef.current.width = w; canvasRef.current.height = CANVAS_H } }
    resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize)
  }, [authed])

  // Supabase realtime
  useEffect(() => {
    if (!authed) return
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.from("agent_activity").select("agent_name, action, created_at").order("created_at", { ascending: false }).limit(10).then(({ data }) => {
      if (data) { setActivity(data); if (data[0]) setTicker(`${data[0].agent_name}: ${data[0].action}`) }
    })
    const ch = sb.channel("office2").on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_activity" }, (payload) => {
      const e = payload.new as ActivityEntry
      setActivity(prev => [e, ...prev].slice(0, 10))
      setTicker(`${e.agent_name}: ${e.action}`)
    }).subscribe()
    return () => { sb.removeChannel(ch) }
  }, [authed])

  // Random walk triggers
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => {
        const idle = prev.filter(a => a.status === "idle")
        if (idle.length === 0 || Math.random() > 0.3) return prev
        const a = idle[Math.floor(Math.random() * idle.length)]
        const room = ROOMS.find(r => r.id === a.room)!
        // Walk to break room (corridor) and back
        return prev.map(ag => ag.id === a.id ? { ...ag, status: "walking" as const, targetX: BREAK_X, targetY: CORRIDOR_Y + HEADER + CORRIDOR_H / 2, walkTimer: performance.now() } : ag)
      })
    }, 8000)
    // Random look changes
    const lookInterval = setInterval(() => {
      setAgents(prev => prev.map(a => Math.random() < 0.08 ? { ...a, look: Math.floor(Math.random() * 3) } : a))
    }, 2000)
    return () => { clearInterval(interval); clearInterval(lookInterval) }
  }, [])

  // Animation loop
  useEffect(() => {
    if (!authed || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function animate() {
      if (!ctx || !canvas) return
      const t = performance.now()
      const mode = getMode()
      const p = P[mode]

      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, canvas.width, CANVAS_H)
      ctx.fillStyle = p.bg; ctx.fillRect(0, 0, canvas.width, CANVAS_H)

      // Header
      ctx.fillStyle = p.wall; ctx.fillRect(0, 0, canvas.width, HEADER)
      ctx.fillStyle = p.accent; ctx.font = "bold 9px 'DM Sans',sans-serif"; ctx.fillText("FLIPT HQ", 8, 16)
      ctx.textAlign = "right"; ctx.fillText(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), canvas.width - 8, 16); ctx.textAlign = "left"

      // Corridor
      ctx.fillStyle = p.floor; ctx.fillRect(0, CORRIDOR_Y + HEADER, canvas.width, CORRIDOR_H)
      ctx.fillStyle = p.wall; ctx.fillRect(0, CORRIDOR_Y + HEADER, canvas.width, 2); ctx.fillRect(0, CORRIDOR_Y + HEADER + CORRIDOR_H - 2, canvas.width, 2)

      // Break room
      const bx = BREAK_X - scrollX
      if (bx > -40 && bx < canvas.width + 40) {
        ctx.fillStyle = p.accent + "15"; ctx.fillRect(bx - 20, CORRIDOR_Y + HEADER + 4, 40, CORRIDOR_H - 8)
        // Coffee machine
        ctx.fillStyle = "#4a4a4a"; ctx.fillRect(bx - 8, CORRIDOR_Y + HEADER + 8, 8, 12)
        ctx.fillStyle = "#8b4513"; ctx.fillRect(bx - 6, CORRIDOR_Y + HEADER + 10, 4, 3)
        // Table
        ctx.fillStyle = "#7a6345"; ctx.fillRect(bx + 4, CORRIDOR_Y + HEADER + 12, 12, 6)
        // Fridge
        ctx.fillStyle = "#ecf0f1"; ctx.fillRect(bx + 14, CORRIDOR_Y + HEADER + 6, 6, 16)
      }

      // Corridor plants
      for (let px = 80; px < OFFICE_W; px += 160) {
        const sx = px - scrollX
        if (sx < -10 || sx > canvas.width + 10) continue
        ctx.fillStyle = "#4a3520"; ctx.fillRect(sx - 3, CORRIDOR_Y + HEADER + CORRIDOR_H - 10, 6, 4)
        ctx.fillStyle = "#27ae60"; const sw = Math.sin(t / 2500 + px) * 1
        ctx.beginPath(); ctx.ellipse(sx + sw, CORRIDOR_Y + HEADER + CORRIDOR_H - 13, 4, 7, 0, 0, Math.PI * 2); ctx.fill()
      }

      // Draw rooms
      for (const room of ROOMS) drawRoom(ctx, room, p, agents, t, scrollX)

      // Draw walking agents
      const walking = agents.filter(a => a.status === "walking")
      for (const a of walking) {
        const dx = a.targetX - scrollX
        const dy = a.targetY
        // Move towards target
        const elapsed = t - a.walkTimer
        if (elapsed > 6000) {
          // Return home after 6 seconds
          setAgents(prev => prev.map(ag => ag.id === a.id ? { ...ag, status: "idle" as const } : ag))
          continue
        }
        const progress = Math.min(elapsed / 2000, 1)
        const room = ROOMS.find(r => r.id === a.room)!
        const homeWorldX = room.x + W + 14 + a.homeX * (room.w - W * 2 - 28)
        const homeWorldY = room.y + HEADER + W + 14 + a.homeY * (room.h - W * 2 - 36)
        let cx: number, cy: number
        if (progress < 0.5) {
          // Walking to target
          const p2 = progress * 2
          cx = homeWorldX + (a.targetX - homeWorldX) * p2 - scrollX
          cy = homeWorldY + (a.targetY - homeWorldY) * p2
        } else {
          // Walking back
          const p2 = (progress - 0.5) * 2
          cx = a.targetX + (homeWorldX - a.targetX) * p2 - scrollX
          cy = a.targetY + (homeWorldY - a.targetY) * p2
        }
        drawChar(ctx, cx, cy - 4, { ...a, status: "walking" }, t)
      }

      // Lights along corridor ceiling
      for (let lx = 120; lx < OFFICE_W; lx += 200) {
        const sx = lx - scrollX
        if (sx < -30 || sx > canvas.width + 30) continue
        ctx.fillStyle = mode === "night" ? "rgba(82,183,136,0.03)" : "rgba(255,255,220,0.04)"
        ctx.beginPath(); ctx.ellipse(sx, CORRIDOR_Y + HEADER + CORRIDOR_H / 2, 30, 14, 0, 0, Math.PI * 2); ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [authed, scrollX, agents, canvasW])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left + scrollX, cy = e.clientY - rect.top
    for (const room of ROOMS) {
      const ra = agents.filter(a => a.room === room.id)
      for (const a of ra) {
        const ax = room.x + W + 14 + a.homeX * (room.w - W * 2 - 28)
        const ay = room.y + HEADER + W + 14 + a.homeY * (room.h - W * 2 - 36) - 4
        if (Math.abs(cx - ax) < 14 && Math.abs(cy - ay) < 18) { setSelectedAgent(a); return }
      }
    }
    setSelectedAgent(null)
  }, [scrollX, agents])

  function scroll(dir: number) { setScrollX(prev => Math.max(0, Math.min(OFFICE_W - canvasW + 100, prev + dir * 180))) }

  if (!mounted) return null
  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#0a0d0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "24px", color: "#52b788", marginBottom: "16px" }}>Flipt Office</p>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && pw === PASSWORD) { localStorage.setItem(AUTH_KEY, "true"); setAuthed(true) } }} placeholder="Password" style={{ padding: "12px 20px", background: "#111411", border: "1px solid #1e241e", borderRadius: "10px", color: "#f0f4f0", fontSize: "14px", width: "240px", fontFamily: "var(--font-body)" }} />
      </div>
    </div>
  )

  const S = { bg: "#0a0d0a", surface: "#111411", border: "#1e241e", green: "#52b788", text: "#f0f4f0", muted: "#6b7c6b" }
  const mmScale = (canvasW - 40) / OFFICE_W

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "var(--font-body)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${S.border}` }}>
        <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "16px", color: S.green }}>Flipt Office</p>
        <span style={{ fontSize: "10px", color: S.muted }}>{getMode()}</span>
      </div>

      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} onClick={handleClick} style={{ imageRendering: "pixelated", cursor: "pointer", display: "block", width: "100%" }} />
        {scrollX > 0 && <button onClick={() => scroll(-1)} style={{ position: "absolute", left: "6px", top: "50%", transform: "translateY(-50%)", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(10,13,10,0.8)", border: `1px solid ${S.border}`, color: S.green, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px" }}><ChevronLeft size={14} /></button>}
        {scrollX < OFFICE_W - canvasW + 100 && <button onClick={() => scroll(1)} style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(10,13,10,0.8)", border: `1px solid ${S.border}`, color: S.green, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px" }}><ChevronRight size={14} /></button>}
      </div>

      {/* Minimap */}
      <div style={{ padding: "6px 16px", borderTop: `1px solid ${S.border}` }}>
        <div style={{ position: "relative", height: "18px", background: S.surface, borderRadius: "3px", overflow: "hidden" }}>
          {ROOMS.map(r => (
            <div key={r.id} onClick={() => setScrollX(Math.max(0, r.x - canvasW / 2 + r.w / 2))} style={{ position: "absolute", left: `${r.x * mmScale + 20}px`, width: `${r.w * mmScale}px`, height: "100%", background: S.border, borderRadius: "2px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "6px", color: S.muted }}>{r.label.split(" ")[0]}</span>
            </div>
          ))}
          <div style={{ position: "absolute", left: `${scrollX * mmScale + 20}px`, width: `${canvasW * mmScale}px`, height: "100%", border: `1.5px solid ${S.green}`, borderRadius: "2px", pointerEvents: "none" }} />
        </div>
      </div>

      {selectedAgent && (
        <div style={{ position: "fixed", bottom: "80px", left: "50%", transform: "translateX(-50%)", background: S.surface, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "14px", width: "220px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 50 }}>
          <button onClick={() => setSelectedAgent(null)} style={{ position: "absolute", top: "6px", right: "8px", background: "none", border: "none", color: S.muted, cursor: "pointer" }}>x</button>
          <p style={{ fontSize: "14px", fontWeight: 700 }}>{selectedAgent.name}</p>
          <p style={{ fontSize: "11px", color: S.muted }}>{selectedAgent.title}</p>
          <span style={{ display: "inline-block", marginTop: "6px", padding: "2px 8px", fontSize: "9px", fontWeight: 600, borderRadius: "50px", background: selectedAgent.status === "working" ? "rgba(82,183,136,0.15)" : "rgba(74,74,74,0.15)", color: selectedAgent.status === "working" ? S.green : S.muted }}>{selectedAgent.status}</span>
        </div>
      )}

      <div style={{ padding: "6px 16px", borderTop: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: S.green }} />
        <p style={{ fontSize: "10px", color: S.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticker}</p>
      </div>
    </div>
  )
}
