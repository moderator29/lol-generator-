"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { realmFetch } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { timeAgo } from "@/lib/social/types";

interface ConvoOther {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Convo {
  id: string;
  kind: string;
  title: string | null;
  last_message_at: string | null;
  other: ConvoOther | null;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface ProfileHit {
  id: string;
  handle: string | null;
  display_name: string | null;
}

function convoName(c: Convo): string {
  return c.other?.display_name ?? c.other?.handle ?? c.title ?? "Whisper";
}

function avatarLetter(c: Convo): string {
  return convoName(c).slice(0, 1).toUpperCase();
}

export default function WhispersPage() {
  const { ready, authenticated } = useRealmAuth();

  const [convos, setConvos] = useState<Convo[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ProfileHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [composeErr, setComposeErr] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadConvos = useCallback(async () => {
    const res = await realmFetch<{ conversations: Convo[] }>("/api/whispers");
    if (res.ok && res.data) setConvos(res.data.conversations);
    else setConvos((prev) => prev ?? []);
  }, []);

  const loadMessages = useCallback(async (conversation: string) => {
    const res = await realmFetch<{ me: string; messages: Message[] }>(
      `/api/whispers/messages?conversation=${encodeURIComponent(conversation)}`
    );
    if (res.ok && res.data) {
      setMeId(res.data.me);
      setMsgs(
        [...res.data.messages].sort((a, b) =>
          a.created_at < b.created_at ? -1 : 1
        )
      );
    }
  }, []);

  /* Initial conversation list */
  useEffect(() => {
    if (ready && authenticated) void loadConvos();
  }, [ready, authenticated, loadConvos]);

  /* Poll the open thread every 8s */
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => {
      void loadMessages(activeId);
    }, 8000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  /* Keep the thread pinned to the latest message */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, activeId]);

