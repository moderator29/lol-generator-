import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { RAVEN_SYSTEM_PROMPT } from "@/lib/ai/raven-voice";

const key = process.env.ANTHROPIC_API_KEY;
const client = key ? new Anthropic({ apiKey: key }) : null;

export function ravenEnabled() {
  return Boolean(client);
}

export async function askRaven(
  messages: { role: "user" | "assistant"; content: string }[],
  context?: string
): Promise<string | null> {
  if (!client) return null;
  try {
    const res = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 600,
      system: context
        ? `${RAVEN_SYSTEM_PROMPT}\n\nLIVE DATA CONTEXT (real, verified, use it):\n${context}`
        : RAVEN_SYSTEM_PROMPT,
      messages,
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : null;
  } catch {
    return null;
  }
}
