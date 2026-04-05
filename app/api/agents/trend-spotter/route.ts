import { askClaude, logActivity, supabase } from "../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the Trend Spotter Agent for Flipt, a Canadian resale app. Identify 5 items trending in the Canadian resale market right now. For each: name, why_trending (one sentence), price_low, price_high, best_platform, demand (Low/Medium/High). Consider seasonal trends, pop culture, and market conditions. Return as JSON array only.`
    )

    let items
    try { items = JSON.parse(raw) } catch { items = [] }

    await logActivity("Trend Spotter", `Identified ${items.length} trending items`, JSON.stringify(items.map((i: { name: string }) => i.name)))

    // Save notification for all users
    const { data: users } = await supabase.from("profiles").select("id")
    if (users && items.length > 0) {
      const topItem = items[0]
      const notifications = users.map((u: { id: string }) => ({
        user_id: u.id,
        type: "trending",
        title: `${topItem.name} is trending`,
        message: `${topItem.why_trending} Estimated value: $${topItem.price_low}–$${topItem.price_high}`,
      }))
      await supabase.from("notifications").insert(notifications)
    }

    return Response.json({ success: true, items })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("Trend Spotter", "Trend spotting failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
