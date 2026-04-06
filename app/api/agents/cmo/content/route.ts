import { askClaude, logActivity, saveProposal } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the CMO of Flipt, a Canadian AI resale pricing app. Generate a week of social media content. Return JSON only:
{"tiktok":[{"title":"string","hook":"0-3s","body":"3-20s","cta":"20-30s","hashtags":["10 tags"]}],"instagram":[{"title":"string","caption":"full caption","hashtags":["10 tags"]}],"reddit":[{"title":"string","subreddit":"r/...","body":"full text"}]}
Generate 3 TikTok, 3 Instagram, 2 Reddit. Make content authentic, helpful, not salesy.`,
      2000
    )
    let content: { tiktok?: Array<{ title: string; hook: string; body: string; cta: string; hashtags: string[] }>; instagram?: Array<{ title: string; caption: string; hashtags: string[] }>; reddit?: Array<{ title: string; subreddit: string; body: string }> } = {}
    try { content = JSON.parse(raw) } catch { return Response.json({ error: "Failed to parse AI response" }, { status: 500 }) }

    const saved = []
    for (const s of content.tiktok || []) {
      const d = await saveProposal("CMO Content Agent", "marketing_content", `TikTok - ${s.title}`,
        `Hook: ${s.hook}\nBody: ${s.body}\nCTA: ${s.cta}\nHashtags: ${(s.hashtags || []).join(" ")}`,
        "Medium", "Ready", { platform: "TikTok", ...s })
      if (d) saved.push(d)
    }
    for (const c of content.instagram || []) {
      const d = await saveProposal("CMO Content Agent", "marketing_content", `Instagram - ${c.title}`,
        `${c.caption}\n\nHashtags: ${(c.hashtags || []).join(" ")}`,
        "Medium", "Ready", { platform: "Instagram", ...c })
      if (d) saved.push(d)
    }
    for (const r of content.reddit || []) {
      const d = await saveProposal("CMO Content Agent", "marketing_content", `Reddit - ${r.title}`,
        `${r.subreddit}\n\n${r.body}`,
        "Medium", "Ready", { platform: "Reddit", ...r })
      if (d) saved.push(d)
    }

    await logActivity("CMO Content Agent", `Generated ${saved.length} content pieces`)
    return Response.json({ success: true, count: saved.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CMO Content Agent", "Content generation failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
