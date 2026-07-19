"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { houses } from "@/lib/data/houses";
import { Icon } from "@/components/ui/icon";
import { TIER_NAMES, timeAgo } from "@/lib/social/types";

interface ProfileHit {
  handle: string | null;
  display_name: string | null;
  tier: string;
}

interface CallRow {
  id: string;
  created_at: string;
  call: { token: string; stance: "up" | "down"; timeframe: string } | null;
  author: { handle: string | null; display_name: string | null } | null;
}

const sigilIcon: Record<string, string> = {
  raven: "raven",
  flame: "flame",
  snowflake: "shield",
  storm: "signal",
  moon: "eye",
  lion: "crown",
};

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ProfileHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [calls, setCalls] = useState<CallRow[] | null>(null);

  useEffect(() => {
    const db = createClient();
    void db
      .from("posts")
      .select(
        "id, created_at, call, author:profiles!posts_author_id_fkey (handle, display_name)"
      )
      .eq("kind", "call")
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setCalls((data as unknown as CallRow[]) ?? []));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      const db = createClient();
      const like = `%${q.replace(/[%_]/g, "")}%`;
      void db
        .from("profiles")
        .select("handle, display_name, tier")
        .or(`handle.ilike.${like},display_name.ilike.${like}`)
        .not("handle", "is", null)
        .limit(12)
        .then(({ data }) => {
          setHits((data as ProfileHit[]) ?? []);
          setSearching(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">
        The Crossroads
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Explore
      </p>

      {/* Search */}
      <div className="glass glass-sm mt-5 flex items-center gap-3 px-4 py-3">
        <Icon name="search" className="h-4 w-4 shrink-0 text-bone-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the realm by name or handle"
          className="w-full bg-transparent text-sm text-bone placeholder:text-bone-faint focus:outline-none"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="mt-3 flex flex-col gap-2">
          {searching && hits === null ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="glass glass-sm h-14 animate-pulse" />
            ))
          ) : hits && hits.length === 0 ? (
            <div className="glass glass-sm p-6 text-center text-sm text-bone-mut">
              No citizen answers to that name. Try another spelling.
            </div>
          ) : (
            (hits ?? []).map((p, i) => (
              <Link
                key={p.handle ?? i}
                href={`/u/${p.handle}`}
                className="glass glass-sm glass-hover flex items-center gap-3 p-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-steel-line bg-panel font-display text-sm text-gold">
                  {(p.display_name ?? p.handle ?? "?")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-bone">
                    {p.display_name ?? p.handle}
                  </p>
                  <p className="truncate text-xs text-bone-faint">
                    @{p.handle}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-steel-line px-2.5 py-1 text-[11px] text-bone-mut">
                  {TIER_NAMES[p.tier] ?? p.tier}
                </span>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Houses */}
      <h2 className="mt-8 font-display text-base font-semibold text-bone">
        The Six Houses
      </h2>
      <p className="text-xs text-bone-faint">Communities, pick your banner</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {houses.map((h) => (
          <Link
            key={h.slug}
            href={`/houses/${h.slug}`}
            className="glass glass-sm glass-hover flex items-center gap-3 p-3"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: `linear-gradient(160deg, ${h.color}22, #101017)`,
                border: `1px solid ${h.color}44`,
                color: h.color,
              }}
            >
              <Icon name={sigilIcon[h.sigil] ?? "banner"} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-bone">
                {h.name.replace("House ", "")}
              </p>
              <p className="truncate text-[11px] italic text-bone-faint">
                {h.motto}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Latest Calls */}
      <h2 className="mt-8 font-display text-base font-semibold text-bone">
        Latest Calls
      </h2>
      <p className="text-xs text-bone-faint">
        Public claims, sealed and timestamped
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {calls === null ? (
          [0, 1].map((i) => (
            <div key={i} className="glass glass-sm h-14 animate-pulse" />
          ))
        ) : calls.length === 0 ? (
          <div className="glass glass-sm p-6 text-center text-sm text-bone-mut">
            No Calls have been sealed yet. The first bold claim awaits its
            maker.
          </div>
        ) : (
          calls.map((c) => (
            <Link
              key={c.id}
              href={`/post/${c.id}`}
              className="glass glass-sm glass-hover flex items-center gap-3 p-3"
            >
              <Icon
                name="target"
                className={`h-4.5 w-4.5 shrink-0 ${
                  c.call?.stance === "up" ? "text-gold" : "text-ember-deep"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-bone">
                  <span className="font-semibold text-gold-bright">
                    {c.call?.token ?? "?"}
                  </span>{" "}
                  {c.call?.stance === "up" ? "rises" : "falls"}
                </p>
                <p className="truncate text-xs text-bone-faint">
                  called by @{c.author?.handle ?? "unknown"}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-bone-faint">
                {timeAgo(c.created_at)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
