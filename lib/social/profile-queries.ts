"use client";

import { createClient } from "@/lib/supabase/client";
import { realmFetch } from "@/lib/auth/api";

/* Helpers owned by the Profiles + Explore surface. Kept separate from
   lib/social/queries.ts so this surface can evolve without touching the
   shared feed queries. */

export interface Viewer {
  id: string;
  handle: string | null;
  onboarded?: boolean;
}

/* The signed-in member, resolved through the token-authenticated /api/me
   route. Returns null when no one is signed in. */
export async function fetchViewer(): Promise<Viewer | null> {
  const res = await realmFetch<{ profile?: Viewer }>("/api/me", {
    method: "POST",
  });
  return res.data?.profile ?? null;
}

/* Whether `viewerId` currently follows `targetId`. The follows table is
   public-read, so the anon client answers this directly. */
export async function fetchIsFollowing(
  viewerId: string,
  targetId: string
): Promise<boolean> {
  const db = createClient();
  const { data } = await db
    .from("follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("followee_id", targetId)
    .maybeSingle();
  return Boolean(data);
}

/* Count of Calls this member sealed that landed as hits. */
export async function fetchCrestCount(profileId: string): Promise<number> {
  const db = createClient();
  const { count } = await db
    .from("user_crests")
    .select("crest_slug", { count: "exact", head: true })
    .eq("profile_id", profileId);
  return count ?? 0;
}
