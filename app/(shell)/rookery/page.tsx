"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";

type FlagRow = Record<string, unknown> | null;

export default function RookeryPage() {
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    const db = createClient();
    void db
      .from("feature_flags")
      .select("*")
      .eq("key", "rookery_live")
      .maybeSingle()
      .then(({ data }) => {
        const row = data as FlagRow;
        const on =
          !!row &&
          (row.enabled === true || row.value === true || row.value === "true");
        setLive(on);
      });
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">
        The Rookery
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Live
      </p>

      {live === null ? (
        <div className="glass mt-5 h-64 animate-pulse" />
      ) : live ? (
        <div className="glass mt-5 p-8 text-center">
          <Icon name="signal" className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-3 font-display text-lg font-semibold text-bone">
            No courts in session
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-bone-mut">
            The hall stands ready and the benches are empty. When a court
            convenes, it will appear here.
          </p>
        </div>
      ) : (
        <div className="glass relative mt-5 overflow-hidden p-8 sm:p-12">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-40"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 0%, rgba(200,162,76,0.14), transparent)",
            }}
          />
          <div className="relative flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-steel-line bg-panel">
              <Icon name="signal" className="h-8 w-8 text-gold" />
            </span>
            <h2 className="gold-text font-display mt-5 text-2xl font-semibold sm:text-3xl">
              The court is being raised
            </h2>
            <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
              Live audio rooms
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-bone-mut">
              Courts are the realm&apos;s live chambers. A host takes the dais,
              speakers join by voice, and anyone in the hall may raise a hand to
              be heard. Debates, war councils, victory feasts: when a court is
              in session, the whole realm listens.
            </p>
            <p className="mt-3 max-w-md text-sm text-bone-faint">
              The masons are still at work on this hall. There is nothing to
              join yet, and we will not pretend otherwise.
            </p>
            <Link href="/ravens" className="btn-glass mt-6 px-5 py-2.5 text-sm">
              <Icon name="bell" className="h-4 w-4" />
              Get notified
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
