import { askClaude, logActivity, supabase } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the CTO Agent for Flipt, an AI-powered resale pricing app for Canadians. Generate 5 specific, actionable feature improvement ideas that would increase user retention, conversion to paid plans, or overall app value. For each idea provide: title, description, problem_it_solves, complexity (Simple/Medium/Complex), impact (Low/Medium/High), build_hours (number). Focus on practical improvements a solo developer could build. Current features: AI item scanning, price comparison across 5 platforms, marketplace, community feed, closet tracking, business mode, subscription plans. Return as JSON array only, no markdown.`
    )

    let proposals
    try { proposals = JSON.parse(raw) } catch { proposals = [] }

    for (const p of proposals) {
      await supabase.from("agent_proposals").insert({
        agent_name: "CTO Agent",
        proposal_type: "feature",
        title: p.title,
        description: p.description + (p.problem_it_solves ? `\n\nProblem: ${p.problem_it_solves}` : ""),
        impact_rating: p.impact || "Medium",
        complexity: p.complexity || "Medium",
        status: "pending",
        content: p,
      })
    }

    await logActivity("CTO Agent", `Generated ${proposals.length} feature proposals`, JSON.stringify(proposals.map((p: { title: string }) => p.title)))
    return Response.json({ success: true, proposals })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CTO Agent", "Research failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
