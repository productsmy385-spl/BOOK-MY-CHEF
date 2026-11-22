# Product Requirements Document (PRD)

**Project:** Culinary & Event Atelier ("BOOK MY CHEF") — Multi-Service Chef, Catering & Event Services Marketplace  
**Version:** 1.0.0 (Production Release Specification)  
**Author:** Principal Software Architect & Product Management Team  
**Status:** Approved for Implementation  

---

## 1. Product Vision & Problem Statement

### 1.1 Product Vision
**BOOK MY CHEF** (Culinary & Event Atelier) is India's premier mobile-first marketplace connecting discerning hosts with verified professional master chefs, traditional home chefs, bespoke caterers, decorators, event planners, photographers, and hospitality staff. 

Our mission is to transform event and culinary hosting across metropolitan India into a transparent, frictionless, and opulent hospitality experience—empowering hosts with instant quotation discovery, verified culinary talent, and escrow-protected transactions, while offering service providers a robust digital storefront and financial ecosystem to scale their businesses.

### 1.2 Problem Statement
1. **Unorganized & Fragmented Market:** Finding reliable chefs, caterers, and decorators currently relies on word-of-mouth or unverified local classifieds with zero quality assurance or hygiene guarantees.
2. **Opaque Pricing & Hidden Surcharges:** Hosts frequently face arbitrary pricing, last-minute demands for ingredient reimbursements, or inflated travel fees without itemized transparency.
3. **Double Booking & Unreliable Scheduling:** Service providers lack real-time digital calendar reservation systems, leading to severe double-booking conflicts and no-shows on critical event days.
4. **Payment Insecurity:** Hosts hesitate to pay large advances upfront due to fear of poor service or non-appearance, while providers struggle with payment delays and bad debts after delivering events.
5. **No Specialized Regional Cuisines Discovery:** Discerning hosts seeking authentic regional culinary mastery (e.g., traditional Andhra home feast, authentic Telangana delicacies, Chettinad royal spread, Kashmiri Wazwan) cannot readily find verified specialists.

---

## 2. Target Audience & User Personas

### 2.1 Persona A: The Discerning Host (Customer)
- **Profile:** Ananya & Rajesh Rao, 34 & 37, Tech Executives residing in Jubilee Hills, Hyderabad.
- **Need:** Organizing a traditional 25-guest housewarming luncheon (*Gruhapravesam*).
- **Pain Points:** Wants authentic Andhra vegetarian dishes cooked with traditional spices and ghee on-site; does not want commercial hotel bulk food; needs a verified chef who manages preparation, serving, and kitchen sanitization.
- **Goals:** Browse verified home chefs, view video proof of cooking, get an itemized per-head quote, pay a secure advance, and track the chef's arrival live.

### 2.2 Persona B: The Professional Executive Chef (Service Provider)
- **Profile:** Chef Raghavendra Rao, 48, 18+ years culinary experience in luxury hotels, now operating as an independent master chef.
- **Need:** A digital atelier to showcase high-end culinary packages, manage weekend availability, and handle bookings without chasing hosts for payments.
- **Pain Points:** Host cancellations without compensation; constant WhatsApp negotiation; unorganized schedule.
- **Goals:** Receive structured leads with guest counts and dietary requirements; send formal digital quotations; enjoy guaranteed payments via escrow.

### 2.3 Persona C: The Boutique Caterer & Event Planner
- **Profile:** Sumanth Reddy, Owner of "Utsav Banquets & Event Styling", Hyderabad.
- **Need:** Multi-role profile offering both grand catering (50 to 500 guests) and thematic mandap floral decorations.
- **Goals:** Configurable per-plate packages (Starters, Mains, Desserts), equipment rentals, and staff booking.

### 2.4 Persona D: Platform Operations & Verification Administrator
- **Profile:** Platform Admin at BOOK MY CHEF Operations Team.
- **Need:** Review FSSAI certificates, government IDs, and hygiene compliance before approving provider listings; oversee escrow releases and resolve host-chef disputes.

---

## 3. Business Objectives & Monetization Architecture

1. **Marketplace Commission:** 10% to 15% platform commission deducted from provider gross booking value upon successful event completion.
2. **Customer Convenience Fee:** 3% to 5% escrow protection and platform security fee charged to the customer on checkout.
3. **Premium Provider Listing & Verification Tiers:** Optional monthly subscription for chefs seeking featured visibility, professional photography badges, and zero-commission milestones.
4. **Cancellation Fee Splits:** Tiered cancellation policy ensuring fair compensation to providers while protecting customer rights.

---

## 4. Three-Console Application Architecture

The system strictly decouples the user experience into three distinct consoles:

```
                                  [ BOOK MY CHEF ]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  [ CUSTOMER CONSOLE ]          [ PROVIDER CONSOLE ]            [ ADMIN CONSOLE ]
  • Mobile-First / Web          • Mobile-First / Web            • Desktop-First Responsive
  • 5 Bottom Nav Items          • 5 Bottom Nav Items            • Persistent Sidebar
  • Contextual Drawer           • Business Drawer               • Role-Based Governance
  • Discovery & Booking         • Leads & Escrow Wallet         • KYC, Disputes & Auditing
```

