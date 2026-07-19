"use client";

import { champions, type Champion } from "@/lib/game/champions";
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

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        The War
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Champion roster, read-only
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
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
      </div>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-bone">
          Roster by rarity
        </h2>
        <div className="glass mt-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            {counts.map((c) => (
              <div key={c.rarity} className="flex items-center gap-3">
                <span className={`rarity-${c.rarity} rarity-chip w-24 shrink-0 text-center`}>
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
          Battles fought
        </h2>
        <div className="glass mt-3 flex items-start gap-3 p-5">
          <Icon name="scroll" className="mt-0.5 h-5 w-5 shrink-0 text-bone-faint" />
          <p className="text-sm text-bone-mut">
            Battle records live in the war ledger, but the council does not yet
            have a viewing table for them. Detailed liveops, battle logs,
            balance levers, and roster tuning, arrive with the next wave. We
            will not show you numbers we have not counted.
          </p>
        </div>
      </section>
    </div>
  );
}
