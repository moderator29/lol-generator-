"use client";

import { useEffect, useState } from "react";
import { realmFetch } from "@/lib/auth/api";
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
  const [status, setStatus] = useState<"loading" | "ok" | "sealed" | "error">(
    "loading"
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void realmFetch<{ seasons: SeasonRow[] }>("/api/admin/seasons").then(
      (res) => {
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          setStatus("sealed");
        } else if (res.ok && res.data?.seasons) {
          setRows(res.data.seasons);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function setSeasonStatus(id: number, next: "active" | "closed") {
    setBusyId(id);
    setNote(null);
    const res = await realmFetch<{ ok?: boolean; season?: SeasonRow }>(
      "/api/admin/seasons",
      { method: "POST", json: { id, status: next } }
    );
    if (res.ok && res.data?.ok && res.data.season) {
      const updated = res.data.season;
      setRows((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } else {
      setNote("The decree did not take. Try again.");
    }
    setBusyId(null);
  }

  if (status === "sealed") {
    return (
      <div className="glass p-8 text-center">
        <Icon name="lock" className="mx-auto h-6 w-6 text-bone-faint" />
        <p className="gold-text font-display mt-3 text-xl font-semibold">
          The council chamber is sealed
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        Seasons
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        The realm calendar
      </p>

      {note && <p className="mt-3 text-xs text-ember">{note}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {status === "loading" &&
          [0, 1].map((i) => (
            <div key={i} className="glass glass-sm h-28 animate-pulse" />
          ))}
        {status === "error" && (
          <div className="glass glass-sm p-5">
            <p className="text-sm text-bone-mut">
              The calendar could not be read. Try again shortly.
            </p>
          </div>
        )}
        {status === "ok" && rows.length === 0 && (
          <div className="glass glass-sm flex items-center gap-3 p-5">
            <Icon name="crown" className="h-5 w-5 text-bone-faint" />
            <p className="text-sm text-bone-mut">
              No seasons are written in the calendar yet.
            </p>
          </div>
        )}
        {rows.map((s) => {
          const isActive = s.status === "active";
          return (
            <div key={s.id} className="glass glass-sm p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-base font-semibold text-bone">
                  {s.name}
                </p>
                <span
                  className={`rounded-full border border-steel-line bg-panel px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                    isActive ? "text-gold" : "text-bone-faint"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <p className="tnum text-sm text-bone">
                    {fmtDate(s.starts_at)}
                  </p>
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
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === s.id || isActive}
                  onClick={() => void setSeasonStatus(s.id, "active")}
                  className="btn-gold px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Activate
                </button>
                <button
                  type="button"
                  disabled={busyId === s.id || s.status === "closed"}
                  onClick={() => void setSeasonStatus(s.id, "closed")}
                  className="btn-glass px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