### 4.1 Customer Console Navigation (Strict 5 Bottom Tabs)
1. **Home:** Curated carousels, location selector, category icons, spotlight deals.
2. **Explore:** Search, cuisine filters, budget sliders, distance radius, real-time availability.
3. **Bookings:** Active bookings with live countdowns, past completed events, cancellation tracking.
4. **Favourites:** Saved chefs, caterers, and decorators.
5. **Profile:** Account details, addresses, notification settings, and contextual drawer trigger.

### 4.2 Provider Console Navigation (Strict 5 Bottom Tabs)
1. **Dashboard:** Live metrics (Gross Earnings, Pending Leads, Confirmed Events, Host Rating), urgent requests.
2. **Services:** Package builders, custom dish pricing, delivery modes, pricing models.
3. **Bookings:** Incoming leads, active contracts, live event checklist, quotation status.
4. **Calendar:** Month/Week/Day scheduling, blocked holiday dates, capacity limits.
5. **Profile:** Business branding, bio, certifications, payouts ledger, and business drawer.

### 4.3 Platform Administrator Console (Desktop-First)
1. **Overview Dashboard:** Total GMV, active chefs, active bookings, net platform revenue, dispute index.
2. **User Management:** Customer list, account histories, suspension controls.
3. **Provider Verification Queue:** Document inspection (FSSAI licenses, Aadhaar, hygiene certificates), approve/reject actions with reason codes.
4. **Category & Cuisine Catalog:** Dynamic service taxonomy management.
5. **Booking Oversight:** Real-time booking monitor, manual escrow intervention.
6. **Financials & Settlements:** Payout batches, commission tiers, refund processing.
7. **Audit Logs:** Immutable audit trail of administrative actions.

---

## 5. Functional Requirements

### 5.1 Identity & Authentication (Clerk + Internal PostgreSQL)
- **FR-AUTH-01:** Customer & Provider phone number OTP verification via Clerk.
- **FR-AUTH-02:** Background identity synchronization linking Clerk `sub` ID with internal PostgreSQL `users` table via `/api/v1/auth/sync`.
- **FR-AUTH-03:** Platform administrator invitation-only access via Clerk with zero public registration endpoint.
- **FR-AUTH-04:** Strict role-based session token validation rejecting unauthorized cross-console routing.

### 5.2 Customer Discovery & Search Engine
- **FR-DISC-01:** GPS-based location detection and postal code/neighborhood search with radius filtering (5 km to 50 km).
- **FR-DISC-02:** Multi-faceted filtering: Service Category, Cuisine Specialization (Andhra, Telangana, Chettinad, Mughlai, Continental, Italian, Vegan, etc.), Budget per person / per event, Service Delivery Mode, Instant Availability.
- **FR-DISC-03:** Sort results by: "Recommended", "Top Rated", "Nearest", "Price: Low to High", "Experience".
- **FR-DISC-04:** Unavailable providers on selected dates must be flagged as "Unavailable" and disabled from instant reservation.

