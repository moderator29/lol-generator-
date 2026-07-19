"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RavenMark } from "@/components/brand/raven-mark";
import { CrestRoundel, crests } from "@/components/brand/crests";
import { Icon } from "@/components/ui/icon";

const chips = [
  { label: "The Ravenry", href: "/home" },
  { label: "Claim the Throne", href: "/throne" },
  { label: "The War", href: "/war" },
  { label: "Ask @raven", href: "/raven" },
  { label: "The Vault", href: "/vault" },
];

/* Fixed positions for the ten drifting crests (percent based, no randomness). */
const floatSpots = [
  { top: "8%", left: "6%", size: 72, delay: 0 },
  { top: "18%", left: "86%", size: 88, delay: 2 },
  { top: "40%", left: "3%", size: 60, delay: 4 },
  { top: "62%", left: "90%", size: 66, delay: 1 },
  { top: "76%", left: "12%", size: 84, delay: 3 },
  { top: "6%", left: "44%", size: 52, delay: 5 },
  { top: "84%", left: "58%", size: 58, delay: 2.5 },
  { top: "30%", left: "70%", size: 54, delay: 6 },
  { top: "55%", left: "30%", size: 48, delay: 7 },
  { top: "12%", left: "22%", size: 56, delay: 8 },
];

const sections = [
  {
    kicker: "A realm, not a terminal",
    title: "A social realm you will love to live in",
    body: "Ravenspire is fun first. Post, banter, duel, go live, build your name. Creators and their Houses are the heart of everything. The chains and charts serve the story, never the other way round.",
    icon: "home",
    href: "/home",
    cta: "Enter the Ravenry",
  },
  {
    kicker: "Two games at launch",
    title: "Claim the Throne. Then win The War.",
    body: "Swear to a House and earn Glory through quests, duels of wit and streaks; each Season the top House claims the Throne. Then take the field in The War, a real-time battle for the realm with champions, legendary arms and massive battlefields.",
    icon: "swords",
    href: "/war",
    cta: "See The War",
  },
  {
    kicker: "The Herald of the realm",
    title: "@raven answers everything",
    body: "Tag @raven in any raven or whisper. It settles debates, narrates the Season, reads any token or wallet over real data, and does it all in a voice you will quote. Helpful first, flavor always.",
    icon: "raven",
    href: "/raven",
    cta: "Summon the Raven",
  },
  {
    kicker: "Create to earn",
    title: "Build a name. Get paid for it.",
    body: "Real actions earn points: ravens that move the realm, verified Calls, courts you host, newcomers you welcome. At Season's end, points convert to $RAVEN you claim straight to your own wallet. Earned, never bought.",
    icon: "medal",
    href: "/renown",
    cta: "How Renown works",
  },
  {
    kicker: "Non-custodial, always",
    title: "Your keys. Your vault. Your realm.",
    body: "A wallet is created for you on sign-up and it is truly yours: export your keys any time and take them anywhere. We never hold funds, and every action is signed by you.",
    icon: "shield",
    href: "/chronicle",
    cta: "Read the Chronicle",
  },
];

export default function Landing() {
  return (
    <main className="realm-bg relative min-h-screen overflow-hidden">
      {/* Aurora crest field */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {floatSpots.map((s, i) => (
          <div
            key={i}
            className="aurora-item absolute opacity-40"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s, ${s.delay * 0.7}s`,
            }}
          >
            <CrestRoundel icon={crests[i].icon} dim className="h-full w-full" />
          </div>
        ))}
      </div>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass glass-sm px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold"
        >
          The realm awakens · Season I
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="mt-8"
        >
          <RavenMark className="h-20 w-20 sm:h-24 sm:w-24" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="gold-text mt-6 font-display text-5xl font-semibold tracking-[0.12em] sm:text-7xl"
        >
          RAVENSPIRE
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-5 max-w-xl text-base text-bone-mut sm:text-lg"
        >
          See every chain. Fear no rug.{" "}
          <span className="font-semibold text-gold">Rule your realm.</span>
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/signin" className="btn-gold px-7 py-3 text-sm">
            Enter the Realm
          </Link>
          <Link
            href="/chronicle"
            className="text-sm font-medium text-bone-mut transition hover:text-bone"
          >
            Read the Chronicle
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="mt-10 flex max-w-full flex-wrap items-center justify-center gap-2 px-2"
        >
          {chips.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="btn-glass px-3.5 py-1.5 text-xs text-bone-mut"
            >
              {c.label}
            </Link>
          ))}
        </motion.div>
      </section>

      {/* Story sections */}
      <div className="relative mx-auto max-w-3xl space-y-6 px-4 pb-16">
        {sections.map((s, i) => (
          <motion.section
            key={s.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.05 * i }}
            className="glass glass-hover p-7 sm:p-9"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
              <Icon name={s.icon} className="h-4 w-4" />
              {s.kicker}
            </div>
            <h2 className="mt-3 font-display text-2xl font-semibold text-bone sm:text-3xl">
              {s.title}
            </h2>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-bone-mut">
              {s.body}
            </p>
            <Link
              href={s.href}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold transition hover:text-gold-bright"
            >
              {s.cta}
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </motion.section>
        ))}

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="glass p-9 text-center"
        >
          <RavenMark className="mx-auto h-12 w-12" />
          <h2 className="gold-text mt-4 font-display text-3xl font-semibold">
            The gates are open
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-bone-mut">
            A non-custodial wallet is created for you the moment you enter. No
            keys held, no seats sold, nothing bought that must be earned.
          </p>
          <Link
            href="/signin"
            className="btn-gold mt-6 inline-flex px-8 py-3 text-sm"
          >
            Enter the Realm
          </Link>
        </motion.section>

        <footer className="flex flex-col items-center gap-2 pb-6 pt-8 text-center text-xs text-bone-faint">
          <p>Ravenspire. The realm remembers.</p>
          <p>Non-custodial by design. Reputation is earned, never bought.</p>
        </footer>
      </div>
    </main>
  );
}
