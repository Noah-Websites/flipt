import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function POST(request: Request) {
  const { image, mediaType, condition, correctedName } = await request.json()

  const conditionText = condition || "Good"
  const nameHint = correctedName ? `\nIMPORTANT: The user has identified this item as "${correctedName}". Use this as the item name and generate accurate pricing for this specific item.` : ""

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: image,
              },
            },
            {
              type: "text",
              text: `You are a resale and collectibles expert. Analyze this item in "${conditionText}" condition. Respond in JSON only (no markdown, no code fences) with this exact structure:
{
  "item": "what the item is (specific brand, model, details)",
  "identificationConfidence": number (0-100, how confident you are in the identification),
  "valueLow": number,
  "valueHigh": number,
  "platform": "best platform and why in one sentence",
  "title": "ready-to-post listing title",
  "description": "2-3 sentence listing description mentioning ${conditionText} condition",
  "priceHistory": [
    {"month": "Nov", "price": number},{"month": "Dec", "price": number},
    {"month": "Jan", "price": number},{"month": "Feb", "price": number},
    {"month": "Mar", "price": number},{"month": "Apr", "price": number}
  ],
  "comparables": [
    {"title": "string", "platform": "string", "price": number, "daysListed": number},
    {"title": "string", "platform": "string", "price": number, "daysListed": number},
    {"title": "string", "platform": "string", "price": number, "daysListed": number}
  ],
  "bestTimeToSell": {"day": "string", "time": "string", "reason": "string"},
  "platformComparison": [
    {"platform": "Kijiji", "icon": "kijiji", "avgPrice": number, "priceLow": number, "priceHigh": number, "avgDaysToSell": number, "difficulty": "Easy" or "Medium" or "Hard"},
    {"platform": "Facebook Marketplace", "icon": "facebook", "avgPrice": number, "priceLow": number, "priceHigh": number, "avgDaysToSell": number, "difficulty": "Easy" or "Medium" or "Hard"},
    {"platform": "eBay", "icon": "ebay", "avgPrice": number, "priceLow": number, "priceHigh": number, "avgDaysToSell": number, "difficulty": "Easy" or "Medium" or "Hard"},
    {"platform": "Poshmark", "icon": "poshmark", "avgPrice": number, "priceLow": number, "priceHigh": number, "avgDaysToSell": number, "difficulty": "Easy" or "Medium" or "Hard"},
    {"platform": "Craigslist", "icon": "craigslist", "avgPrice": number, "priceLow": number, "priceHigh": number, "avgDaysToSell": number, "difficulty": "Easy" or "Medium" or "Hard"}
  ],
  "brand": {
    "name": "brand name or 'Unknown Brand'",
    "confidence": number (0-100),
    "cues": "what visual cues identified the brand (logos, text, design patterns)"
  },
  "damageAnalysis": {
    "issues": [
      {"description": "what damage is visible", "severity": "Minor" or "Moderate" or "Significant"}
    ],
    "adjustedValueLow": number (price adjusted down for damage, same as valueLow if no damage),
    "adjustedValueHigh": number (price adjusted down for damage, same as valueHigh if no damage),
    "hasDamage": boolean
  },
  "authenticity": {
    "riskLevel": "Low" or "Medium" or "High",
    "isCommonlyCounterfeited": boolean,
    "verificationTips": ["things to check in person to verify authenticity"],
    "explanation": "one sentence about why this risk level"
  },
  "vintage": {
    "isVintage": boolean,
    "isAntique": boolean,
    "estimatedDecade": "e.g. 1990s or null if not vintage",
    "characteristics": "what design/manufacturing details suggest its age",
    "premiumApplied": boolean,
    "premiumPercentage": number (0 if not vintage, e.g. 20 for 20% premium)
  },
  "collectible": {
    "isCollectible": boolean,
    "type": "trading card, coin, vinyl record, etc or null",
    "series": "series/set name or null",
    "estimatedGrade": "grade on standard scale for this collectible type or null",
    "collectibleValueLow": number or null,
    "collectibleValueHigh": number or null,
    "recommendedPlatforms": ["platform names for selling this collectible type"]
  }
}

Generate realistic data for all fields. For identificationConfidence: be honest about how sure you are — 90+ means very clear identification, 70-89 means probable but not certain, below 70 means a best guess. For brand: ONLY identify the brand if you can see a clear logo, brand name text, or unmistakable design pattern unique to that brand. Say "Unknown Brand" rather than guessing wrong — do not guess based on general style alone. For priceHistory use seasonal trends. For damageAnalysis carefully examine the photo for any visible wear, scratches, dents, stains. For authenticity consider if this item type is commonly counterfeited. For vintage analyze design characteristics to estimate age. For collectible only populate if the item is actually a collectible type.${nameHint}`,
            },
          ],
        },
      ],
    })

    const text =
      message.content[0].type === "text" ? message.content[0].text : ""

    try {
      const result = JSON.parse(text)
      return Response.json(result)
    } catch {
      return Response.json(
        { error: "Failed to parse response", raw: text },
        { status: 500 }
      )
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error calling Anthropic API"
    console.error("Anthropic API error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
