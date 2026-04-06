import Anthropic from "@anthropic-ai/sdk"
import supabaseAdmin from "./supabase-admin"

const anthropic = new Anthropic()

// Export the admin client for direct use in agent routes
export const supabase = supabaseAdmin

export async function askClaude(prompt: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  })
  return msg.content[0].type === "text" ? msg.content[0].text : ""
}

export async function logActivity(agentName: string, action: string, details?: string, status?: string) {
  const { error } = await supabaseAdmin.from("agent_activity").insert({
    agent_name: agentName,
    action,
    details: details || null,
    status: status || "completed",
  })
  if (error) console.error(`[Agent Activity] Failed to log for ${agentName}:`, error.message)
}

export async function saveProposal(agentName: string, type: string, title: string, description: string, impact: string, complexity: string, content?: unknown) {
  const { data, error } = await supabaseAdmin.from("agent_proposals").insert({
    agent_name: agentName,
    proposal_type: type,
    title,
    description,
    impact_rating: impact,
    complexity,
    status: "pending",
    content: content || null,
  }).select().single()
  if (error) console.error(`[Agent Proposal] Failed to save "${title}":`, error.message)
  return data
}
