import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

const USER_SELECT =
  "id, handle, display_name, tier, renown, points, house_slug, is_admin, created_at";

export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const { data, error } = await db
    .from("profiles")
    .select(USER_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return json({ error: "query_failed" }, 500);

  return json({ users: data ?? [] });
}

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  let body: { profile_id?: string; action?: string };
  try {
    body = (await req.json()) as { profile_id?: string; action?: string };
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  if (body.action !== "toggle_admin" || !body.profile_id) {
    return json({ error: "bad_request" }, 400);
  }
  if (body.profile_id === profile.id) {
    return json({ error: "cannot_change_own_seat" }, 400);
  }

  const { data: target } = await db
    .from("profiles")
    .select("id, is_admin")
    .eq("id", body.profile_id)
    .maybeSingle();
  if (!target) return json({ error: "not_found" }, 404);

  const { data: updated, error } = await db
    .from("profiles")
    .update({ is_admin: !target.is_admin })
    .eq("id", target.id)
    .select(USER_SELECT)
    .single();
  if (error) return json({ error: "update_failed" }, 500);

  return json({ ok: true, user: updated });
}
