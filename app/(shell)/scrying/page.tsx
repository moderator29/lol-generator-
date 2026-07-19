"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

interface TrendingToken {
  name: string;
  chain: string;
  address: string;
  url: string;
}

export default function ScryingPage() {
  const [trending, setTrending] = useState<TrendingToken[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/scrying");
        const body = (await res.json()) as { trending?: TrendingToken[] };
        if (!cancelled) setTrending(body.trending ?? []);
      } catch {
        if (!cancelled) setTrending([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">
        The Scrying Glass
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Market watch
      </p>
      <p className="mt-3 text-sm text-bone-mut">
        What the realm is watching now, from live markets.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        {trending === null ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="glass glass-sm h-14 animate-pulse" />
          ))
        ) : trending.length === 0 ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            The glass is dark for the moment. No trends could be read from the
            markets. Return soon.
          </div>
        ) : (
          trending.map((t, i) => (
            <div
              key={`${t.address}-${i}`}
              className="glass glass-sm flex items-center gap-3 px-3.5 py-3"
            >
              <span className="tnum w-6 shrink-0 text-center text-sm text-bone-faint">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-bone">{t.name}</p>
              </div>
              <span className="glass-sm shrink-0 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-bone-mut">
                {t.chain}
              </span>
              {t.url && (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${t.name} on DexScreener`}
                  className="shrink-0 text-bone-faint transition-colors hover:text-gold"
                >
                  <Icon name="arrow" className="h-4 w-4" />
                </a>
              )}
            </div>
          ))
        )}
      </div>

      <div className="glass mt-5 p-5">
        <div className="flex items-start gap-3">
          <Icon name="eye" className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            <h2 className="font-display text-sm font-semibold text-bone">
              Track great wallets
            </h2>
            <p className="mt-1 text-sm text-bone-mut">
              Follow the moves of the realm&apos;s most storied treasuries.
              This scrying deepens soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
