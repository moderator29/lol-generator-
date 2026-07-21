"use client";

import { Icon } from "@/components/ui/icon";
import { CopyButton } from "@/components/wallet/copy-button";
import { WalletBackup } from "@/components/wallet/wallet-backup";
import {
  type ChainMeta,
  addressExplorerUrl,
  shortAddress,
} from "@/components/wallet/chains";

/* Wallet settings sheet. Houses the account details and the sensitive Backup /
   Export flow, moved off the main overview so the wallet reads clean. Copy
   address, open on the explorer, see the active network, back up the recovery
   phrase, and read the self-custody note. Rendered as the body of the Settings
   modal; Backup requires the Privy provider above it. */
export function WalletSettings({
  address,
  chainMeta,
}: {
  address?: string;
  chainMeta: ChainMeta;
}) {
  const explorer = address ? addressExplorerUrl(chainMeta, address) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Account */}
      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bone-faint">
          Account
        </p>

        {address ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-steel-line bg-panel/40 p-3.5">
            <div className="min-w-0">
              <p className="text-xs text-bone-faint">Wallet address</p>
              <code className="tnum mt-0.5 block font-mono text-sm text-bone">
                {shortAddress(address, 10, 8)}
              </code>
            </div>
            <CopyButton value={address} label="Copy address" iconOnly />
          </div>
        ) : null}

        {explorer ? (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl border border-steel-line bg-panel/40 p-3.5 transition-colors hover:border-gold/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-steel-line bg-panel">
                <Icon name="search" className="h-4 w-4 text-gold" />
              </span>
              <div>
                <p className="text-sm font-medium text-bone">View on explorer</p>
                <p className="text-xs text-bone-faint">
                  Full history on {chainMeta.name}
                </p>
              </div>
            </div>
            <Icon name="arrow" className="h-4 w-4 shrink-0 text-bone-faint" />
          </a>
        ) : null}

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-steel-line bg-panel/40 p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-steel-line bg-panel">
              <Icon name="signal" className="h-4 w-4 text-gold" />
            </span>
            <div>
              <p className="text-sm font-medium text-bone">Network</p>
              <p className="text-xs text-bone-faint">Default for this wallet</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-panel-warm/60 px-2.5 py-1 text-xs font-medium text-bone">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {chainMeta.name}
          </span>
        </div>
      </section>

      {/* Backup / Export */}
      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bone-faint">
          Backup and recovery
        </p>
        <div className="rounded-2xl border border-steel-line bg-panel/40 p-4">
          <WalletBackup />
        </div>
      </section>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-2xl border border-gold/15 bg-panel/40 p-3.5">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-xs leading-relaxed text-bone-mut">
          Non-custodial means self-custody. Ravenspire never holds your keys and
          cannot move your funds. Guard your recovery phrase; anyone who holds it
          controls the wallet.
        </p>
      </div>
    </div>
  );
}
