"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RavenMark } from "@/components/brand/raven-mark";
import { Icon } from "@/components/ui/icon";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";

export default function SignInPage() {
  /* Routing into the realm after sign-in is handled globally by the
     PostAuthGate, so it works no matter where the login completes. */
  const { ready, enabled, authenticated, signInX, signInEmail, connectWallet } =
    useRealmAuth();

  return (
    <main className="realm-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(200,162,76,0.13), transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
      >
        <RavenMark className="h-16 w-16" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="gold-text mt-4 font-display text-4xl font-semibold tracking-[0.1em]"
      >
        RAVENSPIRE
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-3 text-sm text-bone-mut"
      >
        See every chain. Fear no rug. Rule your realm.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="mt-10 w-full max-w-sm"
      >
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.34em] text-bone-faint">
          Enter the realm
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={signInX}
            disabled={!enabled}
            className="btn-glass w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="xlogo" className="h-4 w-4" />
            Continue with X
          </button>
          <button
            onClick={signInEmail}
            disabled={!enabled}
            className="btn-glass w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="mail" className="h-[17px] w-[17px]" />
            Continue with Email
          </button>
          <div className="my-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-bone-faint">
            <span className="h-px flex-1 bg-steel-line" />
            or
            <span className="h-px flex-1 bg-steel-line" />
          </div>
          <button
            onClick={connectWallet}
            disabled={!enabled}
            className="btn-gold w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="wallet" className="h-[17px] w-[17px]" />
            Connect Wallet
          </button>
        </div>
        <p className="mt-5 text-center text-xs leading-relaxed text-bone-faint">
          A non-custodial wallet is created for you.
          <br />
          By entering, you agree to the{" "}
          <Link href="/chronicle" className="text-bone-mut underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/chronicle" className="text-bone-mut underline">
            Privacy Policy
          </Link>
          .
        </p>
        {ready && !enabled && (
          <p className="mt-3 text-center text-[11px] text-bone-faint">
            The Gatehouse keys are not configured in this environment. Auth goes
            live on the hosted realm.
          </p>
        )}
      </motion.div>
    </main>
  );
}
