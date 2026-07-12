# Phase 10 — Design System

Implemented in `assets/css/main.css` as custom properties + component classes.
Light and dark themes ship from day one; the toggle persists and respects
`prefers-color-scheme` by default.

## Tokens

- **Color:** see BRAND.md palette. All pairs meet WCAG AA (4.5:1 body text).
- **Type scale:** 12–64 px, display serif (Fraunces) for headlines and
  prices, Inter for UI. Tabular numerals on all data.
- **Spacing:** 4 px base — 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
- **Radius:** 10 (controls) / 14 (inputs) / 18 (cards) / 28 (heroes, sheets).
- **Shadows:** two elevations, warm-tinted, subtle: `--shadow-1` rest,
  `--shadow-2` hover/overlay.
- **Motion:** 200–500 ms, `cubic-bezier(0.22, 1, 0.36, 1)`; every animation
  disabled under `prefers-reduced-motion`.
- **Breakpoints:** 640 / 900 / 1200 px, mobile-first.

## Components

| Component | Class | Notes |
| --- | --- | --- |
| Buttons | `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-icon` | 44 px min touch target |
| Inputs | `.field`, `.field input/select` | Floating-quiet labels, visible focus ring |
| Cards | `.card`, `.property-card` | Hover lift, image placeholder art |
| Navigation | `.nav`, `.nav-links`, mobile sheet | Glass on scroll |
| Dropdowns | native `select` styled + `.menu` | Keyboard-safe |
| Tables | `.table` | Row hover, tabular numbers |
| Forms | `.form-grid` | 2-col desktop, 1-col mobile |
| Badges | `.badge`, status variants | For Sale / New / Open House / Pending / Price Cut |
| Skeletons | `.skeleton` | Shimmer honoring reduced motion |
| Loading | `.loader` | Brand mark: sun rises in the arch |
| Empty state | `.empty` | Icon + guidance + action |
| Error state | `.notice-error` | Never blame the user |
| Glass | `.glass` | `backdrop-filter` with solid fallback |
| Map | `.map-panel` | Placeholder canvas with pins, ready for MapLibre |
| Charts | `.bars` | CSS bar chart for dashboards |
| Toast | `.toast` | Polite `aria-live` |
| Modal / Drawer | `.modal`, `.drawer` | Focus-trapped, Esc to close |

## States & content rules

- Every async surface has skeleton → content → empty → error designed.
- Placeholder photography tiles use curated dusk/sage/sand gradients with a
  line-art home mark — composed, never "broken image".
- Contact/social slots render as labeled quiet dashes until launch data
  exists (Phase 9).

## Accessibility

Semantic landmarks, skip link, focus-visible rings everywhere, gallery and
drawer keyboard support, `aria-live` for async results, form labels always
visible, color never the sole signal.
