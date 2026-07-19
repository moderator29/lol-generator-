import Link from "next/link";
import { Icon } from "@/components/ui/icon";

const methods = [
  { label: "Continue with X", icon: "raven" },
  { label: "Continue with Email", icon: "mail" },
  { label: "Connect Wallet", icon: "wallet" },
];

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-display text-2xl font-semibold tracking-wide text-gold"
      >
        <Icon name="raven" className="h-7 w-7" />
        RAVENSPIRE
      </Link>
      <div className="hairline w-full max-w-sm rounded-2xl bg-panel p-6">
        <h1 className="font-display text-xl font-semibold text-bone">
          Enter the realm
        </h1>
        <p className="mt-1 text-sm text-bone-muted">
          A non-custodial wallet is created for you. Your keys stay yours.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {methods.map((m) => (
            <button
              key={m.label}
              disabled
              className="hairline flex cursor-not-allowed items-center justify-center gap-2.5 rounded-lg bg-raised px-4 py-2.5 text-sm font-medium text-bone-muted"
            >
              <Icon name={m.icon} className="h-4.5 w-4.5" />
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-bone-muted/70">
          The gates open shortly. Auth goes live in this phase.
        </p>
      </div>
    </main>
  );
}
