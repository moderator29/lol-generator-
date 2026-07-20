"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { Icon } from "@/components/ui/icon";
import { WatchBadge } from "@/components/tools/watch-badge";
import { BackButton } from "@/components/shell/back-button";

interface Holding {
  symbol: string;
  name: string;
  balance: string;
  quoteUsd: number;
  change24hUsd: number;
  logo: string | null;
  address: string | null;
  chain: string;
  chainLabel: string;
  watchChain: string;
}

interface Allocation {
  chain: string;
  chainLabel: string;
  totalUsd: number;
}

interface LedgerResponse {
  configured: boolean;
  items?: Holding[];
  dust?: Holding[];
  totalUsd?: number;
  change24hUsd?: number;
  allocations?: Allocation[];
  error?: string;
}

const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const allocColors = [
  "bg-gold",
  "bg-ember",
  "bg-gold-bright",
  "bg-ember-deep",
  "bg-bone-mut",
];

export default function LedgerPage() {
  const { ready, authenticated, address } = useRealmAuth();
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [showDust, setShowDust] = useState(false);

  const load = useCallback(async () => {
    if (!address) return;
    setRefreshing(true);
    setFailed(false);
    try {
      const res = await fetch(
        `/api/ledger?address=${encodeURIComponent(address)}`
      );
      const body = (await res.json()) as LedgerResponse;
      setData(body);
      setUpdatedAt(Date.now());
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    if (!ready || !authenticated || !address) return;
    void load();
  }, [ready, authenticated, address, load]);

  const items = data?.items ?? [];
  const dust = data?.dust ?? [];
  const allocations = data?.allocations ?? [];
  const change = data?.change24hUsd ?? 0;
  const up = change >= 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-bone">
            The Ledger
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
            Portfolio across ETH and L2s
          </p>
        </div>
        {authenticated && address && (
          <button
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="btn-glass shrink-0"
          >
            {refreshing ? "Reading" : "Refresh"}
          </button>
        )}
      </div>

      <div className="mt-5">
        {!ready ? (
          <div className="glass h-32 animate-pulse" />
        ) : !authenticated ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            <Link href="/signin" className="text-gold underline">
              Enter the realm
            </Link>{" "}
            to open your Ledger.
          </div>
        ) : !address ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            No wallet is bound to your banner yet. Connect a wallet and the
            Ledger will keep your accounts.
          </div>
        ) : failed ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            The Ledger could not be read just now.
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 block w-full text-gold underline"
            >
              Try again
            </button>
          </div>
        ) : data === null ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass glass-sm h-14 animate-pulse" />
            ))}
          </div>
        ) : !data.configured ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            The Ledger&apos;s far-seeing lens (GoldRush key) is not yet mounted
            in this environment.
          </div>
        ) : data.error ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            The Ledger&apos;s lens clouded over.
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 block w-full text-gold underline"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 && dust.length === 0 ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            This wallet holds no coin worth an entry yet. The Ledger awaits your
            first treasure.
          </div>
        ) : (
          <>
            <div className="glass p-6">
              <p className="text-xs uppercase tracking-[0.26em] text-bone-faint">
                Net worth
              </p>
              <p className="gold-text font-display tnum mt-2 text-3xl font-semibold">
                {usd(data.totalUsd ?? 0)}
              </p>
              {items.length > 0 && (
                <p
                  className={`tnum mt-1 text-sm font-medium ${up ? "text-gold-bright" : "text-ember-deep"}`}
                >
                  {up ? "+" : ""}
                  {usd(change)} in the last 24h
                </p>
              )}

              {allocations.length > 0 && (
                <div className="mt-4">
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-panel">
                    {allocations.map((a, i) => (
                      <div
                        key={a.chain}
                        className={allocColors[i % allocColors.length]}
                        style={{
                          width: `${((a.totalUsd / (data.totalUsd || 1)) * 100).toFixed(1)}%`,
                        }}
                        title={`${a.chainLabel} ${usd(a.totalUsd)}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {allocations.map((a, i) => (
                      <span
                        key={a.chain}
                        className="inline-flex items-center gap-1.5 text-[11px] text-bone-mut"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${allocColors[i % allocColors.length]}`}
                        />
                        {a.chainLabel}
                        <span className="tnum text-bone-faint">
                          {((a.totalUsd / (data.totalUsd || 1)) * 100).toFixed(0)}
                          %
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="glass mt-3 overflow-x-auto p-2">
                <table className="w-full min-w-[460px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                      <th className="px-3 py-2 font-medium">Holding</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Balance
                      </th>
                      <th className="px-3 py-2 text-right font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr
                        key={`${it.chain}-${it.symbol}-${i}`}
                        className="border-t border-steel-line"
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {it.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={it.logo}
                                alt=""
                                className="h-6 w-6 shrink-0 rounded-full"
                              />
                            ) : (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-panel">
                                <Icon
                                  name="coin"
                                  className="h-3.5 w-3.5 text-gold"
                                />
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-bone">
                                  {it.symbol}
                                </p>
                                {it.address && (
                                  <WatchBadge
                                    address={it.address}
                                    chain={it.watchChain}
                                  />
                                )}
                              </div>
                              <p className="truncate text-xs text-bone-faint">
                                {it.name}
                                <span className="ml-1.5 text-bone-mut">
                                  {it.chainLabel}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="tnum px-3 py-2.5 text-right text-bone-mut">
                          {it.balance}
                        </td>
                        <td className="tnum px-3 py-2.5 text-right text-bone">
                          {usd(it.quoteUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {dust.length > 0 && (
              <div className="glass mt-3 p-2">
                <button
                  type="button"
                  onClick={() => setShowDust((v) => !v)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-bone-mut"
                >
                  <span>
                    Small balances ({dust.length}) under {usd(0.5)}
                  </span>
                  <Icon
                    name={showDust ? "compass" : "plus"}
                    className="h-4 w-4 text-bone-faint"
                  />
                </button>
                {showDust && (
                  <div className="flex flex-col divide-y divide-steel-line">
                    {dust.map((it, i) => (
                      <div
                        key={`${it.chain}-${it.symbol}-${i}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-bone-mut">
                          {it.symbol}
                          <span className="ml-1.5 text-xs text-bone-faint">
                            {it.chainLabel}
                          </span>
                        </span>
                        <span className="tnum text-bone-faint">
                          {usd(it.quoteUsd)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {updatedAt && (
              <p className="mt-3 text-center text-[11px] text-bone-faint">
                Read {new Date(updatedAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                . Values from live on-chain balances.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
