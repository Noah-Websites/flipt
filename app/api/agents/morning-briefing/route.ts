import { askClaude, logActivity, supabase } from "../../../lib/agents"

export async function GET() {
  try {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 86400000)

    // Get pending proposals count
    const { count: pendingCount } = await supabase.from("agent_proposals").select("*", { count: "exact", head: true }).eq("status", "pending")

    // Get revenue metrics
    const { data: profiles } = await supabase.from("profiles").select("plan")
    const { data: subs } = await supabase.from("subscriptions").select("plan, status, billing_period").eq("status", "active")

    let mrr = 0
    for (const s of subs || []) {
      if (s.plan === "pro") mrr += s.billing_period === "yearly" ? 47.99 / 12 : s.billing_period === "weekly" ? 1.99 * 4.33 : 5.99
      else if (s.plan === "business") mrr += s.billing_period === "yearly" ? 119.99 / 12 : s.billing_period === "weekly" ? 4.99 * 4.33 : 14.99
    }

    // Get latest trending item
    const { data: trendActivity } = await supabase.from("agent_activity").select("details").eq("agent_name", "Trend Spotter").order("created_at", { ascending: false }).limit(1)
    let trendingItem = "No trending data yet"
    if (trendActivity?.[0]?.details) {
      try {
        const items = JSON.parse(trendActivity[0].details)
        if (Array.isArray(items) && items.length > 0) trendingItem = items[0]
      } catch { /* ignore */ }
    }

    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

    const briefingPrompt = `Write a concise CEO morning briefing for a startup called Flipt (AI resale pricing app). Keep it under 200 words, professional but warm tone. Here is the data:

Date: ${dateStr}
CEO Name: Noah
MRR: $${mrr.toFixed(2)} CAD
Total users: ${(profiles || []).length}
Active paid subscriptions: ${(subs || []).length}
Pending proposals awaiting review: ${pendingCount || 0}
Top trending resale item: ${trendingItem}

Format as a brief with sections: REVENUE, TRENDING, AWAITING APPROVAL, TOP PRIORITY. Start with "Good morning Noah."`

    const briefing = await askClaude(briefingPrompt)

    await logActivity("Morning Briefing", "Daily briefing generated", briefing, "morning_briefing")
    return Response.json({ success: true, briefing, metrics: { mrr, totalUsers: (profiles || []).length, pendingProposals: pendingCount || 0 } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Briefing failed"
    await logActivity("Morning Briefing", "Briefing generation failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
