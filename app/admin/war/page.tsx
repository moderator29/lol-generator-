"use client";

import { useEffect, useState } from "react";
import { champions, type Champion } from "@/lib/game/champions";
import { realmFetch } from "@/lib/auth/api";
import { Icon } from "@/components/ui/icon";

const rarityOrder: Champion["rarity"][] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export default function AdminWarPage() {
  const counts = rarityOrder.map((rarity) => ({
    rarity,
    count: champions.filter((c) => c.rarity === rarity).length,
  }));
  const unlockedCount = champions.filter((c) => c.unlocked).length;
  const maxCount = Math.max(1, ...counts.map((c) => c.count));

  const [battles, setBattles] = useState<number | null>(null);
  const [battlesStatus, setBattlesStatus] = useState<
    "loading" | "ok" | "error"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    void realmFetch<{ battles: number }>("/api/admin/war").then((res) => {
      if (cancelled) return;
      if (res.ok && typeof res.data?.battles === "number") {
        setBattles(res.data.battles);
        setBattlesStatus("ok");
      } else {
        setBattlesStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        The War
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Champion roster and battle ledger
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-3">
        <div className="glass glass-sm p-4">
          <Icon name="swords" className="h-4 w-4 text-bone-faint" />
          <p className="tnum font-display mt-2 text-2xl font-semibold text-gold">
            {champions.length}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-bone-faint">
            Champions in the roster
          </p>
        </div>
        <div className="glass glass-sm p-4">
          <Icon name="flag" className="h-4 w-4 text-bone-faint" />
          <p className="tnum font-display mt-2 text-2xl font-semibold text-gold">
            {unlockedCount}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-bone-faint">
            Unlocked at the start
          </p>
        </div>
        <div className="glass glass-sm p-4">
          <Icon name="scroll" className="h-4 w-4 text-bone-faint" />
          <p className="tnum font-display mt-2 text-2xl font-semibold text-gold">
            {battlesStatus === "loading"
              ? "—"
              : battlesStatus === "error"
                ? "—"
                : (battles ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-bone-faint">
            Battles fought
          </p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-bone">
          Roster by rarity
        </h2>
        <div className="glass mt-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            {counts.map((c) => (
              <div key={c.rarity} className="flex items-center gap-3">
                <span
                  className={`rarity-${c.rarity} rarity-chip w-24 shrink-0 text-center`}
                >
                  {c.rarity}
                </span>
                <div className="bar-track h-1.5 min-w-0 flex-1">
                  <div
                    className="bar-gold h-full"
                    style={{
                      width: `${Math.max(c.count === 0 ? 0 : 4, (c.count / maxCount) * 100)}%`,
                    }}
                  />
                </div>
                <span className="tnum w-8 shrink-0 text-right text-sm font-semibold text-gold">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-bone">
          Battle ledger
        </h2>
        <div className="glass mt-3 flex items-start gap-3 p-5">
          <Icon
            name="scroll"
            className="mt-0.5 h-5 w-5 shrink-0 text-bone-faint"
          />
          {battlesStatus === "error" ? (
            <p className="text-sm text-bone-mut">
              The war ledger could not be reached. The battle count above will
              return once it answers.
            </p>
          ) : battlesStatus === "ok" && (battles ?? 0) === 0 ? (
            <p className="text-sm text-bone-mut">
              No battles have been fought yet. The ledger stands empty until the
              first champion takes the field.
            </p>
          ) : (
            <p className="text-sm text-bone-mut">
              The realm has fought{" "}
              <span className="tnum text-gold">
                {(battles ?? 0).toLocaleString()}
              </span>{" "}
              {battles === 1 ? "battle" : "battles"} so far. Detailed liveops,
              per-battle logs, and balance levers arrive with the next wave.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