### 5.3 Service Provider Management & 9-Step Onboarding
- **FR-PROV-01:** Comprehensive 9-step wizard: Basic Info, Role Selection, Specializations, Packages & Menus, Pricing Models, Service Locations, Availability Schedule, Portfolio & Documents, Review & Submit.
- **FR-PROV-02:** Support for multi-role registration (e.g., Chef + Caterer).
- **FR-PROV-03:** Configurable pricing architectures: Per-Person (`₹/guest`), Fixed Event (`₹/event`), Hourly (`₹/hr`), Base Visiting Fee + Ingredients, Custom Quotation.
- **FR-PROV-04:** Service delivery mode selection: Chef Visits Home, Cook & Deliver, Venue Banquet Cooking.
- **FR-PROV-05:** FSSAI and KYC document upload with status tracking (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`).

### 5.4 Booking Lifecycle & Quotation Engine
- **FR-BOOK-01:** 5-step booking flow: Event Requirements -> Service Mode Preferences -> Quotation & Summary -> Payment & Checkout -> Booking Confirmed.
- **FR-BOOK-02:** 17-state finite state machine with strict server-side transition guards.
- **FR-BOOK-03:** Concurrency locking on provider schedule slots during quotation acceptance to prevent double-booking.
- **FR-BOOK-04:** Provider quotation negotiation allowing custom line items (Travel charges, Ingredients reimbursement, Extra dishes, Service staff).
- **FR-BOOK-05:** Dedicated Family Home-Food Experience Workflow for traditional home gathering requirements.

### 5.5 Escrow Financials & Payments
- **FR-FIN-01:** Razorpay integration supporting UPI, Cards, Net Banking, and Wallets.
- **FR-FIN-02:** Split payment model: Booking Advance (typically 30%) + Remaining Balance upon service completion.
- **FR-FIN-03:** Escrow protection: Customer funds remain in platform escrow until host confirms service completion or 24 hours post-event without dispute.
- **FR-FIN-04:** Automated provider earnings calculation minus platform commission.

### 5.6 Real-Time Event Day Tracking & Reviews
- **FR-EVT-01:** Provider event-day checklist: Prep Done -> En Route (GPS sharing) -> Arrived -> Cooking Started -> Served -> Kitchen Cleaned.
- **FR-EVT-02:** Customer live tracking view showing chef ETA and status badges.
- **FR-EVT-03:** Multi-criteria review submission: Overall Rating, Food Quality, Hygiene & Kitchen Cleanliness, Punctuality, Staff Hospitality, dish photos.

---

## 6. Non-Functional Requirements (NFRs)

| Metric | Target Specification | Enforcement Mechanism |
|---|---|---|
| **API Latency** | P95 < 150ms, P99 < 300ms | Spring Boot indexed queries, caching, connection pooling |
| **Mobile Initial Load** | FCP < 1.2s, LCP < 2.0s on 4G | Vite bundle code-splitting, WebP assets, Tailwind minification |
| **Availability & Uptime** | 99.9% uptime SLA | Stateless backend instances, PostgreSQL automated backups |
| **Concurrency & ACID** | Zero double-booking occurrences | PostgreSQL Serializable / Pessimistic row locking on calendar slots |
| **Security Standards** | OWASP Top 10 compliance | Spring Security, CSRF/XSS protection, Clerk RS256 JWT validation |
| **Data Protection** | Strict tenant isolation | Service-layer ownership verification, row-level security policies |

---

## 7. 20 Fundamental Business Rules

1. **Independent Pricing:** Every provider controls their own service pricing; the platform never hardcodes provider prices.
2. **Search Without Booking:** Customers can freely search, filter, and compare providers without committing to a booking.
3. **Mandatory Availability Configuration:** Providers must configure their calendar and working slots before accepting bookings.
4. **Availability Recheck on Acceptance:** Booking acceptance must be re-validated against current provider availability before locking.
5. **Anti-Double-Booking Guarantee:** Providers cannot accept conflicting bookings for the same date and overlapping time window.
6. **Omnichannel Notifications:** Customers and providers receive real-time notifications for acceptance, rejection, quotation revisions, and cancellations.
7. **Custom Quotations Supported:** Providers can adjust menu items and prices based on special host requirements.
8. **Decoupled Financial Status:** Payment status (`ESCROW_HELD`, `CAPTURED`, `REFUNDED`) and booking status (`CONFIRMED`, `IN_PROGRESS`) remain decoupled.
9. **Immutable Financial Audit:** All transactions, payouts, commission deductions, and refunds maintain immutable audit records.
10. **Data Privacy & Isolation:** Customers and providers have access strictly to their authorized domain records.
11. **Granular Admin Permissions:** Platform administrators operate strictly according to assigned role-based permissions.
12. **Decoupled Verification:** Account registration is immediately separated from professional verification; unverified providers cannot accept paid bookings.
13. **Provider Service Pause:** Providers can pause their service listings at any time without terminating past confirmed bookings.
14. **Temporary Unavailability:** Providers can mark individual days or time slots as blocked/holiday on their calendar.
15. **Configurable Cancellation Policies:** Cancellation tiers (e.g., 100% refund > 72h, 50% refund 24h-72h, 0% refund < 24h) are enforced server-side.
16. **Truth in Discovery:** Search results must reflect live provider availability; busy providers must not be shown as instantly bookable.
17. **Integrity of Reviews:** Reviews can only be submitted by hosts who completed a paid booking with that specific provider.
18. **Zero Synthetic Metrics:** No fake ratings, artificial reviews, or hardcoded metrics are permitted in production dashboards.
19. **Server-Side Validation:** All critical constraints, calculations, and status transitions must be executed and validated on the backend.
20. **Escrow Safety Protocol:** Payouts to providers are released only after host completion confirmation or dispute resolution.

---

## 8. MVP Scope vs. Future Roadmap

### MVP Scope (Current Release)
- Complete Customer Console (Home, Explore, Chef Profile, 5-step Booking, Live Tracking, Reviews).
- Complete Provider Console (9-step Onboarding, Dashboard, Services, Calendar, Quotations, Escrow Wallet).
- Complete Administrator Console (Governance, Verification Queue, Bookings, Financials, Audits).
- Core Categories: Chefs (Pro/Home/Personal), Caterers, Event Planners & Decorators.
- Integrated Clerk Auth, Razorpay Escrow, and Capacitor Mobile Wrapper.

### Future Enhancements (Phase 2 & 3)
- Real-time IoT kitchen temperature sensors for commercial banquet hygiene.
- AI-driven menu generation based on seasonal grocery wholesale prices.
- WhatsApp Business API conversational booking bot.
- Multi-city expansion across Tier-1 and Tier-2 Indian hubs.
