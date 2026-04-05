import { askClaude, logActivity, supabase } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the CMO of Flipt, a Canadian AI resale pricing app. Generate a full week of social media content. Return as JSON only with this structure:
{
  "tiktok_scripts": [
    {"title": "title", "hook": "0-3s attention grabber", "demo": "3-20s show Flipt solving a problem", "cta": "20-30s download CTA", "hashtags": ["10 hashtags"]},
    {"title": "title", "hook": "...", "demo": "...", "cta": "...", "hashtags": [...]},
    {"title": "title", "hook": "...", "demo": "...", "cta": "...", "hashtags": [...]}
  ],
  "instagram_captions": [
    {"title": "post title", "caption": "full caption with emojis", "hashtags": ["10 hashtags"]},
    {"title": "...", "caption": "...", "hashtags": [...]},
    {"title": "...", "caption": "...", "hashtags": [...]}
  ],
  "reddit_posts": [
    {"title": "post title", "subreddit": "r/...", "body": "full post text"},
    {"title": "...", "subreddit": "...", "body": "..."}
  ]
}
Make content authentic, not salesy. Focus on genuine value: helping people make money from stuff they already own.`
    )

    let content
    try { content = JSON.parse(raw) } catch { content = { tiktok_scripts: [], instagram_captions: [], reddit_posts: [] } }

    // Save each piece as a proposal
    const saved = []
    for (const s of content.tiktok_scripts || []) {
      const { data } = await supabase.from("agent_proposals").insert({
        agent_name: "CMO Agent", proposal_type: "marketing_content", title: s.title,
        description: `TikTok Script\n\nHook: ${s.hook}\nDemo: ${s.demo}\nCTA: ${s.cta}\nHashtags: ${(s.hashtags || []).join(" ")}`,
        impact_rating: "Medium", complexity: "Ready", status: "pending", content: { platform: "TikTok", ...s },
      }).select().single()
      if (data) saved.push(data)
    }
    for (const c of content.instagram_captions || []) {
      const { data } = await supabase.from("agent_proposals").insert({
        agent_name: "CMO Agent", proposal_type: "marketing_content", title: c.title,
        description: `Instagram Caption\n\n${c.caption}\n\nHashtags: ${(c.hashtags || []).join(" ")}`,
        impact_rating: "Medium", complexity: "Ready", status: "pending", content: { platform: "Instagram", ...c },
      }).select().single()
      if (data) saved.push(data)
    }
    for (const r of content.reddit_posts || []) {
      const { data } = await supabase.from("agent_proposals").insert({
        agent_name: "CMO Agent", proposal_type: "marketing_content", title: r.title,
        description: `Reddit Post (${r.subreddit})\n\n${r.body}`,
        impact_rating: "Medium", complexity: "Ready", status: "pending", content: { platform: "Reddit", ...r },
      }).select().single()
      if (data) saved.push(data)
    }

    await logActivity("CMO Agent", `Generated ${saved.length} content pieces`, saved.map(s => s.title).join(", "))
    return Response.json({ success: true, count: saved.length, content })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CMO Agent", "Content generation failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
