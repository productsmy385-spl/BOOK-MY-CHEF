# Book My Chef — Form Validation Audit

**Audit Objective:** Inspect all forms across the application for strict input validation, phone number formatting, required field rules, error handling, and security guards.

---

## 1. Authentication & Onboarding Forms

### A. Customer Authentication (`CustomerAuth.jsx`)
- **Phone Number Field:**
  - Mandatory format: Indian mobile numbers with `+91` country code.
  - Regex pattern: `/^[6-9]\d{9}$/` (10 digits starting with 6, 7, 8, or 9).
  - Clean state: Zero fake pre-filled phone numbers. User must enter real phone.
  - Validation response: Immediate inline validation alert if digits < 10 or non-numeric characters entered.
- **OTP Verification Field:**
  - 6-digit numeric input with auto-tabbing and numeric keyboard invocation.
  - Empty input prevention: Verification button disabled until exactly 6 digits are typed.
  - Error state: Displays Clerk-generated verification error (e.g., "Invalid OTP code entered", "Code expired").
- **Terms & Privacy Agreement:**
  - Mandatory checkbox. Form submission halted if unchecked.

### B. Partner / Provider Registration (`PartnerAuth.jsx`)
- **Business Role Selection (Pre-flight requirement):**
  - Mandatory selection of 1 of 12 roles before entering registration details (`HOME_CHEF`, `PRO_CHEF`, `PERSONAL_CHEF`, `CATERER`, `EVENT_PLANNER`, `EVENT_MANAGER`, `DECORATOR`, `PHOTOGRAPHER`, `VIDEOGRAPHER`, `BARTENDER`, `SERVER`, `KITCHEN_ASSISTANT`).
  - Next button disabled until role is actively chosen.
- **Provider Details Form:**
  - `fullName`: Minimum 3 characters, alphabetic with spaces.
  - `brandName`: Mandatory trade name or personal atelier title.
  - `city`: Pre-selected with Hyderabad / Telangana / Andhra tier-1 cities.
  - `experienceYears`: Integer between 1 and 40.
  - `fssaiNumber`: 14-digit FSSAI food safety license format validation (`/^\d{14}$/`) for culinary roles.
  - `phone`: Real Indian mobile format (`+91` with 10 digits).

### C. Administrator Login (`AdminLogin.jsx`)
- **Invitation Code:**
  - Validates against authoritative admin invitation tokens (`ATELIER-ADMIN-2026-HYD`, `ADMIN-CHEF-PRIVILEGED-01`).
  - Rejection: Non-matching invitation codes trigger immediate unauthorized error.
- **Admin Phone OTP:**
  - Verification guarded by admin whitelist in PostgreSQL user table (`role = 'PLATFORM_ADMIN'`).

---

## 2. Booking Workflow Forms

### A. Step 1: Event Details (`BookingStep1Requirements.jsx`)
- `eventType`: Required selection from preset occasion tags (Family Gathering, Housewarming, Birthday, Puja, Corporate).
- `eventDate`: Native date picker restricted to today's date + 1 day minimum (preventing past date bookings).
- `timeSlot`: Required dropdown (Lunch 12:30 PM, Dinner 08:00 PM, High Tea, Breakfast).
- `guestCount`: Minimum 5 guests, maximum 500 guests. Enforced by stepper limits.
- `location`: Required address string. Validation prevents empty submission.

### B. Step 2: Service Preferences (`BookingStep2ServiceMode.jsx`)
- `serviceMode`: Mandatory choice of `CHEF_VISITS_HOME`, `COOK_AND_DELIVER`, or `VENUE_BANQUET`.
- `dietary`: Pure Vegetarian, Non-Vegetarian, Jain, Halal selection.
- `spiceLevel`: Mild, Medium, or Andhra Authentic.
- `specialNotes`: Optional textarea sanitizing HTML injection tags.

### C. Step 4: Checkout & Payment (`BookingStep4Payment.jsx`)
- `promoCode`: Validates against backend promo rules (`ATELIER250` for ₹250 flat discount).
- `paymentStage`: Strict enum check (`ADVANCE` 30% vs `FULL` 100%).
- `selectedMethod`: UPI (`UPI_GPAY`, `UPI_PHONEPE`) or `CARDS`.

---

## 3. Administrative Moderation Forms

### A. KYC Verification Queue (`AdminVerificationQueue.jsx`)
- `decision`: Required action (`APPROVE` or `REJECT`).
- `notes`: Required moderation reason persisted into `audit_logs` for dispute defense.

### B. Financial Commission Settings (`AdminFinance.jsx`)
- `commissionRate`: Numeric float validated between `5.0%` and `30.0%`. Form rejects negative or > 100% values.
