import Anthropic from "@anthropic-ai/sdk"
import { CATEGORY_DETECT_PROMPT, getExpertPrompt, PHOTO_QUALITY_CHECK, RESPONSE_FORMAT } from "../../lib/scan-prompts"

const client = new Anthropic()

export async function POST(request: Request) {
  const { image, images, mediaType, condition, correctedName } = await request.json()

  const conditionText = condition || "Good"
  const nameHint = correctedName ? `\nThe user has identified this item as "${correctedName}". Use this as the item name and generate accurate pricing.` : ""

  // Build image content blocks (support 1-3 images)
  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = []

  if (images && Array.isArray(images)) {
    // Multi-image mode
    for (const img of images.slice(0, 3)) {
      imageBlocks.push({
        type: "image",
        source: { type: "base64", media_type: img.mediaType || mediaType || "image/jpeg", data: img.data },
      })
    }
  } else if (image) {
    // Single image mode
    imageBlocks.push({
      type: "image",
      source: { type: "base64", media_type: mediaType || "image/jpeg", data: image },
    })
  }

  if (imageBlocks.length === 0) {
    return Response.json({ error: "No image provided" }, { status: 400 })
  }

  try {
    // PASS 1: Category detection
    const catMsg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 50,
      messages: [{
        role: "user",
        content: [...imageBlocks, { type: "text" as const, text: CATEGORY_DETECT_PROMPT }],
      }],
    })
    const rawCategory = (catMsg.content[0].type === "text" ? catMsg.content[0].text : "other").trim().toLowerCase().replace(/[^a-z_]/g, "")
    const category = rawCategory || "other"

    // PASS 2: Expert analysis with category-specific prompt
    const expertPrompt = getExpertPrompt(category)
    const imageContext = imageBlocks.length > 1
      ? `You have ${imageBlocks.length} photos of the same item from different angles. Use all photos for the most accurate identification.`
      : "Analyze this single photo."

    const analysisPrompt = `${expertPrompt}

${PHOTO_QUALITY_CHECK}

${imageContext}
The user reports the item is in "${conditionText}" condition.${nameHint}

IMPORTANT for brand identification: ONLY identify the brand if you can see a clear logo, brand name text, or unmistakable design pattern. Say "Unknown Brand" rather than guessing.

For confidence scoring:
- High (90%+): clear identifying features visible
- Medium (60-89%): strong educated guess
- Low (below 60%): image quality or angle makes it difficult

For pricing provide three tiers in CAD:
- Quick sale: sell within 24 hours
- Fair market: sell in 1-2 weeks
- Patient seller: wait for the right buyer

Generate two listing versions:
- Short (title + description): for Facebook Marketplace and Kijiji
- Long (ebayTitle + ebayDescription): for eBay collectors

${RESPONSE_FORMAT}`

    const msg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [...imageBlocks, { type: "text" as const, text: analysisPrompt }],
      }],
    })

    const text = msg.content[0].type === "text" ? msg.content[0].text : ""

    try {
      const result = JSON.parse(text)
      // Add detected category
      result.detectedCategory = category
      // Ensure backward compatibility
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
