"use client";

import Link from "next/link";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { Icon } from "@/components/ui/icon";

export default function BookmarksPage() {
  const { ready, authenticated } = useRealmAuth();

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">
        Bookmarks
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Saved ravens
      </p>

      {!ready ? (
        <div className="glass mt-5 h-48 animate-pulse" />
      ) : !authenticated ? (
        <div className="glass mt-5 p-8 text-center">
          <Icon name="bookmark" className="mx-auto h-7 w-7 text-gold" />
          <p className="mt-3 text-sm text-bone-mut">
            The shelf is private. Enter the realm to see what you have saved.
          </p>
          <Link href="/signin" className="btn-gold mt-5 px-5 py-2.5 text-sm">
            Enter the realm
          </Link>
        </div>
      ) : (
        <div className="glass mt-5 p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-steel-line bg-panel">
            <Icon name="bookmark" className="h-6 w-6 text-gold" />
          </span>
          <p className="mt-4 font-display text-base font-semibold text-bone">
            Your saved ravens live here
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-bone-mut">
            Bookmarks are yours alone; no one else can see this shelf. The
            shelf syncs shortly, so anything you have marked will appear here
            once it does.
          </p>
        </div>
      )}
    </div>
  );
}
