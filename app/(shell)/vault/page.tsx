"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { Icon } from "@/components/ui/icon";

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable; stay quiet and honest */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="btn-glass inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs"
    >
      <Icon name={copied ? "medal" : "scroll"} className="h-3.5 w-3.5" />
      {copied ? "Copied" : (label ?? "Copy")}
    </button>
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

export default function VaultPage() {
  const { ready, enabled, authenticated, address, signInX, signInEmail, connectWallet } =
    useRealmAuth();

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
                resting. <Link href="/signin" className="text-gold underline">The gate</Link> will open once it is.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Address */}
            <section className="glass p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <Icon name="wallet" className="h-4 w-4 text-gold" />
                <h2 className="font-display text-base font-semibold text-bone">
                  Your address
                </h2>
              </div>
              {address ? (
                <>
                  <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-steel-line bg-panel/60 p-3">
                    <code className="tnum min-w-0 break-all font-mono text-xs leading-relaxed text-bone sm:text-sm">
                      {address}
                    </code>
                    <CopyButton value={address} />
                  </div>
                  <p className="mt-3 text-xs text-bone-faint">
                    This wallet is non-custodial and truly yours. Ravenspire
                    never holds your keys and cannot move your funds; only you
                    can.
                  </p>
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

            {/* Export (only when the Gatehouse is enabled) */}
            {enabled ? <ExportSection /> : null}

            {/* Receive */}
            <section className="glass p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <Icon name="arrow" className="h-4 w-4 text-gold" />
                <h2 className="font-display text-base font-semibold text-bone">
                  Receive
                </h2>
              </div>
              {address ? (
                <>
                  <p className="mt-3 text-sm text-bone-mut">
                    Share this address to receive coin into your vault.
                  </p>
                  <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-steel-line bg-panel/60 p-3">
                    <code className="tnum min-w-0 break-all font-mono text-xs leading-relaxed text-bone sm:text-sm">
                      {address}
                    </code>
                    <CopyButton value={address} label="Copy address" />
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-bone-mut">
                  Bind a wallet first and your receiving address will appear
                  here.
                </p>
              )}
            </section>

            {/* Send */}
            <section className="glass p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <Icon name="send" className="h-4 w-4 text-gold" />
                <h2 className="font-display text-base font-semibold text-bone">
                  Send
                </h2>
              </div>
              <div className="mt-3 rounded-2xl border border-steel-line bg-panel/60 p-4 text-sm text-bone-mut">
                Send opens with gasless smart accounts shortly. Until then, the
                drawbridge stays up rather than making you pay gas the old way.
              </div>
            </section>

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
                takes flight, it lands here first; we will not show you a
                number that does not exist yet.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
