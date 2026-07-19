"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { RavenMark } from "@/components/brand/raven-mark";
import { SideNav } from "@/components/shell/side-nav";

/* Mobile-only top bar: drawer trigger, brand, ravens (notifications),
   whispers and the vault live up here so the bottom nav stays social. */
export function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-steel-line/70 bg-obsidian/92 px-3 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-full text-bone-mut"
        >
          <Icon name="user" className="h-5 w-5" />
        </button>
        <Link href="/home" aria-label="The Ravenry">
          <RavenMark className="h-8 w-8" />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/ravens"
            aria-label="Ravens"
            className="flex h-9 w-9 items-center justify-center rounded-full text-bone-mut"
          >
            <Icon name="bell" className="h-5 w-5" />
          </Link>
          <Link
            href="/whispers"
            aria-label="Whispers"
            className="flex h-9 w-9 items-center justify-center rounded-full text-bone-mut"
          >
            <Icon name="mail" className="h-5 w-5" />
          </Link>
          <Link
            href="/vault"
            aria-label="The Vault"
            className="flex h-9 w-9 items-center justify-center rounded-full text-bone-mut"
          >
            <Icon name="wallet" className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[290px] max-w-[85vw] border-r border-steel-line bg-obsidian shadow-2xl">
            <SideNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
