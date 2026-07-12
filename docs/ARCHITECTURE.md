# Phases 11–13 — Production Architecture, Performance & Security

The prototype in this repo is dependency-free by design. This document is the
recommended production stack once real data, auth, and scale arrive.

## Tech stack (Phase 11)

| Layer | Choice | Why it is the strongest option |
| --- | --- | --- |
| Frontend | **Next.js (React, App Router)** | Hybrid SSG/SSR/ISR fits real estate exactly: static marketing pages, incrementally regenerated listing pages, server components for data-heavy detail views. Largest hiring pool, first-class Vercel deployment. |
| Backend | **Next.js route handlers + a Go or Node service for heavy work** | Keep CRUD close to the frontend; isolate search indexing, image processing, and feeds (MLS/RESO Web API sync) in a queue-driven service. |
| Auth | **Auth.js or Clerk** | Email + OAuth + magic links out of the box, session security handled by specialists, SOC 2 available (Clerk) for enterprise agent accounts. |
| Database | **PostgreSQL (managed: Supabase or Neon)** | Relational integrity for listings/offers/users, PostGIS for geo queries (radius, polygon draw-to-search), row-level security for multi-tenant agent data. |
| Search | **Typesense (or Meilisearch)** | Sub-50 ms faceted search with geo-filtering and typo tolerance at a fraction of Elasticsearch's operational cost. |
| Image storage | **S3-compatible object storage + Cloudflare Images/imgix** | Originals in S3, on-the-fly AVIF/WebP variants at the edge; listing photos are the platform's heaviest asset. |
| Maps | **MapLibre GL + Protomaps or Mapbox** | Vector tiles, clustering, draw-to-search; MapLibre keeps costs predictable at scale. |
| Hosting | **Vercel (frontend) + Fly.io/AWS (services)** | Edge network for pages, regional compute near the database for services. |
| CDN | **Cloudflare** | Edge caching, image resizing, WAF, and bot management in one layer. |
| Caching | **Redis (Upstash)** | Session data, rate-limit counters, hot search results, ISR tag invalidation. |
| Email | **Resend + React Email** | Deliverability plus templates in the same component language as the app. |
| Notifications | **Web Push + Twilio SMS** | Saved-search alerts are the platform's strongest retention loop; SMS for tour confirmations. |
| Analytics | **PostHog** | Product analytics, funnels, session replay, and feature flags — self-hostable if data residency demands it. |
| Monitoring | **Sentry + OpenTelemetry → Grafana** | Error tracking with release health; traces across web → API → search. |
| Testing | **Vitest + Playwright + axe-core** | Unit, end-to-end, and automated accessibility in CI. |
| CI/CD | **GitHub Actions** | Preview deploys per PR, migration gates, Lighthouse CI budgets enforced on every merge. |

## Performance (Phase 12)

- **Budgets enforced in CI:** LCP < 2.0 s (4G), CLS < 0.05, INP < 200 ms,
  JS < 170 KB gzipped per route.
- Hero and first-row card images are the LCP: preloaded, sized, AVIF with
  WebP fallback; everything below the fold lazy-loads.
- All media rendered with explicit dimensions — zero layout shift.
- Route-level code splitting; maps and galleries hydrate on interaction.
- Fonts: two families, variable, `font-display: swap`, subset to Latin.
- Search results cached at the edge keyed by filter signature.
- The prototype already practices this: system-light payload, no framework,
  content-visibility on long sections, IntersectionObserver-driven effects.

## SEO

- Listing pages server-rendered with `RealEstateListing` JSON-LD, canonical
  URLs, and city/neighborhood landing pages generated from search facets.
- XML sitemaps segmented by state, refreshed on listing change.
- Prototype ships per-page titles, meta descriptions, and Open Graph tags.

## Security (Phase 13)

- **Authentication:** passwordless-first, MFA for agents/admins, session
  rotation, strict SameSite cookies.
- **Authorization:** role-based (buyer / seller / agent / admin) enforced in
  the database via row-level security, not just the API layer.
- **Rate limiting:** Redis token buckets per IP + per account on auth, search,
  and lead-submission endpoints.
- **Encryption:** TLS 1.3 everywhere, AES-256 at rest, KMS-managed keys;
  PII columns encrypted application-side.
- **Uploads:** pre-signed URLs only; server-side MIME sniffing, image
  re-encoding (strips EXIF/GPS — critical for seller privacy), size caps,
  malware scanning before publish.
- **Input validation:** schema validation (Zod) at every boundary;
  parameterized queries only; output encoding by default.
- **Audit logs:** append-only log of listing edits, price changes, role
  grants, and data exports; retained 7 years.
- **Fraud prevention:** listing-claim verification, duplicate-photo detection,
  velocity checks on lead forms, human review queue for first-time listers.
- **Secrets:** cloud secret manager, short-lived credentials, no secrets in
  the repo or build artifacts.
- **Monitoring:** WAF managed rules, anomaly alerts on auth failures and
  scraping patterns, quarterly penetration tests.

## Dashboards (Phase 8) — production notes

The prototype's four dashboards (buyer, seller, agent, admin) are wired to
placeholder data. In production each becomes a role-gated route group sharing
the same shell, with server-fetched data and optimistic UI for saves.
