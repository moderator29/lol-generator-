"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { formatEther } from "viem";
import { WalletCard } from "@/components/wallet/wallet-card";
import { WalletSend } from "@/components/wallet/wallet-send";
import { WalletBackup } from "@/components/wallet/wallet-backup";
import { Icon } from "@/components/ui/icon";
import { chainMetaFor, parseChainId } from "@/components/wallet/chains";

/* The Privy-powered part of the wallet: locates the embedded wallet, reads its
   live chain + native balance straight from the wallet's own provider (no
   invented numbers), and wires up Send and Backup. MUST render only when Privy
   is enabled so useWallets/useSendTransaction have their provider. */
export function WalletLive({ address }: { address?: string }) {
  const { wallets, ready } = useWallets();

  const wallet = useMemo(() => {
    if (!wallets.length) return undefined;
    const byAddress = address
      ? wallets.find((w) => w.address.toLowerCase() === address.toLowerCase())
      : undefined;
    const embedded = wallets.find(
      (w) =>
        w.walletClientType === "privy" || w.walletClientType === "privy-v2"
    );
    return byAddress ?? embedded ?? wallets[0];
  }, [wallets, address]);

  const chainId = parseChainId(wallet?.chainId);
  const chainMeta = chainMetaFor(chainId);

  const [balanceWei, setBalanceWei] = useState<bigint | undefined>(undefined);
  const [balanceState, setBalanceState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    setBalanceState("loading");
    void (async () => {
      try {
        const provider = await wallet.getEthereumProvider();
        const hex = (await provider.request({
          method: "eth_getBalance",
          params: [wallet.address, "latest"],
        })) as string;
        if (cancelled) return;
        setBalanceWei(BigInt(hex));
        setBalanceState("idle");
      } catch {
        if (cancelled) return;
        setBalanceState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet, refreshKey]);

  const balanceText =
    balanceWei !== undefined
      ? Number(formatEther(balanceWei)).toLocaleString(undefined, {
          maximumFractionDigits: 6,
        })
      : null;

  if (ready && !wallet) {
    return (
      <WalletCard icon="coin" title="Holdings" caption="Live balance">
        <p className="text-sm text-bone-mut">
          No embedded wallet is ready yet. It is forged automatically once you
          are fully signed in.
        </p>
      </WalletCard>
    );
  }

  return (
    <>
      <WalletCard icon="coin" title="Holdings" caption={chainMeta.name} warm>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="gold-text font-display tnum text-3xl font-semibold">
              {balanceText ?? "--"}{" "}
              <span className="text-xl">{chainMeta.symbol}</span>
            </p>
            <p className="mt-1 text-xs text-bone-faint">
              {balanceState === "loading"
                ? "Reading the ledger..."
                : balanceState === "error"
                  ? "Balance could not be read just now."
                  : `Native balance on ${chainMeta.name}`}
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={balanceState === "loading"}
            className="btn-glass inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
          >
            <Icon name="repost" className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </WalletCard>

      <WalletSend
        fromAddress={wallet?.address ?? address}
        chainId={chainId}
        chainMeta={chainMeta}
        balanceWei={balanceWei}
        onSent={refresh}
      />

      <WalletBackup />
    </>
  );
}
