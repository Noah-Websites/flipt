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
  const { itemName, askingPrice, fairMarketValue, condition, platform, buyerMessage } = await request.json()

  if (!itemName || !askingPrice || !buyerMessage) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const prompt = `You are an expert negotiation coach specializing in Canadian peer-to-peer resale markets. Analyze this buyer message and provide negotiation guidance.

Item: ${itemName}
Asking Price: $${askingPrice} CAD
Fair Market Value: $${fairMarketValue || askingPrice} CAD
Condition: ${condition || "Good"}
Platform: ${platform || "Kijiji"}
Buyer Message: "${buyerMessage}"

Return ONLY valid JSON with this structure:
{
  "detectedOffer": number or null,
  "assessment": "Reasonable" | "Low" | "Lowball",
  "percentBelowAsking": number,
  "percentBelowFMV": number,
  "counterOffer": number,
  "counterReasoning": "string explaining the counter",
  "responses": {
    "firm": "Full ready-to-send message holding close to asking price",
    "flexible": "Full ready-to-send message willing to negotiate",
    "quickSale": "Full ready-to-send message prioritizing speed"
  },
  "buyerAnalysis": {
    "intent": "Serious Buyer" | "Casual Browser" | "Lowballer",
    "urgencySignals": ["signal1"],
    "redFlags": ["flag1"] or [],
    "recommendedNextStep": "string"
  },
  "tips": ["tip1", "tip2", "tip3"]
}`

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })
    const rawText = msg.content[0].type === "text" ? msg.content[0].text : ""
    const result = extractJSON(rawText)
    if (result) return Response.json(result)
    return Response.json({ error: "Failed to parse response" }, { status: 500 })
  } catch (err) {
    console.error("[OfferManager]", err instanceof Error ? err.message : "unknown")
    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
