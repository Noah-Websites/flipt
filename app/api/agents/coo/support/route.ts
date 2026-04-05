import { askClaude, logActivity } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the Support Agent for Flipt, a resale pricing app. Generate template responses for the 5 most common support questions users would ask. For each: question, response (friendly, helpful, concise), category (billing/scanning/marketplace/account/general). Return as JSON array only.`
    )

    let templates
    try { templates = JSON.parse(raw) } catch { templates = [] }

    await logActivity("Support Agent", `Generated ${templates.length} support templates`)
    return Response.json({ success: true, templates })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("Support Agent", "Template generation failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
