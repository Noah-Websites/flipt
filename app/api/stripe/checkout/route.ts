import { stripe, getPriceId, getOrCreateCustomer } from "../../../lib/stripe"

export async function POST(request: Request) {
  try {
    const { plan, period, userId, email } = await request.json()

    if (!plan || !period) {
      return Response.json({ error: "Plan and period are required" }, { status: 400 })
    }

    const priceId = await getPriceId(plan, period)
    const userEmail = email || "guest@flipt.app"
    const customerId = await getOrCreateCustomer(userEmail, userId || "guest")

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?success=true&plan=${plan}`,
      cancel_url: `${origin}/settings?cancelled=true`,
      metadata: {
        supabase_user_id: userId || "",
        plan,
        period,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId || "",
          plan,
          period,
        },
      },
    })

    return Response.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session"
    console.error("Stripe checkout error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
