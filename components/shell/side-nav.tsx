"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { liveNav, comingSoonNav } from "@/lib/nav";

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-4">
      <Link
        href="/home"
        className="mb-3 flex items-center gap-2 px-2 font-display text-xl font-semibold tracking-wide text-gold"
      >
        <Icon name="raven" className="h-6 w-6" />
        RAVENSPIRE
      </Link>

      <div className="hairline mb-3 rounded-xl bg-panel p-3">
        <div className="flex items-center gap-3">
          <div className="hairline flex h-10 w-10 items-center justify-center rounded-full bg-raised text-bone-muted">
            <Icon name="raven" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-bone">Not signed in</p>
            <p className="truncate text-xs text-bone-muted">Join the realm</p>
          </div>
        </div>
        <Link
          href="/signin"
          className="mt-3 block rounded-lg bg-gold px-3 py-1.5 text-center text-sm font-semibold text-obsidian transition hover:bg-gold-deep"
        >
          Sign in
        </Link>
      </div>

      {liveNav.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.slug}
            href={item.href}
            className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition ${
              active
                ? "bg-raised text-gold"
                : "text-bone-muted hover:bg-panel hover:text-bone"
            }`}
          >
            <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate font-medium">{item.themed}</span>
            <span className="ml-auto hidden truncate text-[11px] text-bone-muted/70 group-hover:inline">
              {item.plain}
            </span>
          </Link>
        );
      })}

      <p className="mt-4 mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-bone-muted/70">
        Coming soon
      </p>
      {comingSoonNav.map((item) => (
        <Link
          key={item.slug}
          href={item.href}
          className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-bone-muted/60 transition hover:bg-panel hover:text-bone-muted"
        >
          <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate font-medium">{item.themed}</span>
          <span className="hairline ml-auto shrink-0 rounded-full bg-panel px-1.5 py-0.5 text-[10px] text-gold/80">
            Soon
          </span>
        </Link>
      ))}
    </nav>
  );
}
