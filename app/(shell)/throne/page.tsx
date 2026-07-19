"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { houses as houseData } from "@/lib/data/houses";
import { quests, duelPrompts } from "@/lib/game/quests";
import { Icon } from "@/components/ui/icon";

/* ---------- types ---------- */

interface SeasonRow {
  name: string;
  ends_at: string | null;
}

interface Profile {
  id: string;
  handle: string;
  house_slug: string | null;
  tier: string;
  renown: number;
  glory: number;
}

interface HouseRow {
  slug: string;
  name: string;
  member_count: number;
  glory: number;
}

interface DuelSide {
  handle: string;
  display_name: string | null;
}

interface DuelRow {
  id: string;
  prompt: string;
  challenger_entry: string | null;
  opponent_entry: string | null;
  status: string;
  winner_id: string | null;
  challenger_id: string | null;
  opponent_id: string | null;
  created_at: string;
  challenger: DuelSide | null;
  opponent: DuelSide | null;
}

const tierNames: Record<string, string> = {
  smallfolk: "Smallfolk",
  squire: "Squire",
  knight: "Knight",
  lord: "Lord / Lady",
  warden: "Warden",
  hand: "Hand",
  king: "King / Queen",
};

const DUEL_SELECT =
  "id, prompt, challenger_entry, opponent_entry, status, winner_id, challenger_id, opponent_id, created_at, challenger:profiles!duels_challenger_id_fkey(handle, display_name), opponent:profiles!duels_opponent_id_fkey(handle, display_name)";

function sideName(side: DuelSide | null): string {
  if (!side) return "A masked duelist";
  return side.display_name?.trim() || `@${side.handle}`;
}

/* ---------- page ---------- */

