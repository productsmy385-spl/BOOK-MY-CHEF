# BOOK MY CHEF — EL100 ADMIN WORKFLOWS
**Implementation Identifier:** EL100  
**Console:** Superadmin Platform Operations (`/admin`)  
**Status:** FULLY OPERATIONAL (Zero Mock Policy)  

---

## 1. Operational Dashboard (`/admin/dashboard`)
1. **Live Metrics Engine:**
   - Real Gross Merchandise Value (GMV): Dynamically sums `finalAmount` from all bookings in PostgreSQL `bookings` table.
   - Net Commission Revenue: Dynamic 12.0% platform take rate applied to real GMV.
   - Active Providers: Real `COUNT(*)` from `provider_profiles`.
   - Total Bookings: Real `COUNT(*)` from `bookings`.
   - Pending Verifications: Real count of providers with `verification_status = 'PENDING'`.

---

## 2. KYC & Provider Credential Verification (`/admin/verifications`)
1. **Verification Dossier Queue:**
   - Queries `GET /api/v1/admin/kyc/pending`.
   - Displays applicant's FSSAI license number, years of experience, primary culinary role, and uploaded certificates.
2. **Adjudication Actions:**
   - Approve: Calls `POST /api/v1/admin/providers/{id}/verify` with `{ decision: "APPROVE", remarks: "FSSAI verified" }`. Updates provider status to `VERIFIED` and sets `verified_at` timestamp.
   - Reject: Calls with `{ decision: "REJECT", remarks: "Incomplete document" }`. Updates status to `REJECTED`.
   - Audit Log: Automatically records an immutable entry into `admin_audit_logs`.

---

## 3. Host & Customer Governance (`/admin/users`)
1. **User Directory:**
   - Queries `GET /api/v1/admin/users` to display real registered customers, providers, and staff.
   - Shows user role, verified mobile, email address, account status (`ACTIVE` / `SUSPENDED`).
2. **Account Moderation:**
   - Suspend Account: Calls `POST /api/v1/admin/users/{id}/suspend`. Immediately blocks user authentication and API tokens.
   - Reactivate Account: Calls `POST /api/v1/admin/users/{id}/restore`. Restores active platform standing.
   - Audit Log: Records moderation event with admin principal timestamp.

---

## 4. Booking Lifecycle & FSM Oversight (`/admin/bookings`)
1. **17-State Transition Control:**
   - Displays all platform bookings from `GET /api/v1/admin/bookings`.
   - Allows superadmin to force transition any booking (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
2. **Dispute Resolution:**
   - Handles customer dispute claims.
   - Unfreezes or refunds escrow holdings directly.

---

## 5. Escrow Settlements & Financial Policy (`/admin/finance`)
1. **Escrow Holdings Oversight:**
   - Queries `GET /api/v1/admin/finance`.
   - Breaks down: Total Escrow Held (`ESCROW_LOCKED`), Disbursed Provider Payouts (`CAPTURED`), and Refunded Volume (`REFUNDED`).
2. **Commission Rate Configuration:**
   - Dynamic commission adjustment across chef categories (Pro Chefs: 12%, Home Chefs: 8%, Caterers: 10%, Planners: 12%).
   - Direct trigger for batch provider settlements via Razorpay Route.
