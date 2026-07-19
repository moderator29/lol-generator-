import { after } from "next/server";
import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";
import { award } from "@/lib/points";
import { maybeRavenReply } from "@/lib/ai/mention";
import { lookupToken } from "@/lib/data/tokens";

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  if (!profile.onboarded)
    return json({ error: "Finish onboarding first" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const body = (await req.json().catch(() => null)) as {
    body?: string;
    kind?: string;
    media?: { url: string; type: string }[];
    poll?: { options: string[] };
    call?: { token: string; stance: "up" | "down"; timeframe: string };
  } | null;
  if (!body) return json({ error: "bad request" }, 400);

  const text = (body.body ?? "").trim();
  if (!text && !body.media?.length)
    return json({ error: "An empty raven carries no word" }, 400);
  if (text.length > 1000) return json({ error: "Too long" }, 400);

  const cashtags = [...text.matchAll(/\$([a-zA-Z]{2,12})\b/g)].map((m) =>
    m[1].toUpperCase()
  );

  let kind = body.kind === "poll" ? "poll" : "raven";
  let call: Record<string, unknown> | null = null;
  if (body.call?.token && body.call.stance) {
    kind = "call";
    /* A Call locks the REAL entry price at creation; the verdict is
       settled later against real data. No price, no Call. */
    const card = await lookupToken(body.call.token);
    if (!card || card.priceUsd === null)
      return json(
        { error: "No live price found for that token, the Call cannot be sealed" },
        400
      );
    call = {
      token: card.symbol,
      address: card.address,
      chain: card.chain,
      stance: body.call.stance,
      timeframe: ["24h", "7d", "30d"].includes(body.call.timeframe)
        ? body.call.timeframe
        : "24h",
      entry_price: card.priceUsd,
      verdict: "open",
    };
  }

  const poll =
    kind === "poll" && body.poll?.options?.length
      ? {
          options: body.poll.options
            .slice(0, 4)
            .map((o) => ({ text: String(o).slice(0, 60), votes: 0 })),
        }
      : null;

  const { data: post, error } = await db
    .from("posts")
    .insert({
      author_id: profile.id,
      kind,
      body: text,
      media: body.media?.slice(0, 4) ?? [],
      cashtags,
      call,
      poll,
      house_slug: profile.house_slug,
    })
    .select("id")
    .single();
  if (error || !post) return json({ error: "Could not send the raven" }, 500);

  await award(db, profile.id, {
    points: kind === "call" ? 8 : 5,
    glory: 2,
    reason: kind === "call" ? "sealed_a_call" : "sent_a_raven",
    ref: post.id,
  });

  after(async () => {
    await maybeRavenReply(db, post.id, text, profile.handle);
  });

  return json({ ok: true, id: post.id });
}
