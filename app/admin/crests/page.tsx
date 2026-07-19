"use client";

import { crests, CrestRoundel } from "@/components/brand/crests";

export default function AdminCrestsPage() {
  const liveCount = crests.filter((c) => c.status === "live").length;

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        Crests
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        The honor roll, read-only
      </p>
      <p className="mt-2 text-xs text-bone-faint">
        <span className="tnum">{liveCount}</span> of{" "}
        <span className="tnum">{crests.length}</span> crests are live. Issuance
        and revocation controls arrive with the next wave.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {crests.map((c) => (
          <div
            key={c.slug}
            className={`rarity-${c.rarity} rarity-frame glass glass-sm p-4 sm:p-5`}
          >
            <div className="flex items-start gap-4">
              <CrestRoundel
                icon={c.icon}
                className="h-14 w-14 shrink-0"
                dim={c.status === "locked"}
              />
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-bone">
                  {c.name}
                </p>
                <p className="text-xs text-bone-faint">{c.plain}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`rarity-${c.rarity} rarity-chip`}>
                    {c.rarity}
                  </span>
                  <span
                    className={`rounded-full border border-steel-line bg-panel px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                      c.status === "live" ? "text-gold" : "text-bone-faint"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-bone-mut">{c.earn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
