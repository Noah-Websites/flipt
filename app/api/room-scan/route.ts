import Anthropic from "@anthropic-ai/sdk"
import { jsonrepair } from "jsonrepair"

const client = new Anthropic()
export const maxDuration = 60

function extractJSON(text: string): unknown[] | null {
  if (!text?.trim()) return null
  const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  const arrMatch = stripped.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]) } catch {}
    try { return JSON.parse(jsonrepair(arrMatch[0])) } catch {}
  }
  try { return JSON.parse(jsonrepair(stripped)) } catch {}
  return null
}

export async function POST(request: Request) {
  const { images, mediaType } = await request.json()

  if (!images || !Array.isArray(images) || images.length === 0) {
    return Response.json({ error: "No images provided" }, { status: 400 })
  }

  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = images.slice(0, 3).map((img: { data: string; mediaType?: string }) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: (img.mediaType || mediaType || "image/jpeg") as "image/jpeg", data: img.data },
  }))

  const prompt = `You are an expert home appraiser and resale specialist. Analyze this photo of a room or space and identify every item that could be sold on the Canadian resale market.

For each item provide: item name, estimated condition, estimated resale value low and high in CAD, best platform to sell on, category, and confidence level.

Focus on items that are realistically sellable — electronics, clothing, furniture, appliances, collectibles, sporting equipment, tools, books, toys, kitchen items, decor. Ignore built-in fixtures, walls, floors, windows.

Try to identify at least 5-15 sellable items. Be specific about brands when you can see them.

Return ONLY a JSON array:
[{"item_name":"string","condition":"Like New|Good|Fair|Poor","value_low":number,"value_high":number,"best_platform":"string","category":"string","confidence":0-100}]`

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: [...imageBlocks, { type: "text" as const, text: prompt }] }],
    })
    const rawText = msg.content[0].type === "text" ? msg.content[0].text : ""
    const items = extractJSON(rawText)
    if (items && Array.isArray(items) && items.length > 0) {
      return Response.json({ items })
    }
    return Response.json({ error: "Could not identify items in this room" }, { status: 500 })
  } catch (err) {
    console.error("[RoomScan]", err instanceof Error ? err.message : "unknown")
    return Response.json({ error: "Room scan failed. Please try again." }, { status: 500 })
  }
}
