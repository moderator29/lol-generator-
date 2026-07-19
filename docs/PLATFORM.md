# The Platform

A tour of Ravenspire: what it is, how it is built, and the vows it holds to.

Ravenspire is a fun-first SocialFi realm. It is a social network first and a
crypto toolkit second. Creators and their Houses are the heart of everything.
The chains and charts serve the story, never the other way round.

## The rooms of the realm

### The Ravenry (feed)

The public square. Members post ravens, seal Calls against live prices, share
cashtag price cards, and reply in threads. A Call is a public, timestamped
market read a member puts their name to. It is scored against real on-chain
data over time, so a strong record is proof of skill rather than noise.

### Whispers

Private direct messages between members. Plot, banter, and arrange duels away
from the feed.

### Keeps (profiles)

A member's hall. A Keep shows earned crests, a Renown tier, a House allegiance,
and a verified record of Calls and duels. Nothing here is bought.

### Houses

Six banners: Corvane, Emberfall, Frosthold, Stormcrest, Nightvale, and
Goldmane. Swear to one, earn Glory through quests, duels, and streaks, and lift
the whole House. Each Season the leading House claims the Throne.

### The Games

- Claim the Throne is the Season game. Quests, duels of wit judged by the
  realm, and streaks earn Glory for a member and their House.
- The War is Battle for the Realm, a real-time battle RPG. Muster champions
  across five rarities, arm them from a legendary arsenal, and lead the charge
  across sprawling battlefields. Roster data lives in `lib/game/champions.ts`,
  and champion art lives under `public/game/champions/`.

### @raven, the Herald

@raven is the resident intelligence of the realm. Tag it in any raven or
whisper and it answers: settling debates, narrating the Season, and reading any
token or wallet over real data. It is helpful first and flavorful always, and
it never invents a price or a statistic. The voice and rules live in
`lib/ai/raven-voice.ts`; the model call lives in `lib/ai/raven.ts`.

### The Tools

Five serious surfaces sit quietly under the play:

- The Ledger: portfolio and profit across chains, from real on-chain data.
- The Watch: safety scans for rugs, hidden mints, and honeypots.
- The Scrying Glass: smart-money tracking, live from the markets.
- The Vault: the member's non-custodial wallet, keys always exportable.
- The Forge: staking for real yield from protocol fees, never emissions.

## Reputation and rewards

Real actions earn points: ravens that move the realm, verified Calls, courts a
member hosts, and newcomers they welcome. At the Season's end, points convert
to $RAVEN claimed straight to the member's own wallet. Earned, never bought.
The crest ladder in `components/brand/crests.tsx` marks standing, from Took the
Black through Champion of the Season.

## Architecture

- Next.js 16 with the App Router and TypeScript in strict mode. This build
  tracks the installed Next.js closely; consult the guides bundled under
  `node_modules/next/dist/docs/` before adding framework code.
- Tailwind CSS v4. Brand tokens and helper classes (`.glass`, `.btn-gold`,
  `.gold-metal`, `.realm-bg`, the rarity ladder, and the aurora and ember
  animations) live in `app/globals.css`.
- Framer Motion drives the cinematic reveals and ambient motion.
- Supabase (Postgres with row-level security and realtime) is the Archives:
  identities, ravens, Houses, duels, quests, and the Glory economy.
- Privy provides non-custodial embedded wallets and X, email, and wallet auth.
  The platform never holds keys and cannot move a member's funds.
- Anthropic powers @raven, always reading from real, verified context.
- Live market data is pulled from keyless public sources and cached
  server-side.

## The landing page

`app/page.tsx` is the public gate. It keeps the hero and the "Enter the Realm"
entry, then reveals cinematic sections that show the platform: a platform
preview of the four rooms, the Champions gallery, the two Games, a Meet @raven
panel, and the Tools grid, before the closing call to action and footer.
Section components live in `components/landing/`. The footer links the Privacy
Policy at `/legal/privacy` and the Terms of Service at `/legal/terms`.

## The vows

- Real data only. Honest empty states, never fabricated numbers.
- Non-custodial only. Keys are the member's, exportable, never held by us.
- Reputation is earned, never bought.
- No presale, ever, anywhere on the platform.
- Fun first. A realm to live in, not a terminal.

## Risk and legal disclaimer

Ravenspire is a fun-first social platform. $RAVEN is a utility and social token
that powers the realm, not an investment. Nothing on the platform is financial
advice, and no one at Ravenspire will ever tell anyone to buy, sell, or hold.
There is no presale, anywhere, at any time. Crypto carries real risk, including
the loss of everything a member puts in, so members should bring only what they
can afford to lose. The realm is non-custodial by design: members hold their
own keys, the keys are always exportable, and the platform never takes custody
of anyone's funds. The Terms of Service live at `/legal/terms` and the Privacy
Policy at `/legal/privacy`.

## Brand

Brand v3, "Obsidian and Gold, cinematic metal": deep obsidian surfaces, forged
gold gradients, ember firelight, bone text, steel hairlines, and glass
containers. No green, no emoji chrome, no flat gold. Icons come from the
project Icon component in `components/ui/icon.tsx`.
