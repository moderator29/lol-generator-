import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const TIERS: { slug: string; name: string; min: number }[] = [
  { slug: "smallfolk", name: "Smallfolk", min: 0 },
  { slug: "squire", name: "Squire", min: 100 },
  { slug: "knight", name: "Knight", min: 400 },
  { slug: "lord", name: "Lord / Lady", min: 1200 },
  { slug: "warden", name: "Warden", min: 3000 },
  { slug: "hand", name: "Hand", min: 7000 },
  { slug: "king", name: "King / Queen", min: 15000 },
];

export function tierFor(renown: number) {
  let current = TIERS[0];
  for (const t of TIERS) if (renown >= t.min) current = t;
  return current;
}

/* Award points/glory: writes the ledger and updates the profile totals.
   The ledger is the source of truth; totals are a cached convenience. */
export async function award(
  db: SupabaseClient,
  profileId: string,
  opts: { points?: number; glory?: number; reason: string; ref?: string }
) {
  const points = opts.points ?? 0;
  const glory = opts.glory ?? 0;
  if (points === 0 && glory === 0) return;

  await db.from("points_ledger").insert({
    profile_id: profileId,
    points_delta: points,
    glory_delta: glory,
    reason: opts.reason,
    ref: opts.ref ?? null,
  });

  const { data: prof } = await db
    .from("profiles")
    .select("points, glory, renown, house_slug")
    .eq("id", profileId)
    .single();
  if (!prof) return;

  const renown = prof.renown + points + glory;
  await db
    .from("profiles")
    .update({
      points: prof.points + points,
      glory: prof.glory + glory,
      renown,
      tier: tierFor(renown).slug,
    })
    .eq("id", profileId);

  if (glory > 0 && prof.house_slug) {
    const { data: house } = await db
      .from("houses")
      .select("glory")
      .eq("slug", prof.house_slug)
      .single();
    if (house) {
      await db
        .from("houses")
        .update({ glory: house.glory + glory })
        .eq("slug", prof.house_slug);
    }
  }
}

export async function grantCrest(
  db: SupabaseClient,
  profileId: string,
  crestSlug: string
) {
  await db
    .from("user_crests")
    .upsert(
      { profile_id: profileId, crest_slug: crestSlug },
      { onConflict: "profile_id,crest_slug", ignoreDuplicates: true }
    );
}
