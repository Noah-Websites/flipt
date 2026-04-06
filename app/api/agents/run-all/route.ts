import { logActivity } from "../../../lib/agents"

const AGENTS = [
  { name: "CFO Revenue Agent", path: "/api/agents/cfo/revenue" },
  { name: "Trend Spotter Agent", path: "/api/agents/trend-spotter" },
  { name: "CTO Research Agent", path: "/api/agents/cto/research" },
  { name: "CMO Research Agent", path: "/api/agents/cmo/research" },
  { name: "CMO Content Agent", path: "/api/agents/cmo/content" },
  { name: "CPO Research Agent", path: "/api/agents/cpo/research" },
  { name: "COO Support Agent", path: "/api/agents/coo/support" },
  { name: "Morning Briefing", path: "/api/agents/morning-briefing" },
]

export async function GET(request: Request) {
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  await logActivity("System", "Running all agents — batch started")
  const results: Array<{ name: string; status: string; error?: string }> = []

  for (const agent of AGENTS) {
    try {
      const res = await fetch(`${origin}${agent.path}`, { method: "GET" })
      if (res.ok) {
        results.push({ name: agent.name, status: "success" })
      } else {
        const data = await res.json().catch(() => ({ error: "Unknown" }))
        results.push({ name: agent.name, status: "failed", error: data.error })
      }
    } catch (err) {
      results.push({ name: agent.name, status: "failed", error: err instanceof Error ? err.message : "Network error" })
    }
  }

  const succeeded = results.filter(r => r.status === "success").length
  const failed = results.filter(r => r.status === "failed").length
  await logActivity("System", `Batch complete: ${succeeded} succeeded, ${failed} failed`, JSON.stringify(results))

  return Response.json({ success: true, results, summary: { succeeded, failed, total: AGENTS.length } })
}
