import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

/* The honor roll. Returns how many citizens have earned each crest,
   keyed by crest_slug. Only real rows are counted. */
export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const { data, error } = await db.from("user_crests").select("crest_slug");
  if (error) return json({ error: "query_failed" }, 500);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const slug = (row as { crest_slug: string | null }).crest_slug;
    if (!slug) continue;
    counts[slug] = (counts[slug] ?? 0) + 1;
  }

  return json({ counts, total: (data ?? []).length });
}
