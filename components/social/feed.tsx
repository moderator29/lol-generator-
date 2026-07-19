"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/social/post-card";
import { Composer } from "@/components/social/composer";
import {
  fetchFeed,
  subscribeToFeed,
  fetchFollowingIds,
  type FeedTab,
} from "@/lib/social/queries";
import type { Post } from "@/lib/social/types";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";

const TABS: { key: FeedTab; label: string }[] = [
  { key: "foryou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "houses", label: "My House" },
  { key: "signal", label: "Signal" },
  { key: "latest", label: "Latest" },
];

export function Feed() {
  const { authenticated } = useRealmAuth();
  const [tab, setTab] = useState<FeedTab>("foryou");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);
  const [done, setDone] = useState(false);
  const me = useRef<{ id: string; house_slug: string | null } | null>(null);
  const followingIds = useRef<string[] | null>(null);

  const load = useCallback(
    async (append = false) => {
      setLoading(!append);
      if (
        authenticated &&
        (tab === "following" || tab === "houses") &&
        !me.current
      ) {
        const res = await realmFetch<{
          profile?: { id: string; house_slug: string | null };
        }>("/api/me", { method: "POST" });
        if (res.data?.profile) me.current = res.data.profile;
      }
      if (tab === "following" && me.current && followingIds.current === null) {
        followingIds.current = await fetchFollowingIds(me.current.id);
      }
      const before = append ? posts[posts.length - 1]?.created_at : undefined;
      const batch = await fetchFeed({
        tab,
        before,
        followingIds: followingIds.current ?? [],
        houseSlug: me.current?.house_slug ?? null,
      });
      setDone(batch.length < 30);
      setPosts((prev) => (append ? [...prev, ...batch] : batch));
      setLoading(false);
      setHasNew(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, authenticated]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribeToFeed(() => setHasNew(true));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Composer onPosted={() => void load()} />

      <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.key
                ? "btn-gold"
                : "btn-glass text-bone-mut"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {hasNew && (
        <button
          onClick={() => void load()}
          className="btn-glass mx-auto px-4 py-1.5 text-xs text-gold"
        >
          New ravens have arrived
        </button>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass glass-sm h-28 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-bone-mut">
          {tab === "following"
            ? authenticated
              ? "You follow no one yet. The Crossroads is a fine place to find your people."
              : "Sign in to see the creators you follow."
            : tab === "houses"
              ? authenticated
                ? "No word from your House yet. Send the first raven."
                : "Sign in and join a House to see its hall."
              : "The ravens carry no word yet. Send the first raven of the realm."}
        </div>
      ) : (
        <>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
          {!done && (
            <button
              onClick={() => void load(true)}
              className="btn-glass mx-auto px-5 py-2 text-xs text-bone-mut"
            >
              Older ravens
            </button>
          )}
        </>
      )}
    </div>
  );
}
