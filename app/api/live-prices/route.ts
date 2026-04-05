import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function POST(request: Request) {
  const { itemName } = await request.json()

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a resale market data expert. For the item "${itemName}", generate realistic current market pricing and demand data. Respond in JSON only (no markdown, no code fences):
{
  "livePrices": [
    {"platform": "Kijiji", "avgPrice": number, "trend": "up" or "down" or "flat", "activeListings": number},
    {"platform": "Facebook Marketplace", "avgPrice": number, "trend": "up" or "down" or "flat", "activeListings": number},
    {"platform": "eBay", "avgPrice": number, "trend": "up" or "down" or "flat", "activeListings": number},
    {"platform": "Poshmark", "avgPrice": number, "trend": "up" or "down" or "flat", "activeListings": number},
    {"platform": "Craigslist", "avgPrice": number, "trend": "up" or "down" or "flat", "activeListings": number}
  ],
  "bestPricePlatform": "platform name with best price opportunity",
  "demand": {
    "level": number (1-100, where 1 is very low and 100 is extremely high),
    "category": "Low" or "Medium" or "High",
    "estimatedDaysToSell": number,
    "activeBuyers": number (estimated number of people searching for this item),
    "trend": "Rising" or "Stable" or "Falling",
    "trendReason": "one sentence explaining why demand is at this level"
  }
}

Base the data on realistic market conditions for this specific item type. Vary prices across platforms realistically.`,
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    try {
      return Response.json(JSON.parse(text))
    } catch {
      return Response.json({ error: "Failed to parse", raw: text }, { status: 500 })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "API error"
    return Response.json({ error: msg }, { status: 500 })
  }
}
