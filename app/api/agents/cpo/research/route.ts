import { askClaude, logActivity, saveProposal } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the CPO of Flipt, a Canadian resale pricing app. Analyze competitors (eBay, Mercari, OfferUp, Decluttr, Poshmark). Return JSON only:
{"competitor_features":[{"feature":"name","competitor":"who has it","description":"what it does","opportunity":"how Flipt could do it better"}],"market_gaps":[{"gap":"name","description":"what nobody does","size":"Small/Medium/Large","approach":"how Flipt fills this"}]}
Include 3 competitor features and 3 market gaps.`,
      1500
    )
    let findings: { competitor_features?: Array<{ feature: string; competitor: string; description: string; opportunity: string }>; market_gaps?: Array<{ gap: string; description: string; size: string; approach: string }> } = {}
    try { findings = JSON.parse(raw) } catch { findings = {} }

    const saved = []
    for (const f of findings.competitor_features || []) {
      const d = await saveProposal("CPO Research Agent", "product_research",
        `Competitor: ${f.feature}`, `${f.competitor} has: ${f.description}\n\nOpportunity: ${f.opportunity}`,
        "Medium", "Medium", f)
      if (d) saved.push(d)
    }
    for (const g of findings.market_gaps || []) {
      const d = await saveProposal("CPO Research Agent", "product_research",
        `Market Gap: ${g.gap}`, `${g.description}\n\nSize: ${g.size}\nApproach: ${g.approach}`,
        g.size === "Large" ? "High" : "Medium", "Medium", g)
      if (d) saved.push(d)
    }

    await logActivity("CPO Research Agent", `Product research completed: ${saved.length} findings`)
    return Response.json({ success: true, count: saved.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CPO Research Agent", "Research failed: " + msg, undefined, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
