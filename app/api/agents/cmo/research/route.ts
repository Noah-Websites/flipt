import { logActivity } from "../../../../lib/agents"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ])
}

export const maxDuration = 30

export async function GET() {
  try {
    const apiCall = anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Search the web for trending topics this week on TikTok, Instagram, and Reddit related to reselling, decluttering, flipping for profit, thrift finds, and personal finance in Canada.

Find 5 REAL trending topics. Return JSON array only (no markdown):
[{"topic":"name","platform":"TikTok/Instagram/Reddit","why_trending":"reason","hook_text":"attention grabber","target_audience":"who","engagement":"High/Medium/Low"}]`,
      }],
    })

    const msg = await withTimeout(apiCall, 25000)

    let rawText = ""
    for (const block of msg.content) { if (block.type === "text") rawText += block.text }

    let trends: Array<{ topic: string }> = []
    try {
      const match = rawText.match(/\[[\s\S]*\]/)
      if (match) trends = JSON.parse(match[0])
    } catch { /* ignore */ }

    for (const t of trends) {
      await logActivity("CMO Research Agent", `Trending topic: ${t.topic}`, JSON.stringify(t))
    }

    await logActivity("CMO Research Agent", `Found ${trends.length} trending topics (web search)`)
    return Response.json({ success: true, count: trends.length, trends })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CMO Research Agent", "Research failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
