"use client";

import { Icon } from "@/components/ui/icon";
import { CopyButton } from "@/components/wallet/copy-button";
import {
  type ChainMeta,
  addressExplorerUrl,
} from "@/components/wallet/chains";

/* Receive: shows the user's non-custodial realm wallet address in full with a
   clear copy affordance and the network to receive on. No balances are invented
   here; this is the true, shareable receiving address. Rendered as the body of
   the Receive modal. */
export function WalletReceive({
  address,
  chainMeta,
}: {
  address?: string;
  chainMeta: ChainMeta;
}) {
  if (!address) {
    return (
      <p className="text-sm text-bone-mut">
        No wallet is bound to your banner yet. Once one is forged, your
        receiving address appears here.
      </p>
    );
  }

  const explorer = addressExplorerUrl(chainMeta, address);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-bone-mut">
        Share this address to receive {chainMeta.symbol} and tokens. It is yours
        alone, non-custodial, and safe to share.
      </p>

      <div className="flex items-center gap-2 rounded-2xl border border-steel-line bg-panel/50 px-3.5 py-2.5">
        <span className="flex h-2 w-2 shrink-0 rounded-full bg-gold" />
        <span className="text-sm text-bone">Receiving on</span>
        <span className="ml-auto text-sm font-medium text-bone">
          {chainMeta.name}
        </span>
      </div>

      <div className="rounded-2xl border border-steel-line bg-panel/50 p-3.5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
          Wallet address
        </p>
        <code className="tnum mt-1.5 block break-all font-mono text-sm leading-relaxed text-bone">
          {address}
        </code>
      </div>

      <div className="flex gap-2">
        <CopyButton
          value={address}
          label="Copy address"
          className="btn-gold inline-flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-sm"
        />
        {explorer ? (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="btn-glass inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm"
          >
            <Icon name="arrow" className="h-4 w-4" />
            Explorer
          </a>
        ) : null}
      </div>

      <p className="text-xs leading-relaxed text-bone-faint">
        Only send assets on {chainMeta.name} to this address. Coins sent on an
        unsupported chain can be lost for good.
      </p>
    </div>
  );
}
