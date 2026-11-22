# BOOK MY CHEF — Security Implementation Guide

## 1. Architectural Model

The Book My Chef platform adopts an **Enterprise Decoupled Authentication & Authorization Architecture**:

```
[ Browser / Mobile Client ]
         │ (Phone +91)
         ▼
[ Clerk Identity Gateway ]  ───► Dispatches Real SMS OTP via Carrier
         │ (Verified Session)
         ▼
[ Signed Clerk JWT Bearer ]
         │ (HTTPS Request)
         ▼
[ Spring Boot API Security Gateway ]
  ├── 1. ClerkJwtAuthenticationFilter (Validates Expiry, Issuer, Nimbus JWKS Signature)
  ├── 2. Identity Resolver (Maps clerk_user_id to internal PostgreSQL user)
  ├── 3. RBAC Authorizer (ROLE_CUSTOMER, ROLE_PROVIDER, ROLE_ADMIN)
  └── 4. Ownership Validator (Verifies user matches requested resource)
         │
         ▼
[ PostgreSQL Internal Database (Source of Truth) ]
```

---

## 2. Key Modules Implemented

### A. Real SMS OTP Custom Flows (Frontend)
- **Component**: [`OtpInput6.jsx`](file:///c:/Users/Gopala%20Krishna/OneDrive/Desktop/BOOK%20MY%20CHEF/apps/web/src/components/auth/OtpInput6.jsx)
  - 6 individual inputs with automated forward focus, backspace navigation, paste distribution, and 60-second cooldown timer.
- **Hook**: [`useClerkOtp.js`](file:///c:/Users/Gopala%20Krishna/OneDrive/Desktop/BOOK%20MY%20CHEF/apps/web/src/hooks/useClerkOtp.js)
  - Interacts with Clerk's custom flow API for phone code verification:
    - Sign Up: `signUp.create({ phoneNumber })` $\rightarrow$ `signUp.preparePhoneNumberVerification()` $\rightarrow$ `signUp.attemptPhoneNumberVerification({ code })`
    - Sign In: `signIn.create({ identifier })` $\rightarrow$ `signIn.prepareFirstFactor()` $\rightarrow$ `signIn.attemptFirstFactor({ code })`
- **Phone Utility**: [`clerkAuthService.js`](file:///c:/Users/Gopala%20Krishna/OneDrive/Desktop/BOOK%20MY%20CHEF/apps/web/src/lib/clerkAuthService.js)
  - Formats numbers to E.164 standard (`+91[6-9]\d{9}`).

### B. Clerk JWT Verification Filter (Backend)
- **Filter**: [`ClerkJwtAuthenticationFilter.java`](file:///c:/Users/Gopala%20Krishna/OneDrive/Desktop/BOOK%20MY%20CHEF/apps/backend/src/main/java/com/marketplace/config/ClerkJwtAuthenticationFilter.java)
  - Parses Bearer tokens using Nimbus JOSE + JWT (`SignedJWT`).
  - Verifies token expiration (`exp`) and claims integrity.
  - Queries `UserRepository` to resolve the verified internal PostgreSQL user.
  - Populates Spring Security's `SecurityContextHolder` with `AuthenticatedUserPrincipal`.

### C. Role-Based Access Control (RBAC)
- **Security Config**: [`SecurityConfig.java`](file:///c:/Users/Gopala%20Krishna/OneDrive/Desktop/BOOK%20MY%20CHEF/apps/backend/src/main/java/com/marketplace/config/SecurityConfig.java)
  - Admin endpoints (`/api/v1/admin/**`): Strictly restricted to `hasRole('ADMIN')`.
  - Provider endpoints: Strictly restricted to `hasAnyRole('PROVIDER', 'ADMIN')`.
  - Customer bookings & payments: Strictly restricted to authenticated users matching resource ownership.

### D. Payment Cryptographic Integrity
- **Service**: [`RazorpayService.java`](file:///c:/Users/Gopala%20Krishna/OneDrive/Desktop/BOOK%20MY%20CHEF/apps/backend/src/main/java/com/marketplace/payments/RazorpayService.java)
  - Performs strict HMAC-SHA256 verification:
    $$\text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{secret})$$
  - Any mismatch throws `SecurityException` and immediately terminates transaction.
  - Idempotent: previously captured orders cannot be re-executed.

### E. Secure Exception Handling
- **Advice**: [`GlobalExceptionHandler.java`](file:///c:/Users/Gopala%20Krishna/OneDrive/Desktop/BOOK%20MY%20CHEF/apps/backend/src/main/java/com/marketplace/common/GlobalExceptionHandler.java)
  - Prevents leaking stack traces, internal paths, or SQL details.
  - Formats clean responses:
    - 403 Forbidden for `AccessDeniedException`
    - 401 Unauthorized for `SecurityException`
    - 400 Bad Request for validation errors
    - 500 Generic Error with internal logging for unhandled exceptions.
