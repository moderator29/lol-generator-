import Link from "next/link";
import { SideNav } from "@/components/shell/side-nav";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { RightRail } from "@/components/shell/right-rail";
import { Icon } from "@/components/ui/icon";

export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="realm-bg mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
      <div className="sticky top-0 hidden h-screen w-[272px] shrink-0 border-r border-steel-line/70 lg:block">
        <SideNav />
      </div>
      <TopBar />
      <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>
      <RightRail />
      <BottomNav />

      {/* Floating compose: send a raven */}
      <Link
        href="/home?compose=1"
        aria-label="Send a raven"
        className="btn-gold fixed bottom-20 right-4 z-40 h-13 w-13 rounded-full p-3.5 lg:bottom-8 lg:right-8"
      >
        <Icon name="plus" className="h-6 w-6" />
      </Link>
    </div>
  );
}
