import { askClaude, logActivity } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the CMO of Flipt, a resale pricing app. Research trending topics for social media content about: reselling, decluttering, flipping items, personal finance in Canada, second-hand selling. Generate 5 trending content hooks for TikTok and Instagram. Each hook should include: topic, why_trending, hook_text (the first line that grabs attention), target_audience, estimated_engagement (Low/Medium/High). Return as JSON array only.`
    )

    let trends
    try { trends = JSON.parse(raw) } catch { trends = [] }

    await logActivity("CMO Agent", `Found ${trends.length} trending topics`, JSON.stringify(trends.map((t: { topic: string }) => t.topic)))
    return Response.json({ success: true, trends })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CMO Agent", "Research failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
