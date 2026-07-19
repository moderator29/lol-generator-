"use client";

import { useMemo, useState } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { isAddress, parseEther } from "viem";
import { WalletCard } from "@/components/wallet/wallet-card";
import { Icon } from "@/components/ui/icon";
import { type ChainMeta, txExplorerUrl } from "@/components/wallet/chains";

/* Send native coin from the embedded wallet. Privy's sendTransaction opens a
   secure confirmation window that the user must approve, so the platform never
   moves funds on its own. MUST render only when Privy is enabled. */
export function WalletSend({
  fromAddress,
  chainId,
  chainMeta,
  balanceWei,
  onSent,
}: {
  fromAddress?: string;
  chainId: number | null;
  chainMeta: ChainMeta;
  balanceWei?: bigint;
  onSent?: () => void;
}) {
  const { sendTransaction } = useSendTransaction();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const toValid = to.trim() === "" || isAddress(to.trim());

  const parsedValue = useMemo(() => {
    if (amount.trim() === "") return null;
    try {
      const wei = parseEther(amount.trim());
      return wei > BigInt(0) ? wei : null;
    } catch {
      return null;
    }
  }, [amount]);

  const overBalance =
    parsedValue !== null &&
    balanceWei !== undefined &&
    parsedValue > balanceWei;

  const canSend =
    !pending &&
    isAddress(to.trim()) &&
    parsedValue !== null &&
    !overBalance &&
    !!fromAddress;

  const submit = async () => {
    setError(null);
    setHash(null);
    if (!isAddress(to.trim())) {
      setError("That does not look like a valid address.");
      return;
    }
    if (parsedValue === null) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setPending(true);
    try {
      const result = await sendTransaction(
        {
          to: to.trim(),
          value: parsedValue,
          ...(chainId ? { chainId } : {}),
        },
        fromAddress ? { address: fromAddress } : undefined
      );
      setHash(result.hash);
      setTo("");
      setAmount("");
      onSent?.();
    } catch (e) {
      const message =
        e instanceof Error && e.message
          ? e.message
          : "The transaction was not sent.";
      // Privy throws a friendly rejection when the user closes the window.
      setError(
        /reject|denied|cancel/i.test(message)
          ? "You closed the confirmation window. Nothing was sent."
          : message
      );
    } finally {
      setPending(false);
    }
  };

  const explorer = hash ? txExplorerUrl(chainMeta, hash) : null;

  return (
    <WalletCard icon="send" title="Send" caption={chainMeta.name}>
      <p className="text-sm text-bone-mut">
        Send {chainMeta.symbol} from your realm wallet on {chainMeta.name}. You
        approve every transfer yourself in a secure window; Ravenspire cannot
        move your funds.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.2em] text-bone-faint">
            Recipient address
          </span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="0x..."
            className={`tnum w-full rounded-2xl border bg-panel/60 px-3 py-2.5 font-mono text-sm text-bone outline-none transition-colors placeholder:text-bone-faint focus:border-gold ${
              toValid ? "border-steel-line" : "border-ember/60"
            }`}
          />
          {!toValid ? (
            <span className="text-xs text-ember">
              This is not a valid wallet address.
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.2em] text-bone-faint">
            Amount ({chainMeta.symbol})
          </span>
          <div className="relative">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              spellCheck={false}
              autoComplete="off"
              placeholder="0.0"
              className={`tnum w-full rounded-2xl border bg-panel/60 px-3 py-2.5 pr-16 font-mono text-sm text-bone outline-none transition-colors placeholder:text-bone-faint focus:border-gold ${
                overBalance ? "border-ember/60" : "border-steel-line"
              }`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.15em] text-bone-faint">
              {chainMeta.symbol}
            </span>
          </div>
          {overBalance ? (
            <span className="text-xs text-ember">
              That is more than your balance on {chainMeta.name}.
            </span>
          ) : null}
        </label>

        <button
          type="button"
          disabled={!canSend}
          onClick={() => void submit()}
          className="btn-gold mt-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="send" className="h-4 w-4" />
          {pending ? "Confirm in the window..." : "Review and send"}
        </button>

        {error ? (
          <p className="text-xs text-ember">{error}</p>
        ) : null}

        {hash ? (
          <div className="rounded-2xl border border-steel-line bg-panel/60 p-3">
            <p className="text-sm text-bone">Sent. Your transfer is on its way.</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="tnum min-w-0 truncate font-mono text-xs text-bone-mut">
                {hash}
              </code>
              {explorer ? (
                <a
                  href={explorer}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs text-gold underline"
                >
                  View
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="text-xs text-bone-faint">
          Network fees apply and are paid from this wallet. Double-check the
          address; transfers cannot be reversed.
        </p>
      </div>
    </WalletCard>
  );
}
