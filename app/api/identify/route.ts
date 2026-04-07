import Anthropic from "@anthropic-ai/sdk"
import { jsonrepair } from "jsonrepair"
import { MASTER_PROMPT, PHOTO_QUALITY_CHECK, RESPONSE_FORMAT } from "../../lib/scan-prompts"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic()
export const maxDuration = 60

// ===== Supabase for caching =====
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const CACHE_TTL_HOURS = 24
const SCAN_MODEL = "claude-sonnet-4-20250514"

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ])
}

function extractJSON(text: string): Record<string, unknown> | null {
  if (!text || !text.trim()) return null
  try { return JSON.parse(text) } catch { /* continue */ }
  const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  try { return JSON.parse(stripped) } catch { /* continue */ }
  const objMatch = stripped.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) } catch {
      try { return JSON.parse(jsonrepair(objMatch[0])) } catch { /* continue */ }
    }
  }
  try { return JSON.parse(jsonrepair(stripped)) } catch { /* continue */ }
  try { return JSON.parse(jsonrepair(text)) } catch { /* continue */ }
  return null
}

function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)) }

// ===== Cache helpers =====
async function getCachedResult(cacheKey: string): Promise<Record<string, unknown> | null> {
  if (!supabase) return null
  try {
    const { data } = await supabase
      .from("scan_cache")
      .select("result, created_at")
      .eq("cache_key", cacheKey)
      .single()
    if (!data) return null
    // Check expiry
    const age = (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60)
    if (age > CACHE_TTL_HOURS) return null
    return data.result as Record<string, unknown>
  } catch {
    return null
  }
}

async function setCachedResult(cacheKey: string, result: Record<string, unknown>): Promise<void> {
  if (!supabase) return
  try {
    await supabase.from("scan_cache").upsert({
      cache_key: cacheKey,
      result,
      created_at: new Date().toISOString(),
    }, { onConflict: "cache_key" })
  } catch {
    // Cache write failure is non-critical
  }
}

// ===== Streaming scan with retry =====
async function streamScan(
  imageBlocks: Anthropic.Messages.ImageBlockParam[],
  prompt: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<Record<string, unknown> | null> {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 3000

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const apiCall = client.messages.create({
        model: SCAN_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: [...imageBlocks, { type: "text" as const, text: prompt }] }],
      })
      const msg = await withTimeout(apiCall, timeoutMs)
      const rawText = msg.content[0].type === "text" ? msg.content[0].text : ""
      const result = extractJSON(rawText)
      if (result && (result.item || result.item_name)) return result
      console.error("[Scan] No item in response. Raw:", rawText.slice(0, 200))
      return null
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown"
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("overloaded")
      if (isRateLimit && attempt < MAX_RETRIES) {
        console.log(`[Scan] Rate limited, retry ${attempt + 1}/${MAX_RETRIES}...`)
        await sleep(RETRY_DELAY)
        continue
      }
      console.error("[Scan] Failed:", msg)
      return null
    }
  }
  return null
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

  // ===== CHECK CACHE (if correctedName provided, use it as key) =====
  if (correctedName) {
    const cacheKey = `${correctedName.toLowerCase().trim()}_${conditionText.toLowerCase()}`
    const cached = await getCachedResult(cacheKey)
    if (cached) {
      console.log(`[Scan] Cache hit: ${cacheKey}`)
      return Response.json(cached)
    }
  }

  // ===== ATTEMPT 1: Fast Sonnet scan =====
  const fullPrompt = `CRITICAL: Respond with ONLY valid JSON. No text before { or after }. No markdown.

${MASTER_PROMPT}
${PHOTO_QUALITY_CHECK}
Condition: "${conditionText}".${nameHint}
${RESPONSE_FORMAT}
Start with { end with }.`

  let result = await streamScan(imageBlocks, fullPrompt, 1024, 25000)
  if (result) {
    if (!result.valueLow && result.quickSalePrice) result.valueLow = result.quickSalePrice
    if (!result.valueHigh && result.patientPrice) result.valueHigh = result.patientPrice

    // Cache the result
    const itemName = (result.item || result.item_name || "") as string
    if (itemName) {
      const cacheKey = `${itemName.toLowerCase().trim()}_${conditionText.toLowerCase()}`
      setCachedResult(cacheKey, result) // Fire and forget
    }

    return Response.json(result)
  }

  // ===== ATTEMPT 2: Simplified prompt =====
  console.log("[Scan] Attempt 1 failed, trying simplified...")
  const simplePrompt = `Identify this item and estimate resale value in CAD. JSON only:
{"item":"name","brand":{"name":"brand or Unknown Brand","confidence":50,"cues":"what you see"},"quickSalePrice":0,"fairMarketPrice":0,"patientPrice":0,"valueLow":0,"valueHigh":0,"title":"listing title","description":"short listing","platform":"best platform","tips":["tip"],"identificationConfidence":50,"category":"category"}
Condition: ${conditionText}.${nameHint} JSON only.`

  result = await streamScan(imageBlocks, simplePrompt, 512, 15000)
  if (result) {
    if (!result.valueLow && result.quickSalePrice) result.valueLow = result.quickSalePrice
    if (!result.valueHigh && result.patientPrice) result.valueHigh = result.patientPrice
    return Response.json(result)
  }

  // ===== ATTEMPT 3: Minimal =====
  console.log("[Scan] Attempt 2 failed, trying minimal...")
  const minimalPrompt = `What is this item? What is it worth in Canada? JSON only: {"item":"name","valueLow":0,"valueHigh":0,"title":"title","description":"desc","platform":"where to sell","identificationConfidence":30}`

  result = await streamScan(imageBlocks, minimalPrompt, 256, 12000)
  if (result) return Response.json(result)

  // ===== ALL FAILED =====
  console.error("[Scan] All attempts failed.")
  return Response.json({
    error: "We had trouble with this image. Try a clearer photo or enter the item name manually.",
    fallback: true,
    tips: [
      "Make sure the item is well lit",
      "Photograph the item straight on",
      "Make sure the item fills the frame",
      "Include any brand labels or tags",
    ],
  })
}
