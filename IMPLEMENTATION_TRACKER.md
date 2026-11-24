# Implementation tracker

Status of the Enterprise Edition upgrade. Updated 2026-11-24.
Legend: **Done** = implemented and verified by tests; **Partial** = works but has stated gaps; **Not started**.

> The other `*_AUDIT.md`, `*_REPORT.md` and `EL100_*.md` files in this folder were written by
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
| 11 Production readiness | Partial | Config is env-driven with no fallback secrets; nginx security headers. Not deployed or verified on Railway in this session. |

## Booking lifecycle

`PENDING_PROVIDER_CONFIRMATION → (accept) CONFIRMED | PENDING_PAYMENT → CONFIRMED → COMPLETED`,
`→ (quote) QUOTATION_SENT → (customer accepts) CONFIRMED`, plus declined / cancelled / expired.
Transitions are enforced in `BookingStatus` and `BookingService`, recorded in `booking_status_history`,
and notify the other party. Double booking is prevented by a provider row lock plus a capacity check
(verified with a concurrent-accept test). Payment is off by default (`booking.payment_required`).

## Test evidence

| Suite | Command | Result |
|---|---|---|
| Backend unit | `cd apps/backend && ./mvnw test` | 18 passed |
| API end-to-end | scenario script (auth, isolation, filters, lifecycle, race, admin) | 93 passed |
| Browser | `cd apps/web && npm run test:e2e` (setup in `apps/web/e2e/README.md`) | 16 passed |

## Open items

1. Smoke-test sign-up/sign-in against the real Clerk tenant (local tests use a stand-in issuer).
2. Configure Railway env vars from `.env.example`; set `BOOTSTRAP_ADMIN_EMAILS` once, then remove.
3. Rebuild and run the Capacitor Android app. Note: the Gradle wrapper was changed to 9.7.1 outside this work (IDE); confirm compatibility with the Android Gradle Plugin before building.
4. Not implemented: chat/messages, disputes UI, refunds, push notifications, admin editing of the category/cuisine catalog, map/geocoded address search (location uses device GPS or city/area text).
5. Frontend stays JavaScript (JSX); TypeScript migration was not done.
6. Delete or archive the outdated report files listed at the top once you have reviewed them.
