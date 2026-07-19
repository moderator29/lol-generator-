import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function RightRail() {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 px-4 py-6 xl:flex">
      <div className="glass p-4">
        <div className="flex items-center gap-2">
          <Icon name="raven" className="h-5 w-5 text-gold" />
          <h2 className="font-display text-base font-semibold tracking-wide text-bone">
            @raven
          </h2>
          <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-bone-faint">
            The Herald
          </span>
        </div>
        <p className="mt-2 text-sm text-bone-mut">
          Ask anything. Settle a debate, read a token, roast a friend kindly.
          Real data only, realm voice always.
        </p>
        <Link
          href="/raven"
          className="btn-glass mt-3 block w-full px-3 py-2 text-center text-sm text-bone-mut"
        >
          Summon the Raven
        </Link>
      </div>

      <div className="glass p-4">
        <h2 className="font-display text-base font-semibold tracking-wide text-bone">
          Live ravens
        </h2>
        <p className="mt-2 text-sm text-bone-mut">
          Trending ravens, courts in session and House movements appear here
          once the realm opens.
        </p>
      </div>
    </aside>
  );
}
