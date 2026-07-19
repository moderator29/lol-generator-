"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BattleEngine, type BattleOutcome } from "@/components/war/battle-engine";
import { champions } from "@/lib/game/champions";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { Icon } from "@/components/ui/icon";

function BattleInner() {
  const params = useSearchParams();
  const { authenticated } = useRealmAuth();
  const slug = params.get("champion") ?? "aeron-the-black";
  const champion =
    champions.find((c) => c.slug === slug && c.art) ??
    champions.find((c) => c.slug === "aeron-the-black")!;

  const [outcome, setOutcome] = useState<BattleOutcome | null>(null);
  const [serverGlory, setServerGlory] = useState<number | null>(null);
  const [key, setKey] = useState(0);
  const [mastery, setMastery] = useState(0);

  useEffect(() => {
    if (!authenticated) return;
    void realmFetch<{ state?: { mastery?: Record<string, number> } }>(
      "/api/war/battle"
    ).then((res) => {
      const lvl = res.data?.state?.mastery?.[champion.slug] ?? 0;
      setMastery(lvl);
    });
  }, [authenticated, champion.slug]);

  const handleEnd = async (o: BattleOutcome) => {
    setOutcome(o);
    if (authenticated) {
      const res = await realmFetch<{ glory?: number }>("/api/war/battle", {
        method: "POST",
        json: {
          champion: champion.slug,
          battlefield: "river-crossing",
          result: o.result,
          kills: o.kills,
          duration_s: o.duration_s,
        },
      });
      if (res.ok && res.data?.glory !== undefined)
        setServerGlory(res.data.glory);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/war"
          className="inline-flex items-center gap-2 text-xs text-bone-faint hover:text-bone-mut"
        >
          <Icon name="arrow" className="h-4 w-4 rotate-180" />
          The War
        </Link>
        <p className="text-xs uppercase tracking-[0.24em] text-bone-faint">
          Quick Battle · River Crossing
        </p>
      </div>

      {!outcome ? (
        <BattleEngine
          key={key}
          champion={champion}
          mastery={mastery}
          onEnd={handleEnd}
        />
      ) : (
        <div className="glass flex flex-col items-center p-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-bone-faint">
            The field falls silent
          </p>
          <h2
            className={`mt-3 font-display text-4xl font-semibold ${
              outcome.result === "victory" ? "gold-text" : "text-ember-deep"
            }`}
          >
            {outcome.result === "victory" ? "VICTORY" : "DEFEAT"}
          </h2>
          <div className="tnum mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="glass glass-sm px-5 py-3">
              <p className="text-lg font-bold text-bone">{outcome.kills}</p>
              <p className="text-[10px] uppercase tracking-wider text-bone-faint">
                Foes felled
              </p>
            </div>
            <div className="glass glass-sm px-5 py-3">
              <p className="text-lg font-bold text-gold-bright">
                +{serverGlory ?? outcome.glory}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-bone-faint">
                Glory
              </p>
            </div>
            <div className="glass glass-sm px-5 py-3">
              <p className="text-lg font-bold text-bone">
                {outcome.duration_s}s
              </p>
              <p className="text-[10px] uppercase tracking-wider text-bone-faint">
                Fought
              </p>
            </div>
          </div>
          {!authenticated && (
            <p className="mt-4 text-xs text-bone-faint">
              Enter the realm to bank your Glory; this battle was fought for
              honor alone.
            </p>
          )}
          {outcome.result === "defeat" && (
            <p className="mt-4 max-w-sm text-xs text-bone-faint">
              Even the greatest fell before they rose. The realm still counts
              your courage.
            </p>
          )}
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => {
                setOutcome(null);
                setServerGlory(null);
                setKey((k) => k + 1);
              }}
              className="btn-gold px-6 py-2.5 text-sm"
            >
              Fight again
            </button>
            <Link href="/war/champions" className="btn-glass px-6 py-2.5 text-sm text-bone-mut">
              Champions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BattlePage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-4xl p-6"><div className="glass h-72 animate-pulse" /></div>}
    >
      <BattleInner />
    </Suspense>
  );
}
