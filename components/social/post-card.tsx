"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/social/avatar";
import { RichBody } from "@/components/social/rich-body";
import { PriceCard } from "@/components/social/price-card";
import { Icon } from "@/components/ui/icon";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { timeAgo, TIER_NAMES, type Post } from "@/lib/social/types";

function PollBlock({ post }: { post: Post }) {
  const { authenticated } = useRealmAuth();
  const [options, setOptions] = useState(post.poll?.options ?? []);
  const [voted, setVoted] = useState(false);
  const total = options.reduce((s, o) => s + o.votes, 0);

  const vote = async (i: number) => {
    if (!authenticated) {
      window.location.href = "/signin";
      return;
    }
    if (voted) return;
    setVoted(true);
    const res = await realmFetch<{ options?: { text: string; votes: number }[] }>(
      "/api/polls",
      { method: "POST", json: { post_id: post.id, option: i } }
    );
    if (res.data?.options) setOptions(res.data.options);
  };

  if (!options.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {options.map((o, i) => {
        const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
        return (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void vote(i);
            }}
            className="hairline relative overflow-hidden rounded-xl bg-void px-3 py-2 text-left text-xs text-bone-mut transition hover:border-gold/40"
          >
            <span
              className="absolute inset-y-0 left-0 bg-gold/12"
              style={{ width: `${pct}%` }}
            />
            <span className="relative flex justify-between gap-2">
              <span className="truncate">{o.text}</span>
              {total > 0 && <span className="tnum shrink-0 text-bone-faint">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="tnum px-1 text-[10px] text-bone-faint">
        {total} {total === 1 ? "voice" : "voices"}
      </p>
    </div>
  );
}

function ActionButton({
  icon,
  count,
  active,
  activeClass,
  label,
  onClick,
}: {
  icon: string;
  count?: number;
  active?: boolean;
  activeClass?: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition hover:bg-panel ${
        active ? (activeClass ?? "text-gold") : "text-bone-faint hover:text-bone-mut"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {count !== undefined && count > 0 && <span className="tnum">{count}</span>}
    </button>
  );
}

export function PostCard({ post }: { post: Post }) {
  const { authenticated } = useRealmAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.like_count);
  const [reposted, setReposted] = useState(false);
  const [reposts, setReposts] = useState(post.repost_count);
  const [bookmarked, setBookmarked] = useState(false);

  const requireAuth = () => {
    if (!authenticated) {
      window.location.href = "/signin";
      return false;
    }
    return true;
  };

  const toggleLike = async () => {
    if (!requireAuth()) return;
    const on = !liked;
    setLiked(on);
    setLikes((n) => n + (on ? 1 : -1));
    await realmFetch("/api/social", {
      method: "POST",
      json: { action: "like", subject_type: "post", subject_id: post.id, on },
    });
  };
  const toggleBookmark = async () => {
    if (!requireAuth()) return;
    const on = !bookmarked;
    setBookmarked(on);
    await realmFetch("/api/social", {
      method: "POST",
      json: { action: "bookmark", subject_id: post.id, on },
    });
  };
  const doRepost = async () => {
    if (!requireAuth() || reposted) return;
    setReposted(true);
    setReposts((n) => n + 1);
    await realmFetch("/api/social", {
      method: "POST",
      json: { action: "repost", subject_id: post.id },
    });
  };
  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* no clipboard, no drama */
    }
  };

  const a = post.author;
  const firstTag = post.cashtags[0];

  return (
    <article className="glass glass-sm glass-hover p-4">
      <div className="flex gap-3">
        <Link href={a.handle ? `/u/${a.handle}` : "#"}>
          <Avatar author={a} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <Link
              href={a.handle ? `/u/${a.handle}` : "#"}
              className="font-semibold text-bone hover:underline"
            >
              {a.display_name ?? a.handle ?? "A stranger"}
            </Link>
            {a.is_agent && (
              <span className="rounded-full border border-gold/40 px-1.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                Herald
              </span>
            )}
            {a.handle && (
              <span className="text-bone-faint">@{a.handle}</span>
            )}
            <span className="text-bone-faint">·</span>
            <span className="text-xs text-bone-faint">
              {timeAgo(post.created_at)}
            </span>
            {a.tier && !a.is_agent && (
              <span className="ml-auto hidden text-[10px] uppercase tracking-[0.16em] text-bone-faint sm:inline">
                {TIER_NAMES[a.tier] ?? a.tier}
              </span>
            )}
          </div>

          <Link href={`/post/${post.id}`} className="mt-1 block text-[15px] leading-relaxed text-bone">
            <RichBody text={post.body} />
          </Link>

          {post.call && (
            <div
              className={`glass-sm mt-2 flex items-center gap-3 rounded-xl border px-3 py-2 ${
                post.call.stance === "up"
                  ? "border-gold/40 bg-panel-warm"
                  : "border-ember-deep/40 bg-panel"
              }`}
            >
              <Icon
                name="target"
                className={`h-4 w-4 ${post.call.stance === "up" ? "text-gold" : "text-ember-deep"}`}
              />
              <p className="text-xs text-bone-mut">
                <span className="font-bold text-bone">CALL</span> · $
                {post.call.token} {post.call.stance === "up" ? "rises" : "falls"}{" "}
                within {post.call.timeframe} · sealed at ${post.call.entry_price}
              </p>
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  post.call.verdict === "hit"
                    ? "bg-gold/15 text-gold-bright"
                    : post.call.verdict === "miss"
                      ? "bg-ember-deep/15 text-ember-deep"
                      : "bg-steel-deep text-bone-faint"
                }`}
              >
                {post.call.verdict}
              </span>
            </div>
          )}

          {post.media.length > 0 && (
            <div
              className={`mt-2 grid gap-1.5 overflow-hidden rounded-2xl ${
                post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {post.media.slice(0, 4).map((m, i) =>
                m.type === "video" ? (
                  <video
                    key={i}
                    src={m.url}
                    controls
                    playsInline
                    muted
                    className="max-h-96 w-full rounded-xl border border-steel-line object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={m.url}
                    alt=""
                    loading="lazy"
                    className={`w-full rounded-xl border border-steel-line object-cover ${
                      post.media.length === 1 ? "max-h-96" : "aspect-square"
                    }`}
                  />
                )
              )}
            </div>
          )}

          {post.poll && <PollBlock post={post} />}

          {firstTag && !post.call && <PriceCard symbol={firstTag} />}

          <div className="mt-2 flex items-center gap-1">
            <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-bone-faint transition hover:bg-panel hover:text-bone-mut">
              <Icon name="reply" className="h-4 w-4" />
              {post.reply_count > 0 && (
                <span className="tnum">{post.reply_count}</span>
              )}
            </Link>
            <ActionButton
              icon="repost"
              count={reposts}
              active={reposted}
              label="Re-raven"
              onClick={doRepost}
            />
            <ActionButton
              icon="heart"
              count={likes}
              active={liked}
              activeClass="text-ember"
              label="Like"
              onClick={toggleLike}
            />
            <ActionButton
              icon="bookmark"
              active={bookmarked}
              label="Bookmark"
              onClick={toggleBookmark}
            />
            <ActionButton icon="share" label="Copy link" onClick={share} />
          </div>
        </div>
      </div>
    </article>
  );
}
