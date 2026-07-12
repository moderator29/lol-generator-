# Phase 2 & 3 — Brand & Logo System

## Name

**Solhaven** — from *sol* (sun, light) and *haven* (safe harbor, home).

Shortlist considered and rejected: Keystead (too rustic), Northdoor (too
regional), Domara (too abstract), Vantage Homes (generic). Solhaven won for
warmth, memorability, and a clean two-syllable-plus-one cadence that works in
speech, print, and an app icon.

## Domains

- `solhaven.com` (primary target)
- `solhaven.homes`
- `livesolhaven.com`
- `solhaven.us`

## Brand story

Buying a home in America has become a spreadsheet exercise run through
websites that feel like classified ads. Solhaven starts from the opposite
premise: the search for a home is one of the most hopeful things a person
ever does, and the software should feel that way — calm, warm, and honest.

## Mission

Make finding, buying, and selling a home feel effortless, transparent, and
worthy of the moment.

## Vision

To be the most trusted way Americans move — a platform where every number is
honest, every photo is real, and every step is clear.

## Voice

Warm, precise, unhurried. We say "home," not "unit." We give numbers, not
hype. We never use exclamation points in product copy. Short sentences.
Active voice. Confidence without pressure.

## Tagline

**Home, illuminated.**

Alternates: *Find your light.* / *The clear way home.*

## Design philosophy

1. **Light as material.** Warm paper backgrounds, sunrise-brass accents, deep
   ink text. Dark mode is dusk, not black.
2. **Photography leads, chrome recedes.** Interface elements stay quiet so
   homes can speak.
3. **Motion with purpose.** Everything eases; nothing bounces. 200–500 ms,
   `cubic-bezier(0.22, 1, 0.36, 1)`.
4. **Honest by default.** Real numbers, labeled estimates, visible placeholders
   — never fake data pretending to be real.

---

## Logo system

### Mark

A minimal **arch doorway with a rising sun** — home as shelter, dawn as the
new chapter. One continuous geometry, drawn in `currentColor` so it adapts to
any surface, with the sun disc in brand brass.

- **Main logo:** mark + "Solhaven" wordmark in the display serif.
- **App icon / social avatar:** mark alone on a rounded-square brass or ink
  field.
- **Website logo:** horizontal lockup, 28 px mark height in the navbar.
- **Loading animation:** the sun rises inside the arch on a 1.6 s eased loop
  (implemented as the `.loader` component).

SVG-first, stroke-based, legible from 16 px favicon to billboard.

### Color

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| Ink | `#1B2430` | `#EDF1F6` | Text, mark |
| Paper | `#FAF7F2` | `#0E131B` | Background |
| Surface | `#FFFFFF` | `#161D28` | Cards, panels |
| Brass | `#B3833E` | `#D9AE63` | Accent, sun, CTAs |
| Sage | `#5E7263` | `#8FA796` | Success, "open house" |
| Line | `#E8E1D5` | `#26303E` | Borders, dividers |

### Typography

- **Display:** Fraunces (variable serif) — headlines, prices, the wordmark.
- **UI/Body:** Inter — everything else.
- Fallbacks: Georgia / system-ui stacks so the product never blocks on fonts.

Scale: 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64, line-height 1.5 body,
1.1 display. Numeric data uses tabular figures.
