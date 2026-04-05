import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function GET() {
  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: `You are a resale expert who specializes in finding hidden value in everyday household items. Generate a list of 20 commonly overlooked household items that are surprisingly valuable on the resale market. Respond in JSON only (no markdown, no code fences):
{
  "gems": [
    {
      "name": "specific item name",
      "category": "Kitchen" or "Electronics" or "Clothing" or "Furniture" or "Books" or "Toys" or "Tools" or "Sports" or "Decor" or "Other",
      "whyValuable": "one sentence explaining why this item is valuable",
      "avgValue": number (average resale value in USD),
      "valueLow": number,
      "valueHigh": number,
      "bestPlatform": "best platform to sell on",
      "surpriseFactor": "Low" or "Medium" or "High" (how surprised would someone be that this is valuable)
    }
  ]
}

Include items people commonly have at home and don't realize are valuable: vintage electronics, specific kitchen appliances, certain book editions, designer items people don't recognize, retro toys, specific tools, etc. Focus on items that regularly sell for $30+ that most people would throw away or donate.`,
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

export async function POST(request: Request) {
  const { query } = await request.json()

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Is "${query}" worth selling on the resale market? Respond in JSON only:
{
  "item": "${query}",
  "worthSelling": boolean,
  "avgValue": number (estimated resale value, 0 if not worth selling),
  "valueLow": number,
  "valueHigh": number,
  "bestPlatform": "platform or 'N/A'",
  "verdict": "one sentence verdict on whether to sell, donate, or keep"
}`,
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    try {
      return Response.json(JSON.parse(text))
    } catch {
      return Response.json({ error: "Failed to parse" }, { status: 500 })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "API error"
    return Response.json({ error: msg }, { status: 500 })
  }
}
