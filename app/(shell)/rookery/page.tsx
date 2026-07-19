"use client";

import { useCallback, useEffect, useState } from "react";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { realmFetch } from "@/lib/auth/api";
import { Icon } from "@/components/ui/icon";

type Host = {
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
} | null;

type Court = {
  id: string;
  host_id: string;
  title: string | null;
  status: "live" | "scheduled";
  started_at: string | null;
  host: Host;
  participants: number;
  participant_ids: string[];
};

export default function RookeryPage() {
  const { ready, authenticated } = useRealmAuth();
  const [me, setMe] = useState<string | null>(null);
  const [courts, setCourts] = useState<Court[] | null>(null);
  const [title, setTitle] = useState("");
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = (await res.json()) as { rooms?: Court[] } | null;
      setCourts(Array.isArray(data?.rooms) ? data.rooms : []);
    } catch {
      setCourts((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 12000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!ready || !authenticated) {
      setMe(null);
      return;
    }
    void realmFetch<{ profile?: { id: string } }>("/api/me", {
      method: "POST",
    }).then(({ data }) => {
      if (data?.profile?.id) setMe(data.profile.id);
    });
  }, [ready, authenticated]);

  async function openCourt() {
    const t = title.trim();
    if (!t || opening) return;
    setOpening(true);
    setError(null);
    const { ok, data } = await realmFetch<{ error?: string }>("/api/rooms", {
      method: "POST",
      json: { action: "open", title: t },
    });
    if (ok) setTitle("");
    else setError(data?.error ?? "The court could not be raised. Try again.");
    await load();
    setOpening(false);
  }

  async function act(action: "close" | "join" | "leave", roomId: string) {
    if (busy) return;
    setBusy(roomId);
    setError(null);
    const { ok, data } = await realmFetch<{ error?: string }>("/api/rooms", {
      method: "POST",
      json: { action, room_id: roomId },
    });
    if (!ok) setError(data?.error ?? "The act failed. Try again.");
    await load();
    setBusy(null);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">
        The Rookery
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Live
      </p>

      {ready && authenticated && (
        <div className="glass mt-5 p-4">
          <p className="font-display text-sm font-semibold text-bone">
            Open a court
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void openCourt();
              }}
              maxLength={80}
              placeholder="Name the matter before the court"
              className="w-full rounded-lg border border-steel-line bg-panel px-3 py-2.5 text-sm text-bone placeholder:text-bone-faint focus:outline-none"
            />
            <button
              onClick={() => void openCourt()}
              disabled={opening || !title.trim()}
              className="btn-gold shrink-0 px-4 py-2.5 text-sm disabled:opacity-50"
            >
              <Icon name="signal" className="h-4 w-4" />
              {opening ? "Raising..." : "Open a court"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="glass glass-sm mt-3 border-ember/40 p-3 text-sm text-ember">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {courts === null ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="glass h-24 animate-pulse" />
          ))
        ) : courts.length === 0 ? (
          <div className="glass p-8 text-center">
            <Icon name="signal" className="mx-auto h-8 w-8 text-gold" />
            <p className="mt-3 font-display text-lg font-semibold text-bone">
              No courts in session
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-bone-mut">
              The hall stands ready and the benches are empty. Open a court and
              the realm will see your banner raised here.
            </p>
          </div>
        ) : (
          courts.map((c) => {
            const isHost = me !== null && c.host_id === me;
            const isMember = me !== null && c.participant_ids.includes(me);
            const hostName =
              c.host?.display_name ?? c.host?.handle ?? "Unknown herald";
            return (
              <div key={c.id} className="glass glass-hover p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {c.status === "live" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-ember/40 bg-ember/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember" />
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-steel-line bg-panel px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-bone-mut">
                        Scheduled
                      </span>
                    )}
                    <p className="mt-2 truncate font-display text-base font-semibold text-bone">
                      {c.title ?? "An unnamed court"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-steel-line bg-panel font-display text-xs text-gold">
                        {hostName.slice(0, 1).toUpperCase()}
                      </span>
                      <p className="truncate text-xs text-bone-mut">
                        Held by{" "}
                        <span className="text-bone">{hostName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-xs text-bone-faint">
                      <span className="tnum text-bone">{c.participants}</span>{" "}
                      {c.participants === 1 ? "listener" : "listeners"}
                    </p>
                    {ready && authenticated && me && (
                      isHost ? (
                        <button
                          onClick={() => void act("close", c.id)}
                          disabled={busy === c.id}
                          className="btn-glass px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          End court
                        </button>
                      ) : isMember ? (
                        <button
                          onClick={() => void act("leave", c.id)}
                          disabled={busy === c.id}
                          className="btn-glass px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => void act("join", c.id)}
                          disabled={busy === c.id}
                          className="btn-gold px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          Join
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="glass glass-sm mt-5 flex items-start gap-3 p-4">
        <Icon name="orb" className="mt-0.5 h-4 w-4 shrink-0 text-bone-faint" />
        <p className="text-xs leading-relaxed text-bone-mut">
          Voices carry when the court&apos;s speaking stones (the live audio
          provider) are set in place. Until then, courts gather and the realm
          sees who holds them.
        </p>
      </div>
    </div>
  );
}
