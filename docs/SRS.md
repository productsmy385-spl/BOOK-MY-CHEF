# Software Requirements Specification (SRS)

**Project:** Culinary & Event Atelier ("BOOK MY CHEF") — Multi-Service Chef, Catering & Event Services Marketplace  
**Standard:** IEEE Std 830-1998 Compliant Architecture  
**Version:** 1.0.0  
**Status:** Approved for Implementation  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the production release of **BOOK MY CHEF**, a mobile-first, multi-role on-demand marketplace connecting customers with professional culinary and event services across India.

### 1.2 Scope of System
The system comprises:
1. **Customer Web & Mobile Application (React + Capacitor):** Discovery, interactive filtering, customized event booking, live status tracking, and escrow payments.
2. **Service Provider Web & Mobile Application (React + Capacitor):** 9-step professional onboarding, digital service atelier, calendar scheduling, quotation negotiation, and escrow payouts.
3. **Platform Administrator Console (React Desktop-First):** Oversight, KYC verification, booking lifecycle arbitration, financial settlement, and audit logging.
4. **Backend Application Server (Java 21 + Spring Boot 3+):** Enterprise REST APIs, domain state machines, concurrency locking, and security enforcement.
5. **Relational Database Management System (PostgreSQL 16+):** Normalized schemas, foreign key constraints, and transactional integrity.

---

## 2. System Context & External Interfaces

```
                           ┌───────────────────────────────────┐
                           │   CLERK AUTHENTICATION (OIDC/OTP) │
                           └─────────────────┬─────────────────┘
                                             │ JWT / User Sync
                                             ▼
  ┌───────────────────────┐        ┌───────────────────┐        ┌───────────────────────┐
  │   CUSTOMER CLIENT     │◄──────►│  SPRING BOOT 3+   │◄──────►│   PROVIDER CLIENT     │
  │ (React/Capacitor/iOS) │  REST  │  MODULAR BACKEND  │  REST  │ (React/Capacitor/And) │
  └───────────────────────┘  APIs  └─────────┬─────────┘  APIs  └───────────────────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
             ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
             │ POSTGRESQL 16+ DB │ │ RAZORPAY GATEWAY  │ │ IMAGEKIT CDN /    │
             │ (74 Tables/ACID)  │ │ (Escrow & Payout) │ │ GOOGLE MAPS API   │
             └───────────────────┘ └───────────────────┘ └───────────────────┘
```

### 2.1 User Interfaces
- **Customer UI:** Responsive mobile viewport (360px to 430px primary, adaptive tablet/desktop) with persistent 5-tab bottom navigation, drawer menu, and Sora typography.
- **Provider UI:** Operational dashboard with 5-tab bottom navigation, calendar matrix, and live event checklist.
- **Admin UI:** High-density desktop workspace with persistent left sidebar, data tables, metrics, and modal drawers.

### 2.2 Hardware & Network Interfaces
- Client execution on Android 10+ and iOS 15+ devices via Capacitor native wrapper.
- Secure communication over TLS 1.3 with HTTPS REST endpoints (`/api/v1/*`).

### 2.3 Software & Cloud Interfaces
- **Clerk Identity Provider:** Phone OTP delivery, session tokens, and admin invitation webhooks.
- **Razorpay Payments API:** Order generation (`/orders`), signature verification (HMAC SHA256), and automated route transfers for escrow settlements.
- **ImageKit Storage:** Media optimization, automated watermarking, and secure client upload tokens.
- **Google Maps Platform:** Places Autocomplete, Geocoding, and Distance Matrix API for travel surcharge calculations.

---

## 3. Detailed Functional Requirements

### 3.1 Identity & Access Control (Module: IAM)
- **REQ-IAM-01:** The system shall authenticate customers and providers using Clerk mobile phone OTP.
- **REQ-IAM-02:** Upon first authentication, the backend shall synchronize the Clerk user identifier (`sub`) with the internal PostgreSQL `users` table, assigning default role `CUSTOMER` or `PROVIDER`.
- **REQ-IAM-03:** Platform administrators shall access the admin console strictly through Clerk invitation tokens issued by authorized Super Admins.
- **REQ-IAM-04:** Every REST request shall carry an `Authorization: Bearer <clerk_jwt>` header, verified against Clerk's public JWKS endpoint on the backend.
- **REQ-IAM-05:** The backend security filter chain shall enforce role-based authorization:
  - `/api/v1/customers/**` requires `ROLE_CUSTOMER`
  - `/api/v1/providers/**` requires `ROLE_PROVIDER`
  - `/api/v1/admin/**` requires `ROLE_ADMIN_*`

### 3.2 Customer Discovery & Search (Module: Discovery)
- **REQ-DISC-01:** The system shall provide full-text search across provider names, bio text, cuisine tags, and dish items.
- **REQ-DISC-02:** The system shall calculate geodesic distance between the customer's coordinates and the provider's registered kitchen coordinates.
- **REQ-DISC-03:** Providers exceeding their configured maximum travel distance (`max_travel_distance_km`) shall be excluded from search results or flagged as "Out of Delivery Range".
- **REQ-DISC-04:** The system shall support compound filtering:
  - Cuisines (Andhra, Telangana, Chettinad, Mughlai, North Indian, Continental, Vegan)
  - Price per person / per event
  - Minimum customer rating (4.0+, 4.5+, 4.8+)
  - Event date availability check

