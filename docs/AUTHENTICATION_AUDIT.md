# Authentication Audit & Root Cause Analysis

**Project**: Book My Chef  
**Audit Date**: November 22, 2026  
**Status**: Resolved & Hardened  

---

## 1. Executive Summary

During testing of the Book My Chef mobile authentication system, two specific Clerk authentication errors were observed in screenshots:
1. **Registration Error**: `phone_number is not a valid parameter for this request` (`form_param_unknown`).
2. **Sign-In Error**: `Identifier is invalid.` (`form_identifier_not_found`).

Additionally, testing identified that the web client previously rendered hardcoded mock values (`Ananya Rao`, `+91 9876543210`) and simulated login fallbacks (`setTimeout`) when the Clerk environment variables were missing or misconfigured.

This audit details the root causes, the Clerk Frontend API (FAPI) behavior, and the comprehensive architectural remediation implemented across `@clerk/clerk-react`, Java Spring Boot, and PostgreSQL.

---

## 2. Root Cause Analysis

### A. Customer Registration: `phone_number is not a valid parameter for this request`

- **Clerk Error Code**: `form_param_unknown`
- **Error Parameter**: `phone_number`
- **Technical Mechanism**:
  1. The Clerk React SDK method `signUp.create({ phoneNumber })` serializes into a POST request payload sent to Clerk's Frontend API endpoint `/v1/client/sign_ups`.
  2. Clerk validates incoming payload parameters against the **Instance Schema** configured in the Clerk Dashboard.
  3. If **Phone Number** is disabled under *User & Authentication* $\rightarrow$ *Email, Phone, Username*, the Clerk FAPI schema validator rejects any payload containing `phone_number` as an unknown/disallowed attribute.
  4. When rejected, Clerk returns HTTP 422 Unprocessable Entity with error code `form_param_unknown` and message `"phone_number is not a valid parameter for this request"`.
- **Resolution**:
  - Activated dual-dispatch compatibility in `useClerkOtp.js` ensuring correct casing (`phoneNumber`).
  - Added deterministic error interceptor in `useClerkOtp.js` that recognizes `form_param_unknown` and guides the developer/admin to enable Phone authentication in the Clerk Dashboard.
  - Normalized all entered mobile numbers to strict E.164 format (`+91XXXXXXXXXX`) before invoking Clerk methods.

### B. Customer Sign-In: `Identifier is invalid.`

- **Clerk Error Code**: `form_identifier_not_found`
- **Error Parameter**: `identifier`
- **Technical Mechanism**:
  1. During customer sign-in via `signIn.create({ identifier: formattedPhone })`, Clerk queries its database for an existing user account possessing that verified phone number in the active Clerk instance.
  2. If the user has never registered before, or if phone number sign-in is disabled in the Clerk instance, Clerk returns `form_identifier_not_found` with the user-facing message `"Identifier is invalid."`.
  3. Previously, this raw message left users confused whether their phone number format was wrong or if they needed to sign up first.
- **Resolution**:
  - Implemented smart error translation in `useClerkOtp.js`: when `form_identifier_not_found` is returned, the application displays:  
    *`"No account found for this mobile number. Please switch to Sign Up to create your account."`*
  - Added automatic toggle suggestion so customers can immediately transition to the Registration tab without retyping their phone number.

---

## 3. Architecture Overview: Clerk + Spring Boot + PostgreSQL

```
+---------------------------------------------------------------------------------+
|                                 REACT FRONTEND                                  |
|                             (Vite + Tailwind CSS)                               |
|                                                                                 |
|   1. User enters 10-digit Indian Mobile (+91)                                   |
|   2. Formats to E.164 -> triggers useClerkOtp hook                              |
+---------------------------------------+-----------------------------------------+
                                        |
                   Clerk Frontend API   | Real SMS OTP
                   (FAPI)               v
+---------------------------------------------------------------------------------+
|                                  CLERK CLOUD                                    |
|   * Generates cryptographically secure 6-digit OTP                              |
|   * Dispatches SMS via configured SMS gateway (India +91)                       |
|   * Validates OTP upon submission -> issues Clerk JWT Session Token             |
+---------------------------------------+-----------------------------------------+
                                        |
                 Clerk Session JWT      | Verified Mobile & Clerk User ID
                                        v
+---------------------------------------------------------------------------------+
|                           JAVA SPRING BOOT BACKEND                              |
|                     (book-my-chef-backend on Railway)                           |
|                                                                                 |
|   * Validates Clerk JWT using Clerk JWKS endpoint                               |
|   * Endpoint POST /api/v1/auth/sync:                                            |
|       - Upserts user record in PostgreSQL                                       |
|       - Assigns account type (CUSTOMER, PROVIDER, ADMIN)                        |
|       - Links roles (e.g., PRO_CHEF, CATERER) and initializes profile           |
|       - Returns unified session payload                                         |
+---------------------------------------+-----------------------------------------+
                                        |
                 JDBC Pool              v
+---------------------------------------------------------------------------------+
|                              POSTGRESQL DATABASE                                |
|                        (Hosted on Railway Port 5432)                            |
|                                                                                 |
|   Tables:                                                                       |
|   - users (id, clerk_id, phone, email, full_name, role, status)                 |
|   - provider_profiles (user_id, business_name, roles, kyc_status, rating)       |
|   - bookings, payments, audit_logs                                              |
+---------------------------------------------------------------------------------+
```

---

## 4. Key Security Invariants

1. **Zero Secret Key in Frontend**: `CLERK_SECRET_KEY` is strictly confined to `apps/backend/.env` and Railway backend variables. The frontend bundle only receives the public `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PUBLISHABLE_KEY`.
2. **Zero Mock Fallbacks**: Simulated `setTimeout` logins and demo accounts have been permanently purged from `useAuthStore.js`, `CustomerAuth.jsx`, `PartnerAuth.jsx`, and `AdminLogin.jsx`.
3. **Database Authorization Truth**: Clerk manages authentication (identity and OTP delivery); PostgreSQL remains the sole source of truth for account roles, business permissions, and booking transactions.
