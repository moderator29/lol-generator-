import { json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";
import { award } from "@/lib/points";
import { lookupToken } from "@/lib/data/tokens";

const WINDOW_MS: Record<string, number> = {
  "24h": 24 * 3600 * 1000,
  "7d": 7 * 24 * 3600 * 1000,
  "30d": 30 * 24 * 3600 * 1000,
};

/* Settles matured Calls against the live market. Runs on a schedule
   (vercel.json cron) and is safe to call any time: only matured, still
   open Calls are touched, and verdicts come from real prices only. */
export async function GET() {
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const { data: posts } = await db
    .from("posts")
    .select("id, author_id, call, created_at")
    .eq("kind", "call")
    .eq("deleted", false)
    .order("created_at", { ascending: true })
    .limit(200);

  let settled = 0;
  for (const post of posts ?? []) {
    const call = post.call as {
      token: string;
      stance: "up" | "down";
      timeframe: string;
      entry_price: number;
      verdict: string;
    } | null;
    if (!call || call.verdict !== "open") continue;
    const windowMs = WINDOW_MS[call.timeframe] ?? WINDOW_MS["24h"];
    if (Date.parse(post.created_at) + windowMs > Date.now()) continue;

    const card = await lookupToken(call.token);
    if (!card || card.priceUsd === null) continue; /* no data, no verdict */

    const rose = card.priceUsd > call.entry_price;
    const hit = call.stance === "up" ? rose : !rose;
    await db
      .from("posts")
      .update({
        call: {
          ...call,
          verdict: hit ? "hit" : "miss",
          settled_price: card.priceUsd,
          settled_at: new Date().toISOString(),
        },
      })
      .eq("id", post.id);
    settled++;

    await db.from("notifications").insert({
      profile_id: post.author_id,
      kind: "call_verdict",
      subject_id: post.id,
      body: hit
        ? `Your Call on $${call.token} struck true.`
        : `Your Call on $${call.token} missed its mark.`,
    });
    if (hit) {
      await award(db, post.author_id, {
        points: 40,
        glory: 25,
        reason: "call_hit",
        ref: post.id,
      });
    }
  }

  return json({ ok: true, settled });
}
