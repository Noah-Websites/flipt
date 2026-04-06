import { askClaude, logActivity, supabase } from "../../../../lib/agents"

export async function POST(request: Request) {
  try {
    const { proposal_id } = await request.json()
    if (!proposal_id) return Response.json({ error: "proposal_id required" }, { status: 400 })

    const { data: proposal } = await supabase.from("agent_proposals").select("*").eq("id", proposal_id).single()
    if (!proposal) return Response.json({ error: "Proposal not found" }, { status: 404 })

    const raw = await askClaude(
      `You are the CTO building this feature for Flipt:\n\nTitle: ${proposal.title}\nDescription: ${proposal.description}\n\nCreate a detailed implementation plan. Return JSON only with: approach (string), files (array of file paths), steps (array of step descriptions), testing (string), estimated_hours (number).`
    )
    let plan: Record<string, unknown> = {}
    try { plan = JSON.parse(raw) } catch { plan = { approach: raw, files: [], steps: [], testing: "Manual", estimated_hours: 8 } }

    await supabase.from("agent_proposals").update({
      status: "building",
      content: { ...(typeof proposal.content === "object" ? proposal.content : {}), implementation_plan: plan },
    }).eq("id", proposal_id)

    await logActivity("CTO Build Agent", `Created build plan for: ${proposal.title}`)
    return Response.json({ success: true, plan })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Build error"
    await logActivity("CTO Build Agent", "Build failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
