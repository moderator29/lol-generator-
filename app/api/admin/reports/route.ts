import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const { data, error } = await db
    .from("reports")
    .select(
      "id, subject_type, subject_id, reason, status, created_at, reporter:reporter_id (handle, display_name)"
    )
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return json({ error: "query_failed" }, 500);

  return json({ reports: data ?? [] });
}

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  let body: { report_id?: string; action?: string };
  try {
    body = (await req.json()) as { report_id?: string; action?: string };
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  if (!body.report_id || (body.action !== "resolve" && body.action !== "dismiss")) {
    return json({ error: "bad_request" }, 400);
  }

  const nextStatus = body.action === "resolve" ? "resolved" : "dismissed";
  const { data: updated, error } = await db
    .from("reports")
    .update({ status: nextStatus })
    .eq("id", body.report_id)
    .eq("status", "open")
    .select("id, status")
    .maybeSingle();
  if (error) return json({ error: "update_failed" }, 500);
  if (!updated) return json({ error: "not_found" }, 404);

  return json({ ok: true, report: updated });
}
