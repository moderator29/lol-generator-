import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const [users, posts, reportsOpen, houses] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("posts").select("id", { count: "exact", head: true }),
    db
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    db.from("houses").select("glory"),
  ]);

  const { data: recent } = await db
    .from("posts")
    .select("id, body, created_at, author:author_id (handle, display_name)")
    .order("created_at", { ascending: false })
    .limit(8);

  return json({
    stats: {
      users: users.count ?? 0,
      posts: posts.count ?? 0,
      openReports: reportsOpen.count ?? 0,
      gloryIssued: (houses.data ?? []).reduce((s, h) => s + (h.glory ?? 0), 0),
    },
    recent: recent ?? [],
  });
}
