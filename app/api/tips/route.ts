import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";
import { award } from "@/lib/points";

/* Send a tribute of points from the caller to another member.
   Body: { to, subject_type?, subject_id?, points } */
export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  if (!profile.onboarded)
    return json({ error: "Complete your rites before sending tribute" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const body = (await req.json().catch(() => null)) as {
    to?: string;
    subject_type?: string;
    subject_id?: string;
    points?: number;
  } | null;

  const to = body?.to;
  const points = Math.floor(Number(body?.points));
  if (!to || !Number.isFinite(points)) return json({ error: "bad request" }, 400);
  if (points < 1 || points > 100)
    return json({ error: "A tribute must be between 1 and 100 points" }, 400);
  if (to === profile.id)
    return json(
      { error: "You cannot pay tribute to yourself, however deserving" },
      400
    );

  /* Fresh balance from the ledger's cached total, so a stale session token
     cannot overspend. */
  const { data: sender } = await db
    .from("profiles")
    .select("points")
    .eq("id", profile.id)
    .single();
  if (!sender) return json({ error: "unavailable" }, 503);
  if (sender.points < points)
    return json({ error: "Your coffers hold too few points" }, 400);

  const { data: receiver } = await db
    .from("profiles")
    .select("id")
    .eq("id", to)
    .maybeSingle();
  if (!receiver) return json({ error: "No such recipient" }, 404);

  const ref = body?.subject_id ?? to;

  /* Deduct the sender's spendable points and record it in the ledger.
     Renown (lifetime reputation) is deliberately left untouched: generosity
     spends coin, it does not lower a member's standing. */
  await db.from("points_ledger").insert({
    profile_id: profile.id,
    points_delta: -points,
    glory_delta: 0,
    reason: "tip_sent",
    ref,
  });
  await db
    .from("profiles")
    .update({ points: sender.points - points })
    .eq("id", profile.id);

  /* Credit the receiver through the standard award path. */
  await award(db, to, {
    points,
    reason: `tip_from_${profile.id}`,
    ref: body?.subject_id ?? undefined,
  });

  const { data: tip } = await db
    .from("tips")
    .insert({
      from_id: profile.id,
      to_id: to,
      points,
      subject_type: body?.subject_type ?? null,
      subject_id: body?.subject_id ?? null,
    })
    .select("id")
    .single();

  await db.from("notifications").insert({
    profile_id: to,
    kind: "tip",
    actor_id: profile.id,
    subject_id: body?.subject_id ?? null,
    body: String(points),
  });

  return json({ ok: true, tip: tip?.id ?? null });
}
