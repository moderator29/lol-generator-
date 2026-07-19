"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Icon } from "@/components/ui/icon";

/*
  The Tools. The five serious surfaces under the play, drawn from lib/nav
  (toolsNav + the Vault from accountNav). Icons are the project's own.
*/

const tools = [
  {
    icon: "book",
    name: "The Ledger",
    plain: "Portfolio",
    href: "/ledger",
    desc: "Net worth and profit across chains, read from real on-chain data only, never a fabricated figure.",
  },
  {
    icon: "shield",
    name: "The Watch",
    plain: "Safety",
    href: "/watch",
    desc: "Scans any token for rugs, hidden mints and honeypots before you ever touch it.",
  },
  {
    icon: "eye",
    name: "The Scrying Glass",
    plain: "Smart money",
    href: "/scrying",
    desc: "See what the great wallets are watching, live from the markets as it moves.",
  },
  {
    icon: "wallet",
    name: "The Vault",
    plain: "Wallet",
    href: "/vault",
    desc: "Your non-custodial wallet, created on sign-up and truly yours. Export the keys any time.",
  },
  {
    icon: "flame",
    name: "The Forge",
    plain: "Staking",
    href: "/forge",
    desc: "Swear an oath and earn real yield from protocol fees, never from empty emissions.",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function TheTools() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={container}
      className="glass p-7 sm:p-9"
    >
      <motion.div
        variants={rise}
        className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold"
      >
        <Icon name="shield" className="h-4 w-4" />
        The Tools
      </motion.div>
      <motion.h2
        variants={rise}
        className="mt-3 font-display text-2xl font-semibold text-bone sm:text-3xl"
      >
        The realm is fun. The tools are serious.
      </motion.h2>
      <motion.p
        variants={rise}
        className="mt-3 max-w-prose text-[15px] leading-relaxed text-bone-mut"
      >
        Five instruments sit quietly under the play, each reading real data and
        signed by you alone.
      </motion.p>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <motion.div key={t.name} variants={rise}>
            <Link
              href={t.href}
              className="glass-sm glass-hover flex h-full items-start gap-3 rounded-2xl border border-steel-line bg-panel p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-void text-gold">
                <Icon name={t.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-bone">
                  {t.name}
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-bone-faint">
                    {t.plain}
                  </span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-bone-mut">{t.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
