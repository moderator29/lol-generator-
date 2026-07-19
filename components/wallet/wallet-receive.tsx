"use client";

import { WalletCard } from "@/components/wallet/wallet-card";
import { CopyButton } from "@/components/wallet/copy-button";

/* Receive: shows the user's non-custodial realm wallet address with a clear
   copy affordance. No balances are invented here; this is the true, shareable
   receiving address for the configured (Ethereum) network. */
export function WalletReceive({ address }: { address?: string }) {
  return (
    <WalletCard icon="arrow" title="Receive" caption="Your realm wallet">
      {address ? (
        <>
          <p className="text-sm text-bone-mut">
            This is your realm wallet address. Share it to receive coin and
            tokens on the Ethereum network. It is yours alone, non-custodial,
            and safe to share.
          </p>
          <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-steel-line bg-panel/60 p-3">
            <code className="tnum min-w-0 break-all font-mono text-xs leading-relaxed text-bone sm:text-sm">
              {address}
            </code>
            <CopyButton value={address} label="Copy address" />
          </div>
          <p className="mt-3 text-xs text-bone-faint">
            Only send assets on networks this wallet supports. Coins sent on an
            unsupported chain can be lost.
          </p>
        </>
      ) : (
        <p className="text-sm text-bone-mut">
          No wallet is bound to your banner yet. Once one is forged, your
          receiving address appears here.
        </p>
      )}
    </WalletCard>
  );
}
