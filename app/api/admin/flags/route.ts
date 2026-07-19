import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const { data, error } = await db
    .from("feature_flags")
    .select("key, enabled, note")
    .order("key", { ascending: true });
  if (error) return json({ error: "query_failed" }, 500);

  return json({ flags: data ?? [] });
}

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  let body: { key?: string; enabled?: unknown };
  try {
    body = (await req.json()) as { key?: string; enabled?: unknown };
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  if (!body.key || typeof body.enabled !== "boolean") {
    return json({ error: "bad_request" }, 400);
  }

  const { data: updated, error } = await db
    .from("feature_flags")
    .update({ enabled: body.enabled })
    .eq("key", body.key)
    .select("key, enabled, note")
    .maybeSingle();
  if (error) return json({ error: "update_failed" }, 500);
  if (!updated) return json({ error: "not_found" }, 404);

  return json({ ok: true, flag: updated });
}
