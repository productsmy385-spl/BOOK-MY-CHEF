# Implementation tracker

Status of the Enterprise Edition upgrade. Updated 2026-11-24.
Legend: **Done** = implemented and verified by tests; **Partial** = works but has stated gaps; **Not started**.

> Older `*_AUDIT.md`, `*_REPORT.md` and `EL100_*.md` files (now in `docs/archive/legacy-reports-2026-11-22/`) were written by
> earlier tooling and do not describe the code accurately (for example, they report a working
> build and real OTP authentication when the backend did not compile and tokens were never
> verified). Treat this file and the code as the source of truth.

## Audit findings (before this upgrade)

| Area | Finding |
|---|---|
| Build | Backend did not compile (`BookingStatus.CANCELLED` did not exist). |
| Migrations | V5 failed on every database (CHECK and primary-key violations), so no environment could start after commit `0b075e8`. |
| Auth | Clerk JWT signatures were never verified; `/auth/sync` trusted a `clerkId` from the request body; a spoofable `X-Mock-User-Id` header authenticated as any user; accounts were linked by unverified email/phone; webhook signatures were not checked. The frontend never sent a token, so every signed-in screen ran on a fake local user. |
| Isolation | Most endpoints took `customerId`/`providerId` from the caller and fell back to a hard-coded demo user. |
| Fake data | Ratings, review counts, cuisines, prices and photos were hard-coded by provider name; providers were auto-verified; admin revenue was invented when zero; Razorpay order ids were fabricated; Explore fell back to a hard-coded provider list. |
| Marketplace | Search loaded every provider into memory; Explore had no category filter. |

## Phases

| Phase | Status | Notes |
|---|---|---|
| 1 Audit | Done | See above. |
| 2 Design system | Done | Tokens in `tailwind.config.js` (palette per spec, `#1551A5` navy), type scale and components in `src/index.css`, shared kit in `src/components/ui.jsx`, Lucide icons. |
| 3 Authentication | Done* | Email OTP + password via Clerk (decision of commit `380bf50`), server-side RS256/JWKS verification, role from PostgreSQL only, invite-only admins with bootstrap e-mail, verified Svix webhook, rate limiting. *Needs a real Clerk tenant smoke test (see Open items). |
| 4 Customer experience | Done | Home, Explore (in-page category + drawer filters in the URL), provider profile, dynamic booking form, bookings, favourites, profile + addresses, notifications. |
| 5 Provider experience | Done | Guided onboarding (8 steps), per-category pricing models, services, weekly hours, blocked dates, capacity, portfolio, documents, publish checklist, dashboard with real metrics. |
| 6 Database & API | Done | V6 migration; parameterised SQL; ownership enforced server-side; consistent `ApiResponse` + status codes; pagination. |
| 7 Administrator | Done | Dashboard, provider verification (audited), customers (suspend/reactivate), bookings, finance, team invitations with roles, settings, audit log. |
| 8 Mobile | Partial | Responsive and mobile-first (verified 360–1920 px). Capacitor Android build **not** re-verified; push notifications not implemented. |
| 9 Security | Done | See Audit findings — all fixed; covered by tests below. |
| 10 QA | Done | 18 backend unit tests, 93 API end-to-end checks, 16 Playwright browser tests. |
| 12 Menus & menu cost calculator | Done | V7. Providers manage dishes (course, veg/egg/non-veg/vegan, spice, allergens, photo, price per person, minimum guests, availability) and set menus with "pick N" sections and per-dish surcharges. Customers see the menu on the profile and pick a set menu or build their own in the booking form; the server prices it live (`POST /providers/{id}/estimate`) with the same code as booking creation. Bookings keep a snapshot of the menu. Pricing rule: see `MenuPricing`. Not done: customers saving favourite menus. |
| 13 Event planner | Done | V9. Customers create an event (occasion, date, guests, city, budget); a fixed rule set suggests the services each occasion needs (`EventCatalog`). Bookings can be made for or attached to an event; the event page shows a checklist (to book / requested / booked), a budget tracker from real booking amounts (confirmed, requested, left to spend, over-budget warning), per-service budgets and a timeline. "Planning for" bar carries the event through Explore → profile → booking. Home page: category tiles, "Plan by occasion", "Your events", cuisines, how-it-works. |
| 11 Production readiness | Partial | Config is env-driven with no fallback secrets; nginx security headers. Not deployed or verified on Railway in this session. |

## Booking lifecycle

`PENDING_PROVIDER_CONFIRMATION → (accept) CONFIRMED | PENDING_PAYMENT → CONFIRMED → COMPLETED`,
`→ (quote) QUOTATION_SENT → (customer accepts) CONFIRMED`, plus declined / cancelled / expired.
Transitions are enforced in `BookingStatus` and `BookingService`, recorded in `booking_status_history`,
and notify the other party. Double booking is prevented by a provider row lock plus a capacity check
(verified with a concurrent-accept test). Payment is off by default (`booking.payment_required`).

## Banners, promotions & discovery (2026-11-24, migration V8)

