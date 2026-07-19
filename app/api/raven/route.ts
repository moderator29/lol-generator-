import { requireProfile, json } from "@/lib/auth/server";
import { askRaven, ravenEnabled } from "@/lib/ai/raven";
import { lookupToken, describeTokenForRaven } from "@/lib/data/tokens";

/* Per-instance rate limit: the Raven's mind costs real coin. */
const usage = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 3600_000;
const MAX_PER_WINDOW = 20;

export async function POST(req: Request) {
  if (!ravenEnabled())
    return json(
      { error: "The Raven sleeps: its mind is not configured in this environment." },
      503
    );

  const profile = await requireProfile(req);
  if (!profile)
    return json(
      { error: "The Raven speaks only to members of the realm. Enter first." },
      401
    );

  const now = Date.now();
  const u = usage.get(profile.id);
  if (!u || now - u.windowStart > WINDOW_MS) {
    usage.set(profile.id, { count: 1, windowStart: now });
  } else if (u.count >= MAX_PER_WINDOW) {
    return json(
      { error: "The Raven grows hoarse. Return within the hour." },
      429
    );
  } else {
    u.count += 1;
  }

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
