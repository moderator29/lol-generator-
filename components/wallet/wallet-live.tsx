"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { formatEther } from "viem";
import { Icon } from "@/components/ui/icon";
import { CopyButton } from "@/components/wallet/copy-button";
import { WalletModal } from "@/components/wallet/wallet-modal";
import { WalletSend } from "@/components/wallet/wallet-send";
import { WalletReceive } from "@/components/wallet/wallet-receive";
import { WalletBackup } from "@/components/wallet/wallet-backup";
import {
  addressExplorerUrl,
  chainMetaFor,
  parseChainId,
  shortAddress,
} from "@/components/wallet/chains";

type Panel = "send" | "receive" | "backup" | null;

/* The Privy-powered wallet overview: locates the embedded wallet, reads its
   live chain + native balance straight from the wallet's own provider (no
   invented numbers), and presents a real, non-custodial wallet: account header,
   balance hero, primary actions (Send / Receive / Backup) in secure modals, and
   an honest holdings + activity area. MUST render only when Privy is enabled so
   useWallets / useSendTransaction have their provider. */
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
  const walletAddress = wallet?.address ?? address;

  const [balanceWei, setBalanceWei] = useState<bigint | undefined>(undefined);
  const [balanceState, setBalanceState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [refreshKey, setRefreshKey] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);

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

  const explorer = walletAddress
    ? addressExplorerUrl(chainMeta, walletAddress)
    : null;

  if (ready && !wallet) {
    return (
      <section className="glass p-6 text-center sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-steel-line bg-panel">
          <Icon name="wallet" className="h-5 w-5 text-gold" />
        </div>
        <h2 className="font-display mt-4 text-lg font-semibold text-bone">
          Forging your wallet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-bone-mut">
          No embedded wallet is ready yet. One is created automatically once you
          are fully signed in.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Account header + balance hero */}
      <section className="glass glass-warm overflow-hidden p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-panel">
              <Icon name="wallet" className="h-5 w-5 text-gold" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-bone">
                Realm Wallet
              </p>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-steel-line bg-panel/60 px-2.5 py-0.5 text-[11px] font-medium text-bone-mut">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {chainMeta.name}
              </span>
            </div>
          </div>

          {walletAddress ? (
            <div className="flex shrink-0 items-center gap-2">
              <code className="tnum hidden rounded-lg border border-steel-line bg-panel/50 px-2.5 py-1.5 font-mono text-xs text-bone-mut sm:block">
                {shortAddress(walletAddress)}
              </code>
              <CopyButton value={walletAddress} label="Copy address" iconOnly />
            </div>
          ) : null}
        </div>

        {walletAddress ? (
          <code className="tnum mt-3 block font-mono text-xs text-bone-mut sm:hidden">
            {shortAddress(walletAddress)}
          </code>
        ) : null}

        <div className="mt-5 border-t border-steel-line/60 pt-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-bone-faint">
            Total balance
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <p className="gold-text font-display tnum text-4xl font-semibold leading-none sm:text-5xl">
              {balanceText ?? "0.00"}
              <span className="ml-2 text-xl font-semibold sm:text-2xl">
                {chainMeta.symbol}
              </span>
            </p>
            <button
              type="button"
              onClick={refresh}
              disabled={balanceState === "loading"}
              aria-label="Refresh balance"
              className="btn-glass inline-flex h-9 w-9 shrink-0 items-center justify-center p-0 disabled:opacity-50"
            >
              <Icon
                name="repost"
                className={`h-4 w-4 ${
                  balanceState === "loading" ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
          <p className="mt-2 text-xs text-bone-faint">
            {balanceState === "loading"
              ? "Reading the on-chain balance..."
              : balanceState === "error"
                ? "Balance could not be read just now. Try refreshing."
                : `Native balance on ${chainMeta.name}`}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gold/15 bg-panel/40 px-3.5 py-2.5">
          <Icon name="lock" className="h-4 w-4 shrink-0 text-gold" />
          <p className="text-xs text-bone-mut">
            Non-custodial. You hold the keys, and only you can move these funds.
          </p>
        </div>
      </section>

      {/* Primary actions */}
      <section className="glass p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-3">
          <ActionButton
            icon="send"
            label="Send"
            primary
            onClick={() => setPanel("send")}
          />
          <ActionButton
            icon="arrow"
            iconClassName="rotate-90"
            label="Receive"
            onClick={() => setPanel("receive")}
          />
          <ActionButton
            icon="shield"
            label="Backup"
            onClick={() => setPanel("backup")}
          />
        </div>
      </section>

      {/* Holdings */}
      <section className="glass p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <Icon name="coin" className="h-4 w-4 text-gold" />
          <h2 className="font-display text-base font-semibold text-bone">
            Holdings
          </h2>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-steel-line bg-panel/40 p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-panel-warm">
              <Icon name="coin" className="h-5 w-5 text-gold" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-bone">{chainMeta.symbol}</p>
              <p className="text-xs text-bone-faint">
                {chainMeta.name} · native coin
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="tnum text-sm font-semibold text-bone">
              {balanceText ?? "0.00"}
            </p>
            <p className="text-xs text-bone-faint">{chainMeta.symbol}</p>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section className="glass p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <Icon name="scroll" className="h-4 w-4 text-gold" />
          <h2 className="font-display text-base font-semibold text-bone">
            Activity
          </h2>
        </div>
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-steel-line bg-panel/25 p-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-steel-line bg-panel/60">
            <Icon name="scroll" className="h-5 w-5 text-bone-faint" />
          </span>
          <p className="text-sm font-medium text-bone-mut">
            Transaction history coming
          </p>
          <p className="max-w-xs text-xs text-bone-faint">
            Your on-chain transfers will appear here. For now, view full history
            on the block explorer.
          </p>
          {explorer ? (
            <a
              href={explorer}
              target="_blank"
              rel="noreferrer"
              className="btn-glass mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
            >
              <Icon name="arrow" className="h-3.5 w-3.5" />
              Open explorer
            </a>
          ) : null}
        </div>
      </section>

      {/* Action modals */}
      <WalletModal
        open={panel === "send"}
        onClose={() => setPanel(null)}
        title="Send"
        caption={chainMeta.name}
        icon="send"
      >
        <WalletSend
          fromAddress={walletAddress}
          chainId={chainId}
          chainMeta={chainMeta}
          balanceWei={balanceWei}
          onSent={refresh}
        />
      </WalletModal>

      <WalletModal
        open={panel === "receive"}
        onClose={() => setPanel(null)}
        title="Receive"
        caption={chainMeta.name}
        icon="arrow"
      >
        <WalletReceive address={walletAddress} chainMeta={chainMeta} />
      </WalletModal>

      <WalletModal
        open={panel === "backup"}
        onClose={() => setPanel(null)}
        title="Back up wallet"
        caption="Export private key"
        icon="shield"
      >
        <WalletBackup />
      </WalletModal>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  primary = false,
  iconClassName = "",
}: {
  icon: string;
  label: string;
  onClick: () => void;
  primary?: boolean;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2.5"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200 ${
          primary
            ? "gold-metal border-gold/50 text-[#171204] shadow-[0_8px_24px_rgba(200,162,76,0.22)] group-hover:brightness-105"
            : "border-steel-line bg-panel/60 text-gold group-hover:border-gold/45"
        }`}
      >
        <Icon name={icon} className={`h-5 w-5 ${iconClassName}`} />
      </span>
      <span className="text-xs font-medium text-bone-mut transition-colors group-hover:text-bone">
        {label}
      </span>
    </button>
  );
}
