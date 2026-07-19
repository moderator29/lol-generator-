"use client";

import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { WalletCard } from "@/components/wallet/wallet-card";
import { WalletReceive } from "@/components/wallet/wallet-receive";
import { WalletLive } from "@/components/wallet/wallet-live";

/* Composable wallet body: Receive + (when the Gatehouse/Privy is enabled) live
   Holdings, Send, and Backup. Safe to drop into the settings page or a
   dedicated wallet route. Renders the real, non-custodial wallet only; no
   invented balances. */
export function WalletSection() {
  const { enabled, authenticated, address } = useRealmAuth();

  return (
    <div className="flex flex-col gap-3">
      <WalletReceive address={authenticated ? address : undefined} />

      {enabled ? (
        <WalletLive address={authenticated ? address : undefined} />
      ) : (
        <WalletCard icon="lock" title="Back up and send" caption="Resting">
          <p className="text-sm text-bone-mut">
            The Gatehouse is not mounted in this environment, so key export and
            sending are resting. Your receiving address above is always yours.
          </p>
        </WalletCard>
      )}
    </div>
  );
}
