import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

/* The caller's banner: their shareable code, how many recruits they have
   raised (activated on real activity), and the roll of names they sent. */
export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  /* The referral code is the member's handle; a row is written to
     referral_codes at onboarding. Fall back to the handle so the banner
     always resolves even for older accounts. */
  const { data: codeRow } = await db
    .from("referral_codes")
    .select("code")
    .eq("owner_id", profile.id)
    .maybeSingle();
  const code = codeRow?.code ?? profile.handle ?? null;

  const { data: rows } = await db
    .from("referrals")
    .select(
      "activated, created_at, member:profiles!referrals_profile_id_fkey (handle, display_name, avatar_url, house_slug, tier)"
    )
    .eq("referrer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const referrals = (rows ?? []).map((r) => ({
    activated: Boolean(r.activated),
    created_at: r.created_at as string,
    member: r.member ?? null,
  }));
  const activated = referrals.filter((r) => r.activated).length;

  return json({
    code,
    activated,
    pending: referrals.length - activated,
    total: referrals.length,
    referrals,
  });
}