export default function ThronePage() {
  const { ready, authenticated } = useRealmAuth();

  const [season, setSeason] = useState<SeasonRow | null>(null);
  const [seasonLoaded, setSeasonLoaded] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [houseRows, setHouseRows] = useState<HouseRow[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [questNote, setQuestNote] = useState<Record<string, string>>({});
  const [questBusy, setQuestBusy] = useState<string | null>(null);
  const [duels, setDuels] = useState<DuelRow[]>([]);
  const [duelsLoaded, setDuelsLoaded] = useState(false);

  /* composer */
  const [promptSlug, setPromptSlug] = useState<string>(duelPrompts[0]?.slug ?? "");
  const [customPrompt, setCustomPrompt] = useState("");
  const [openingEntry, setOpeningEntry] = useState("");
  const [composerNote, setComposerNote] = useState<string | null>(null);
  const [composerBusy, setComposerBusy] = useState(false);

  /* per-duel action state */
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [duelNote, setDuelNote] = useState<Record<string, string>>({});
  const [duelBusy, setDuelBusy] = useState<string | null>(null);

  const loadDuels = useCallback(async () => {
    const db = createClient();
    const { data } = await db
      .from("duels")
      .select(DUEL_SELECT)
      .order("created_at", { ascending: false })
      .limit(10);
    setDuels((data as unknown as DuelRow[]) ?? []);
    setDuelsLoaded(true);
  }, []);

  useEffect(() => {
    const db = createClient();
    void db
      .from("seasons")
      .select("name, ends_at")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        const row = (data as SeasonRow | null) ?? null;
        setSeason(row);
        setSeasonLoaded(true);
        if (row?.ends_at) {
          const ms = new Date(row.ends_at).getTime() - Date.now();
          setDaysLeft(Math.max(0, Math.ceil(ms / 86_400_000)));
        }
      });
    void db
      .from("houses")
      .select("slug, name, member_count, glory")
      .order("glory", { ascending: false })
      .then(({ data }) => setHouseRows((data as HouseRow[]) ?? []));
    void loadDuels();
  }, [loadDuels]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    void realmFetch<{ profile: Profile }>("/api/me", { method: "POST" }).then(
      (res) => {
        if (res.ok && res.data?.profile) setMe(res.data.profile);
      }
    );
    void realmFetch<{ completed: { quest_slug: string; period: string }[] }>(
      "/api/quests"
    ).then((res) => {
      if (res.ok && res.data?.completed) {
        setCompleted(new Set(res.data.completed.map((c) => c.quest_slug)));
      }
    });
  }, [ready, authenticated]);


  const dailyQuests = quests.filter((q) => q.cadence === "daily").slice(0, 5);
  const maxGlory = Math.max(1, ...houseRows.map((r) => r.glory));
  const myHouse = me?.house_slug
    ? houseData.find((h) => h.slug === me.house_slug)
    : null;

  async function completeQuest(slug: string) {
    setQuestBusy(slug);
    setQuestNote((n) => ({ ...n, [slug]: "" }));
    const res = await realmFetch<{
      ok?: boolean;
      glory?: number;
      points?: number;
      error?: string;
    }>("/api/quests", { method: "POST", json: { quest: slug } });
    if (res.ok && res.data?.ok) {
      setCompleted((c) => new Set(c).add(slug));
      setQuestNote((n) => ({
        ...n,
        [slug]: `Oath kept. +${res.data?.glory ?? 0} Glory, +${res.data?.points ?? 0} points.`,
      }));
    } else {
      setQuestNote((n) => ({
        ...n,
        [slug]:
          res.data?.error ??
          (res.status === 409
            ? "Already completed for this period"
            : "The ledger refused. Try again."),
      }));
      if (res.status === 409) setCompleted((c) => new Set(c).add(slug));
    }
    setQuestBusy(null);
  }

  async function createDuel() {
    setComposerBusy(true);
    setComposerNote(null);
    const prompt =
      promptSlug === "custom" ? customPrompt.trim() : promptSlug;
    const res = await realmFetch<{ ok?: boolean; error?: string }>(
      "/api/duels",
      {
        method: "POST",
        json: { action: "create", prompt, entry: openingEntry },
      }
    );
    if (res.ok && res.data?.ok) {
      setOpeningEntry("");
      setCustomPrompt("");
      setComposerNote("The gauntlet is thrown. The realm awaits an answer.");
      await loadDuels();
    } else {
      setComposerNote(res.data?.error ?? "Could not open the duel.");
    }
    setComposerBusy(false);
  }

  async function enterDuel(id: string) {
    setDuelBusy(id);
    setDuelNote((n) => ({ ...n, [id]: "" }));
    const res = await realmFetch<{ ok?: boolean; error?: string }>(
      "/api/duels",
      {
        method: "POST",
        json: { action: "enter", duel_id: id, entry: replyText[id] ?? "" },
      }
    );
    if (res.ok && res.data?.ok) {
      setReplyText((t) => ({ ...t, [id]: "" }));
      setDuelNote((n) => ({ ...n, [id]: "Riposte delivered. The realm votes." }));
      await loadDuels();
    } else {
      setDuelNote((n) => ({
        ...n,
        [id]: res.data?.error ?? "The riposte went astray.",
      }));
    }
    setDuelBusy(null);
  }

  async function voteDuel(id: string, choice: "challenger" | "opponent") {
    setDuelBusy(id);
    setDuelNote((n) => ({ ...n, [id]: "" }));
    const res = await realmFetch<{ ok?: boolean; error?: string }>(
      "/api/duels",
      { method: "POST", json: { action: "vote", duel_id: id, choice } }
    );
    if (res.ok && res.data?.ok) {
      setDuelNote((n) => ({ ...n, [id]: "Your voice is counted." }));
      await loadDuels();
    } else {
      setDuelNote((n) => ({
        ...n,
        [id]: res.data?.error ?? "The vote was not received.",
      }));
    }
    setDuelBusy(null);
  }

  return (
    <div className="realm-bg mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      {/* 1. Season banner */}
      <section className="glass p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-steel-line bg-panel px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-gold">
            Season I
          </span>
          {daysLeft !== null && (
            <span className="tnum rounded-full border border-steel-line bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-bone-mut">
              {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
            </span>
          )}
        </div>
        <h1 className="gold-text font-display mt-3 text-2xl font-semibold sm:text-3xl">
          {season?.name ?? (seasonLoaded ? "The Season" : "Consulting the calendar")}
        </h1>
        <p className="mt-2 text-sm text-bone-mut">
          Claim the Throne. Earn Glory for your House and Renown for your name.
        </p>
        <p className="mt-1 text-xs text-bone-faint">
          The reward vault opens when the Season closes. Nothing is paid out before
          then, and we will not pretend otherwise.
        </p>
      </section>

      {/* 2. You */}
      <section className="mt-4">
        {authenticated && me ? (
          <div className="glass glass-sm p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.26em] text-bone-faint">
              Your standing
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="font-display text-lg font-semibold text-bone">
                @{me.handle}
              </p>
              <span className="rounded-full border border-steel-line bg-panel px-3 py-1 text-xs text-gold">
                {tierNames[me.tier] ?? me.tier}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="tnum font-display text-lg font-semibold text-gold">
                  {me.renown.toLocaleString()}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  Renown
                </p>
              </div>
              <div>
                <p className="tnum font-display text-lg font-semibold text-gold-bright">
                  {me.glory.toLocaleString()}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  Glory
                </p>
              </div>
              <div>
                <p className="truncate font-display text-lg font-semibold text-bone">
                  {myHouse?.name ?? "Unsworn"}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  House
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass glass-sm flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <Icon name="lock" className="h-5 w-5 text-bone-faint" />
              <p className="text-sm text-bone-mut">
                {ready && !authenticated
                  ? "Sign in to see your tier, Renown, and Glory, and to play the Season."
                  : "Checking the gate ledger for your name."}
              </p>
            </div>
            {ready && !authenticated && (
              <Link href="/signin" className="btn-gold px-4 py-2 text-sm">
                Enter the realm
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 3. House standings */}
      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-bone">
          House standings
        </h2>
        <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
          Leaderboard · season glory
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {houseRows.length === 0 && (
            <div className="glass-sm glass p-4 text-sm text-bone-faint">
              The heralds have not posted the standings yet.
            </div>
          )}
          {houseRows.map((row, i) => {
            const meta = houseData.find((h) => h.slug === row.slug);
            return (
              <Link
                key={row.slug}
                href={`/houses/${row.slug}`}
                className="glass glass-sm glass-hover flex items-center gap-3 p-3 sm:gap-4 sm:p-4"
              >
                <span className="tnum w-5 shrink-0 text-center font-display text-lg text-bone-faint">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-bone sm:text-base">
                    {meta?.name ?? row.name}
                  </p>
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
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Daily quests */}
      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-bone">
          Daily quests
        </h2>
        <p className="mt-1 text-xs text-bone-faint">
          Completing a quest is an oath. The realm trusts, and the Watch
          remembers.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {dailyQuests.map((q) => {
            const done = completed.has(q.slug);
            return (
              <div key={q.slug} className="glass glass-sm p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-bone">
                      {q.name}
                    </p>
                    <p className="mt-1 text-xs text-bone-mut">{q.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="tnum rounded-full border border-steel-line bg-panel px-2.5 py-0.5 text-[11px] text-gold">
                        +{q.glory} Glory
                      </span>
                      <span className="tnum rounded-full border border-steel-line bg-panel px-2.5 py-0.5 text-[11px] text-bone-mut">
                        +{q.points} points
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {authenticated ? (
                      done ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-steel-line bg-panel px-3 py-1.5 text-xs text-gold">
                          <Icon name="medal" className="h-3.5 w-3.5" />
                          Oath kept
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-gold px-4 py-1.5 text-xs"
                          disabled={questBusy === q.slug}
                          onClick={() => void completeQuest(q.slug)}
                        >
                          {questBusy === q.slug ? "Swearing" : "Complete"}
                        </button>
                      )
                    ) : (
                      <Link href="/signin" className="btn-glass px-4 py-1.5 text-xs">
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
                {questNote[q.slug] ? (
                  <p className="mt-2 text-xs text-bone-faint">
                    {questNote[q.slug]}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Duels of wit */}
      <section className="mt-6 pb-8">
        <h2 className="font-display text-lg font-semibold text-bone">
          Duels of wit
        </h2>
        <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
          Words are weapons · the crowd decides
        </p>

        {/* composer */}
        <div className="glass mt-3 p-4 sm:p-5">
          <p className="font-display text-sm font-semibold text-bone">
            Open a duel
          </p>
          {authenticated ? (
            <div className="mt-3 flex flex-col gap-3">
              <select
                value={promptSlug}
                onChange={(e) => setPromptSlug(e.target.value)}
                className="w-full rounded-xl border border-steel-line bg-panel px-3 py-2 text-sm text-bone"
              >
                {duelPrompts.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.prompt.length > 90 ? `${p.prompt.slice(0, 90)}...` : p.prompt}
                  </option>
                ))}
                <option value="custom">Write my own challenge</option>
              </select>
              {promptSlug === "custom" && (
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="State your challenge to the realm"
                  className="w-full resize-y rounded-xl border border-steel-line bg-panel px-3 py-2 text-sm text-bone placeholder:text-bone-faint"
                />
              )}
              <textarea
                value={openingEntry}
                onChange={(e) => setOpeningEntry(e.target.value)}
                maxLength={400}
                rows={3}
                placeholder="Your opening blow. Make it sting."
                className="w-full resize-y rounded-xl border border-steel-line bg-panel px-3 py-2 text-sm text-bone placeholder:text-bone-faint"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-xs text-bone-faint">
                  {composerNote ?? ""}
                </p>
                <button
                  type="button"
                  className="btn-gold shrink-0 px-4 py-2 text-sm"
                  disabled={composerBusy || !openingEntry.trim()}
                  onClick={() => void createDuel()}
                >
                  {composerBusy ? "Throwing the gauntlet" : "Throw the gauntlet"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-bone-mut">
                Sign in to challenge the realm to a battle of words.
              </p>
              <Link href="/signin" className="btn-glass px-4 py-2 text-sm">
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* duel list */}
        <div className="mt-3 flex flex-col gap-3">
          {duelsLoaded && duels.length === 0 && (
            <div className="glass glass-sm flex items-center gap-3 p-5">
              <Icon name="swords" className="h-5 w-5 text-bone-faint" />
              <p className="text-sm text-bone-mut">
                No duels rage today. Draw first blood, with words.
              </p>
            </div>
          )}
          {duels.map((d) => {
            const winnerSide =
              d.winner_id && d.winner_id === d.challenger_id
                ? d.challenger
                : d.winner_id && d.winner_id === d.opponent_id
                  ? d.opponent
                  : null;
            return (
              <div key={d.id} className="glass glass-sm p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-bone">{d.prompt}</p>
                  <span className="shrink-0 rounded-full border border-steel-line bg-panel px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                    {d.status}
                  </span>
                </div>

                {d.status === "open" && (
                  <div className="mt-3">
                    <p className="text-xs text-bone-faint">
                      {sideName(d.challenger)} opens:
                    </p>
                    <p className="mt-1 text-sm text-bone-mut">
                      {d.challenger_entry}
                    </p>
                    {authenticated ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <textarea
                          value={replyText[d.id] ?? ""}
                          onChange={(e) =>
                            setReplyText((t) => ({ ...t, [d.id]: e.target.value }))
                          }
                          maxLength={400}
                          rows={2}
                          placeholder="Your riposte"
                          className="w-full resize-y rounded-xl border border-steel-line bg-panel px-3 py-2 text-sm text-bone placeholder:text-bone-faint"
                        />
                        <button
                          type="button"
                          className="btn-gold self-end px-4 py-1.5 text-xs"
                          disabled={
                            duelBusy === d.id || !(replyText[d.id] ?? "").trim()
                          }
                          onClick={() => void enterDuel(d.id)}
                        >
                          Answer the challenge
                        </button>
                      </div>
                    ) : (
                      <Link
                        href="/signin"
                        className="btn-glass mt-3 inline-flex px-4 py-1.5 text-xs"
                      >
                        Sign in to answer the challenge
                      </Link>
                    )}
                  </div>
                )}

                {d.status === "voting" && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(
                      [
                        {
                          key: "challenger" as const,
                          side: d.challenger,
                          entry: d.challenger_entry,
                        },
                        {
                          key: "opponent" as const,
                          side: d.opponent,
                          entry: d.opponent_entry,
                        },
                      ]
                    ).map((s) => (
                      <div
                        key={s.key}
                        className="flex flex-col rounded-2xl border border-steel-line bg-panel p-3"
                      >
                        <p className="text-xs font-semibold text-bone">
                          {sideName(s.side)}
                        </p>
                        <p className="mt-1 flex-1 text-sm text-bone-mut">
                          {s.entry}
                        </p>
                        {authenticated ? (
                          <button
                            type="button"
                            className="btn-glass mt-3 px-3 py-1.5 text-xs"
                            disabled={duelBusy === d.id}
                            onClick={() => void voteDuel(d.id, s.key)}
                          >
                            Vote for this blade
                          </button>
                        ) : (
                          <Link
                            href="/signin"
                            className="btn-glass mt-3 inline-flex justify-center px-3 py-1.5 text-xs"
                          >
                            Sign in to vote
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {d.status === "settled" && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <Icon name="crown" className="h-4 w-4 text-gold" />
                      <p className="text-sm font-semibold text-gold">
                        {winnerSide
                          ? `${sideName(winnerSide)} takes the day`
                          : "The duel is settled"}
                      </p>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-bone-mut sm:grid-cols-2">
                      <p>
                        <span className="text-xs text-bone-faint">
                          {sideName(d.challenger)}:
                        </span>{" "}
                        {d.challenger_entry}
                      </p>
                      <p>
                        <span className="text-xs text-bone-faint">
                          {sideName(d.opponent)}:
                        </span>{" "}
                        {d.opponent_entry}
                      </p>
                    </div>
                  </div>
                )}

                {duelNote[d.id] ? (
                  <p className="mt-2 text-xs text-bone-faint">{duelNote[d.id]}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
