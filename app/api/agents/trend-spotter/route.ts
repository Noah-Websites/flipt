import { logActivity, supabase } from "../../../lib/agents"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

// Timeout helper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ])
}

export const maxDuration = 30 // Vercel function timeout (Pro plan)

export async function GET() {
  try {
    const apiCall = anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Search the web for what items are trending and selling fast on resale platforms like eBay, Facebook Marketplace, Poshmark, Kijiji, and Craigslist this week in Canada. Look for viral items, seasonal demand, collectibles that spiked, and household items selling fast.

Return EXACTLY 10 real trending items as a JSON array (no markdown, no code fences). Each:
{"name":"item","why_trending":"reason","avg_price":number,"best_platform":"platform","demand":"High" or "Medium","price_change":"+X%" or "stable"}`,
      }],
    })

    // 25 second timeout
    const msg = await withTimeout(apiCall, 25000)

    let rawText = ""
    for (const block of msg.content) {
      if (block.type === "text") rawText += block.text
    }

    let items: Array<{ name: string; why_trending: string; avg_price: number; best_platform: string; demand: string; price_change: string }> = []
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/)
      if (jsonMatch) items = JSON.parse(jsonMatch[0])
    } catch {
      console.error("Parse error:", rawText.slice(0, 200))
    }

    if (items.length === 0) {
      await logActivity("Trend Spotter Agent", "No items found from web search", rawText.slice(0, 300), "warning")
      return Response.json({ success: false, error: "No items parsed" })
    }

    // Save full list for the market page
    await logActivity("Trend Spotter Agent", `Market report: ${items.length} trending items`, JSON.stringify(items))

    // Notify users about top item
    const top = items[0]
    const { data: users } = await supabase.from("profiles").select("id")
    if (users && users.length > 0) {
      await supabase.from("notifications").insert(
        users.map((u: { id: string }) => ({
          user_id: u.id, type: "trend_alert", title: "Trending Now",
          message: `${top.name} is trending — $${top.avg_price} CAD. ${top.why_trending}`,
        }))
      )
    }

    await logActivity("Trend Spotter Agent", `Spotted ${items.length} trending items`)
    return Response.json({ success: true, count: items.length, items })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    console.error("Trend Spotter:", msg)
    await logActivity("Trend Spotter Agent", "Failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
