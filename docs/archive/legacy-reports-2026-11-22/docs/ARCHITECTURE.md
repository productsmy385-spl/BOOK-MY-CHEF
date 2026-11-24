# System Architecture Document

**Project:** Culinary & Event Atelier ("BOOK MY CHEF") — Multi-Service Chef, Catering & Event Services Marketplace  
**Document:** High-Level & Detailed Technical Architecture  
**Version:** 1.0.0  
**Status:** Approved for Implementation  

---

## 1. High-Level Architecture Overview

**BOOK MY CHEF** is architected as a **Modular Monolith** backend powered by **Java 21 and Spring Boot 3+**, paired with a **mobile-first React 19 + Vite + Capacitor** frontend packaged for Android, iOS, and Web. 

A modular monolith architecture delivers superior transactional integrity, zero distributed transaction overhead (crucial for anti-double-booking locks), streamlined deployment, and simplified observability, while strictly separating domain boundaries into cohesive internal modules.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS LAYER                             │
│                                                                                 │
│   ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────┐ │
│   │     CUSTOMER CONSOLE      │ │     PROVIDER CONSOLE      │ │ ADMIN CONSOLE │ │
│   │ (React/Capacitor/Mobile)  │ │ (React/Capacitor/Mobile)  │ │(React/Desktop)│ │
│   └─────────────┬─────────────┘ └─────────────┬─────────────┘ └───────┬───────┘ │
│                 │                             │                       │         │
│                 └──────────────────────┬──────┴───────────────────────┘         │
│                                        │ HTTPS / REST (JSON)                    │
│                                        ▼                                        │
│                         ┌─────────────────────────────┐                         │
│                         │   NGINX REVERSE PROXY / SSL │                         │
│                         └──────────────┬──────────────┘                         │
└────────────────────────────────────────┼────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SPRING BOOT 3+ APPLICATION BACKEND                         │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                            SECURITY GATEWAY                               │  │
│  │   • Clerk JWKS Token Verifier    • Spring Security Filter Chain           │  │
│  │   • Role-Based Access Control    • Rate Limiting & CORS Policies          │  │
│  └─────────────────────────────────────┬─────────────────────────────────────┘  │
│                                        │                                        │
│  ┌─────────────────────────────────────▼─────────────────────────────────────┐  │
│  │                         DOMAIN MODULE BOUNDARIES                          │  │
│  │                                                                           │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌────────────┐  │  │
│  │  │ Identity/IAM  │  │   Customer    │  │   Provider    │  │ Discovery  │  │  │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └─────┬──────┘  │  │
│  │          │                  │                  │                │         │  │
│  │  ┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐  ┌─────▼──────┐  │  │
│  │  │ Availability  │  │    Booking    │  │    Finance    │  │  Reviews   │  │  │
│  │  │ & Slot Engine │  │ & Quotations  │  │   & Escrow    │  │ & Ratings  │  │  │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └─────┬──────┘  │  │
│  │          │                  │                  │                │         │  │
│  │  ┌───────▼──────────────────▼──────────────────▼────────────────▼──────┐  │  │
│  │  │                 PLATFORM ADMINISTRATION & AUDITING                  │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────┬─────────────────────────────────────┘  │
│                                        │ Spring Data JPA / Hibernate            │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                 POSTGRESQL 16+ RELATIONAL DATABASE ENGINE                 │  │
│  │   • Flyway Migrations       • 74 Normalized Tables      • UUID Keys       │  │
│  │   • Row-Level Security      • Pessimistic Locking       • B-Tree Indexes  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (React + Vite + Capacitor)

The frontend is constructed using modern React 19 with Vite for instant HMR and optimized production bundles.

