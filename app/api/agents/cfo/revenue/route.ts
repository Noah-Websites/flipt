import { logActivity, supabase } from "../../../../lib/agents"

export async function GET() {
  try {
    // Get subscription counts
    const { data: subs } = await supabase.from("subscriptions").select("plan, status, billing_period")
    const active = (subs || []).filter(s => s.status === "active")

    // Get user counts by plan
    const { data: profiles } = await supabase.from("profiles").select("plan")
    const planCounts = { free: 0, pro: 0, business: 0 }
    for (const p of profiles || []) {
      const plan = (p.plan || "free") as keyof typeof planCounts
      if (plan in planCounts) planCounts[plan]++
    }

    // Calculate MRR
    let mrr = 0
    for (const s of active) {
      if (s.plan === "pro") {
        if (s.billing_period === "weekly") mrr += 1.99 * 4.33
        else if (s.billing_period === "yearly") mrr += 47.99 / 12
        else mrr += 5.99
      } else if (s.plan === "business") {
        if (s.billing_period === "weekly") mrr += 4.99 * 4.33
        else if (s.billing_period === "yearly") mrr += 119.99 / 12
        else mrr += 14.99
      }
    }

    // Today's new/cancelled
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { data: todaySubs } = await supabase.from("subscriptions").select("status, created_at, updated_at").gte("created_at", today.toISOString())
    const newToday = (todaySubs || []).filter(s => s.status === "active").length
    const cancelledToday = (todaySubs || []).filter(s => s.status === "cancelled").length

    const totalUsers = (profiles || []).length

    const metrics = {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      totalUsers,
      activeSubscriptions: active.length,
      newToday,
      cancelledToday,
      planBreakdown: planCounts,
    }

    await logActivity("CFO Agent", "Revenue snapshot generated", JSON.stringify(metrics))
    return Response.json({ success: true, metrics })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CFO Agent", "Revenue snapshot failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