| Capability | Implemented | Tested locally | Real external service | In production |
|---|---|---|---|---|
| Platform campaigns (home, sign-in, register, explore, category; schedule, publish, duplicate, archive, preview) | Yes | Yes | n/a | Deployed 59a7bcf; no campaigns created yet |
| Provider banners with admin approval (draft → pending → approved/rejected/changes requested/paused/expired) | Yes | Yes | n/a | Deployed; none submitted yet |
| Featured / top-rated (≥ `marketplace.top_rated_min_reviews` genuine reviews) / nearby chefs | Yes | Yes | n/a | Deployed; empty until providers publish |
| Banner analytics (impressions/clicks, de-duplicated per visitor per day) | Yes | Yes | n/a | Deployed |
| ImageKit uploads (signed per folder, verified with ImageKit before recording, owner-only delete) | Yes | Against a stand-in ImageKit | Keys on Railway verified 2026-11-25: direct upload, CDN delivery (incl. `tr:w-400`), details and delete all succeed against ImageKit account `Myproduct` | In-app admin upload not yet exercised with a real admin session |
| AI campaign images (OpenAI Images API → ImageKit) | Yes | Against a stand-in API | **Not verified** — no `OPENAI_API_KEY` | Shows "not configured"; manual upload still works |

Railway: set `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` (and optionally `OPENAI_API_KEY`)
on the **book-my-chef-backend** service only. Then upload one image from Admin → Images to verify.

### Initial campaigns (2026-11-25, migration V10)

| Item | Status |
|---|---|
| 7 customer + 7 provider campaigns, stored as `platform_banners` rows (not hardcoded in React) | Done. Images are **licensed Unsplash photographs, not AI-generated** (no image generator or OpenAI key was available); sources in `apps/web/public/banners/SOURCES.md` |
| Image files | `apps/web/public/banners/<slug>-desktop.jpg` (1920×731) and `-mobile.jpg` (1080×1350); `media_assets.storage = 'BUNDLED'` |
| ImageKit | Keys valid (verified 2026-11-25). The 14 seeded banners are still served from the web app until an admin uses Admin → Images → "Copy to ImageKit" on each image; no fake success |
| Placements | Customer: HOME 7, SIGN_IN 3, REGISTER 3, EXPLORE 2, CATEGORY (home chef / caterer / personal chef). Provider: PROVIDER_HOME 7, PROVIDER_SIGN_IN 3, PROVIDER_REGISTER 3 |
| Pages | Customer home (carousel, featured, top-rated, nearby, popular catering, provider offers); customer + partner sign-in/register (desktop split screen, compact banner above the form on phones, hidden during OTP); provider dashboard (carousel + 6 "Grow your business" cards linking to setup/profile, promotions, calendar, verification, bookings, performance) |
| Admin | Audience filter, publish/unpublish, ▲/▼ reorder (priority), replace image, edit, schedule, delete (any non-published), desktop/mobile preview |
| Schema | V10: `media_assets.owner_user_id` nullable for BUNDLED only; storage `IMAGEKIT`/`BUNDLED`; `platform_banners.placements` widened to `varchar(32)[]` |
| Visual check | `node e2e/support/banner-visual-check.mjs` — all placements at 1440 and 390 px, every banner image loads, no horizontal overflow |

## Test evidence

| Suite | Command | Result |
|---|---|---|
| Backend unit | `cd apps/backend && mvn test` | 27 passed (6 menu pricing, 3 event rules) |
| Menu API scenarios | `cd apps/web && node e2e/support/menu-scenarios.mjs` (stack as in `e2e/README.md`) | 36 passed |
| Event planner API scenarios | `cd apps/web && node e2e/support/events-scenarios.mjs` | 26 passed |
| Promotion API scenarios | `cd apps/web && node e2e/promotions-scenarios.mjs` | 61 passed |
| API end-to-end | `cd apps/web && npm run test:api` (auth, isolation, filters, lifecycle, race, admin) | 93 passed |
| Browser | `cd apps/web && npm run test:e2e` (marketplace, menus, promotions incl. Bartender filter regression, events, 360–1920 px) | 33 passed (2026-11-25, with V10 banners) |
| Banner visual check | `cd apps/web && node e2e/support/banner-visual-check.mjs` | 14 page/viewport combinations, all images loaded (2026-11-25) |

## Open items

1. Smoke-test sign-up/sign-in against the real Clerk tenant (local tests use a stand-in issuer).
2. Configure Railway env vars from `.env.example`; set `BOOTSTRAP_ADMIN_EMAILS` once, then remove.
3. Rebuild and run the Capacitor Android app. Note: the Gradle wrapper was changed to 9.7.1 outside this work (IDE); confirm compatibility with the Android Gradle Plugin before building.
4. Not implemented: chat/messages, disputes UI, refunds, push notifications, admin editing of the category/cuisine catalog, map/geocoded address search (location uses device GPS or city/area text).
5. Frontend stays JavaScript (JSX); TypeScript migration was not done.
6. ImageKit keys are valid (2026-11-25). Still to do: one admin upload through the app, and "Copy to ImageKit" for the seeded banners. AI images need an `OPENAI_API_KEY` (not set).
7. Production still holds three non-Clerk test accounts (`user_guest_*`, `test_verify_live_*`) and their one booking; they are hidden but should be removed by a new migration (not by editing V6, which is applied).