```
apps/web/
├── src/
│   ├── assets/              # Audited photographic assets, icons, logos
│   ├── components/          # Design system components
│   │   ├── ui/              # shadcn/ui primitives (Dialog, Tabs, Toast, Button)
│   │   ├── cards/           # ChefCard, CateringCard, MetricCard, QuotationCard
│   │   ├── navigation/      # CustomerBottomNav, ProviderBottomNav, AdminSidebar
│   │   └── forms/           # FormField, CounterStepper, DatePicker, LocationPin
│   ├── features/            # Domain-driven feature bundles
│   │   ├── authentication/  # Clerk integration, OTP screens, UserSync handler
│   │   ├── customer/        # Home, Explore, ChefProfile, Favourites
│   │   ├── booking/         # 5-step booking wizard, Quotation view, Checkout
│   │   ├── provider/        # 9-step onboarding, Dashboard, Calendar, Services
│   │   ├── tracking/        # Live event tracking, checklist, ETA tracker
│   │   ├── reviews/         # Host review & ratings submission form
│   │   └── admin/           # Dashboard, Verification Queue, Bookings, Finance
│   ├── hooks/               # useAuth, useBooking, useGeolocation, useDebounce
│   ├── stores/              # Zustand stores (useAuthStore, useBookingStore)
│   ├── services/            # Axios API clients with Bearer token interceptors
│   ├── styles/              # globals.css with Sora font & Stitch design tokens
│   └── App.tsx              # Router provider & three console layout switchers
```

### 2.1 State Management Architecture
- **Server Cache & Synchronization:** TanStack Query (React Query) handles all server-state caching, optimistic updates, and background refetching.
- **Client Session & UI State:** Zustand stores manage authenticated user profiles, active booking draft steps, filter states, and temporary quotation line items.

### 2.2 Mobile Packaging via Capacitor
- **Cross-Platform Delivery:** Single React codebase deployed to Web, Android (APK/AAB), and iOS (IPA).
- **Native Device APIs:**
  - `@capacitor/geolocation`: High-accuracy device GPS coordinates for immediate nearby provider discovery.
  - `@capacitor/camera`: Direct photo capture for KYC documents, dish reference uploads, and review images.
  - `@capacitor/push-notifications`: Native APNs and FCM token registration.
  - `@capacitor/haptics`: Tactile feedback on booking confirmation and payment success.

---

## 3. Backend Architecture (Java 21 + Spring Boot 3+)

### 3.1 Technology Stack
- **Language:** Java 21 LTS (utilizing records, pattern matching, Virtual Threads for high-concurrency I/O).
- **Framework:** Spring Boot 3.3.x.
- **Security:** Spring Security 6.x + Nimbus Jose JWT (Clerk RS256 JWKS validation).
- **Persistence:** Spring Data JPA + Hibernate 6.x.
- **Database Migrations:** Flyway.
- **Validation:** Jakarta Bean Validation (Hibernate Validator).
- **API Documentation:** SpringDoc OpenAPI 2.5 (Swagger UI at `/swagger-ui.html`).
- **Build System:** Apache Maven (configured with portable Maven Wrapper).

### 3.2 Modular Monolith Package Structure

```
com.marketplace/
├── config/                  # SecurityConfig, CorsConfig, OpenApiConfig, FlywayConfig
├── security/                # ClerkJwtAuthenticationFilter, UserPrincipal, SecurityUtils
├── common/                  # BaseEntity, ApiResponse, GlobalExceptionHandler, PagedResponse
├── identity/                # User, UserProfile, UserRole, UserSession, SyncController
├── customer/                # CustomerProfile, CustomerAddress, CustomerPreference
├── provider/                # ProviderProfile, ProviderRole, ProviderVerification, Documents
├── services/                # ServiceCategory, ServiceListing, ServicePackage, PricingModel
├── availability/            # ProviderAvailability, CalendarSlot, SlotLockEngine
├── discovery/               # SearchEngine, GeolocationUtils, ProviderSearchController
├── booking/                 # Booking, BookingQuotation, BookingStateMachine, EventChecklist
├── payments/                # Payment, Transaction, RazorpayGatewayService, EscrowManager
├── reviews/                 # Review, ProviderRatingSummary, ReviewEventListener
├── notifications/           # Notification, FcmPushService, InAppNotificationService
└── admin/                   # AdminDashboardService, AuditLogService, VerificationController
```

---

## 4. Authentication & Identity Architecture (Clerk + PostgreSQL)

We implement a **Decoupled Identity Model**:
1. **Clerk as Identity Provider:** Clerk handles phone number OTP dispatch, mobile verification, bot protection, and admin invitation links.
2. **PostgreSQL as Domain Truth:** Our database stores user profiles, addresses, provider listings, pricing, bookings, and permissions.

