"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { bottomNav } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-steel/40 bg-obsidian/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {bottomNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center justify-center gap-1 text-[11px] ${
                active ? "text-gold" : "text-bone-muted"
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
