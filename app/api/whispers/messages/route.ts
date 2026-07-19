import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

async function assertMember(
  db: NonNullable<ReturnType<typeof adminClient>>,
  conversationId: string,
  profileId: string
) {
  const { data } = await db
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return Boolean(data);
}

export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const conversation = new URL(req.url).searchParams.get("conversation");
  if (!conversation) return json({ error: "bad request" }, 400);
  if (!(await assertMember(db, conversation, profile.id)))
    return json({ error: "Not your whisper" }, 403);

  const { data: messages } = await db
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversation)
    .order("created_at", { ascending: true })
    .limit(200);

  await db
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversation)
    .eq("profile_id", profile.id);

  return json({ me: profile.id, messages: messages ?? [] });
}

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const body = (await req.json().catch(() => null)) as {
    conversation?: string;
    body?: string;
  } | null;
  const text = body?.body?.trim();
  if (!body?.conversation || !text) return json({ error: "bad request" }, 400);
  if (text.length > 1000) return json({ error: "Too long for one breath" }, 400);
  if (!(await assertMember(db, body.conversation, profile.id)))
    return json({ error: "Not your whisper" }, 403);

  const { error } = await db.from("messages").insert({
    conversation_id: body.conversation,
    sender_id: profile.id,
    body: text,
  });
  if (error) return json({ error: "The whisper was lost" }, 500);

  await db
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", body.conversation);

  return json({ ok: true });
}
