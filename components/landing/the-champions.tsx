"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { champions } from "@/lib/game/champions";

/*
  The Champions. Real roster data from lib/game/champions. We only render
  champions whose art field is set (each maps to a file under
  public/game/champions), so no broken frames.
*/

const featuredSlugs = [
  "kaelen-dragonborn",
  "aeron-the-black",
  "the-faceless",
  "mira-stormborn",
  "isolde-the-pure",
  "vorian-nightblade",
  "morrigan-shadowmist",
  "ser-willas",
];

const bySlug = new Map(champions.map((c) => [c.slug, c]));
const featured = featuredSlugs
  .map((s) => bySlug.get(s))
  .filter((c): c is (typeof champions)[number] => Boolean(c && c.art));

/* Rough ceilings across the roster, used to normalize the stat bars. */
const MAX = { attack: 3800, defense: 1600, health: 14000, speed: 500 };

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 shrink-0 text-[8px] uppercase tracking-[0.12em] text-bone-faint">
        {label}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-void">
        <div className="gold-metal h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TheChampions() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={container}
      className="glass overflow-hidden p-7 sm:p-9"
    >
      <motion.div
        variants={rise}
        className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold"
      >
        <Icon name="swords" className="h-4 w-4" />
        The Champions
      </motion.div>
      <motion.h2
        variants={rise}
        className="mt-3 font-display text-2xl font-semibold text-bone sm:text-3xl"
      >
        Sixty heroes. Six Houses. One banner to carry.
      </motion.h2>
      <motion.p
        variants={rise}
        className="mt-3 max-w-prose text-[15px] leading-relaxed text-bone-mut"
      >
        Collect champions across the rarities, arm them from a legendary arsenal,
        and lead them into The War yourself. Each carries a passive, an ultimate,
        and a story worth quoting.
      </motion.p>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {featured.map((c) => (
          <motion.div key={c.slug} variants={rise}>
            <Link
              href="/war/champions"
              className={`rarity-${c.rarity} rarity-frame group block overflow-hidden rounded-2xl bg-panel`}
            >
              <div className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.art}
                  alt={c.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/10 to-transparent" />
                <span className={`rarity-${c.rarity} rarity-chip absolute left-2 top-2`}>
                  {c.rarity}
                </span>
              </div>
              <div className="p-3">
                <p className="truncate font-display text-sm font-semibold text-bone">
                  {c.name}
                </p>
                <p className="truncate text-[10px] text-bone-faint">{c.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-gold">
                  <Icon name="swords" className="h-3 w-3" />
                  {c.weapon}
                </p>
                <div className="mt-2.5 flex flex-col gap-1 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                  <StatBar label="ATK" value={c.stats.attack} max={MAX.attack} />
                  <StatBar label="DEF" value={c.stats.defense} max={MAX.defense} />
                  <StatBar label="HP" value={c.stats.health} max={MAX.health} />
                  <StatBar label="SPD" value={c.stats.speed} max={MAX.speed} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div variants={rise}>
        <Link
          href="/war/champions"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold transition hover:text-gold-bright"
        >
          Muster the full roster
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </motion.div>
    </motion.section>
  );
}
