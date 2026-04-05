import { stripe } from "../../../lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  let event
  try {
    // In production, verify the webhook signature
    // For now in dev, parse the event directly
    event = JSON.parse(body)
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan || "pro"
      const period = session.metadata?.period || "monthly"

      if (userId) {
        // Upsert subscription record
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          plan,
          billing_period: period,
          status: "active",
          created_at: new Date().toISOString(),
        }, { onConflict: "user_id" })

        // Update user metadata
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { plan },
        })
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object
      const userId = subscription.metadata?.supabase_user_id

      if (userId) {
        await supabase.from("subscriptions").update({
          status: "cancelled",
          plan: "free",
        }).eq("user_id", userId)

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { plan: "free" },
        })
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object
      const userId = subscription.metadata?.supabase_user_id
      const status = subscription.status

      if (userId) {
        await supabase.from("subscriptions").update({
          status: status === "active" ? "active" : "past_due",
        }).eq("user_id", userId)
      }
      break
    }
  }

  return Response.json({ received: true })
}
