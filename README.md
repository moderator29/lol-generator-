# Solhaven

**Home, illuminated.**

Solhaven is a next-generation American real estate platform, a premium home
discovery experience designed to feel like a modern technology product, not a
traditional listings site.

This repository contains the full front-end prototype: brand identity, design
system, and four production-ready page experiences built with zero runtime
dependencies. Every listing, image, contact detail, and social link is an
intentional placeholder, structured so live production data can be dropped in
without redesign.

## Pages

| Page | File | Description |
| --- | --- | --- |
| Landing | `index.html` | Hero, search, 30 featured listings, communities, trust, testimonials, stats, FAQ |
| Search | `search.html` | Advanced filtering, sorting, map panel, mobile filter drawer |
| Property | `property.html?id=…` | Swipeable 10-slot gallery, full detail sections, mortgage estimator, similar homes |
| Dashboard | `dashboard.html` | Buyer, seller, agent, and admin workspaces |

## Running locally

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
index.html  search.html  property.html  dashboard.html
assets/
  css/main.css       , design system + page styles
  js/data.js         , 30 placeholder listings (swap for API/database)
  js/app.js          , shared runtime: theme, nav, favorites, cards, quick view
  js/home.js  search.js  property.js  dashboard.js
  img/favicon.svg    , brand mark
docs/
  BRAND.md           , name, story, voice, logo system
  RESEARCH.md        , principles extracted from the market
  DESIGN-SYSTEM.md   , tokens, components, motion, states
  ARCHITECTURE.md    , recommended production stack, security, performance
```

## Replacing placeholders with production data

- **Listings**, `assets/js/data.js` exports `PROPERTIES`; replace with API
  responses of the same shape.
- **Photos**, gallery and cards render elegant placeholder tiles wherever an
  `images` array is absent; supply URLs to light them up.
- **Contact & social**, footer and contact blocks render labeled empty slots;
  fill the `CONTACT` map in `assets/js/app.js` after launch.
- **Maps**, map panels are bordered placeholder canvases sized for a real
  provider (MapLibre/Mapbox) drop-in.
