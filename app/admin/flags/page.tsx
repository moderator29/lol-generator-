"use client";

import { useEffect, useState } from "react";
import { realmFetch } from "@/lib/auth/api";
import { Icon } from "@/components/ui/icon";

interface FlagRow {
  key: string;
  enabled: boolean;
  note: string | null;
}

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "sealed" | "error">(
    "loading"
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void realmFetch<{ flags: FlagRow[] }>("/api/admin/flags").then((res) => {
      if (cancelled) return;
      if (res.status === 401 || res.status === 403) {
        setStatus("sealed");
      } else if (res.ok && res.data?.flags) {
        setFlags(res.data.flags);
        setStatus("ok");
      } else {
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(flag: FlagRow) {
    setBusyKey(flag.key);
    setNote(null);
    const res = await realmFetch<{ ok?: boolean; flag?: FlagRow }>(
      "/api/admin/flags",
      { method: "POST", json: { key: flag.key, enabled: !flag.enabled } }
    );
    if (res.ok && res.data?.ok && res.data.flag) {
      const updated = res.data.flag;
      setFlags((rows) => rows.map((r) => (r.key === updated.key ? updated : r)));
    } else {
      setNote("The lever would not move. Try again.");
    }
    setBusyKey(null);
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
        Feature Flags
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Levers of the realm
      </p>

      {note && <p className="mt-3 text-xs text-ember">{note}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {status === "loading" &&
          [0, 1, 2].map((i) => (
            <div key={i} className="glass glass-sm h-16 animate-pulse" />
          ))}
        {status === "error" && (
          <div className="glass glass-sm p-5">
            <p className="text-sm text-bone-mut">
              The lever room could not be reached. Try again shortly.
            </p>
          </div>
        )}
        {status === "ok" && flags.length === 0 && (
          <div className="glass glass-sm flex items-center gap-3 p-5">
            <Icon name="sliders" className="h-5 w-5 text-bone-faint" />
            <p className="text-sm text-bone-mut">
              No flags are registered. The realm runs on its defaults.
            </p>
          </div>
        )}
        {flags.map((f) => (
          <div
            key={f.key}
            className="glass glass-sm flex items-center justify-between gap-4 p-4 sm:p-5"
          >
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-bone">
                {f.key}
              </p>
              <p className="mt-1 text-xs text-bone-mut">
                {f.note?.trim() || "No note recorded for this flag."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={f.enabled}
              aria-label={`Toggle ${f.key}`}
              disabled={busyKey === f.key}
              onClick={() => void toggle(f)}
              className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                f.enabled
                  ? "border-gold bg-gold"
                  : "border-steel-line bg-panel"
              } ${busyKey === f.key ? "opacity-60" : ""}`}
            >
              <span
                className={`absolute top-0.5 h-[18px] w-[18px] rounded-full transition-all ${
                  f.enabled ? "left-[22px] bg-obsidian" : "left-0.5 bg-bone-faint"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
