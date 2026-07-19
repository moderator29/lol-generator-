import { after } from "next/server";
import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";
import { award } from "@/lib/points";
import { maybeRavenReply } from "@/lib/ai/mention";

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  if (!profile.onboarded)
    return json({ error: "Finish onboarding first" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const body = (await req.json().catch(() => null)) as {
    post_id?: string;
    parent_id?: string;
    body?: string;
  } | null;
  const text = body?.body?.trim();
  if (!body?.post_id || !text) return json({ error: "bad request" }, 400);
  if (text.length > 600) return json({ error: "Too long" }, 400);

  const { data: post } = await db
    .from("posts")
    .select("id, author_id, reply_count")
    .eq("id", body.post_id)
    .single();
  if (!post) return json({ error: "That raven is gone" }, 404);

  const { data: comment, error } = await db
    .from("comments")
    .insert({
      post_id: post.id,
      author_id: profile.id,
      parent_id: body.parent_id ?? null,
      body: text,
    })
    .select("id")
    .single();
  if (error || !comment) return json({ error: "Could not reply" }, 500);

  await db
    .from("posts")
    .update({ reply_count: post.reply_count + 1 })
    .eq("id", post.id);

  if (post.author_id !== profile.id) {
    await db.from("notifications").insert({
      profile_id: post.author_id,
      kind: "reply",
      actor_id: profile.id,
      subject_id: post.id,
      body: text.slice(0, 120),
    });
  }
  await award(db, profile.id, {
    points: 2,
    glory: 1,
    reason: "replied",
    ref: comment.id,
  });

  after(async () => {
    await maybeRavenReply(db, post.id, text, profile.handle);
  });

  return json({ ok: true, id: comment.id });
}
