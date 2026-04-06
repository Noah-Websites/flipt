import { askClaude, logActivity } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the CMO of Flipt. Research 5 trending social media topics related to: reselling, decluttering, flipping items, personal finance Canada, second-hand selling. For each: topic, why_trending, hook_text (attention-grabbing first line), target_audience, engagement_potential (Low/Medium/High). Return JSON array only.`
    )
    let trends: Array<{ topic: string; why_trending?: string }> = []
    try { trends = JSON.parse(raw) } catch { trends = [] }

    for (const t of trends) {
      await logActivity("CMO Research Agent", `Found trending topic: ${t.topic}`, JSON.stringify(t))
    }

    await logActivity("CMO Research Agent", `Completed research: ${trends.length} trending topics found`)
    return Response.json({ success: true, count: trends.length, trends })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CMO Research Agent", "Research failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
