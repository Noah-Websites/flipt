import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Price lookup keys for each plan/period combo
const PRICE_CONFIGS = [
  { plan: "pro", period: "weekly", amount: 199, interval: "week" as const, name: "Flipt Pro Weekly" },
  { plan: "pro", period: "monthly", amount: 599, interval: "month" as const, name: "Flipt Pro Monthly" },
  { plan: "pro", period: "yearly", amount: 4799, interval: "year" as const, name: "Flipt Pro Yearly" },
  { plan: "business", period: "weekly", amount: 499, interval: "week" as const, name: "Flipt Business Weekly" },
  { plan: "business", period: "monthly", amount: 1499, interval: "month" as const, name: "Flipt Business Monthly" },
  { plan: "business", period: "yearly", amount: 11999, interval: "year" as const, name: "Flipt Business Yearly" },
]

// Cache to avoid re-creating products/prices on every request
let priceCache: Record<string, string> = {}

export async function getPriceId(plan: string, period: string): Promise<string> {
  const key = `${plan}_${period}`
  if (priceCache[key]) return priceCache[key]

  const config = PRICE_CONFIGS.find(c => c.plan === plan && c.period === period)
  if (!config) throw new Error(`Invalid plan/period: ${plan}/${period}`)

  const lookupKey = `flipt_${plan}_${period}`

  // Check if price already exists
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })
  if (existing.data.length > 0) {
    priceCache[key] = existing.data[0].id
    return existing.data[0].id
  }

  // Create the product
  const product = await stripe.products.create({ name: config.name })

  // Create the price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: config.amount,
    currency: "cad",
    recurring: { interval: config.interval },
    lookup_key: lookupKey,
  })

  priceCache[key] = price.id
  return price.id
}

export async function getOrCreateCustomer(email: string, userId: string): Promise<string> {
  // Search for existing customer
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0].id

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })
  return customer.id
}
