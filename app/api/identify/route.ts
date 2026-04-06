import Anthropic from "@anthropic-ai/sdk"
import { jsonrepair } from "jsonrepair"
import { MASTER_PROMPT, PHOTO_QUALITY_CHECK, RESPONSE_FORMAT } from "../../lib/scan-prompts"

const client = new Anthropic()
export const maxDuration = 60

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ])
}

function extractJSON(text: string): Record<string, unknown> | null {
  if (!text || !text.trim()) return null

  // Try 1: Direct parse
  try { return JSON.parse(text) } catch { /* continue */ }

  // Try 2: Strip markdown fences then parse
  const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  try { return JSON.parse(stripped) } catch { /* continue */ }

  // Try 3: Extract JSON object via regex
  const objMatch = stripped.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) } catch {
      // Try 4: jsonrepair on the extracted object
      try { return JSON.parse(jsonrepair(objMatch[0])) } catch { /* continue */ }
    }
  }

  // Try 5: jsonrepair on full stripped text
  try { return JSON.parse(jsonrepair(stripped)) } catch { /* continue */ }

  // Try 6: jsonrepair on original text
  try { return JSON.parse(jsonrepair(text)) } catch { /* continue */ }

  return null
}

async function attemptScan(
  imageBlocks: Anthropic.Messages.ImageBlockParam[],
  prompt: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<Record<string, unknown> | null> {
  try {
    const apiCall = client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: [...imageBlocks, { type: "text" as const, text: prompt }] }],
    })
    const msg = await withTimeout(apiCall, timeoutMs)
    const rawText = msg.content[0].type === "text" ? msg.content[0].text : ""
    const result = extractJSON(rawText)
    if (result && (result.item || result.item_name)) return result
    console.error("[Scan] Attempt returned no item. Raw:", rawText.slice(0, 200))
    return null
  } catch (err) {
    console.error("[Scan] Attempt failed:", err instanceof Error ? err.message : "unknown")
    return null
  }
}

export async function POST(request: Request) {
  const { image, images, mediaType, condition, correctedName } = await request.json()
  const conditionText = condition || "Good"
  const nameHint = correctedName ? ` The user says this is: "${correctedName}".` : ""

  // Build image blocks
  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = []
  if (images && Array.isArray(images)) {
    for (const img of images.slice(0, 3)) {
      imageBlocks.push({ type: "image", source: { type: "base64", media_type: img.mediaType || mediaType || "image/jpeg", data: img.data } })
    }
  } else if (image) {
    imageBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } })
  }
  if (imageBlocks.length === 0) {
    return Response.json({ error: "No image provided" }, { status: 400 })
  }

  // === ATTEMPT 1: Full detailed prompt ===
  const fullPrompt = `CRITICAL: Respond with ONLY a valid JSON object. No text before { or after }. No markdown.

${MASTER_PROMPT}
${PHOTO_QUALITY_CHECK}
Condition: "${conditionText}".${nameHint}
Brand: Only identify if you see a clear logo. Say "Unknown Brand" if unsure.
${RESPONSE_FORMAT}
Respond with ONLY JSON. Start with { end with }.`

  let result = await attemptScan(imageBlocks, fullPrompt, 2000, 30000)
  if (result) {
    if (!result.valueLow && result.quickSalePrice) result.valueLow = result.quickSalePrice
    if (!result.valueHigh && result.patientPrice) result.valueHigh = result.patientPrice
    return Response.json(result)
  }

  // === ATTEMPT 2: Simplified prompt ===
  console.log("[Scan] Attempt 1 failed, trying simplified prompt...")
  const simplePrompt = `Look at this image. Identify what the item is and estimate its resale value in Canadian dollars. Respond in JSON only:
{"item":"item name","brand":{"name":"brand or Unknown Brand","confidence":50,"cues":"what you see"},"quickSalePrice":0,"fairMarketPrice":0,"patientPrice":0,"valueLow":0,"valueHigh":0,"title":"listing title","description":"short listing description","platform":"best platform to sell","tips":["tip 1"],"identificationConfidence":50,"category":"category"}
Condition: ${conditionText}.${nameHint} JSON only, no other text.`

  result = await attemptScan(imageBlocks, simplePrompt, 800, 20000)
  if (result) {
    if (!result.valueLow && result.quickSalePrice) result.valueLow = result.quickSalePrice
    if (!result.valueHigh && result.patientPrice) result.valueHigh = result.patientPrice
    return Response.json(result)
  }

  // === ATTEMPT 3: Ultra minimal prompt ===
  console.log("[Scan] Attempt 2 failed, trying minimal prompt...")
  const minimalPrompt = `What is this item and what is it worth in Canada? Reply in JSON only: {"item":"name","valueLow":0,"valueHigh":0,"title":"title","description":"desc","platform":"where to sell","identificationConfidence":30}`

  result = await attemptScan(imageBlocks, minimalPrompt, 400, 15000)
  if (result) {
    return Response.json(result)
  }

  // === ALL ATTEMPTS FAILED ===
  console.error("[Scan] All 3 attempts failed.")
  return Response.json({
    error: "We had trouble with this image. Try a clearer photo or enter the item name manually.",
    fallback: true,
    tips: [
      "Make sure the item is well lit",
      "Photograph the item straight on",
      "Make sure the item fills most of the frame",
      "Include any brand labels or tags",
    ],
  })
}
