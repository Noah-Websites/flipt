import Stripe from "stripe"
import { stripe } from "../../../lib/stripe"
import supabaseAdmin from "../../../lib/supabase-admin"

export const maxDuration = 30

/**
 * Determine plan tier from the Stripe price amount (in cents CAD).
 * Falls back to metadata, then defaults to "pro".
 */
function planFromAmount(amountInCents: number): "pro" | "business" {
  // Business plans: $14.99/mo (1499), $119.99/yr (11999)
  // Pro plans: $4.99/mo (499), $39.99/yr (3999)
  if (amountInCents === 1499 || amountInCents === 11999) {
    return "business"
  }
  return "pro"
}

async function resolvePlan(subscription: Stripe.Subscription, metadataPlan?: string): Promise<"pro" | "business"> {
  // 1. Trust metadata if present
  if (metadataPlan === "pro" || metadataPlan === "business") return metadataPlan

  // 2. Check price amount on the first line item
  const item = subscription.items?.data?.[0]
  if (item?.price?.unit_amount) {
    return planFromAmount(item.price.unit_amount)
  }

  return "pro"
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return Response.json({ error: "Missing signature or webhook secret" }, { status: 400 })
    }
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[Webhook] Signature verification failed:", message)
    return Response.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  switch (event.type) {
    // ─── User completed checkout ───────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId) {
        console.error("[Webhook] checkout.session.completed missing supabase_user_id")
        break
      }

      const metadataPlan = session.metadata?.plan
      const period = session.metadata?.period || "monthly"
      const subscriptionId = session.subscription as string

      // Fetch the full subscription to get price details
      let plan: "pro" | "business" = (metadataPlan === "business") ? "business" : "pro"
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          plan = await resolvePlan(sub, metadataPlan)
        } catch {
          // Fall back to metadata plan
        }
      }

      // Update profiles table (this is what useSubscription reads)
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
        })
        .eq("id", userId)

      if (profileError) {
        console.error("[Webhook] Failed to update profile:", profileError.message)
      }

      // Upsert subscriptions table
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          plan,
          billing_period: period,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })

      if (subError) {
        console.error("[Webhook] Failed to upsert subscription:", subError.message)
      }

      console.log(`[Webhook] ✓ User ${userId} upgraded to ${plan} (${period})`)
      break
    }

    // ─── Subscription updated (plan change, renewal, payment issue) ──
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) {
        console.error("[Webhook] customer.subscription.updated missing supabase_user_id")
        break
      }

      const plan = await resolvePlan(subscription, subscription.metadata?.plan)
      const status = subscription.status

      // Map Stripe status to our status
      const ourStatus = status === "active" || status === "trialing" ? "active" : "past_due"

      // Update profiles table
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ plan: ourStatus === "active" ? plan : "free" })
        .eq("id", userId)

      if (profileError) {
        console.error("[Webhook] Failed to update profile on sub update:", profileError.message)
      }

      // Update subscriptions table
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          plan,
          status: ourStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (subError) {
        console.error("[Webhook] Failed to update subscription:", subError.message)
      }

      console.log(`[Webhook] ✓ Subscription updated for ${userId}: ${plan} (${status})`)
      break
    }

    // ─── Subscription cancelled ────────────────────────────────
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) {
        console.error("[Webhook] customer.subscription.deleted missing supabase_user_id")
        break
      }

      // Downgrade profile to free
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "free",
          stripe_subscription_id: null,
        })
        .eq("id", userId)

      if (profileError) {
        console.error("[Webhook] Failed to downgrade profile:", profileError.message)
      }

      // Update subscriptions table
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "cancelled",
          plan: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (subError) {
        console.error("[Webhook] Failed to update cancelled subscription:", subError.message)
      }

      console.log(`[Webhook] ✓ Subscription cancelled for ${userId}, downgraded to free`)
      break
    }
  }

  return Response.json({ received: true })
}
