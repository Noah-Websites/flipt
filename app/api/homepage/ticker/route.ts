import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic()
export const maxDuration = 30

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const CACHE_KEY = "homepage_ticker"
const CACHE_TTL_HOURS = 24

interface TickerItem {
  item: string
  price: number
  city: string
}

async function getCached(): Promise<TickerItem[] | null> {
  if (!supabase) return null
  try {
    const { data } = await supabase
      .from("scan_cache")
      .select("result, created_at")
      .eq("cache_key", CACHE_KEY)
      .single()
    if (!data) return null
    const age = (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60)
    if (age > CACHE_TTL_HOURS) return null
    return (data.result as { items: TickerItem[] }).items || null
  } catch {
    return null
  }
}

async function setCache(items: TickerItem[]): Promise<void> {
  if (!supabase) return
  try {
    await supabase.from("scan_cache").upsert({
      cache_key: CACHE_KEY,
      result: { items },
      created_at: new Date().toISOString(),
    }, { onConflict: "cache_key" })
  } catch {}
}

export async function GET() {
  // Check cache first
  const cached = await getCached()
  if (cached) {
    return Response.json({ items: cached, cached: true })
  }

  // Fetch fresh data from Claude with web search
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      messages: [{
        role: "user",
        content: "Search for 10 real items that sold recently on Canadian resale platforms like Kijiji, Facebook Marketplace, and eBay Canada this week. For each item provide: item name, selling price in CAD, and city in Canada. Format as JSON array with fields: item, price, city. Focus on interesting or surprising sales. Return ONLY the JSON array, no other text.",
      }],
    })

    // Extract text from response
    let rawText = ""
    for (const block of msg.content) {
      if (block.type === "text") rawText += block.text
    }

    // Parse JSON
    let items: TickerItem[] = []
    try {
      const match = rawText.match(/\[[\s\S]*\]/)
      if (match) {
        items = JSON.parse(match[0])
      }
    } catch {
      // Parse failed
    }

    if (items.length > 0) {
      // Cache for 24 hours
      setCache(items) // fire and forget
      return Response.json({ items, cached: false })
    }
  } catch (err) {
    console.error("[Ticker] API error:", err instanceof Error ? err.message : "unknown")
  }

  // If API fails, try to return stale cache
  if (supabase) {
    try {
      const { data } = await supabase
        .from("scan_cache")
        .select("result")
        .eq("cache_key", CACHE_KEY)
        .single()
      if (data) {
        const items = (data.result as { items: TickerItem[] }).items
        if (items) return Response.json({ items, cached: true, stale: true })
      }
    } catch {}
  }

  // Final fallback - return empty so frontend uses its own fallback
  return Response.json({ items: [], cached: false })
}
