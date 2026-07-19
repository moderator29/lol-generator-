import "server-only";
import { PrivyClient } from "@privy-io/server-auth";
import { adminClient } from "@/lib/supabase/admin";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

const privy = appId && appSecret ? new PrivyClient(appId, appSecret) : null;

export type SessionProfile = {
  id: string;
  privy_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  house_slug: string | null;
  x_handle: string | null;
  wallet_address: string | null;
  renown: number;
  tier: string;
  points: number;
  glory: number;
  is_admin: boolean;
  onboarded: boolean;
};

/* Verify the bearer token from the request and return (or create) the
   caller's profile. Returns null when unauthenticated or unconfigured. */
export async function requireProfile(
  req: Request
): Promise<SessionProfile | null> {
  if (!privy) return null;
  const db = adminClient();
  if (!db) return null;

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  let privyId: string;
  try {
    const claims = await privy.verifyAuthToken(token);
    privyId = claims.userId;
  } catch {
    return null;
  }

  const { data: existing } = await db
    .from("profiles")
    .select(
      "id, privy_id, handle, display_name, avatar_url, house_slug, x_handle, wallet_address, renown, tier, points, glory, is_admin, onboarded"
    )
    .eq("privy_id", privyId)
    .maybeSingle();
  if (existing) return existing as SessionProfile;

  /* First entrance: create the profile shell, enrich from Privy. The X
     profile photo becomes the citizen's first avatar (editable later). */
  let displayName: string | null = null;
  let xHandle: string | null = null;
  let wallet: string | null = null;
  let avatar: string | null = null;
  try {
    const user = await privy.getUser(privyId);
    xHandle = user.twitter?.username ?? null;
    displayName =
      user.twitter?.name ??
      user.twitter?.username ??
      user.email?.address?.split("@")[0] ??
      null;
    wallet = user.wallet?.address ?? null;
    const pic = user.twitter?.profilePictureUrl ?? null;
    /* Twitter serves a tiny "_normal" crop by default; ask for a real size. */
    avatar = pic ? pic.replace("_normal", "_400x400") : null;
  } catch {
    /* enrichment is best-effort */
  }

  const { data: created, error } = await db
    .from("profiles")
    .insert({
      privy_id: privyId,
      display_name: displayName,
      x_handle: xHandle,
      wallet_address: wallet,
      avatar_url: avatar,
    })
    .select(
      "id, privy_id, handle, display_name, avatar_url, house_slug, x_handle, wallet_address, renown, tier, points, glory, is_admin, onboarded"
    )
    .single();
  if (error) return null;
  return created as SessionProfile;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
