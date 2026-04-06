import { logActivity } from "../../../lib/agents"

export const maxDuration = 60

const AGENTS = [
  { name: "CFO Revenue Agent", path: "/api/agents/cfo/revenue" },
  { name: "Trend Spotter Agent", path: "/api/agents/trend-spotter" },
  { name: "CTO Research Agent", path: "/api/agents/cto/research" },
  { name: "CMO Research Agent", path: "/api/agents/cmo/research" },
  { name: "CMO Content Agent", path: "/api/agents/cmo/content" },
  { name: "CPO Research Agent", path: "/api/agents/cpo/research" },
  { name: "COO Support Agent", path: "/api/agents/coo/support" },
]

export async function GET(request: Request) {
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  await logActivity("System", "Running all agents in parallel")

  // Run all agents in parallel
  const promises = AGENTS.map(async (agent) => {
    try {
      const res = await fetch(`${origin}${agent.path}`, { method: "GET" })
      if (res.ok) return { name: agent.name, status: "success" as const }
      const data = await res.json().catch(() => ({ error: "Unknown" }))
      return { name: agent.name, status: "failed" as const, error: data.error }
    } catch (err) {
      return { name: agent.name, status: "failed" as const, error: err instanceof Error ? err.message : "Network error" }
    }
  })

  const results = await Promise.allSettled(promises)
  const flat = results.map(r => r.status === "fulfilled" ? r.value : { name: "Unknown", status: "failed" as const, error: "Promise rejected" })

  const succeeded = flat.filter(r => r.status === "success").length
  const failed = flat.filter(r => r.status === "failed").length

  // Run morning briefing AFTER all others complete (needs their data)
  try {
    await fetch(`${origin}/api/agents/morning-briefing`, { method: "GET" })
    await logActivity("System", `Batch complete: ${succeeded}/${AGENTS.length} agents + briefing`, JSON.stringify(flat))
  } catch {
    await logActivity("System", `Batch complete: ${succeeded}/${AGENTS.length} agents (briefing failed)`, JSON.stringify(flat))
  }

  return Response.json({ success: true, results: flat, summary: { succeeded, failed, total: AGENTS.length } })
}
