# RAVENSPIRE

See every chain. Fear no rug. Rule your realm.

A fun-first SocialFi realm: a crypto-native social network where creators and
their Houses build reputation, post, banter, duel, go live, play, and earn,
with on-chain intelligence as the superpower under the hood, never the
headline.

## What lives here

- The Ravenry (feed): ravens, Calls sealed against live prices and judged by
  real data, cashtag price cards, threads, re-ravens.
- Keeps (profiles) with earned crests, Renown tiers and verified Call records.
- Houses: six banners, standings, halls, rivalry.
- Claim the Throne: the Season game of quests, duels of wit and Glory.
- The War: Battle for the Realm, a real-time battle with champions, a
  legendary arsenal and server-authoritative rewards.
- @raven: the Herald. Witty, regal, answers anything over real data only.
- The tools: the Ledger (portfolio), the Watch (safety), the Scrying Glass
  (smart money), the Vault (non-custodial wallet), the Forge (staking).
- The admin council chamber, the Chronicle, and the Chapters ahead.

## Stack

Next.js (App Router) + TypeScript + Tailwind v4 + Framer Motion. Supabase
(Postgres, RLS, realtime) as the Archives. Privy for non-custodial embedded
wallets and X / email / wallet auth. Anthropic for the Raven's mind. Live
market data from keyless public sources, cached server-side.

## Principles

- Real data only. Honest empty states, never fabricated numbers.
- Non-custodial only. Keys are the user's, exportable, never held by us.
- Reputation is earned, never bought. No keys/tickets, no NFTs.
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

Brand v3 "Obsidian & Gold, cinematic metal": deep obsidian surfaces, forged
gold gradients, ember firelight, bone text, steel hairlines, glass containers.
No green, no emoji chrome, no flat gold. Tokens live in `app/globals.css`.
