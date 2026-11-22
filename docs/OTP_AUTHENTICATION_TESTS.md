# Genuine SMS OTP Authentication Test Suite

**Project**: Book My Chef  
**Testing Scope**: Clerk Core 3 Phone Authentication & PostgreSQL Integration  
**Date**: November 22, 2026  
**Status**: PASSED  

---

## 1. Authentication Flows Tested

### Flow A: New Customer Registration
1. **User Input**:
   - Full Name: User's genuine name (clean initial input state).
   - Mobile Number: `8464091436` (Indian 10-digit format).
   - Terms & Conditions: Accepted.
2. **Phone Normalization**:
   - `formatToE164("8464091436")` $\rightarrow$ `+918464091436`
   - Prefix validation: Starts with `8` (valid Indian mobile range: 6, 7, 8, 9).
3. **Clerk Sign-Up Dispatch**:
   - `signUp.create({ phoneNumber: '+918464091436' })` $\rightarrow$ Created sign-up object.
   - `signUp.preparePhoneNumberVerification({ strategy: 'phone_code' })` $\rightarrow$ Dispatches genuine SMS OTP.
4. **OTP Verification**:
   - Submitting genuine 6-digit code:
     `signUp.attemptPhoneNumberVerification({ code: 'XXXXXX' })` $\rightarrow$ `status: 'complete'`.
   - `setActive({ session: result.createdSessionId })` activates client session.
5. **Database Synchronization**:
   - Triggers `POST /api/v1/auth/sync` with payload `{ clerkId, phone, fullName, userType: 'CUSTOMER' }`.
   - Upserts record into PostgreSQL `users` table.
   - Automatically navigates to `/customer/home`.

### Flow B: Existing Customer Sign-In
1. **User Input**:
   - Mobile Number: `8464091436`.
2. **Clerk Sign-In Factor Setup**:
   - `signIn.create({ identifier: '+918464091436' })`
   - Discovers `phone_code` in `supportedFirstFactors`.
   - `signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId })` $\rightarrow$ SMS sent.
3. **OTP Verification**:
   - `signIn.attemptFirstFactor({ strategy: 'phone_code', code: 'XXXXXX' })` $\rightarrow$ `status: 'complete'`.
   - Client session activated; synchronized with database; navigates to `/customer/home`.

### Flow C: Service Partner Registration & Role Selection
1. **Role Multi-Select**:
   - Available roles: Professional Chef, Caterer, Event Manager, Mixologist/Bartender, Server, etc.
   - Dynamically records selected roles in state (e.g. `['PRO_CHEF', 'CATERER']`).
2. **Phone Verification**:
   - Same robust Clerk SMS OTP verification.
3. **Provider Initialization**:
   - `POST /api/v1/auth/sync` with `userType: 'PROVIDER'` and `roles`.
   - PostgreSQL initializes `provider_profiles` record.
   - Automatically navigates to `/provider/dashboard`.

---

## 2. Security & Failure Mode Test Matrix

| Test Scenario | Input / Action | System Behavior | Validation |
|---|---|---|---|
| **Invalid Mobile Number** | `5123456789` (starts with 5) | Rejection: `"Please enter a valid 10-digit Indian mobile number (+91 followed by 6, 7, 8, or 9)."` | **PASS** |
| **Short Mobile Number** | `98765` (< 10 digits) | Rejection before API call | **PASS** |
| **Incorrect OTP Code** | `000000` | Clerk returns `form_code_incorrect` $\rightarrow$ `"Incorrect verification code. Please check your SMS and enter the 6-digit code again."` | **PASS** |
| **Expired OTP Code** | Submitted after 10 min | Clerk returns `verification_expired` $\rightarrow$ `"This verification code has expired. Please click 'Resend OTP' to receive a new code."` | **PASS** |
| **Unregistered Sign-In** | Unregistered phone | Clerk returns `form_identifier_not_found` $\rightarrow$ `"No registered account found with this mobile number. Please switch to 'Sign Up' to register your account first."` | **PASS** |
| **Role Protection** | Customer token on `/admin/dashboard` | Route guard verifies `userType === 'ADMIN'`; redirects unauthorized user to `/customer/home` | **PASS** |
| **API PermitAll** | Unauthenticated `GET /api/v1/search/providers` | HTTP 200 OK — Public discovery allowed | **PASS** |
| **Protected Mutation** | Unauthenticated `POST /api/v1/bookings` | HTTP 401 Unauthorized — Token required | **PASS** |
