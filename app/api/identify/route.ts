import Anthropic from "@anthropic-ai/sdk"
import { MASTER_PROMPT, PHOTO_QUALITY_CHECK, RESPONSE_FORMAT } from "../../lib/scan-prompts"

const client = new Anthropic()

export async function POST(request: Request) {
  const { image, images, mediaType, condition, correctedName } = await request.json()

  const conditionText = condition || "Good"
  const nameHint = correctedName ? `\nIMPORTANT: The user has identified this item as "${correctedName}". Use this name and generate accurate pricing for this specific item.` : ""

  // Build image content blocks (1-3 images)
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

  try {
    const imageContext = imageBlocks.length > 1
      ? `You have ${imageBlocks.length} photos of the same item from different angles. Use all photos for best accuracy.`
      : "Analyze this photo."

    const fullPrompt = `${MASTER_PROMPT}

${PHOTO_QUALITY_CHECK}

${imageContext}
The user reports the item is in "${conditionText}" condition.${nameHint}

For brand identification: ONLY identify the brand if you can see a clear logo, brand name text, or unmistakable design pattern. Say "Unknown Brand" rather than guessing.

${RESPONSE_FORMAT}`

    const msg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [...imageBlocks, { type: "text" as const, text: fullPrompt }],
      }],
    })

    const text = msg.content[0].type === "text" ? msg.content[0].text : ""

    try {
      const result = JSON.parse(text)
      // Backward compatibility
      if (!result.valueLow && result.quickSalePrice) result.valueLow = result.quickSalePrice
      if (!result.valueHigh && result.patientPrice) result.valueHigh = result.patientPrice
      return Response.json(result)
    } catch {
      return Response.json({ error: "Failed to parse AI response", raw: text.slice(0, 500) }, { status: 500 })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Scan error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
