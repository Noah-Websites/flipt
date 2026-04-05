import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const anthropic = new Anthropic()
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export { anthropic, supabase }

export async function askClaude(prompt: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  })
  return msg.content[0].type === "text" ? msg.content[0].text : ""
}

export async function logActivity(agentName: string, action: string, details?: string, status?: string) {
  await supabase.from("agent_activity").insert({
    agent_name: agentName,
    action,
    details,
    status: status || "completed",
  })
}

export async function saveProposal(agentName: string, type: string, title: string, description: string, impact: string, complexity: string, content?: unknown) {
  const { data } = await supabase.from("agent_proposals").insert({
    agent_name: agentName,
    proposal_type: type,
    title,
    description,
    impact_rating: impact,
    complexity,
    status: "pending",
    content: content || null,
  }).select().single()
  return data
}
