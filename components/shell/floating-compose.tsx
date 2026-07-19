"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/* The compose action. Uses the gold gradient directly (not .btn-gold, which
   forces position: relative and would break the fixed placement). */
export function FloatingCompose() {
  return (
    <Link
      href="/home?compose=1"
      aria-label="Send a raven"
      style={{ position: "fixed" }}
      className="gold-metal bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-gold-bright/60 text-obsidian shadow-[0_10px_30px_rgba(200,162,76,0.35)] transition active:scale-95 lg:bottom-8 lg:right-8"
    >
      <Icon name="plus" className="h-6 w-6" />
    </Link>
  );
}
