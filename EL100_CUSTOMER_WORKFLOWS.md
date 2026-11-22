# BOOK MY CHEF — EL100 CUSTOMER WORKFLOWS
**Implementation Identifier:** EL100  
**Console:** Customer / Host Experience  
**Status:** FULLY OPERATIONAL (Zero Mock Policy)  

---

## 1. Customer Authentication & Sign-Up Flow
1. **Entry Point:** Host visits `/auth/customer` or clicks "Customer Sign In" from Welcome page.
2. **Input Validation:**
   - Full Name: Required text, minimum 2 characters.
   - Email: Valid RFC 5322 email regex.
   - Password: Minimum 8 characters.
   - Host City / Location: e.g. "Jubilee Hills, Hyderabad".
   - Terms Acceptance: Mandatory checkbox.
3. **Execution:**
   - Clerk Core 3 `signUp.password()` and `signUp.verifications.sendEmailCode()` dispatches real 6-digit email OTP.
   - Individual 6-digit OTP boxes auto-focus and auto-submit on completion.
   - Once verified, `POST /api/v1/auth/sync` saves the host user and profile in PostgreSQL `users` and `user_profiles`.
   - Host is transitioned directly to `/customer/home`.

---

## 2. Atelier Discovery & Dynamic Filtering
1. **Explore Catalog (`/customer/explore`):**
   - Live query sent to `GET /api/v1/search/providers`.
   - Dynamic category pills (`PRO_CHEF`, `HOME_CHEF`, `CATERER`, `PLANNER`).
   - Regional cuisine filtering (`Andhra Royal`, `Telangana Heritage`, `South Indian Classic`, `North Indian`, `Continental`, `Vegan`).
   - Budget slider adjusts query bounds.
2. **Provider Profile View (`/chef/:id`):**
   - Dossier loads verified credentials, FSSAI compliance badge, bio, and portfolio photos.
   - Itemized packages loaded dynamically from PostgreSQL `service_packages` table via `GET /api/v1/providers/{id}/services`.
   - Host can click "Favorite" to save provider to PostgreSQL `customer_favourites`.

---

## 3. End-to-End Booking Reservation (Steps 1–5)
1. **Step 1 Requirements (`/booking/step-1`):**
   - Event occasion (Housewarming, Wedding, Anniversary, Birthday, Private Feast).
   - Date picker + Time slot (Lunch, High Tea, Dinner).
   - Guest headcount (10 to 500+).
   - Celebration address (prefills from PostgreSQL `user_addresses`).
2. **Step 2 Preferences (`/booking/step-2`):**
   - Dietary requirements (Vegetarian, Non-Veg, Jain, Halal, Nut-free).
   - Service mode (Chef Visits Home, Cook & Deliver, Full Banquet).
   - Kitchen amenities checklist (Burners, Oven, Tandoor, Refrigeration).
3. **Step 3 Itemized Quotation (`/booking/step-3`):**
   - Calculates base chef service + per-guest food costs + GST + platform service fee.
   - Submits real booking to `POST /api/v1/bookings` with status `PENDING_PROVIDER_CONFIRMATION` or `PENDING_PAYMENT`.
   - Locks provider availability slot.
4. **Step 4 Razorpay Escrow Payment (`/booking/step-4`):**
   - Calls `POST /api/v1/payments/create-order` to generate genuine Razorpay Order ID.
   - Mounts Razorpay Checkout modal with test/live gateway.
   - On completion, `POST /api/v1/payments/verify` verifies HMAC SHA-256 signature and locks 30% advance in escrow (`ESCROW_LOCKED`).
5. **Step 5 Confirmation & Live Tracking (`/booking/step-5` & `/tracking/:id`):**
   - Displays confirmed booking reference (e.g. `#BMC-4892-HYD`).
   - Live milestone timeline: En Route $\rightarrow$ Arrived $\rightarrow$ Cooking Started $\rightarrow$ Served $\rightarrow$ Feast Completed.
   - Customer confirms completion via `POST /api/v1/bookings/{id}/complete`, releasing escrow to provider.
