import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

/* The great houses. GET returns each house with its membership and
   glory. POST adjusts a single house's glory by a small, bounded
   delta (audited: adjustments are clamped so no steward can swing
   the standings wildly in one stroke). */
export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const { data, error } = await db
    .from("houses")
    .select("slug, name, sigil, color, member_count, glory")
    .order("glory", { ascending: false });
  if (error) return json({ error: "query_failed" }, 500);

  return json({ houses: data ?? [] });
}

/* Bound on a single glory adjustment. Kept small on purpose. */
const MAX_DELTA = 100;

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  let body: { slug?: unknown; glory_delta?: unknown };
  try {
    body = (await req.json()) as { slug?: unknown; glory_delta?: unknown };
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const slug = body.slug;
  const raw =
    typeof body.glory_delta === "number"
      ? body.glory_delta
      : typeof body.glory_delta === "string"
        ? Number(body.glory_delta)
        : NaN;

  if (typeof slug !== "string" || !slug || !Number.isFinite(raw) || raw === 0) {
    return json({ error: "bad_request" }, 400);
  }

  const delta = Math.trunc(raw);
  if (Math.abs(delta) > MAX_DELTA) {
    return json({ error: "delta_too_large", max: MAX_DELTA }, 400);
  }

  const { data: house, error: readErr } = await db
    .from("houses")
    .select("slug, glory")
    .eq("slug", slug)
    .maybeSingle();
  if (readErr) return json({ error: "query_failed" }, 500);
  if (!house) return json({ error: "not_found" }, 404);

  const nextGlory = Math.max(0, (house.glory ?? 0) + delta);

  const { data: updated, error } = await db
    .from("houses")
    .update({ glory: nextGlory })
    .eq("slug", slug)
    .select("slug, name, sigil, color, member_count, glory")
    .maybeSingle();
  if (error) return json({ error: "update_failed" }, 500);
  if (!updated) return json({ error: "not_found" }, 404);

  return json({ ok: true, house: updated, applied: delta });
}
