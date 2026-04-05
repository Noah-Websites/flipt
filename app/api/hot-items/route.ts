import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function GET() {
  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a local resale market expert for Ottawa, Canada. Generate the top 10 trending resale items in Ottawa this week. Respond in JSON only (no markdown, no code fences):
{
  "items": [
    {
      "name": "specific item name",
      "category": "Electronics" or "Clothing" or "Furniture" or "Sports" or "Books" or "Home" or "Toys" or "Auto" or "Other",
      "avgPrice": number,
      "demandLevel": "Low" or "Medium" or "High",
      "priceChange": "+X%" or "-X%" (percentage change this week),
      "whyTrending": "one sentence explanation"
    }
  ],
  "lastUpdated": "April 4, 2026"
}

Make the items realistic for the Ottawa market considering the current season (spring), local demographics, and popular local platforms like Kijiji and Facebook Marketplace.`,
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
