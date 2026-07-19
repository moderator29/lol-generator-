# RAVENSPIRE

See every chain. Fear no rug. Rule your realm.

Ravenspire is a fun-first SocialFi realm: a crypto-native social network where
creators and their Houses build reputation, post, banter, duel, go live, play,
and earn, with on-chain intelligence as the superpower under the hood, never
the headline.

## What lives here

- The Ravenry (feed): ravens, Calls sealed against live prices and judged by
  real data, cashtag price cards, threads, re-ravens.
- Whispers: private direct messages between members of the realm.
- Keeps (profiles): earned crests, Renown tiers, and verified Call records.
- Houses: six banners, standings, halls, and rivalry.
- Claim the Throne: the Season game of quests, duels of wit, and Glory. The
  top House claims the Throne when the Season closes.
- The War: Battle for the Realm, a real-time battle RPG with sixty champions,
  a legendary arsenal, and server-authoritative rewards.
- @raven: the Herald. Witty, regal, and answers anything over real data only.
- The Tools: the Ledger (portfolio), the Watch (safety), the Scrying Glass
  (smart money), the Vault (non-custodial wallet), and the Forge (staking).
- The Chronicle, the crest ladder, and the Chapters ahead.

## The landing

`app/page.tsx` is the public gate. It opens on the hero and the "Enter the
Realm" call to action, then reveals a set of cinematic, motion-rich sections
that show the platform: a four-room platform preview (the Ravenry, Whispers,
Houses, and a Keep), the Champions gallery drawn from real roster data, the
two Games, a Meet @raven panel, and the Tools grid. Section components live in
`components/landing/`. Motion is Framer Motion, using in-view reveals,
staggered children, and subtle parallax.

## Stack

- Next.js 16 (App Router) with TypeScript in strict mode.
- Tailwind CSS v4, with brand tokens and helper classes in `app/globals.css`.
- Framer Motion for cinematic reveals and ambient motion.
- Supabase (Postgres, RLS, realtime) as the Archives.
- Privy for non-custodial embedded wallets and X, email, and wallet auth.
- Anthropic for the Raven's mind (see `lib/ai/raven.ts` and
  `lib/ai/raven-voice.ts`).
- Live market data from keyless public sources, cached server-side.

## Principles

- Real data only. Honest empty states, never fabricated numbers.
- Non-custodial only. Keys are the user's, exportable, never held by us.
- Reputation is earned, never bought. No keys, no tickets, no NFTs.
- No presale, ever, anywhere on the platform.
- Fun first. It is a place to live in, not a terminal.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev
```

`npm run typecheck` and `npm run build` must stay green before every push.

## Design system

Brand v3, "Obsidian and Gold, cinematic metal": deep obsidian surfaces, forged
gold gradients, ember firelight, bone text, steel hairlines, and glass
containers. No green, no emoji chrome, no flat gold. Icons come from the
project Icon component. Tokens live in `app/globals.css`.

See `docs/PLATFORM.md` for a fuller tour of the platform and its architecture.

<!-- deploy: ravenspire on Next.js, build from latest main -->
<!-- build trigger 97e5773 -->
<!-- fresh build 1784487178 -->
