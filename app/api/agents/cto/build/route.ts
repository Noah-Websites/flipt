import { askClaude, logActivity, supabase } from "../../../../lib/agents"

export async function POST(request: Request) {
  try {
    const { proposal_id } = await request.json()
    if (!proposal_id) return Response.json({ error: "proposal_id required" }, { status: 400 })

    const { data: proposal } = await supabase.from("agent_proposals").select("*").eq("id", proposal_id).single()
    if (!proposal) return Response.json({ error: "Proposal not found" }, { status: 404 })

    const plan = await askClaude(
      `You are the CTO of Flipt. Create a detailed implementation plan for this feature:\n\nTitle: ${proposal.title}\nDescription: ${proposal.description}\n\nProvide: 1) Technical approach, 2) Files to create/modify, 3) Step-by-step implementation, 4) Testing plan, 5) Estimated time. Return as JSON with keys: approach, files, steps (array), testing, estimated_hours.`
    )

    let parsed
    try { parsed = JSON.parse(plan) } catch { parsed = { approach: plan } }

    await supabase.from("agent_proposals").update({ status: "building", content: { ...proposal.content, implementation_plan: parsed } }).eq("id", proposal_id)
    await logActivity("CTO Agent", `Created build plan for: ${proposal.title}`, JSON.stringify(parsed).slice(0, 500))

    return Response.json({ success: true, plan: parsed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Build agent error"
    await logActivity("CTO Agent", "Build plan failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
