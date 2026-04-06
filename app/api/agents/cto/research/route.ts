import { askClaude, logActivity, saveProposal } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the CTO of Flipt, an AI-powered resale pricing app for Canadians. Generate 5 specific feature improvement ideas. For each return JSON with: title, description, problem_it_solves, complexity (Simple/Medium/Complex), impact (Low/Medium/High), build_hours (number). Focus on practical improvements a solo developer could build. Current features: AI item scanning, price comparison, marketplace, feed, closet, business mode, subscriptions. Return a JSON array only, no markdown.`,
      2000
    )
    let proposals: Array<{ title: string; description: string; problem_it_solves?: string; complexity: string; impact: string; build_hours?: number }> = []
    try { proposals = JSON.parse(raw) } catch { return Response.json({ error: "Failed to parse AI response" }, { status: 500 }) }

    const saved = []
    for (const p of proposals) {
      const data = await saveProposal(
        "CTO Research Agent", "feature", p.title,
        `${p.description}${p.problem_it_solves ? `\n\nProblem: ${p.problem_it_solves}` : ""}`,
        p.impact || "Medium", p.complexity || "Medium", p
      )
      if (data) saved.push(data)
    }

    await logActivity("CTO Research Agent", `Generated ${saved.length} feature proposals`)
    return Response.json({ success: true, count: saved.length, proposals: saved })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CTO Research Agent", "Research failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
