# BOOK MY CHEF — EL100 PROVIDER WORKFLOWS
**Implementation Identifier:** EL100  
**Console:** Service Partner / Culinary Atelier  
**Status:** FULLY OPERATIONAL (Zero Mock Policy)  

---

## 1. Partner Onboarding Wizard (Steps 1–9)
1. **Role Selection (Step 1):** Multi-role selection among 12 authoritative roles (Home Chef, Pro Chef, Personal Chef, Caterer, Planner, Manager, Decorator, Photographer, Videographer, Bartender, Server, Kitchen Assistant).
2. **Basic Information & FSSAI (Step 2):** Full name, Brand name, Years of experience, FSSAI 14-digit registration number.
3. **Regional Cuisines (Step 3):** Specialization tags (Andhra Royal, Telangana Heritage, Mughlai, Vegan, etc.).
4. **Service Packages (Step 4):** Itemized menu courses, pricing models (Per Person, Per Event).
5. **Kitchen Equipment & Radius (Step 5):** Service radius (km), minimum guest capacity, maximum event size.
6. **Availability Cadence (Step 6):** Working days and slot windows.
7. **Document Dossier (Step 7):** Government ID, Food safety certification upload.
8. **Bank & Payout Details (Step 8):** Account number, IFSC code, UPI ID for Razorpay Route escrow disbursements.
9. **Review & Activation (Step 9):**
   - Submits entire payload to `POST /api/v1/providers/profile` in PostgreSQL.
   - Sets verification status to `PENDING` for Admin review.
   - Enters Provider Workspace (`/provider`).

---

## 2. Reservation Management & Quotation Builder
1. **Booking Inquiries:**
   - Provider receives real-time booking cards via `GET /api/v1/bookings/provider/{providerId}`.
   - Provider can Accept (`PROVIDER_ACCEPTED`) or Reject with written reason (`PROVIDER_REJECTED`) via `POST /api/v1/bookings/{id}/respond`.
2. **Custom Quotation Builder:**
   - Provider can draft customized itemized line items (Ingredients surcharge, Extra servers, Special desserts) and submit via `POST /api/v1/bookings/{id}/quotation`.
   - Customer receives instant quotation update and proceeds to checkout.

---

## 3. Availability & Slot Locks (`/provider/calendar`)
1. **Live Calendar View:**
   - Queries `GET /api/v1/availability/provider/{providerId}`.
   - Shows confirmed bookings (blue indicator) and blocked dates (red strike-through).
2. **Date Blocking & Unblocking:**
   - Provider clicks any date and taps "Block Selected Date" $\rightarrow$ calls `POST /api/v1/availability/provider/{providerId}/block`.
   - Taps "Unblock Date" $\rightarrow$ calls `POST /api/v1/availability/provider/{providerId}/unblock` to release the date.

---

## 4. Day-of Event Execution & Milestones (`/provider/orders`)
1. **Milestone Checklist:**
   - En Route: `POST /api/v1/bookings/{id}/checklist` with `{ statusStep: "EN_ROUTE" }`.
   - Arrived at Kitchen: GPS coordinates logged with `{ statusStep: "ARRIVED" }`.
   - Cooking Started: Kitchen prep underway with `{ statusStep: "COOKING_STARTED" }`.
   - Food Served: Banquet plated with `{ statusStep: "FOOD_SERVED" }`.
2. **Escrow Settlement:**
   - Customer confirms feast completion.
   - Status transitions to `COMPLETED` and payment status to `CAPTURED`.
   - Net earnings (88% after 12% platform fee) reflected in provider wallet balance.
