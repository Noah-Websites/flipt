import { stripe, getOrCreateCustomer } from "../../../lib/stripe"

export async function POST(request: Request) {
  try {
    const { email, userId } = await request.json()

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 })
    }

    const customerId = await getOrCreateCustomer(email, userId || "guest")
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings`,
    })

    return Response.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create portal session"
    console.error("Stripe portal error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
