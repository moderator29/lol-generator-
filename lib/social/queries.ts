"use client";

import { createClient } from "@/lib/supabase/client";
import type { Post, Comment, PublicProfile } from "@/lib/social/types";

const AUTHOR_SELECT =
  "author:profiles!posts_author_id_fkey (handle, display_name, avatar_url, house_slug, tier, is_agent)";
const POST_SELECT = `id, author_id, kind, body, media, cashtags, call, poll, house_slug, like_count, reply_count, repost_count, view_count, created_at, ${AUTHOR_SELECT}`;
/* Same shape plus `deleted`, so re-ravens of removed posts can be dropped. */
const REPOST_POST_SELECT = `id, author_id, kind, body, media, cashtags, call, poll, house_slug, like_count, reply_count, repost_count, view_count, created_at, deleted, ${AUTHOR_SELECT}`;

export type FeedTab = "foryou" | "following" | "houses" | "signal" | "latest";

/* Tabs where a re-raven earns distribution alongside original posts. */
const REPOST_TABS: FeedTab[] = ["foryou", "latest", "following"];

function feedTime(p: Post): number {
  return Date.parse(p.effectiveTime ?? p.created_at);
}

export async function fetchFeed(opts: {
  tab: FeedTab;
  before?: string;
  followingIds?: string[];
  houseSlug?: string | null;
}): Promise<Post[]> {
  const db = createClient();
  let q = db
    .from("posts")
    .select(POST_SELECT)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(30);
  if (opts.before) q = q.lt("created_at", opts.before);
  if (opts.tab === "signal") q = q.eq("kind", "call");
  if (opts.tab === "houses" && opts.houseSlug)
    q = q.eq("house_slug", opts.houseSlug);
  if (opts.tab === "following") {
    if (!opts.followingIds?.length) return [];
    q = q.in("author_id", opts.followingIds);
  }
  const { data } = await q;
  const posts: Post[] = ((data ?? []) as unknown as Post[]).map((p) => ({
    ...p,
    effectiveTime: p.created_at,
  }));

  if (!REPOST_TABS.includes(opts.tab)) return posts;

  const reposts = await fetchReposts({
    tab: opts.tab,
    before: opts.before,
    followingIds: opts.followingIds,
  });
  /* Merge and order by feed time so re-ravens surface at their re-raven
     moment; cap to a single page's worth. */
  return [...posts, ...reposts]
    .sort((a, b) => feedTime(b) - feedTime(a))
    .slice(0, 30);
}

/* Re-ravens as feed items: the original post and author, tagged with who
   re-ravened it and when. Ordered newest re-raven first. */
export async function fetchReposts(opts: {
  tab?: FeedTab;
  before?: string;
  followingIds?: string[];
}): Promise<Post[]> {
  const db = createClient();
  let q = db
    .from("reposts")
    .select(
      `created_at, quote, reposter:profiles!reposts_profile_id_fkey (handle, display_name), post:posts!reposts_post_id_fkey (${REPOST_POST_SELECT})`
    )
    .order("created_at", { ascending: false })
    .limit(30);
  if (opts.before) q = q.lt("created_at", opts.before);
  if (opts.tab === "following") {
    if (!opts.followingIds?.length) return [];
    q = q.in("profile_id", opts.followingIds);
  }
  const { data } = await q;

  type RepostRow = {
    created_at: string;
    quote: string | null;
    reposter: { handle: string | null; display_name: string | null } | null;
    post: (Post & { deleted?: boolean }) | null;
  };

  return ((data ?? []) as unknown as RepostRow[])
    .filter((r): r is RepostRow & { post: Post & { deleted?: boolean } } =>
      Boolean(r.post) && !r.post!.deleted
    )
    .map((r) => {
      const { deleted: _deleted, ...post } = r.post;
      return {
        ...(post as Post),
        repostedBy: r.reposter
          ? {
              handle: r.reposter.handle,
              display_name: r.reposter.display_name,
            }
          : undefined,
        quote: r.quote,
        effectiveTime: r.created_at,
      };
    });
}

export async function fetchPost(id: string): Promise<Post | null> {
  const db = createClient();
  const { data } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Post) ?? null;
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const db = createClient();
  const { data } = await db
    .from("comments")
    .select(
      "id, post_id, parent_id, body, like_count, created_at, author:profiles!comments_author_id_fkey (handle, display_name, avatar_url, house_slug, tier, is_agent)"
    )
    .eq("post_id", postId)
    .eq("deleted", false)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []) as unknown as Comment[];
}

export async function fetchProfile(handle: string): Promise<PublicProfile | null> {
  const db = createClient();
  const { data } = await db
    .from("profiles")
    .select(
      "id, handle, display_name, avatar_url, banner_url, bio, links, house_slug, tier, renown, points, glory, x_handle, is_agent, created_at"
    )
    .ilike("handle", handle)
    .maybeSingle();
  return (data as unknown as PublicProfile) ?? null;
}

export async function fetchProfilePosts(profileId: string): Promise<Post[]> {
  const db = createClient();
  const { data } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("author_id", profileId)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as unknown as Post[];
}

export async function fetchFollowCounts(profileId: string) {
  const db = createClient();
  const [followers, following] = await Promise.all([
    db
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("followee_id", profileId),
    db
      .from("follows")
      .select("followee_id", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function fetchFollowingIds(profileId: string): Promise<string[]> {
  const db = createClient();
  const { data } = await db
    .from("follows")
    .select("followee_id")
    .eq("follower_id", profileId)
    .limit(1000);
  return (data ?? []).map((r) => r.followee_id as string);
}

export async function fetchUserCrests(profileId: string): Promise<string[]> {
  const db = createClient();
  const { data } = await db
    .from("user_crests")
    .select("crest_slug")
    .eq("profile_id", profileId);
  return (data ?? []).map((r) => r.crest_slug as string);
}

export function subscribeToFeed(onInsert: () => void) {
  const db = createClient();
  const channel = db
    .channel("ravenry")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      onInsert
    )
    .subscribe();
  return () => {
    void db.removeChannel(channel);
  };
}
