import Anthropic from "@anthropic-ai/sdk"
import { jsonrepair } from "jsonrepair"

const client = new Anthropic()
export const maxDuration = 30

function extractJSON(text: string): Record<string, unknown> | null {
  if (!text?.trim()) return null
  try { return JSON.parse(text) } catch {}
  const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  try { return JSON.parse(stripped) } catch {}
  const m = stripped.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(jsonrepair(m[0])) } catch {} }
  try { return JSON.parse(jsonrepair(stripped)) } catch {}
  return null
}

export async function POST(request: Request) {
  const { itemName } = await request.json()

  if (!itemName?.trim()) {
    return Response.json({ error: "Item name is required" }, { status: 400 })
  }

  const now = new Date()
  const currentMonth = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const prompt = `You are a Canadian resale market expert with deep knowledge of seasonal pricing trends. Analyze the best time to sell "${itemName}" on the Canadian resale market.

Consider: weather and seasons in Canada, holidays and gift-giving seasons, back to school periods, spring cleaning trends, sports seasons, and Canadian shopping patterns.

Current date: ${currentMonth}

Return ONLY valid JSON:
{
  "itemName": "${itemName}",
  "bestMonth": "month name",
  "worstMonth": "month name",
  "peakPremiumPercent": number (how much more items sell for in peak vs off-peak),
  "monthlyPrices": [number, number, number, number, number, number, number, number, number, number, number, number],
  "currentStatus": "Good" | "Average" | "Bad",
  "currentStatusReason": "Why now is good/average/bad time",
  "daysUntilPeak": number or 0 if currently peak,
  "seasonalReasoning": "Why this item has these seasonal patterns",
  "currentTips": ["tip1", "tip2", "tip3"],
  "whatBuyersWant": "What buyers are looking for right now regarding this type of item",
  "relatedItems": [
    {"name": "related item 1", "bestMonth": "month"},
    {"name": "related item 2", "bestMonth": "month"},
    {"name": "related item 3", "bestMonth": "month"}
  ]
}`

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 768,
      messages: [{ role: "user", content: prompt }],
    })
    const rawText = msg.content[0].type === "text" ? msg.content[0].text : ""
    const result = extractJSON(rawText)
    if (result) return Response.json(result)
    return Response.json({ error: "Failed to parse response" }, { status: 500 })
  } catch (err) {
    console.error("[Sell-O-Meter]", err instanceof Error ? err.message : "unknown")
    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
