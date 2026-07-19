"use client";

import { createClient } from "@/lib/supabase/client";
import type { Post, Comment, PublicProfile } from "@/lib/social/types";

const AUTHOR_SELECT =
  "author:profiles!posts_author_id_fkey (handle, display_name, avatar_url, house_slug, tier, is_agent)";
const POST_SELECT = `id, kind, body, media, cashtags, call, poll, house_slug, like_count, reply_count, repost_count, created_at, ${AUTHOR_SELECT}`;

export type FeedTab = "foryou" | "following" | "houses" | "signal" | "latest";

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
  return (data ?? []) as unknown as Post[];
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
      "id, handle, display_name, avatar_url, banner_url, bio, house_slug, tier, renown, points, glory, x_handle, is_agent, created_at"
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
