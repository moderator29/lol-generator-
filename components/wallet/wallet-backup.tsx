"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { WalletCard } from "@/components/wallet/wallet-card";
import { Icon } from "@/components/ui/icon";

/* Backup / Export. Uses Privy's exportWallet, which reveals the private key or
   recovery phrase inside a secure, on-device window. The key never touches
   Ravenspire's servers. MUST render only when Privy is enabled, so usePrivy has
   its provider above it. */
export function WalletBackup() {
  const { exportWallet } = usePrivy();
  const [failed, setFailed] = useState(false);

  const onExport = async () => {
    setFailed(false);
    try {
      await exportWallet();
    } catch {
      setFailed(true);
    }
  };

  return (
    <WalletCard icon="lock" title="Back up" caption="Export keys">
      <p className="text-sm text-bone-mut">
        Reveal your private key or recovery phrase to back this wallet up or
        carry it to another keep. The reveal happens entirely on this device,
        inside a secure window. It is never sent to our servers, and we could
        not read it if we tried.
      </p>
      <p className="mt-2 text-sm text-ember">
        Guard it like the crown jewels: anyone who holds the phrase controls the
        funds. No steward of Ravenspire will ever ask you for it.
      </p>
      <button
        type="button"
        onClick={() => void onExport()}
        className="btn-glass mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm"
      >
        <Icon name="eye" className="h-4 w-4" />
        Reveal my keys
      </button>
      {failed ? (
        <p className="mt-2 text-xs text-bone-faint">
          The reveal window could not open just now. Try again shortly.
        </p>
      ) : null}
    </WalletCard>
  );
}