```
  [ CLIENT (React / App) ]
         │
         │ 1. Request Phone OTP
         ▼
  [ CLERK IDENTITY PROVIDER ]
         │
         │ 2. Deliver SMS OTP -> User Enters Code -> Verified
         ▼
  [ CLERK ISSUES RS256 JWT ]
         │
         │ 3. Client calls POST /api/v1/auth/sync with Bearer JWT
         ▼
  [ SPRING BOOT SECURITY FILTER ]
         │
         │ 4. Fetch Clerk JWKS Keys & Verify Signature
         │ 5. Extract Clerk 'sub' ID, Phone, Email
         ▼
  [ POSTGRESQL IDENTITY SYNCHRONIZATION ]
         │
         │ 6. Lookup by clerk_id:
         │    - If exists: Load user roles & permissions
         │    - If not: INSERT new user with role CUSTOMER or PROVIDER
         ▼
  [ RETURN AUTHENTICATED USER CONTEXT (UserPrincipal) ]
```

### Platform Administrator Guard
- Admins **cannot** publicly register.
- Super Admins generate invitation links in Clerk with metadata `{"role": "ADMIN", "admin_type": "OPERATIONS"}`.
- When the invited admin accepts and completes OTP, backend `/api/v1/auth/sync` verifies the admin claim against `admin_invitations` table before granting `ROLE_ADMIN`.

---

## 5. Anti-Double-Booking Concurrency Architecture

Preventing double-booking is the single most mission-critical transactional requirement in an on-demand marketplace.

### 5.1 Concurrency Lock Strategy
When a customer requests a booking or when a provider confirms a booking quotation:

```java
@Transactional(isolation = Isolation.REPEATABLE_READ)
public BookingConfirmationResult confirmBookingSlot(UUID bookingId, UUID providerId, LocalDate eventDate, TimeSlot slot) {
    // 1. Acquire Pessimistic Write Lock on the provider's calendar slot
    ProviderAvailabilitySlot lockedSlot = slotRepository
        .findByProviderIdAndSlotDateAndTimeSlotForUpdate(providerId, eventDate, slot)
        .orElseThrow(() -> new SlotUnavailableException("Slot does not exist"));

    // 2. Validate current state
    if (lockedSlot.isBooked() || lockedSlot.isBlocked()) {
        throw new SlotConflictException("Provider is already booked or unavailable for this slot");
    }

    // 3. Mark slot reserved with 15-minute lease expiration
    lockedSlot.setReservationStatus(ReservationStatus.LOCKED_PENDING_PAYMENT);
    lockedSlot.setLockExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
    slotRepository.save(lockedSlot);

    // 4. Update Booking state to PENDING_PAYMENT
    ...
}
```

- **Pessimistic Locking (`PESSIMISTIC_WRITE`):** Employs `SELECT ... FOR UPDATE` at the database level.
- **Lease Expiration Worker:** A scheduled background job releases locks that exceed 15 minutes without payment completion.
- **Unique Composite Database Constraint:** `UNIQUE (provider_id, event_date, time_slot)` guarantees zero collisions even under distributed conditions.

---

## 6. Payment & Escrow Architecture

Payments utilize **Razorpay Route** for secure split escrow processing in compliance with Reserve Bank of India (RBI) guidelines.

```
[ Host Books Event ] ──► [ Razorpay Checkout (UPI/Cards) ] ──► [ Payment Verified ]
                                                                       │
                                                                       ▼
                                                          [ Status: ESCROW_HELD ]
                                                          (Funds safely in escrow)
                                                                       │
                                                                       ▼
                                                          [ Provider Delivers Event ]
                                                                       │
                                                                       ▼
                                                          [ Live Checklist Complete ]
                                                                       │
                                                                       ▼
                                                          [ Host Confirms Completion ]
                                                                       │
                                                                       ▼
                                                          [ Escrow Released ]
                                                          • Platform Commission (10%)
                                                          • Net Payout to Provider
```

### Razorpay Webhook Signature Verification
Every incoming webhook at `/api/v1/payments/webhook` verifies the `X-Razorpay-Signature` using HMAC-SHA256 with the secret key, and records the event in `payment_transactions` to enforce strict idempotency.

---

## 7. Infrastructure & Deployment Topology

- **Docker Containerization:** Multi-stage Docker builds for Spring Boot (Eclipse Temurin JRE 21 alpine) and React Vite (Nginx alpine).
- **Reverse Proxy:** Nginx managing TLS termination, gzip/brotli compression, rate limiting, and routing `/api/*` to Spring Boot and all other routes to React SPA.
- **Monitoring & Observability:** Spring Boot Actuator (`/actuator/health`, `/actuator/metrics`) paired with Prometheus/Grafana ready endpoints.
