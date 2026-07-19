"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  PriceMiniCard,
  WalletMiniCard,
  RealmPulseCard,
  SuggestionChips,
  type Holding,
  type RealmPulse,
} from "@/components/raven/cards";

type TokenCard = {
  symbol: string;
  name: string;
  priceUsd: number | null;
  change24h: number | null;
  marketCap: number | null;
  chain: string | null;
};

type WalletCard = {
  address: string;
  totalUsd: number | null;
  holdings: Holding[];
};

type Source = { title: string; url: string };

type Msg = {
  role: "user" | "assistant" | "error";
  content: string;
  cards?: TokenCard[];
  walletCard?: WalletCard;
  pulse?: RealmPulse;
  suggestions?: string[];
  sources?: Source[];
  browsed?: boolean;
  browseRequested?: boolean;
};

/* ---- AI settings: voice filters + length, persisted in localStorage ---- */
type Voice = "default" | "lore" | "normal" | "degen";
type Length = "brief" | "normal" | "detailed";

const VOICES: { id: Voice; label: string; hint: string }[] = [
  { id: "default", label: "Default", hint: "The realm Herald voice" },
  { id: "lore", label: "Lore", hint: "Deep, mythic worldbuilding" },
  { id: "normal", label: "Normal", hint: "Plain modern assistant" },
  { id: "degen", label: "Degen", hint: "Fast crypto-native alpha" },
];

const LENGTHS: { id: Length; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "normal", label: "Balanced" },
  { id: "detailed", label: "Detailed" },
];

const VOICE_KEY = "raven_voice";
const BROWSE_KEY = "raven_browse";
const LENGTH_KEY = "raven_length";

const OPENERS = [
  "Settle a debate for me",
  "What is $ETH doing today?",
  "Announce my arrival to the realm",
  "Roast me, but kindly",
];

function RavenAvatar() {
  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-panel-warm">
      <Icon name="raven" className="h-4 w-4 text-gold" />
    </div>
  );
}

function SegButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border border-gold/45 bg-panel-warm text-gold"
          : "border border-steel-line/70 bg-panel text-bone-mut hover:border-gold/30 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

