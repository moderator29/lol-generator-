"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RavenMark } from "@/components/brand/raven-mark";
import { CrestRoundel, crests } from "@/components/brand/crests";
import { Icon } from "@/components/ui/icon";
import { comingSoonNav } from "@/lib/nav";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { PlatformPreview } from "@/components/landing/platform-preview";
import { TheChampions } from "@/components/landing/the-champions";
import { TheGames } from "@/components/landing/the-games";
import { MeetRaven } from "@/components/landing/meet-raven";
import { TheTools } from "@/components/landing/the-tools";
import { SiteFooter } from "@/components/landing/site-footer";

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

const faqs = [
  {
    q: "What is Ravenspire?",
    a: "A social realm first, a crypto tool second. You post, banter, duel with wit, swear to a House and play The War. The chains and charts serve the story, never the other way round.",
  },
  {
    q: "Is it non-custodial?",
    a: "Yes. A wallet is created for you the moment you sign up and it is truly yours. Export your keys any time and take them anywhere. We never hold your funds, and every action is signed by you.",
  },
  {
    q: "How do I earn?",
    a: "Real actions earn points: ravens that move the realm, verified Calls, courts you host, newcomers you welcome. At Season's end, points convert to $RAVEN you claim straight to your own wallet. Earned, never bought.",
  },
  {
    q: "What is a Call?",
    a: "A Call is a public, timestamped market read you put your name to. It is scored against real on-chain data over time, so a good record is proof of skill, not noise.",
  },
  {
    q: "Do I need crypto to play?",
    a: "No. You can sign in, post, banter, join a House and play The War without ever touching a token. The wallet waits quietly until you choose to use it.",
  },
  {
    q: "What are Houses?",
    a: "Houses are the teams of the realm. Swear to one, earn Glory through quests, duels and streaks, and each Season the leading House claims the Throne. Your standing lifts the whole House.",
  },
];

const trustPoints = [
  {
    icon: "shield",
    title: "Non-custodial by design",
    body: "Your keys, your vault, always exportable. We never hold funds and cannot move them.",
  },
  {
    icon: "medal",
    title: "Reputation earned, never bought",
    body: "No pay to win, no bought crests. Standing comes from showing up and being good.",
  },
  {
    icon: "eye",
    title: "Real data only",
    body: "Every number you see is read from the chain or the markets. We never invent figures.",
  },
  {
    icon: "heart",
    title: "Fun first",
    body: "A realm you will want to live in. The serious tools sit quietly under the play.",
  },
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
  const { authenticated } = useRealmAuth();
  const ctaHref = authenticated ? "/home" : "/signin";
  const ctaLabel = authenticated ? "Enter the Ravenry" : "Enter the Realm";
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
          <Link href={ctaHref} className="btn-gold px-7 py-3 text-sm">
            {ctaLabel}
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

        {/* Platform preview: the four rooms of the realm */}
        <PlatformPreview />

        {/* The Champions gallery, from real roster data */}
        <TheChampions />

        {/* The Games: Claim the Throne + The War */}
        <TheGames />

        {/* Meet @raven, the Herald */}
        <MeetRaven />

        {/* The Tools: the five serious surfaces */}
        <TheTools />

        {/* The Chapters ahead */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="glass p-7 sm:p-9"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            <Icon name="scroll" className="h-4 w-4" />
            The Chapters ahead
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold text-bone sm:text-3xl">
            The map, not a finished castle
          </h2>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-bone-mut">
            The Forge stands at the gates today. These chapters follow, in
            rough order. Intentions, not oaths, and we will say so plainly when
            they shift.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {comingSoonNav.map((c) => (
              <div
                key={c.slug}
                className="glass-sm flex items-start gap-3 rounded-2xl border border-steel-line bg-panel p-4"
              >
                <Icon name={c.icon} className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-display text-sm font-semibold text-bone">
                    {c.themed}
                    <span className="rounded-full border border-gold/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold/70">
                      Soon
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-bone-mut">
                    {c.blurb}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* The crests you can earn */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="glass p-7 text-center sm:p-9"
        >
          <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            <Icon name="medal" className="h-4 w-4" />
            Earned, never bought
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold text-bone sm:text-3xl">
            Ten crests to prove your standing
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {crests.map((c) => (
              <span key={c.slug} title={`${c.name}: ${c.plain}`}>
                <CrestRoundel
                  icon={c.icon}
                  dim={c.status === "locked"}
                  className="h-12 w-12"
                />
              </span>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-md text-sm text-bone-mut">
            Three live at launch, seven on the roadmap. No collectibles, no
            purchase, no shortcut. You earn them by showing up and being good.
          </p>
        </motion.section>

        {/* Why the realm - trust row */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="glass p-7 sm:p-9"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            <Icon name="shield" className="h-4 w-4" />
            Why the realm
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold text-bone sm:text-3xl">
            Four vows we build on
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trustPoints.map((t) => (
              <div
                key={t.title}
                className="glass-sm flex items-start gap-3 rounded-2xl border border-steel-line bg-panel p-4"
              >
                <div className="glass-sm flex h-10 w-10 shrink-0 items-center justify-center text-gold">
                  <Icon name={t.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-bone">
                    {t.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-bone-mut">
                    {t.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* The realm answers - FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="glass p-7 sm:p-9"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            <Icon name="scroll" className="h-4 w-4" />
            The realm answers
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold text-bone sm:text-3xl">
            Questions before you enter
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group glass-sm rounded-2xl border border-steel-line bg-panel px-4 py-3.5 [&_summary]:list-none"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="font-display text-sm font-semibold text-bone">
                    {f.q}
                  </span>
                  <Icon
                    name="plus"
                    className="h-4 w-4 shrink-0 text-gold transition-transform duration-200 group-open:rotate-45"
                  />
                </summary>
                <p className="mt-3 text-[13px] leading-relaxed text-bone-mut">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </motion.section>

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

        <SiteFooter />
      </div>
    </main>
  );
}
