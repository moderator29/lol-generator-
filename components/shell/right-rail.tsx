import { Icon } from "@/components/ui/icon";

export function RightRail() {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 px-4 py-6 xl:flex">
      <div className="hairline rounded-2xl bg-panel p-4">
        <div className="flex items-center gap-2 text-gold">
          <Icon name="raven" className="h-5 w-5" />
          <h2 className="font-display text-base font-semibold tracking-wide">
            The Raven
          </h2>
        </div>
        <p className="mt-2 text-sm text-bone-muted">
          Ask about any wallet, token or position in plain language. The Raven
          answers from real data only.
        </p>
        <div className="hairline mt-3 rounded-lg bg-raised px-3 py-2 text-sm text-bone-muted/70">
          Awakens with your sign-in
        </div>
      </div>

      <div className="hairline rounded-2xl bg-panel p-4">
        <h2 className="font-display text-base font-semibold tracking-wide text-bone">
          Live Ravens
        </h2>
        <p className="mt-2 text-sm text-bone-muted">
          No word from the realm yet. Trending posts and market movement appear
          here once the feed is live.
        </p>
      </div>
    </aside>
  );
}
