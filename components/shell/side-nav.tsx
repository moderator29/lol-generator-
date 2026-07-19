"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { RavenMark } from "@/components/brand/raven-mark";
import { socialNav, toolsNav, accountNav, comingSoonNav } from "@/lib/nav";
import type { NavItem } from "@/lib/nav";

function NavGroup({
  label,
  items,
  pathname,
}: {
  label?: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <>
      {label && (
        <p className="mt-4 mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-bone-faint">
          {label}
        </p>
      )}
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.slug}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-2.5 py-[7px] text-sm transition ${
              active
                ? "bg-panel text-gold-bright shadow-[inset_0_1px_0_rgba(240,214,140,0.08)]"
                : "text-bone-mut hover:bg-panel/60 hover:text-bone"
            }`}
          >
            <Icon name={item.icon} className="h-[17px] w-[17px] shrink-0" />
            <span className="truncate font-medium">{item.themed}</span>
            <span className="ml-auto hidden truncate text-[10px] text-bone-faint group-hover:inline">
              {item.plain}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-full flex-col gap-0.5 overflow-y-auto px-3 py-4"
      onClick={onNavigate}
    >
      <Link
        href="/home"
        className="mb-3 flex items-center gap-2.5 px-2 font-display text-[19px] font-semibold tracking-[0.08em]"
      >
        <RavenMark className="h-7 w-7" />
        <span className="gold-text">RAVENSPIRE</span>
      </Link>

      <div className="glass glass-sm mb-3 p-3">
        <Link href="/keep" className="flex items-center gap-3">
          <div className="hairline flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-void text-bone-mut">
            <Icon name="user" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-bone">Your Keep</p>
            <p className="truncate text-xs text-bone-faint">Enter the realm</p>
          </div>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/signin"
            className="btn-gold flex-1 px-3 py-1.5 text-center text-[13px]"
          >
            Sign in
          </Link>
          <Link
            href="/vault"
            className="btn-glass shrink-0 px-2.5 py-1.5 text-xs text-bone-mut"
            title="The Vault"
          >
            <Icon name="wallet" className="h-4 w-4" />
            $RAVEN
          </Link>
        </div>
      </div>

      <NavGroup label="Social & Game" items={socialNav} pathname={pathname} />
      <NavGroup label="Tools" items={toolsNav} pathname={pathname} />
      <NavGroup label="Account" items={accountNav} pathname={pathname} />

      <p className="mt-4 mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-bone-faint">
        The Chapters ahead
      </p>
      {comingSoonNav.map((item) => (
        <Link
          key={item.slug}
          href={item.href}
          className="group flex items-center gap-3 rounded-xl px-2.5 py-[7px] text-sm text-bone-faint transition hover:bg-panel/60 hover:text-bone-mut"
        >
          <Icon name={item.icon} className="h-[17px] w-[17px] shrink-0" />
          <span className="truncate font-medium">{item.themed}</span>
          <span className="ml-auto shrink-0 rounded-full border border-gold/25 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold/70">
            Soon
          </span>
        </Link>
      ))}
      <div className="h-4" />
    </nav>
  );
}
