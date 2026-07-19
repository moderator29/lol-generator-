"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { Icon } from "@/components/ui/icon";

interface Holding {
  symbol: string;
  name: string;
  balance: string;
  quoteUsd: number;
  logo: string | null;
}

interface LedgerResponse {
  configured: boolean;
  items?: Holding[];
  totalUsd?: number;
  error?: string;
}

const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

export default function LedgerPage() {
  const { ready, authenticated, address } = useRealmAuth();
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated || !address) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/ledger?address=${encodeURIComponent(address)}`
        );
        const body = (await res.json()) as LedgerResponse;
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, address]);

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">
        The Ledger
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Portfolio
      </p>

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
            The Ledger could not be read just now. Try again shortly.
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
            The Ledger&apos;s lens clouded over. Try again shortly.
          </div>
        ) : (data.items ?? []).length === 0 ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            This wallet holds no coin worth an entry yet. The Ledger awaits
            your first treasure.
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
            </div>

            <div className="glass mt-3 overflow-x-auto p-2">
              <table className="w-full min-w-[420px] text-left text-sm">
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
                  {(data.items ?? []).map((it, i) => (
                    <tr
                      key={`${it.symbol}-${i}`}
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
                            <p className="font-medium text-bone">{it.symbol}</p>
                            <p className="truncate text-xs text-bone-faint">
                              {it.name}
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
          </>
        )}
      </div>
    </div>
  );
}
