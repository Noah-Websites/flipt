import { askClaude, logActivity, saveProposal } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the support lead for Flipt, a resale pricing app. Generate 5 template responses for common user questions. For each: question (what users ask), response (friendly, helpful, concise answer), category (billing/scanning/marketplace/account/general). Return JSON array only.`,
      1000
    )
    let templates: Array<{ question: string; response: string; category: string }> = []
    try { templates = JSON.parse(raw) } catch { templates = [] }

    const saved = []
    for (const t of templates) {
      const d = await saveProposal("COO Support Agent", "support_template", t.question, t.response, "Medium", "Ready", t)
      if (d) saved.push(d)
    }

    await logActivity("COO Support Agent", `Generated ${saved.length} support templates`)
    return Response.json({ success: true, count: saved.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("COO Support Agent", "Template generation failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
