"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  PriceMiniCard,
  WalletMiniCard,
  type Holding,
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

type Msg = {
  role: "user" | "assistant" | "error";
  content: string;
  cards?: TokenCard[];
  walletCard?: WalletCard;
};

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

export default function RavenPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

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
        body: JSON.stringify({ messages: payload }),
      });
      const data = (await res.json().catch(() => null)) as {
        reply?: string;
        cards?: TokenCard[];
        walletCard?: WalletCard | null;
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
          <p className="text-xs text-bone-mut">Ask anything</p>
        </div>
        <span className="shrink-0 rounded-full border border-steel-line/70 bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-bone-faint">
          The Herald
        </span>
      </header>

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
                      {(m.cards || m.walletCard) && (
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
                        </div>
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
