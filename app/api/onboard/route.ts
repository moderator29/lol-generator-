import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";
import { award, grantCrest } from "@/lib/points";

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const HOUSES = new Set([
  "corvane",
  "emberfall",
  "frosthold",
  "stormcrest",
  "nightvale",
  "goldmane",
]);

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  if (profile.onboarded)
    return json({ error: "The Maester has already welcomed you." }, 409);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const body = (await req.json().catch(() => null)) as {
    handle?: string;
    house?: string;
    display_name?: string;
    referral?: string;
  } | null;
  if (!body) return json({ error: "bad request" }, 400);

  const handle = body.handle?.toLowerCase().trim();
  const house = body.house?.toLowerCase().trim();
  if (!handle || !HANDLE_RE.test(handle))
    return json({ error: "Handle must be 3-20 characters, a-z 0-9 _" }, 400);
  if (handle === "raven")
    return json({ error: "That name belongs to the Herald." }, 400);
  if (!house || !HOUSES.has(house))
    return json({ error: "Choose a House of the realm" }, 400);

  const { data: taken } = await db
    .from("profiles")
    .select("id")
    .ilike("handle", handle)
    .neq("id", profile.id)
    .maybeSingle();
  if (taken) return json({ error: "That handle is already claimed" }, 409);

  const { error } = await db
    .from("profiles")
    .update({
      handle,
      house_slug: house,
      display_name: body.display_name?.slice(0, 40) || profile.display_name || handle,
      onboarded: true,
    })
    .eq("id", profile.id);
  if (error) return json({ error: "Could not save" }, 500);

  await db
    .from("house_members")
    .upsert({ profile_id: profile.id, house_slug: house });
  const { data: h } = await db
    .from("houses")
    .select("member_count")
    .eq("slug", house)
    .single();
  if (h)
    await db
      .from("houses")
      .update({ member_count: h.member_count + 1 })
      .eq("slug", house);

  /* Referral: capture who sent this wanderer (referred_by). It unlocks on
     real activity later (the third raven, in the posts route); recorded now.
     Resolve the code against referral_codes first, then fall back to the
     handle itself so a ?ref that predates a code row still credits a banner. */
  if (body.referral) {
    const ref = body.referral.toLowerCase().trim().replace(/^@/, "");
    let referrerId: string | null = null;
    if (ref) {
      const { data: code } = await db
        .from("referral_codes")
        .select("owner_id")
        .eq("code", ref)
        .maybeSingle();
      if (code) referrerId = code.owner_id as string;
      if (!referrerId) {
        const { data: byHandle } = await db
          .from("profiles")
          .select("id")
          .ilike("handle", ref)
          .maybeSingle();
        if (byHandle) referrerId = byHandle.id as string;
      }
    }
    if (referrerId && referrerId !== profile.id) {
      await db
        .from("referrals")
        .upsert({ profile_id: profile.id, referrer_id: referrerId });
    }
  }
  await db
    .from("referral_codes")
    .upsert({ code: handle, owner_id: profile.id }, { onConflict: "owner_id" });

  await grantCrest(db, profile.id, "took-the-black");
  await award(db, profile.id, {
    points: 50,
    glory: 20,
    reason: "took_the_black",
  });

  return json({ ok: true, handle, house });
}
