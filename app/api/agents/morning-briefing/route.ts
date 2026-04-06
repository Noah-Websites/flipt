import { askClaude, logActivity, supabase } from "../../../lib/agents"

export async function GET() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)

    // Pending proposals
    const { count: pendingCount } = await supabase.from("agent_proposals").select("*", { count: "exact", head: true }).eq("status", "pending")

    // User & revenue data
    const { data: profiles } = await supabase.from("profiles").select("plan, created_at")
    const all = profiles || []
    const proCount = all.filter(p => p.plan === "pro").length
    const bizCount = all.filter(p => p.plan === "business").length
    const newToday = all.filter(p => new Date(p.created_at) >= today).length
    const mrr = proCount * 5.99 + bizCount * 14.99

    // Latest trends
    const { data: trendActs } = await supabase.from("agent_activity").select("action").eq("agent_name", "Trend Spotter Agent").like("action", "Trending:%").order("created_at", { ascending: false }).limit(1)
    const topTrend = trendActs?.[0]?.action?.replace("Trending: ", "") || "No trend data yet"

    // Scans today
    const { count: scansToday } = await supabase.from("scans").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString())

    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

    const briefing = await askClaude(
      `Write a concise CEO morning briefing for Flipt (AI resale app). Under 200 words, professional but warm.
Date: ${dateStr}, CEO: Noah
MRR: $${mrr.toFixed(2)} CAD, Total users: ${all.length}, Paid: ${proCount + bizCount}
New users today: ${newToday}, Scans today: ${scansToday || 0}
Pending proposals: ${pendingCount || 0}
Top trending item: ${topTrend}
Format: Start "Good morning Noah." then sections REVENUE, TRENDING, AWAITING APPROVAL, TOP PRIORITY.`
    )

    await logActivity("Morning Briefing", "Daily briefing generated", briefing, "morning_briefing")
    return Response.json({ success: true, briefing })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Briefing error"
    await logActivity("Morning Briefing", "Briefing failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
