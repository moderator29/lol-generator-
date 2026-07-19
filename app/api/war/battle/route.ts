import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";
import { award } from "@/lib/points";
import { champions } from "@/lib/game/champions";

const BATTLEFIELDS = new Set([
  "river-crossing",
  "castle-siege",
  "snow-valley",
  "dark-fortress",
]);

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const body = (await req.json().catch(() => null)) as {
    champion?: string;
    battlefield?: string;
    result?: "victory" | "defeat";
    kills?: number;
    duration_s?: number;
  } | null;
  if (!body?.champion || !body.result) return json({ error: "bad request" }, 400);
  if (!champions.some((c) => c.slug === body.champion))
    return json({ error: "Unknown champion" }, 400);
  const battlefield = BATTLEFIELDS.has(body.battlefield ?? "")
    ? (body.battlefield as string)
    : "river-crossing";

  /* Server-authoritative rewards: the client reports the outcome, the
     server decides the prize inside hard caps. */
  const kills = Math.max(0, Math.min(200, Math.floor(body.kills ?? 0)));
  const duration = Math.max(10, Math.min(900, Math.floor(body.duration_s ?? 60)));
  const victory = body.result === "victory";
  const glory = Math.min(400, (victory ? 120 : 30) + kills * 2);

  let { data: state } = await db
    .from("war_state")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!state) {
    const { data: created } = await db
      .from("war_state")
      .insert({ profile_id: profile.id })
      .select("*")
      .single();
    state = created;
  }
  if (!state) return json({ error: "unavailable" }, 503);
  if (!state.unlocked_champions.includes(body.champion))
    return json({ error: "That champion is not yet sworn to you" }, 403);

  await db.from("war_battles").insert({
    profile_id: profile.id,
    champion_slug: body.champion,
    battlefield,
    result: body.result,
    glory_earned: glory,
    kills,
    duration_s: duration,
  });
  await db
    .from("war_state")
    .update({
      battles: state.battles + 1,
      wins: state.wins + (victory ? 1 : 0),
      war_glory: state.war_glory + glory,
      gold: state.gold + (victory ? 40 : 10),
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);
  await award(db, profile.id, {
    glory,
    reason: victory ? "war_victory" : "war_fought",
  });

  return json({ ok: true, glory, gold: victory ? 40 : 10 });
}

export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);
  const { data: state } = await db
    .from("war_state")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  return json({
    state: state ?? {
      unlocked_champions: ["aeron-the-black", "ser-willas", "mira-stormborn"],
      gold: 200,
      war_glory: 0,
      battles: 0,
      wins: 0,
    },
  });
}
