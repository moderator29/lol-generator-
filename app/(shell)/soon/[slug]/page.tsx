import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { comingSoonNav, findComingSoon } from "@/lib/nav";

export function generateStaticParams() {
  return comingSoonNav.map((i) => ({ slug: i.slug }));
}

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findComingSoon(slug);
  if (!item) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <div className="hairline flex h-16 w-16 items-center justify-center rounded-2xl bg-panel text-gold">
        <Icon name={item.icon} className="h-8 w-8" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.3em] text-bone-muted">
        {item.plain} · Coming soon
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-wide text-gold sm:text-4xl">
        {item.themed}
      </h1>
      <p className="mt-4 max-w-md text-bone-muted">{item.blurb}</p>
      <Link
        href="/signin"
        className="mt-8 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-gold-deep"
      >
        Join the realm to get notified
      </Link>
    </div>
  );
}
