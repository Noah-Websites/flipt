import { logActivity } from "../../../lib/agents"

async function callAgent(baseUrl: string, path: string): Promise<{ path: string; status: string; data?: unknown }> {
  try {
    const res = await fetch(`${baseUrl}${path}`)
    const data = await res.json()
    return { path, status: res.ok ? "success" : "error", data }
  } catch {
    return { path, status: "error" }
  }
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  try {
    await logActivity("System", "Running all agents", "Batch run initiated")

    const results = []
    const agents = [
      "/api/agents/cto/research",
      "/api/agents/cmo/content",
      "/api/agents/cfo/revenue",
      "/api/agents/cpo/research",
      "/api/agents/trend-spotter",
    ]

    for (const path of agents) {
      const result = await callAgent(origin, path)
      results.push(result)
    }

    const summary = results.map(r => `${r.path}: ${r.status}`).join("\n")
    await logActivity("System", "All agents completed", summary)

    return Response.json({ success: true, results })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Run-all failed"
    await logActivity("System", "Batch run failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
