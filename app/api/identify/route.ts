import Anthropic from "@anthropic-ai/sdk"
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
  // Try 1: direct parse
  try { return JSON.parse(text) } catch { /* continue */ }

  // Try 2: extract JSON object with regex
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) } catch { /* continue */ }
  }

  // Try 3: strip markdown code fences
  const fenced = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  try { return JSON.parse(fenced) } catch { /* continue */ }

  // Try 4: extract from fenced content
  const fencedMatch = fenced.match(/\{[\s\S]*\}/)
  if (fencedMatch) {
    try { return JSON.parse(fencedMatch[0]) } catch { /* continue */ }
  }

  return null
}

export async function POST(request: Request) {
  const { image, images, mediaType, condition, correctedName } = await request.json()

  const conditionText = condition || "Good"
  const nameHint = correctedName ? `\nIMPORTANT: The user has identified this item as "${correctedName}". Use this name and generate accurate pricing.` : ""

  // Build image blocks (1-3 images)
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

  const imageContext = imageBlocks.length > 1
    ? `You have ${imageBlocks.length} photos of the same item. Use all for best accuracy.`
    : "Analyze this photo."

  const fullPrompt = `CRITICAL INSTRUCTION: You must respond with ONLY a valid JSON object. No introduction text, no explanation, no markdown code blocks, no backticks. Start your response with { and end with }. Nothing before the { and nothing after the }.

${MASTER_PROMPT}

${PHOTO_QUALITY_CHECK}

${imageContext}
Condition: "${conditionText}".${nameHint}

Brand: ONLY identify if you see a clear logo or text. Say "Unknown Brand" if unsure.

${RESPONSE_FORMAT}

Remember: respond with ONLY the JSON object. Start with { and end with }. No other text.`

  try {
    const apiCall = client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: [...imageBlocks, { type: "text" as const, text: fullPrompt }] }],
    })

    // 30 second timeout
    const msg = await withTimeout(apiCall, 30000)
    const rawText = msg.content[0].type === "text" ? msg.content[0].text : ""

    // Robust JSON extraction
    const result = extractJSON(rawText)

    if (result) {
      // Backward compatibility
      if (!result.valueLow && result.quickSalePrice) result.valueLow = result.quickSalePrice
      if (!result.valueHigh && result.patientPrice) result.valueHigh = result.patientPrice
      return Response.json(result)
    }

    // JSON parsing completely failed — log raw response for debugging
    console.error("[Scan] JSON parse failed. Raw response:", rawText.slice(0, 500))

    return Response.json({
      error: "Could not analyze this image. Please try again with better lighting.",
      fallback: true,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"

    if (message === "timeout") {
      return Response.json({
        error: "Scan is taking too long. Please try again with a smaller photo or better connection.",
        fallback: true,
      }, { status: 504 })
    }

    console.error("[Scan] API error:", message)
    return Response.json({
      error: "Something went wrong. Please try again.",
      fallback: true,
    }, { status: 500 })
  }
}