export default function RavenPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voice, setVoice] = useState<Voice>("default");
  const [browse, setBrowse] = useState(false);
  const [length, setLength] = useState<Length>("normal");

  const scrollerRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  /* Load remembered settings once on mount. */
  useEffect(() => {
    try {
      const v = localStorage.getItem(VOICE_KEY);
      if (v === "default" || v === "lore" || v === "normal" || v === "degen")
        setVoice(v);
      const l = localStorage.getItem(LENGTH_KEY);
      if (l === "brief" || l === "normal" || l === "detailed") setLength(l);
      if (localStorage.getItem(BROWSE_KEY) === "1") setBrowse(true);
    } catch {
      /* storage unavailable, defaults are fine */
    }
  }, []);

  const persist = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const growArea = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const send = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    if (areaRef.current) areaRef.current.style.height = "auto";
    setBusy(true);
    try {
      const payload = next
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/raven", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload, voice, browse, length }),
      });
      const data = (await res.json().catch(() => null)) as {
        reply?: string;
        cards?: TokenCard[];
        walletCard?: WalletCard | null;
        pulse?: RealmPulse | null;
        suggestions?: string[];
        sources?: Source[];
        browsed?: boolean;
        browseRequested?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !data?.reply) {
        setMessages((m) => [
          ...m,
          {
            role: "error",
            content:
              data?.error ?? "The Raven is preoccupied. Try again shortly.",
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.reply as string,
            cards:
              Array.isArray(data.cards) && data.cards.length
                ? data.cards
                : undefined,
            walletCard: data.walletCard ?? undefined,
            pulse: data.pulse ?? undefined,
            suggestions:
              Array.isArray(data.suggestions) && data.suggestions.length
                ? data.suggestions
                : undefined,
            sources:
              Array.isArray(data.sources) && data.sources.length
                ? data.sources
                : undefined,
            browsed: data.browsed,
            browseRequested: data.browseRequested,
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "error",
          content: "The winds swallowed your message. Try again shortly.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const activeVoice = VOICES.find((v) => v.id === voice) ?? VOICES[0];

  return (
    <div className="mx-auto flex h-[calc(100dvh-9.75rem)] w-full max-w-2xl flex-col px-3 py-4 sm:px-4 lg:h-[calc(100dvh-4rem)] lg:py-6">
      {/* Header */}
      <header className="glass-sm mb-3 flex items-center gap-3 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-panel-warm">
          <Icon name="raven" className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="gold-text font-display text-lg font-semibold leading-tight">
            The Raven
          </h1>
          <p className="text-xs text-bone-mut">
            Ask anything
            <span className="text-bone-faint"> · {activeVoice.label} voice</span>
            {browse && <span className="text-gold"> · Browsing</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          aria-expanded={settingsOpen}
          aria-label="AI settings"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
            settingsOpen
              ? "border-gold/45 bg-panel-warm text-gold"
              : "border-steel-line/70 bg-panel text-bone-mut hover:border-gold/35 hover:text-bone"
          }`}
        >
          <Icon name="sliders" className="h-4 w-4" />
        </button>
      </header>

      {/* AI settings panel */}
      {settingsOpen && (
        <section className="glass-sm mb-3 flex flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="sliders" className="h-4 w-4 text-gold" />
              <span className="font-display text-sm font-semibold text-bone">
                AI settings
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">
              Remembered
            </span>
          </div>

          {/* Voice filter */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-bone-mut">
                Voice
              </span>
              <span className="truncate text-[11px] text-bone-faint">
                {activeVoice.hint}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {VOICES.map((v) => (
                <SegButton
                  key={v.id}
                  active={voice === v.id}
                  title={v.hint}
                  onClick={() => {
                    setVoice(v.id);
                    persist(VOICE_KEY, v.id);
                  }}
                >
                  {v.label}
                </SegButton>
              ))}
            </div>
          </div>

          {/* Browse toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-bone-mut">
                Live browsing
              </span>
              <p className="mt-0.5 text-[11px] text-bone-faint">
                Let the Raven search the live web for current answers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !browse;
                setBrowse(nextVal);
                persist(BROWSE_KEY, nextVal ? "1" : "0");
              }}
              aria-pressed={browse}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                browse
                  ? "border-gold/45 bg-panel-warm text-gold"
                  : "border-steel-line/70 bg-panel text-bone-mut hover:border-gold/30 hover:text-bone"
              }`}
            >
              <Icon name="search" className="h-3.5 w-3.5" />
              {browse ? "On" : "Off"}
            </button>
          </div>

          {/* Length preference */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-bone-mut">
              Response length
            </span>
            <div className="flex flex-wrap gap-2">
              {LENGTHS.map((l) => (
                <SegButton
                  key={l.id}
                  active={length === l.id}
                  onClick={() => {
                    setLength(l.id);
                    persist(LENGTH_KEY, l.id);
                  }}
                >
                  {l.label}
                </SegButton>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="glass min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-panel-warm">
              <Icon name="raven" className="h-7 w-7 text-gold" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-bone">
                The rookery is quiet
              </p>
              <p className="mt-1 text-sm text-bone-mut">
                Nothing has been asked yet. The Raven waits on its perch.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {OPENERS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => send(o)}
                  className="btn-glass rounded-full px-3.5 py-1.5 text-xs text-bone"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="glass-sm max-w-[85%] px-4 py-2.5 text-sm leading-relaxed text-bone">
                      <p className="whitespace-pre-wrap break-words">
                        {m.content}
                      </p>
                    </div>
                  </div>
                );
              }
              if (m.role === "error") {
                return (
                  <div key={i} className="flex justify-start">
                    <div className="flex max-w-[90%] items-start gap-2.5">
                      <RavenAvatar />
                      <div className="glass-sm border border-ember-deep/40 px-4 py-2.5 text-sm leading-relaxed text-bone-mut">
                        <p className="whitespace-pre-wrap break-words">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="flex justify-start">
                  <div className="flex max-w-[90%] items-start gap-2.5">
                    <RavenAvatar />
                    <div className="min-w-0">
                      <div className="text-sm leading-relaxed text-bone">
                        <p className="whitespace-pre-wrap break-words">
                          {m.content}
                        </p>
                      </div>

                      {/* Browsing surfaced honestly */}
                      {m.browsed && (
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-panel-warm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                          <Icon name="search" className="h-3 w-3" />
                          Browsed the web
                        </span>
                      )}
                      {!m.browsed && m.browseRequested && (
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-steel-line/70 bg-panel px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-bone-faint">
                          <Icon name="search" className="h-3 w-3" />
                          Browsing unavailable
                        </span>
                      )}

                      {/* Sources */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-bone-faint">
                            Sources
                          </span>
                          <ul className="flex flex-col gap-1">
                            {m.sources.map((s, j) => (
                              <li key={`${s.url}-${j}`}>
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] text-bone-mut transition-colors hover:text-gold"
                                >
                                  <Icon
                                    name="compass"
                                    className="h-3 w-3 shrink-0 text-gold/70"
                                  />
                                  <span className="truncate">{s.title}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(m.cards || m.walletCard || m.pulse) && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {m.cards?.map((c, j) => (
                            <PriceMiniCard
                              key={`${c.symbol}-${j}`}
                              symbol={c.symbol}
                              name={c.name}
                              priceUsd={c.priceUsd}
                              change24h={c.change24h}
                              marketCap={c.marketCap}
                              chain={c.chain}
                              swapHref="/soon/mint"
                            />
                          ))}
                          {m.walletCard && (
                            <WalletMiniCard
                              address={m.walletCard.address}
                              totalUsd={m.walletCard.totalUsd}
                              holdings={m.walletCard.holdings}
                            />
                          )}
                          {m.pulse && <RealmPulseCard pulse={m.pulse} />}
                        </div>
                      )}

                      {m.suggestions && m.suggestions.length > 0 && (
                        <SuggestionChips
                          suggestions={m.suggestions}
                          onSelect={(t) => void send(t)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2.5">
                  <RavenAvatar />
                  <div className="flex items-center gap-1.5 py-2">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold/70"
                        style={{ animationDelay: `${d * 200}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        className="glass-sm mt-3 flex items-end gap-2 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          ref={areaRef}
          value={draft}
          rows={1}
          placeholder="Speak to the Raven..."
          onChange={(e) => {
            setDraft(e.target.value);
            growArea();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-bone placeholder:text-bone-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Send to the Raven"
          className="btn-gold flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="send" className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}
