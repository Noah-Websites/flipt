import { logActivity, supabase } from "../../../lib/agents"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export async function GET() {
  try {
    // Use Claude with web search to find REAL trending items
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 3000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Search the web for what items are trending and selling fast on resale platforms like eBay, Facebook Marketplace, Poshmark, Kijiji, and Craigslist this week in Canada. Look for:
- Viral items on social media that people are reselling
- Seasonal items in high demand right now
- Collectibles or limited edition items that spiked in value recently
- Common household items selling unusually fast

Return EXACTLY 10 real trending items as a JSON array (no markdown, no code fences). Each item:
{"name":"specific item name","why_trending":"one sentence why","avg_price":number in CAD,"best_platform":"platform name","demand":"High" or "Medium","price_change":"+X%" or "-X%" or "stable"}`,
      }],
    })

    // Extract text from response (may have tool use blocks mixed in)
    let rawText = ""
    for (const block of msg.content) {
      if (block.type === "text") rawText += block.text
    }

    let items: Array<{ name: string; why_trending: string; avg_price: number; best_platform: string; demand: string; price_change: string }> = []
    try {
      // Try to find JSON array in the response
      const jsonMatch = rawText.match(/\[[\s\S]*\]/)
      if (jsonMatch) items = JSON.parse(jsonMatch[0])
    } catch {
      console.error("Failed to parse trend spotter response:", rawText.slice(0, 200))
    }

    if (items.length === 0) {
      await logActivity("Trend Spotter Agent", "No trending items found", rawText.slice(0, 500), "warning")
      return Response.json({ success: false, error: "No items parsed", rawPreview: rawText.slice(0, 300) })
    }

    // Save each item as activity
    for (const item of items) {
      await logActivity("Trend Spotter Agent", `Trending: ${item.name}`, JSON.stringify(item))
    }

    // Save full list as a single activity entry for the market page to read
    await logActivity("Trend Spotter Agent", `Market report: ${items.length} trending items`, JSON.stringify(items))

    // Notify all users about top trending item
    const top = items[0]
    const { data: users } = await supabase.from("profiles").select("id")
    if (users && users.length > 0) {
      const notifs = users.map((u: { id: string }) => ({
        user_id: u.id,
        type: "trend_alert",
        title: "Trending Now",
        message: `${top.name} is trending — $${top.avg_price} CAD. ${top.why_trending}`,
      }))
      await supabase.from("notifications").insert(notifs)
    }

    await logActivity("Trend Spotter Agent", `Spotted ${items.length} trending items (web search)`)
    return Response.json({ success: true, count: items.length, items })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    console.error("Trend Spotter error:", msg)
    await logActivity("Trend Spotter Agent", "Trend spotting failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
