"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { realmFetch } from "@/lib/auth/api";
import { EarningsChart, type EarningsPoint } from "@/components/profile/earnings-chart";

/* FOMO-style earnings + balance block that sits between a member's identity
   header and their content tabs. Everything shown is computed from real
   tables through /api/profile/earnings, which also enforces the PnL and
   public-positions privacy gates. Sparse accounts get honest empty states,
   never invented numbers. */

interface PublicBlock {
  handle: string | null;
  joinDate: string;
  renown: number;
  glory: number;
  tier: string;
  callsWon: number;
  callsLost: number;
  callsOpen: number;
  crestCount: number;
  referralCount: number;
  thesis: string | null;
}

interface EarningsBlock {
  grandTotal: number;
  ledgerPoints: number;
  tipsTotal: number;
  referralRewards: number;
  totalGlory: number;
  series: EarningsPoint[];
  breakdown: { label: string; value: number }[];
  firstEarnedAt: string | null;
  lastEarnedAt: string | null;
}

interface EarningsResponse {
  visible: boolean;
  isOwner: boolean;
  showPositions: boolean;
  public: PublicBlock;
  earnings?: EarningsBlock;
  walletAddress?: string | null;
}

interface WalletResponse {
  configured: boolean;
  totalUsd?: number;
  error?: string;
}

const fmt = new Intl.NumberFormat("en-US");

function fmtUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);
}

function joinLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function EarningsSection({
  profileId,
  handle,
}: {
  profileId: string;
  handle: string | null;
  /* Accepted so callers can pass their optimistic own-Keep hint; ownership is
     authoritatively resolved server-side from the caller's token. */
  own?: boolean;
}) {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const [balance, setBalance] = useState<
    { kind: "usd"; usd: number } | { kind: "renown"; renown: number } | null
  >(null);

  const [thesis, setThesis] = useState("");
  const [thesisEditing, setThesisEditing] = useState(false);
  const [thesisSaving, setThesisSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await realmFetch<EarningsResponse>(
      `/api/profile/earnings?id=${encodeURIComponent(profileId)}`
    );
    if (res.ok && res.data) {
      setData(res.data);
      setThesis(res.data.public.thesis ?? "");
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  /* Owner-only live balance: the live wallet total when an address is linked,
     otherwise the member's renown reserve. Other viewers never reach this. */
  useEffect(() => {
    if (!data?.isOwner) return;
    const addr = data.walletAddress;
    if (addr && /^0x[a-fA-F0-9]{40}$/.test(addr)) {
      void realmFetch<WalletResponse>(
        `/api/wallet/balances?address=${addr}`
      ).then((res) => {
        if (res.ok && res.data?.configured && typeof res.data.totalUsd === "number") {
          setBalance({ kind: "usd", usd: res.data.totalUsd });
        } else {
          setBalance({ kind: "renown", renown: data.public.renown });
        }
      });
    } else {
      setBalance({ kind: "renown", renown: data.public.renown });
    }
  }, [data]);

  const share = () => {
    const url = `${window.location.origin}/u/${handle ?? ""}`;
    void navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const saveThesis = async () => {
    setThesisSaving(true);
    const next = thesis.trim().slice(0, 140);
    const res = await realmFetch("/api/settings", {
      method: "POST",
      json: { profile: { thesis: next } },
    });
    setThesisSaving(false);
    if (res.ok) {
      setThesisEditing(false);
      setData((d) =>
        d ? { ...d, public: { ...d.public, thesis: next || null } } : d
      );
    }
  };

  if (loading) {
    return <div className="glass mt-4 h-40 animate-pulse" />;
  }
  if (!data) return null;

  const pub = data.public;

  /* Other viewer, PnL kept private: reputation only, never a balance. */
  if (!data.visible) {
    return (
      <section className="glass glass-warm mt-4 p-5">
        <div className="flex items-center gap-2 text-bone-mut">
          <Icon name="lock" className="h-4 w-4 text-gold" />
          <span className="text-sm">This Keep keeps its earnings private.</span>
        </div>
        <div className="tnum mt-4 grid grid-cols-3 gap-3">
          <Stat label="Renown" value={fmt.format(pub.renown)} icon="medal" />
          <Stat label="Calls won" value={fmt.format(pub.callsWon)} icon="target" />
          <Stat label="Crests" value={fmt.format(pub.crestCount)} icon="crown" />
        </div>
        {pub.thesis && (
          <p className="mt-4 border-t border-steel-line pt-3 text-sm italic text-bone-mut">
            &ldquo;{pub.thesis}&rdquo;
          </p>
        )}
      </section>
    );
  }

  const earn = data.earnings;
  const hasEarnings = !!earn && earn.grandTotal > 0;

  return (
    <section className="glass glass-warm mt-4 overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-bone-faint">
              {data.isOwner ? "Your earnings" : "Total earnings"}
            </span>
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-bright" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="gold-text font-display text-4xl font-bold tnum">
              {fmt.format(earn?.grandTotal ?? 0)}
            </span>
            <span className="text-sm font-semibold text-gold">$RSP</span>
          </div>
          {hasEarnings && earn?.firstEarnedAt ? (
            <p className="mt-0.5 text-xs text-bone-faint">
              Earning since {joinLabel(earn.firstEarnedAt)}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-bone-faint">
              No $RSP earned yet. Send ravens, seal calls, win glory.
            </p>
          )}
        </div>

        <button
          onClick={share}
          className="btn-glass flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs text-bone-mut"
        >
          <Icon name="share" className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Share"}
        </button>
      </div>

      {/* Earnings over time */}
      <div className="mt-4">
        <EarningsChart series={earn?.series ?? []} />
      </div>

      {/* Balance (owner) + quick stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.isOwner && (
          <Stat
            label={balance?.kind === "usd" ? "Wallet balance" : "Renown reserve"}
            value={
              balance
                ? balance.kind === "usd"
                  ? fmtUsd(balance.usd)
                  : fmt.format(balance.renown)
                : "..."
            }
            icon="wallet"
            highlight
          />
        )}
        <Stat label="Glory" value={fmt.format(pub.glory)} icon="flame" />
        <Stat label="Tips" value={fmt.format(earn?.tipsTotal ?? 0)} icon="coin" />
        <Stat
          label="Referrals"
          value={fmt.format(earn?.referralRewards ?? 0)}
          icon="banner"
        />
      </div>

      {/* Shareable thesis */}
      {data.isOwner ? (
        thesisEditing ? (
          <div className="mt-4 border-t border-steel-line pt-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
              Your thesis
            </label>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value.slice(0, 140))}
              rows={2}
              maxLength={140}
              placeholder="One line the realm should know you by."
              className="mt-1.5 w-full resize-none rounded-xl border border-steel-line bg-void px-3 py-2 text-sm text-bone outline-none focus:border-gold/40"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-bone-faint">
                {thesis.length}/140
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setThesis(pub.thesis ?? "");
                    setThesisEditing(false);
                  }}
                  className="btn-glass px-3 py-1 text-xs text-bone-mut"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void saveThesis()}
                  disabled={thesisSaving}
                  className="btn-gold px-3 py-1 text-xs"
                >
                  {thesisSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setThesisEditing(true)}
            className="mt-4 flex w-full items-center gap-2 border-t border-steel-line pt-3 text-left text-sm text-bone-mut transition hover:text-bone"
          >
            <Icon name="scroll" className="h-3.5 w-3.5 shrink-0 text-gold" />
            {pub.thesis ? (
              <span className="italic">&ldquo;{pub.thesis}&rdquo;</span>
            ) : (
              <span className="text-bone-faint">Set a thesis line</span>
            )}
          </button>
        )
      ) : pub.thesis ? (
        <p className="mt-4 flex items-center gap-2 border-t border-steel-line pt-3 text-sm italic text-bone-mut">
          <Icon name="scroll" className="h-3.5 w-3.5 shrink-0 text-gold" />
          &ldquo;{pub.thesis}&rdquo;
        </p>
      ) : null}

      {/* View more */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-steel-line/70 py-2 text-xs font-semibold text-bone-mut transition hover:border-gold/30 hover:text-bone"
      >
        {expanded ? "Hide breakdown" : "View more"}
        <Icon
          name="arrow"
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-4 border-t border-steel-line pt-4">
          {/* Allocation of earnings by source */}
          {data.showPositions && earn && earn.breakdown.length > 0 ? (
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                Where the $RSP came from
              </h4>
              <div className="mt-2 flex flex-col gap-2">
                {earn.breakdown.map((slice) => {
                  const pct = earn.grandTotal
                    ? Math.round((slice.value / earn.grandTotal) * 100)
                    : 0;
                  return (
                    <div key={slice.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-bone-mut">{slice.label}</span>
                        <span className="tnum text-bone">
                          {fmt.format(slice.value)}{" "}
                          <span className="text-bone-faint">{pct}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-void">
                        <div
                          className="gold-metal h-full rounded-full"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : !data.showPositions ? (
            <p className="text-xs text-bone-faint">
              This member keeps their earning sources private.
            </p>
          ) : (
            <p className="text-xs text-bone-faint">
              No earning sources to break down yet.
            </p>
          )}

          {/* Portfolio facts */}
          <div className="tnum grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
            <Fact label="Joined" value={joinLabel(pub.joinDate)} />
            <Fact label="Renown" value={fmt.format(pub.renown)} />
            <Fact label="Glory" value={fmt.format(pub.glory)} />
            <Fact label="Calls won" value={fmt.format(pub.callsWon)} />
            <Fact label="Calls lost" value={fmt.format(pub.callsLost)} />
            <Fact label="Calls open" value={fmt.format(pub.callsOpen)} />
            <Fact label="Crests" value={fmt.format(pub.crestCount)} />
            <Fact label="Referrals" value={fmt.format(pub.referralCount)} />
            <Fact
              label="Tips earned"
              value={`${fmt.format(earn?.tipsTotal ?? 0)} $RSP`}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 ${
        highlight
          ? "border-gold/30 bg-gold/5"
          : "border-steel-line/70 bg-void/40"
      }`}
    >
      <div className="flex items-center gap-1.5 text-bone-faint">
        <Icon name={icon} className="h-3.5 w-3.5 text-gold" />
        <span className="text-[10px] uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="tnum mt-1 text-lg font-semibold text-bone">{value}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.16em] text-bone-faint">
        {label}
      </span>
      <span className="mt-0.5 text-bone">{value}</span>
    </div>
  );
}
