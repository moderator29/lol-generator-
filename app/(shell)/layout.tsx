import { SideNav } from "@/components/shell/side-nav";
import { BottomNav } from "@/components/shell/bottom-nav";
import { RightRail } from "@/components/shell/right-rail";

export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
      <div className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-steel/40 lg:block">
        <SideNav />
      </div>
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      <RightRail />
      <BottomNav />
    </div>
  );
}
