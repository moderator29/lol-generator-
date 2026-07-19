"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

interface Check {
  label: string;
  status: "pass" | "caution" | "risk";
  detail?: string;
}

interface WatchResult {
  score?: number;
  checks?: Check[];
  raw?: { buyTax: number; sellTax: number };
  error?: string;
}

const statusColor: Record<Check["status"], string> = {
  pass: "text-gold",
  caution: "text-ember",
  risk: "text-ember-deep",
};

const statusIcon: Record<Check["status"], string> = {
  pass: "shield",
  caution: "eye",
  risk: "flame",
};

export default function WatchPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WatchResult | null>(null);

  const valid = /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const scan = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/watch?address=${encodeURIComponent(address.trim())}&chain=1`
      );
      setResult((await res.json()) as WatchResult);
    } catch {
      setResult({ error: "The Watch could not reach the wall" });
    } finally {
      setLoading(false);
    }
  };

  const score = result?.score ?? 0;
  const scoreColor =
    score >= 70 ? "text-gold" : score >= 40 ? "text-ember" : "text-ember-deep";

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">
        The Watch
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Token security scanner
      </p>

      <div className="glass mt-5 p-4 sm:p-5">
        <label
          htmlFor="watch-address"
          className="text-xs uppercase tracking-[0.2em] text-bone-faint"
        >
          Token contract address
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="watch-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void scan();
            }}
            placeholder="0x..."
            spellCheck={false}
            className="glass-sm min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-bone placeholder:text-bone-faint focus:outline-none"
          />
          <button
            type="button"
            className="btn-gold shrink-0"
            disabled={!valid || loading}
            onClick={() => void scan()}
          >
            {loading ? "Scanning" : "Scan"}
          </button>
        </div>
        {address.trim() !== "" && !valid && (
          <p className="mt-2 text-xs text-bone-faint">
            The Watch reads Ethereum contract addresses: 0x followed by 40 hex
            characters.
          </p>
        )}
      </div>

      {loading && <div className="glass mt-3 h-32 animate-pulse" />}

      {result?.error && (
        <div className="glass mt-3 p-6 text-center text-sm text-bone-mut">
          {result.error}
        </div>
      )}

      {result && !result.error && (
        <>
          <div className="glass mt-3 p-6 text-center">
            <p
              className={`tnum font-display text-5xl font-semibold ${scoreColor}`}
            >
              {score}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
              Defenses score
            </p>
          </div>

          <div className="glass mt-3 flex flex-col divide-y divide-steel-line p-2">
            {(result.checks ?? []).map((c, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-3">
                <Icon
                  name={statusIcon[c.status]}
                  className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${statusColor[c.status]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${statusColor[c.status]}`}>
                    {c.label}
                  </p>
                  {c.detail && (
                    <p className="mt-0.5 text-xs text-bone-faint">{c.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {result.raw && (
            <div className="glass glass-sm mt-3 flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-bone-mut">Trade taxes</span>
              <span className="tnum text-bone">
                Buy {result.raw.buyTax.toFixed(1)}% / Sell{" "}
                {result.raw.sellTax.toFixed(1)}%
              </span>
            </div>
          )}
        </>
      )}

      <div className="glass mt-5 p-4 text-sm text-bone-mut">
        <div className="flex items-start gap-3">
          <Icon name="wall" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-gold" />
          <p>
            The Watch reads public defenses from live chain data. Approvals
            audit and one-tap revoke arrive as the Watch deepens.
          </p>
        </div>
      </div>
    </div>
  );
}
