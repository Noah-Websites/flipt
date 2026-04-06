import { logActivity } from "../../../../lib/agents"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export async function GET() {
  try {
    // Use Claude with web search for REAL trending topics
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Search the web for trending topics this week on TikTok, Instagram, and Reddit related to: reselling items, decluttering, flipping for profit, thrift finds, personal finance in Canada, and second-hand selling.

Find 5 REAL trending topics or viral posts from this week. For each return: topic name, which platform it's trending on, why it's trending, a hook text (attention-grabbing first line for a video), target audience, and engagement potential (Low/Medium/High).

Return as a JSON array only (no markdown, no code fences):
[{"topic":"name","platform":"TikTok/Instagram/Reddit","why_trending":"reason","hook_text":"first line","target_audience":"who","engagement":"High/Medium/Low"}]`,
      }],
    })

    let rawText = ""
    for (const block of msg.content) {
      if (block.type === "text") rawText += block.text
    }

    let trends: Array<{ topic: string; platform?: string; why_trending?: string }> = []
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/)
      if (jsonMatch) trends = JSON.parse(jsonMatch[0])
    } catch {
      console.error("Failed to parse CMO research:", rawText.slice(0, 200))
    }

    for (const t of trends) {
      await logActivity("CMO Research Agent", `Trending topic: ${t.topic}`, JSON.stringify(t))
    }

    await logActivity("CMO Research Agent", `Completed research: ${trends.length} trending topics found (web search)`)
    return Response.json({ success: true, count: trends.length, trends })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CMO Research Agent", "Research failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
