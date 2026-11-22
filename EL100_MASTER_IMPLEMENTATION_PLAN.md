# EL100 Master Implementation Plan — Complete Production Implementation

**Project:** Book My Chef — Culinary & Event Atelier  
**Implementation ID:** EL100  
**Priority:** CRITICAL  
**Target:** Full Production Readiness (Zero Mock Data, Complete PostgreSQL Persistence, End-to-End Workflows)  
**Deployment:** Railway Production (`book-my-chef-web`, `book-my-chef-backend`, PostgreSQL)

---

## 1. Executive Strategy

The Book My Chef platform transitions from a UI prototype with local storage fallbacks to an enterprise-grade multi-role marketplace.

### Fundamental Engineering Rules
1. **Zero Mock Policy**: Remove all static sample arrays (`catalogProviders`, hardcoded `saved = []`, hardcoded `leads = []`, `defaultBookings = []`, `customers = []`).
2. **Database-First Persistence**: Every user action (profile creation, address saving, search filtering, quotation generation, slot locking, review submission, KYC verification) writes to and reads from PostgreSQL.
3. **Preserve Architectural Integrity**:
   - Backend: Spring Boot 3 + Spring Security + Spring Data JPA + Flyway migrations.
   - Database: PostgreSQL on Railway.
   - Frontend: React 19 + TypeScript/JavaScript + Vite + Tailwind CSS + Lucide / Material Symbols.
   - Auth: Clerk for real SMS/Email OTP with identity mapping in PostgreSQL.
   - Payments: Razorpay order creation and HMAC-SHA256 signature verification.

---

## 2. Milestone Execution Roadmap

| Milestone | Area | Scope | Status |
|---|---|---|---|
| **EL100.1** | Repository Audit | Complete line-by-line inspection of frontend, backend, routes, database tables | COMPLETED |
| **EL100.2** | Database & Migrations | Flyway V5 migration: Seed catalog providers, packages, initial bookings, favourites, and addresses | IN PROGRESS |
| **EL100.3** | Authentication & Security | Role enforcement, JWT verification, admin invite security, ownership isolation | SCHEDULED |
| **EL100.4** | Backend APIs | Favourites API, Address API, Provider Services API, Admin Management APIs, Booking Status APIs | SCHEDULED |
| **EL100.5** | Customer Console | Customer Home, Explore, Search Filters, Favourites, Profile & Saved Addresses, Booking Wizard | SCHEDULED |
| **EL100.6** | Provider Console | Provider Dashboard (real leads & earnings), Onboarding Persistence, Calendar Availability Locks, Services | SCHEDULED |
| **EL100.7** | Administrator Console | Admin Dashboard, Verification Queue, Booking Supervision, User Suspension/Restore, Audit Logs | SCHEDULED |
| **EL100.8** | Booking & Slot Locking | 15-minute pessimistic locking, conflict detection, quotation negotiation, milestone tracking | SCHEDULED |
| **EL100.9** | Payments & Notifications | Razorpay order generation, signature verification, escrow holding & release, notifications | SCHEDULED |
| **EL100.10** | Global UI/UX Repair | Contrast checks (WCAG AAA), FormInput standardization, responsive viewport protection | SCHEDULED |
| **EL100.11** | End-to-End Verification | Full automated test suite across backend compile, frontend build, API contracts | SCHEDULED |
| **EL100.12** | Production Deployment | Push to GitHub `main`, trigger Railway deployments, verify HTTP 200 and Health UP | SCHEDULED |

---

## 3. Detailed Technical Specifications

### 3.1 Backend Entities & Repositories to Implement
1. `CustomerFavourite.java` & `CustomerFavouriteRepository.java` $\rightarrow$ table `customer_favourites`.
2. `UserAddress.java` & `UserAddressRepository.java` $\rightarrow$ table `user_addresses`.
3. `ServicePackage.java` & `ServicePackageRepository.java` $\rightarrow$ table `service_packages`.
4. `AdminAuditLog.java` $\rightarrow$ audit logging for user suspensions and KYC reviews.

### 3.2 Backend Controllers & Endpoints
1. `CustomerController.java` (`/api/v1/customer`):
   - `GET /favourites` — Get saved providers for current user.
   - `POST /favourites/{providerId}` — Add provider to favourites.
   - `DELETE /favourites/{providerId}` — Remove provider from favourites.
   - `GET /addresses` — List user saved addresses.
   - `POST /addresses` — Save new address.
   - `DELETE /addresses/{id}` — Delete address.
2. `BookingController.java` (`/api/v1/bookings`):
   - Add `GET /customer/{customerId}` — Directly fetch customer bookings.
   - Add `GET /provider/{providerId}` — Directly fetch provider bookings.
   - Add `PUT /{id}/status` — Direct status transitions (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
   - Add `POST /{id}/cancel` — Cancel booking.
3. `AvailabilityController.java` (`/api/v1/availability`):
   - Add `POST /provider/{providerId}/unblock` — Unblock a blocked date slot.
4. `ProviderController.java` (`/api/v1/providers`):
   - Add `GET /{id}/services` — Return provider's service packages.
   - Add `POST /{id}/services` — Add/update a provider package.
5. `AdminController.java` (`/api/v1/admin`):
   - Calculate real GMV and Net Commission from `bookings` and `payments`.
   - `GET /bookings` — List all marketplace bookings with status filtering.
   - `GET /users` — List all customers and providers with total spend and bookings count.
   - `POST /users/{id}/suspend` — Suspend user account and log audit trail.
   - `POST /users/{id}/restore` — Restore user account and log audit trail.
   - `GET /finance` — Return real-time escrow, GMV, and commission breakdown.

### 3.3 Frontend Enhancements
1. Remove all static arrays:
   - `CustomerExplore.jsx`: query backend with filters (`query`, `category`, `cuisine`, `budget`).
   - `CustomerFavourites.jsx`: query `/api/v1/customer/favourites`.
   - `CustomerHome.jsx`: synchronize favorites with backend API.
   - `ProviderDashboard.jsx`: load leads from `/api/v1/bookings/provider/{user.id}`.
   - `ProviderCalendar.jsx`: load blocked slots from `/api/v1/availability/provider/{providerId}` and block/unblock via API.
   - `ProviderOnboardingWizard.jsx`: submit all 9 steps to `/api/v1/providers/profile`.
   - `AdminUsers.jsx`: load real users from `/api/v1/admin/users` and support suspend/restore.
   - `AdminBookings.jsx`: load real bookings from `/api/v1/admin/bookings`.
   - `ChefProfile.jsx`: load real provider packages and services from backend.

---

## 4. Verification & Validation Metrics
- All Java unit & integration tests compile and pass (`mvnw test-compile`).
- All frontend components build cleanly with Vite (`npm run build`).
- Railway deployments for Web and Backend services show status `[SUCCESS]`.
- Health check `GET /actuator/health` returns `{"status":"UP"}`.
