import { askClaude, logActivity, supabase } from "../../../../lib/agents"

export async function GET() {
  try {
    const raw = await askClaude(
      `You are the CPO of Flipt, a Canadian resale pricing app. Analyze competitor apps: eBay, Mercari, OfferUp, Decluttr, Poshmark. Return JSON only:
{
  "competitor_features": [
    {"feature": "name", "competitor": "who has it", "description": "what it does", "flipt_opportunity": "how Flipt could do it better"}
  ],
  "market_gaps": [
    {"gap": "name", "description": "what nobody is doing", "opportunity_size": "Small/Medium/Large", "flipt_approach": "how Flipt could fill this"}
  ]
}
Identify 3 competitor features and 3 market gaps.`
    )

    let findings
    try { findings = JSON.parse(raw) } catch { findings = { competitor_features: [], market_gaps: [] } }

    // Save as proposals
    for (const f of findings.competitor_features || []) {
      await supabase.from("agent_proposals").insert({
        agent_name: "CPO Agent", proposal_type: "product_research",
        title: `Competitor feature: ${f.feature}`, description: `${f.competitor} has: ${f.description}\n\nOpportunity: ${f.flipt_opportunity}`,
        impact_rating: "Medium", complexity: "Medium", status: "pending", content: f,
      })
    }
    for (const g of findings.market_gaps || []) {
      await supabase.from("agent_proposals").insert({
        agent_name: "CPO Agent", proposal_type: "product_research",
        title: `Market gap: ${g.gap}`, description: `${g.description}\n\nOpportunity size: ${g.opportunity_size}\nApproach: ${g.flipt_approach}`,
        impact_rating: g.opportunity_size === "Large" ? "High" : "Medium", complexity: "Medium", status: "pending", content: g,
      })
    }

    await logActivity("CPO Agent", "Product research completed", `${(findings.competitor_features || []).length} features, ${(findings.market_gaps || []).length} gaps`)
    return Response.json({ success: true, findings })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent error"
    await logActivity("CPO Agent", "Research failed", msg, "error")
    return Response.json({ error: msg }, { status: 500 })
  }
}
