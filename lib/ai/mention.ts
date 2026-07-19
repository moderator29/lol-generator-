import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { askRaven, ravenEnabled } from "@/lib/ai/raven";
import { lookupToken, describeTokenForRaven } from "@/lib/data/tokens";
import { detectHouses, describeHousesForRaven } from "@/lib/ai/raven-voice";

/* When a raven or comment tags @raven, the Herald answers inline as its
   own account. Real data context is attached for any $cashtags present. */
export async function maybeRavenReply(
  db: SupabaseClient,
  postId: string,
  text: string,
  authorHandle: string | null
) {
  if (!ravenEnabled()) return;
  if (!/@raven\b/i.test(text)) return;

  const { data: raven } = await db
    .from("profiles")
    .select("id")
    .eq("handle", "raven")
    .eq("is_agent", true)
    .single();
  if (!raven) return;

  const cashtags = [...text.matchAll(/\$([a-zA-Z0-9]{2,12})/g)].map(
    (m) => m[1]
  );
  const contexts: string[] = [];
  for (const tag of cashtags.slice(0, 3)) {
    const card = await lookupToken(tag);
    if (card) contexts.push(describeTokenForRaven(card));
    else contexts.push(`Token $${tag.toUpperCase()}: no live data found.`);
  }

  const matchedHouses = detectHouses(text);
  if (matchedHouses.length) contexts.push(describeHousesForRaven(matchedHouses));

  const reply = await askRaven(
    [
      {
        role: "user",
        content: `A member of the realm${authorHandle ? ` (@${authorHandle})` : ""} tagged you in the Ravenry and said:\n\n"${text}"\n\nReply inline as @raven. Keep it under 120 words.`,
      },
    ],
    contexts.length ? contexts.join("\n") : undefined
  );
  if (!reply) return;

  await db.from("comments").insert({
    post_id: postId,
    author_id: raven.id,
    body: reply,
  });
  const { data: post } = await db
    .from("posts")
    .select("reply_count, author_id")
    .eq("id", postId)
    .single();
  if (post) {
    await db
      .from("posts")
      .update({ reply_count: post.reply_count + 1 })
      .eq("id", postId);
    await db.from("notifications").insert({
      profile_id: post.author_id,
      kind: "raven_reply",
      actor_id: raven.id,
      subject_id: postId,
      body: "The Raven has answered your raven.",
    });
  }
}
