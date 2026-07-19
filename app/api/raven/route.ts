import { json } from "@/lib/auth/server";
import { askRaven, ravenEnabled } from "@/lib/ai/raven";
import { lookupToken, describeTokenForRaven } from "@/lib/data/tokens";

export async function POST(req: Request) {
  if (!ravenEnabled())
    return json(
      { error: "The Raven sleeps: its mind is not configured in this environment." },
      503
    );

  const body = (await req.json().catch(() => null)) as {
    messages?: { role: "user" | "assistant"; content: string }[];
  } | null;
  const messages = (body?.messages ?? [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user")
    return json({ error: "Say something to the Raven" }, 400);

  const lastUser = messages[messages.length - 1].content;
  const cashtags = [...lastUser.matchAll(/\$([a-zA-Z0-9]{2,12})/g)].map(
    (m) => m[1]
  );
  const contexts: string[] = [];
  const cards = [];
  for (const tag of cashtags.slice(0, 3)) {
    const card = await lookupToken(tag);
    if (card) {
      contexts.push(describeTokenForRaven(card));
      cards.push(card);
    } else {
      contexts.push(`Token $${tag.toUpperCase()}: no live data found.`);
    }
  }

  const reply = await askRaven(
    messages,
    contexts.length ? contexts.join("\n") : undefined
  );
  if (!reply)
    return json({ error: "The Raven is preoccupied. Try again shortly." }, 502);
  return json({ reply, cards });
}
