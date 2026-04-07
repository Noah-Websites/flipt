import { logActivity, supabase } from "../../../../lib/agents"

export async function GET() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const { data: profiles } = await supabase.from("profiles").select("plan, created_at")
    const all = profiles || []
    const proCount = all.filter(p => p.plan === "pro").length
    const bizCount = all.filter(p => p.plan === "business").length
    const freeCount = all.filter(p => !p.plan || p.plan === "free").length
    const newToday = all.filter(p => new Date(p.created_at) >= today).length
    const mrr = proCount * 4.99 + bizCount * 14.99
    const arr = mrr * 12

    const { count: scansToday } = await supabase.from("scans").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString())

    const metrics = { totalUsers: all.length, proUsers: proCount, businessUsers: bizCount, freeUsers: freeCount, newUsersToday: newToday, mrr: Math.round(mrr * 100) / 100, arr: Math.round(arr * 100) / 100, scansToday: scansToday || 0 }

    await logActivity("CFO Revenue Agent", "Daily revenue snapshot", JSON.stringify(metrics))
    return Response.json({ success: true, metrics })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CFO Revenue Agent", "Revenue snapshot failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
