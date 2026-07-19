"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { houses as houseData } from "@/lib/data/houses";
import { Icon } from "@/components/ui/icon";

interface HouseRow {
  slug: string;
  name: string;
  member_count: number;
  glory: number;
}

export default function AdminHousesPage() {
  const [rows, setRows] = useState<HouseRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const db = createClient();
    void db
      .from("houses")
      .select("slug, name, member_count, glory")
      .order("glory", { ascending: false })
      .then(({ data }) => {
        setRows((data as HouseRow[]) ?? []);
        setLoaded(true);
      });
  }, []);

  const maxGlory = Math.max(1, ...rows.map((r) => r.glory));
  const totalSworn = rows.reduce((s, r) => s + r.member_count, 0);
  const totalGlory = rows.reduce((s, r) => s + r.glory, 0);

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        Houses
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        The six great houses, read-only
      </p>
      <p className="mt-2 text-xs text-bone-faint">
        House management controls arrive with the next wave. For now the
        council may observe, not intervene.
      </p>

      {loaded && rows.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="glass glass-sm p-4">
            <p className="tnum font-display text-2xl font-semibold text-gold">
              {totalSworn.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-bone-faint">
              Sworn members
            </p>
          </div>
          <div className="glass glass-sm p-4">
            <p className="tnum font-display text-2xl font-semibold text-gold">
              {totalGlory.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-bone-faint">
              Total glory
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {!loaded &&
          [0, 1, 2].map((i) => (
            <div key={i} className="glass glass-sm h-20 animate-pulse" />
          ))}
        {loaded && rows.length === 0 && (
          <div className="glass glass-sm flex items-center gap-3 p-5">
            <Icon name="banner" className="h-5 w-5 text-bone-faint" />
            <p className="text-sm text-bone-mut">
              The heralds have not posted the house rolls yet.
            </p>
          </div>
        )}
        {rows.map((row, i) => {
          const meta = houseData.find((h) => h.slug === row.slug);
          return (
            <div
              key={row.slug}
              className="glass glass-sm flex items-center gap-3 p-4 sm:gap-4 sm:p-5"
            >
              <span className="tnum w-5 shrink-0 text-center font-display text-lg text-bone-faint">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-bone sm:text-base">
                  {meta?.name ?? row.name}
                </p>
                {meta?.motto && (
                  <p className="truncate text-xs text-bone-faint">{meta.motto}</p>
                )}
                <div className="bar-track mt-2 h-1.5 w-full">
                  <div
                    className="bar-gold h-full"
                    style={{
                      width: `${Math.max(4, (row.glory / maxGlory) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="tnum text-sm font-semibold text-gold">
                  {row.glory.toLocaleString()} Glory
                </p>
                <p className="tnum text-xs text-bone-faint">
                  {row.member_count.toLocaleString()} sworn
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
