"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";

interface SeasonRow {
  id: number;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  vault_raven: number;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "unset";
  return new Date(iso).toLocaleDateString();
}

export default function AdminSeasonsPage() {
  const [rows, setRows] = useState<SeasonRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const db = createClient();
    void db
      .from("seasons")
      .select("id, name, starts_at, ends_at, status, vault_raven")
      .order("id", { ascending: true })
      .then(({ data }) => {
        setRows((data as SeasonRow[]) ?? []);
        setLoaded(true);
      });
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        Seasons
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        The realm calendar, read-only
      </p>
      <p className="mt-2 text-xs text-bone-faint">
        Season creation and settlement controls arrive with the next wave. The
        council may review the calendar as it stands.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {!loaded && <div className="glass glass-sm h-24 animate-pulse" />}
        {loaded && rows.length === 0 && (
          <div className="glass glass-sm flex items-center gap-3 p-5">
            <Icon name="crown" className="h-5 w-5 text-bone-faint" />
            <p className="text-sm text-bone-mut">
              No seasons are written in the calendar yet.
            </p>
          </div>
        )}
        {rows.map((s) => (
          <div key={s.id} className="glass glass-sm p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-semibold text-bone">
                {s.name}
              </p>
              <span
                className={`rounded-full border border-steel-line bg-panel px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                  s.status === "active" ? "text-gold" : "text-bone-faint"
                }`}
              >
                {s.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="tnum text-sm text-bone">{fmtDate(s.starts_at)}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  Opens
                </p>
              </div>
              <div>
                <p className="tnum text-sm text-bone">{fmtDate(s.ends_at)}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  Closes
                </p>
              </div>
              <div>
                <p className="tnum text-sm text-gold">
                  {s.vault_raven.toLocaleString()}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  Vault (RAVEN)
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