  /* Profile search for a new whisper */
  useEffect(() => {
    const q = query.trim().replace(/[%_]/g, "");
    if (q.length < 2) {
      setHits(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      const db = createClient();
      void db
        .from("profiles")
        .select("id, handle, display_name")
        .ilike("handle", `%${q}%`)
        .not("handle", "is", null)
        .not("is_agent", "is", true)
        .limit(8)
        .then(({ data }) => {
          setHits((data as ProfileHit[]) ?? []);
          setSearching(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function openThread(id: string) {
    setActiveId(id);
    setMsgs(null);
    setConvos((prev) =>
      prev ? prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) : prev
    );
    void loadMessages(id);
  }

  function closeThread() {
    setActiveId(null);
    setMsgs(null);
    setBody("");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    const res = await realmFetch<{ ok: true }>("/api/whispers/messages", {
      method: "POST",
      json: { conversation: activeId, body: text },
    });
    if (res.ok) {
      setBody("");
      await loadMessages(activeId);
      void loadConvos();
    }
    setSending(false);
  }

  async function startWhisper(p: ProfileHit) {
    if (starting) return;
    setStarting(p.id);
    setComposeErr(null);
    const res = await realmFetch<{ id: string }>("/api/whispers", {
      method: "POST",
      json: { with: p.id },
    });
    if (res.ok && res.data?.id) {
      setComposeOpen(false);
      setQuery("");
      setHits(null);
      await loadConvos();
      openThread(res.data.id);
    } else {
      setComposeErr("That whisper could not be opened. Try again.");
    }
    setStarting(null);
  }

  const active = convos?.find((c) => c.id === activeId) ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className={activeId ? "hidden md:block" : ""}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-bone">
              Whispers
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
              Messages
            </p>
          </div>
          {ready && authenticated && (
            <button
              type="button"
              onClick={() => {
                setComposeOpen((v) => !v);
                setComposeErr(null);
              }}
              className="btn-glass flex items-center gap-2 px-3.5 py-2 text-sm"
            >
              <Icon name="plus" className="h-4 w-4" />
              New whisper
            </button>
          )}
        </div>
      </div>

      {!ready ? (
        <div className="glass mt-5 h-48 animate-pulse" />
      ) : !authenticated ? (
        <div className="glass mt-5 p-8 text-center">
          <Icon name="mail" className="mx-auto h-7 w-7 text-gold" />
          <p className="mt-3 text-sm text-bone-mut">
            Whispers travel only between citizens of the realm.
          </p>
          <Link href="/signin" className="btn-gold mt-5 px-5 py-2.5 text-sm">
            Enter the realm
          </Link>
        </div>
      ) : (
        <>
          {/* New whisper search */}
          {composeOpen && !activeId && (
            <div className="glass mt-4 p-3">
              <div className="flex items-center gap-3 rounded-xl border border-steel-line bg-panel px-3.5 py-2.5">
                <Icon
                  name="search"
                  className="h-4 w-4 shrink-0 text-bone-faint"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search citizens by handle"
                  className="w-full bg-transparent text-sm text-bone placeholder:text-bone-faint focus:outline-none"
                />
              </div>
              {composeErr && (
                <p className="mt-2 text-xs text-ember">{composeErr}</p>
              )}
              <div className="mt-2 flex flex-col gap-1.5">
                {searching && hits === null ? (
                  [0, 1].map((i) => (
                    <div
                      key={i}
                      className="glass-sm glass h-12 animate-pulse"
                    />
                  ))
                ) : hits && hits.length === 0 ? (
                  <p className="px-1 py-3 text-center text-sm text-bone-mut">
                    No citizen answers to that handle.
                  </p>
                ) : (
                  (hits ?? []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={starting !== null}
                      onClick={() => void startWhisper(p)}
                      className="glass glass-sm glass-hover flex w-full items-center gap-3 p-2.5 text-left disabled:opacity-60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-steel-line bg-panel font-display text-sm text-gold">
                        {(p.display_name ?? p.handle ?? "?")
                          .slice(0, 1)
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-bone">
                          {p.display_name ?? p.handle}
                        </span>
                        <span className="block truncate text-xs text-bone-faint">
                          @{p.handle}
                        </span>
                      </span>
                      {starting === p.id ? (
                        <span className="shrink-0 text-xs text-bone-faint">
                          Opening
                        </span>
                      ) : (
                        <Icon
                          name="send"
                          className="h-4 w-4 shrink-0 text-gold"
                        />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="mt-4 md:grid md:grid-cols-[300px_minmax(0,1fr)] md:items-start md:gap-4">
            {/* Conversation list */}
            <div
              className={`${
                activeId ? "hidden md:flex" : "flex"
              } flex-col gap-2`}
            >
              {convos === null ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="glass glass-sm h-16 animate-pulse" />
                ))
              ) : convos.length === 0 ? (
                <div className="glass p-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-steel-line bg-panel">
                    <Icon name="send" className="h-5 w-5 text-gold" />
                  </span>
                  <p className="mt-3 text-sm text-bone-mut">
                    No whispers yet. Find a Keep at the Crossroads and speak.
                  </p>
                  <Link
                    href="/explore"
                    className="btn-glass mt-4 inline-flex px-4 py-2 text-sm"
                  >
                    To the Crossroads
                  </Link>
                </div>
              ) : (
                convos.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openThread(c.id)}
                    className={`${
                      c.id === activeId ? "glass glass-warm" : "glass glass-sm"
                    } glass-hover flex w-full items-center gap-3 p-3 text-left`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-steel-line bg-panel font-display text-sm text-gold">
                      {avatarLetter(c)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-bone">
                        {convoName(c)}
                      </span>
                      {c.other?.handle && (
                        <span className="block truncate text-xs text-bone-faint">
                          @{c.other.handle}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      {c.last_message_at && (
                        <span className="tnum text-[11px] text-bone-faint">
                          {timeAgo(c.last_message_at)}
                        </span>
                      )}
                      {c.unread > 0 && (
                        <span
                          className="h-2 w-2 rounded-full bg-gold"
                          aria-label={`${c.unread} unread`}
                        />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Thread */}
            {activeId ? (
              <div className="glass flex h-[calc(100dvh-13rem)] min-h-[24rem] flex-col overflow-hidden">
                <div className="flex items-center gap-3 border-b border-steel-line px-3 py-2.5">
                  <button
                    type="button"
                    onClick={closeThread}
                    aria-label="Back to whispers"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-steel-line bg-panel text-bone-mut md:hidden"
                  >
                    <Icon name="arrow" className="h-4 w-4 rotate-180" />
                  </button>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-steel-line bg-panel font-display text-xs text-gold">
                    {active ? avatarLetter(active) : "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-bone">
                      {active ? convoName(active) : "Whisper"}
                    </p>
                    {active?.other?.handle && (
                      <Link
                        href={`/u/${active.other.handle}`}
                        className="block truncate text-xs text-bone-faint hover:text-gold"
                      >
                        @{active.other.handle}
                      </Link>
                    )}
                  </div>
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-3 py-3"
                >
                  {msgs === null ? (
                    <div className="flex flex-col gap-2">
                      <div className="glass-sm glass h-10 w-3/5 animate-pulse" />
                      <div className="glass-sm glass ml-auto h-10 w-1/2 animate-pulse" />
                      <div className="glass-sm glass h-10 w-2/5 animate-pulse" />
                    </div>
                  ) : msgs.length === 0 ? (
                    <p className="py-10 text-center text-sm text-bone-mut">
                      No words yet. Speak first.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {msgs.map((m) => {
                        const mine = meId !== null && m.sender_id === meId;
                        return (
                          <div
                            key={m.id}
                            className={`flex max-w-[82%] flex-col ${
                              mine
                                ? "self-end items-end"
                                : "self-start items-start"
                            }`}
                          >
                            <div
                              className={`${
                                mine
                                  ? "glass glass-warm rounded-br-sm"
                                  : "glass glass-sm rounded-bl-sm"
                              } rounded-2xl px-3.5 py-2`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm text-bone">
                                {m.body}
                              </p>
                            </div>
                            <span className="tnum mt-0.5 px-1 text-[10px] text-bone-faint">
                              {timeAgo(m.created_at)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => void send(e)}
                  className="flex items-center gap-2 border-t border-steel-line px-3 py-2.5"
                >
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Speak softly"
                    className="w-full rounded-xl border border-steel-line bg-panel px-3.5 py-2.5 text-sm text-bone placeholder:text-bone-faint focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || body.trim().length === 0}
                    aria-label="Send whisper"
                    className="btn-gold flex h-10 w-10 shrink-0 items-center justify-center disabled:opacity-50"
                  >
                    <Icon name="send" className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="hidden h-[calc(100dvh-13rem)] min-h-[24rem] md:block">
                <div className="glass flex h-full flex-col items-center justify-center p-8 text-center">
                  <Icon name="mail" className="h-7 w-7 text-bone-faint" />
                  <p className="mt-3 text-sm text-bone-mut">
                    Choose a whisper from the corridor, or begin a new one.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
