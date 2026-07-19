"use client";

import Link from "next/link";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { Icon } from "@/components/ui/icon";

export default function WhispersPage() {
  const { ready, authenticated } = useRealmAuth();

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">Whispers</h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Messages
      </p>

      {!ready ? (
        <div className="glass mt-5 h-48 animate-pulse" />
      ) : !authenticated ? (
        <div className="glass mt-5 p-8 text-center">
          <Icon name="mail" className="mx-auto h-7 w-7 text-gold" />
          <p className="mt-3 text-sm text-bone-mut">
            Whispers travel only between citizens of the realm.
          </p>
          <Link href="/signin" className="btn-gold mt-5 px-5 py-2.5 text-sm">
            Enter the realm
          </Link>
        </div>
      ) : (
        <>
          <div className="glass glass-sm mt-5 flex items-center gap-3 px-4 py-3">
            <Icon name="search" className="h-4 w-4 shrink-0 text-bone-faint" />
            <input
              placeholder="Search whispers"
              className="w-full bg-transparent text-sm text-bone placeholder:text-bone-faint focus:outline-none"
            />
          </div>

          <div className="glass mt-3 p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-steel-line bg-panel">
              <Icon name="send" className="h-6 w-6 text-gold" />
            </span>
            <p className="mt-4 font-display text-base font-semibold text-bone">
              No whispers yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-bone-mut">
              Visit a Keep and send the first. Your conversations will gather
              here, quiet as a corridor at midnight.
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-bone-faint">
            Whispers open realm-wide shortly. Until then, the corridor is being
            swept.
          </p>
        </>
      )}
    </div>
  );
}
