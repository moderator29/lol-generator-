"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import encodeQR from "@paulmillr/qr";
import { usePrivy, useSendTransaction } from "@privy-io/react-auth";
import { parseEther, isAddress } from "viem";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { Icon } from "@/components/ui/icon";

function copyFallback(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1600);
      return;
    } catch {
      /* fall through to the legacy path for insecure contexts / webviews */
    }
    if (copyFallback(value)) {
      setState("copied");
      window.setTimeout(() => setState("idle"), 1600);
    } else {
      setState("failed");
      window.setTimeout(() => setState("idle"), 2600);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="btn-glass inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs"
    >
      <Icon
        name={state === "copied" ? "medal" : "scroll"}
        className="h-3.5 w-3.5"
      />
      {state === "copied"
        ? "Copied"
        : state === "failed"
          ? "Long-press to copy"
          : (label ?? "Copy")}
    </button>
  );
}

function AddressQR({ address }: { address: string }) {
  const svg = useMemo(() => {
    try {
      return encodeQR(address, "svg", { border: 1 });
    } catch {
      return null;
    }
  }, [address]);
  if (!svg) return null;
  return (
    <div
      className="h-40 w-40 rounded-2xl bg-bone p-2 [&>svg]:h-full [&>svg]:w-full"
      aria-label="Wallet address QR code"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/* Rendered only when the Gatehouse (Privy) is enabled, so usePrivy always
   has its provider above it. */
function ExportSection() {
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
    <section className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <Icon name="lock" className="h-4 w-4 text-gold" />
        <h2 className="font-display text-base font-semibold text-bone">
          Export
        </h2>
        <span className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
          Recovery phrase
        </span>
      </div>
      <p className="mt-3 text-sm text-bone-mut">
        Reveal your private key or recovery phrase to back this wallet up or
        carry it to another keep. The reveal happens entirely on this device,
        inside a secure window. It is never sent to our servers, and we could
        not read it if we tried.
      </p>
      <p className="mt-2 text-sm text-ember">
        Guard it like the crown jewels: anyone who holds the phrase controls
        the funds. No steward of Ravenspire will ever ask you for it.
      </p>
      <button
        type="button"
        onClick={() => void onExport()}
        className="btn-glass mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm"
      >
        <Icon name="eye" className="h-4 w-4" />
        Reveal my keys (Export)
      </button>
      {failed ? (
        <p className="mt-2 text-xs text-bone-faint">
          The reveal window could not open just now. Try again shortly.
        </p>
      ) : null}
    </section>
  );
}

/* Real EOA send. Gas is paid the normal way; gasless smart accounts can layer
   on later. Only rendered under the Privy provider. */
function SendSection() {
  const { sendTransaction } = useSendTransaction();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toValid = isAddress(to.trim());
  const amountValid = /^\d*\.?\d+$/.test(amount.trim()) && Number(amount) > 0;
  const canSend = toValid && amountValid && !busy;

  const onSend = async () => {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    setHash(null);
    try {
      const { hash: txHash } = await sendTransaction({
        to: to.trim(),
        value: parseEther(amount.trim()),
        chainId: 1,
      });
      setHash(txHash);
      setAmount("");
      setTo("");
    } catch {
      setError("The send was not completed. Nothing left your vault.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <Icon name="send" className="h-4 w-4 text-gold" />
        <h2 className="font-display text-base font-semibold text-bone">Send</h2>
        <span className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
          Ethereum
        </span>
      </div>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.2em] text-bone-faint">
          Recipient address
        </span>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
          spellCheck={false}
          className="glass-sm mt-2 w-full bg-transparent px-3.5 py-2.5 font-mono text-sm text-bone placeholder:text-bone-faint focus:outline-none"
        />
      </label>
      {to.trim() !== "" && !toValid && (
        <p className="mt-1.5 text-xs text-ember">
          That is not a valid Ethereum address.
        </p>
      )}

      <label className="mt-3 block">
        <span className="text-xs uppercase tracking-[0.2em] text-bone-faint">
          Amount (ETH)
        </span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="tnum glass-sm mt-2 w-full bg-transparent px-3.5 py-2.5 font-mono text-sm text-bone placeholder:text-bone-faint focus:outline-none"
        />
      </label>

      <button
        type="button"
        disabled={!canSend}
        onClick={() => void onSend()}
        className="btn-gold mt-4 w-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Sending" : "Send on Ethereum"}
      </button>

      {hash && (
        <p className="mt-3 break-all text-xs text-gold">
          Sent. Transaction {hash.slice(0, 10)}...{hash.slice(-8)}
        </p>
      )}
      {error && <p className="mt-3 text-xs text-ember">{error}</p>}
      <p className="mt-3 text-xs text-bone-faint">
        Confirm the destination chain before you send. This transfer goes out on
        Ethereum mainnet and cannot be reversed.
      </p>
    </section>
  );
}

export default function VaultPage() {
  const {
    ready,
    enabled,
    authenticated,
    address,
    signInX,
    signInEmail,
    connectWallet,
  } = useRealmAuth();

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">
        The Vault
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Wallet
      </p>

      <div className="mt-5">
        {!ready ? (
          <div className="glass h-40 animate-pulse" />
        ) : !authenticated ? (
          <div className="glass relative overflow-hidden p-8 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-steel-line bg-panel">
              <Icon name="wallet" className="h-6 w-6 text-gold" />
            </div>
            <h2 className="gold-text font-display mt-5 text-2xl font-semibold">
              The Vault awaits its keeper
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-bone-mut">
              Enter the realm and a non-custodial wallet is forged for you on
              the spot. Your keys, your coin, your vault. No one else holds a
              copy.
            </p>
            {enabled ? (
              <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={signInX}
                  className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                >
                  <Icon name="xlogo" className="h-4 w-4" />
                  Enter with X
                </button>
                <button
                  type="button"
                  onClick={signInEmail}
                  className="btn-glass inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                >
                  <Icon name="mail" className="h-4 w-4" />
                  Enter with email
                </button>
              </div>
            ) : (
              <p className="mt-6 text-xs text-bone-faint">
                The Gatehouse is not mounted in this environment, so sign-in is
                resting.{" "}
                <Link href="/signin" className="text-gold underline">
                  The gate
                </Link>{" "}
                will open once it is.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Address and receiving (merged) */}
            <section className="glass p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <Icon name="wallet" className="h-4 w-4 text-gold" />
                <h2 className="font-display text-base font-semibold text-bone">
                  Your address
                </h2>
                <span className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                  Receive
                </span>
              </div>
              {address ? (
                <>
                  <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <AddressQR address={address} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3 rounded-2xl border border-steel-line bg-panel/60 p-3">
                        <code className="tnum min-w-0 break-all font-mono text-xs leading-relaxed text-bone sm:text-sm">
                          {address}
                        </code>
                        <CopyButton value={address} label="Copy" />
                      </div>
                      <p className="mt-3 flex items-start gap-2 text-xs text-ember">
                        <Icon
                          name="shield"
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        />
                        Send only Ethereum and EVM-network assets to this
                        address. Depositing from another network can lose the
                        funds.
                      </p>
                      <p className="mt-2 text-xs text-bone-faint">
                        This wallet is non-custodial and truly yours. Ravenspire
                        never holds your keys and cannot move your funds; only
                        you can.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-bone-mut">
                  <p>
                    No wallet is bound to your banner yet. Connect one and the
                    Vault opens its doors.
                  </p>
                  {enabled ? (
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="btn-glass mt-3 px-4 py-2 text-sm"
                    >
                      Connect a wallet
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            {/* Send (only when the Gatehouse is enabled and a wallet exists) */}
            {enabled && address ? <SendSection /> : null}

            {/* Export (only when the Gatehouse is enabled) */}
            {enabled ? <ExportSection /> : null}

            {/* $RAVEN balance */}
            <section className="glass-warm glass p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <Icon name="coin" className="h-4 w-4 text-gold" />
                <h2 className="font-display text-base font-semibold text-bone">
                  $RAVEN balance
                </h2>
              </div>
              <p className="gold-text font-display tnum mt-3 text-3xl font-semibold">
                --
              </p>
              <p className="mt-2 text-xs text-bone-faint">
                Your balance awaits the token generation event. When $RAVEN
                takes flight, it lands here first; we will not show you a number
                that does not exist yet.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
