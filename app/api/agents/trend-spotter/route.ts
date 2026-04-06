import { askClaude, logActivity, supabase } from "../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the Trend Spotter for Flipt, a Canadian resale app. Identify 5 items trending in the Canadian resale market right now. For each: name, why_trending (one sentence), price_low, price_high, best_platform, demand (Low/Medium/High). Consider seasonal trends and pop culture. Return JSON array only.`
    )
    let items: Array<{ name: string; why_trending: string; price_low: number; price_high: number; best_platform: string; demand: string }> = []
    try { items = JSON.parse(raw) } catch { items = [] }

    for (const item of items) {
      await logActivity("Trend Spotter Agent", `Trending: ${item.name}`, JSON.stringify(item))
    }

    // Notify all users about top trending item
    if (items.length > 0) {
      const top = items[0]
      const { data: users } = await supabase.from("profiles").select("id")
      if (users && users.length > 0) {
        const notifs = users.map((u: { id: string }) => ({
          user_id: u.id, type: "trend_alert", title: "Trending Now",
          message: `${top.name} is trending — $${top.price_low}-$${top.price_high}. ${top.why_trending}`,
        }))
        await supabase.from("notifications").insert(notifs)
      }
    }

    await logActivity("Trend Spotter Agent", `Spotted ${items.length} trending items`)
    return Response.json({ success: true, count: items.length, items })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("Trend Spotter Agent", "Trend spotting failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