### 3.3 Provider Management & Setup (Module: Provider)
- **REQ-PROV-01:** The system shall provide a 9-step onboarding wizard capturing identity, service roles, cuisines, package pricing, travel radius, availability, and FSSAI credentials.
- **REQ-PROV-02:** The system shall support multiple service roles per provider (e.g., Professional Chef and Catering Business).
- **REQ-PROV-03:** Providers shall configure flexible pricing models:
  - Per Person (`₹/person`)
  - Fixed Event (`₹/event`)
  - Hourly (`₹/hour`)
  - Chef Visiting Fee + Ingredient Cost
- **REQ-PROV-04:** The system shall allow providers to define blocked calendar dates, weekly recurring holidays, and maximum concurrent events per day.

### 3.4 Booking Lifecycle & Quotation Engine (Module: Booking)
- **REQ-BOOK-01:** Customer initiates booking request specifying event type, date, time slot, guest count, location, cuisine, and delivery mode.
- **REQ-BOOK-02:** Booking is created in state `PENDING_PROVIDER_CONFIRMATION`.
- **REQ-BOOK-03:** Provider receives an in-app and push notification with action choices:
  - Accept booking as-is
  - Submit custom quotation with adjusted line items
  - Decline booking with reason code
- **REQ-BOOK-04:** When a provider accepts or submits a quote, the backend shall acquire a database pessimistic write lock on the provider's calendar slot to prevent double-booking.
- **REQ-BOOK-05:** Upon customer payment of the advance, the booking transitions to `CONFIRMED`, and the calendar slot is locked permanently.
- **REQ-BOOK-06:** On the event day, provider and customer track progress through the live checklist (`EN_ROUTE`, `ARRIVED`, `COOKING_STARTED`, `COMPLETED`).

### 3.5 Financials & Escrow (Module: Finance)
- **REQ-FIN-01:** Payments shall be processed via Razorpay with client-side order checkout and server-side HMAC signature verification.
- **REQ-FIN-02:** Customer funds shall be recorded in `payments` with status `ESCROW_HELD`.
- **REQ-FIN-03:** Upon host completion confirmation (or 24 hours without dispute), funds transition to `CAPTURED`, platform commission is deducted (e.g., 10%), and the net amount is credited to `provider_earnings`.
- **REQ-FIN-04:** Providers can trigger automated payouts to their linked bank accounts via Razorpay Route API.

### 3.6 Reviews & Ratings (Module: Review)
- **REQ-REV-01:** Reviews shall be permitted strictly after a booking reaches `COMPLETED` state.
- **REQ-REV-02:** Ratings shall capture overall score (1 to 5) plus granular criteria: Food Taste, Hygiene, Punctuality, and Hospitality.
- **REQ-REV-03:** Provider aggregate rating summaries (`provider_rating_summaries`) shall be automatically recomputed in a transactional event listener.

### 3.7 Administration & Auditing (Module: Admin)
- **REQ-ADM-01:** Super Admins can invite new administrators with specific roles (`ROLE_OPS_ADMIN`, `ROLE_VERIFICATION_ADMIN`, `ROLE_FINANCE_ADMIN`).
- **REQ-ADM-02:** Admin verification queue shall allow inspecting provider government IDs, FSSAI certificates, and portfolio images, with approve/reject actions.
- **REQ-ADM-03:** All administrative actions (user suspension, provider approval, dispute override, commission rate change) shall generate an immutable record in `admin_audit_logs`.

---

## 4. Performance & Scalability Requirements

- **Throughput:** System must handle a minimum of 2,500 requests per second (RPS) on standard cluster configuration.
- **Database Query Latency:** Indexed lookup queries shall execute in < 15ms; complex geospatial discovery queries shall execute in < 80ms.
- **Mobile Network Optimization:** Client payload bundles shall be gzip/brotli compressed; image assets shall be served in WebP format with responsive srcset.
- **Database Connection Pooling:** HikariCP configured with maximum pool size of 30 connections per backend instance, minimum idle of 10.

---

## 5. Security & Compliance Requirements

- **Zero Plaintext Secrets:** Passwords, OTP secrets, and payment credentials are never stored in the application database.
- **SQL Injection Prevention:** 100% parameterization via Spring Data JPA and Hibernate ORM.
- **XSS & Content Security Policy:** Strict HTTP response headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
- **Idempotent Webhooks:** Razorpay payment webhooks shall verify `X-Razorpay-Signature` and enforce idempotency using event IDs stored in `payment_transactions`.
- **Tenant Data Isolation:** Queries must include `WHERE customer_id = :authenticatedUserId` or `WHERE provider_id = :authenticatedProviderId` enforced at the service layer.
