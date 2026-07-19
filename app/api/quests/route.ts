import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";
import { award } from "@/lib/points";
import { quests } from "@/lib/game/quests";

export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await db
    .from("user_quests")
    .select("quest_slug, period")
    .eq("profile_id", profile.id)
    .gte("period", today);
  return json({ completed: data ?? [] });
}

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  if (!profile.onboarded) return json({ error: "Finish onboarding first" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const body = (await req.json().catch(() => null)) as { quest?: string } | null;
  const quest = quests.find((q) => q.slug === body?.quest);
  if (!quest) return json({ error: "Unknown quest" }, 400);

  const period = new Date().toISOString().slice(0, 10);
  const { error } = await db.from("user_quests").insert({
    profile_id: profile.id,
    quest_slug: quest.slug,
    period,
  });
  if (error) return json({ error: "Already completed for this period" }, 409);

  await award(db, profile.id, {
    points: quest.points,
    glory: quest.glory,
    reason: `quest_${quest.slug}`,
  });
  return json({ ok: true, glory: quest.glory, points: quest.points });
}
