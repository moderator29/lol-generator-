import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

/* The realm calendar. GET lists every season; POST lets a steward
   activate or close a single season. */
export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const { data, error } = await db
    .from("seasons")
    .select("id, name, starts_at, ends_at, status, vault_raven")
    .order("id", { ascending: true });
  if (error) return json({ error: "query_failed" }, 500);

  return json({ seasons: data ?? [] });
}

const ALLOWED_STATUS = new Set(["active", "closed"]);

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  let body: { id?: unknown; status?: unknown };
  try {
    body = (await req.json()) as { id?: unknown; status?: unknown };
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const id =
    typeof body.id === "number"
      ? body.id
      : typeof body.id === "string"
        ? Number(body.id)
        : NaN;
  const status = body.status;

  if (!Number.isFinite(id) || typeof status !== "string" || !ALLOWED_STATUS.has(status)) {
    return json({ error: "bad_request" }, 400);
  }

  const { data: updated, error } = await db
    .from("seasons")
    .update({ status })
    .eq("id", id)
    .select("id, name, starts_at, ends_at, status, vault_raven")
    .maybeSingle();
  if (error) return json({ error: "update_failed" }, 500);
  if (!updated) return json({ error: "not_found" }, 404);

  return json({ ok: true, season: updated });
}
