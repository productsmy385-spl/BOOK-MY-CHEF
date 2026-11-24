# BOOK MY CHEF — Production Deployment Security Checklist

| Category | Verification Item | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| **Authentication** | Real SMS Delivery Configured | [x] | India (+91) enabled in Clerk SMS country allowlist |
| **Authentication** | Passwordless Phone Verification | [x] | Primary authentication factor set to phone code in Clerk |
| **Authentication** | No Hardcoded/Mock Codes | [x] | Verified in `useClerkOtp.js` and `OtpInput6.jsx` |
| **Frontend** | Dockerfile Build Arguments | [x] | `ARG VITE_CLERK_PUBLISHABLE_KEY` added to `apps/web/Dockerfile` |
| **Frontend** | Runtime Env Injection | [x] | `entrypoint.sh` writes container variables to `/env-config.js` |
| **Frontend** | Development Banner Removed | [x] | `ClerkAuthProvider.jsx` suppresses debug banners in production |
| **Backend** | Spring Security RBAC | [x] | `/api/v1/admin/**` protected with `ROLE_ADMIN` |
| **Backend** | Clerk JWT Signature Validation | [x] | `ClerkJwtAuthenticationFilter.java` verifies Nimbus SignedJWT |
| **Backend** | Parameter Tampering (IDOR) | [x] | `BookingController.java` & `ProviderController.java` use principal |
| **Payments** | HMAC-SHA256 Verification | [x] | `RazorpayService.java` strictly rejects invalid payment signatures |
| **Payments** | Payment Idempotency | [x] | Replays of captured orders are blocked |
| **Database** | PostgreSQL Constraints | [x] | 74 tables with unique constraints, indexes, and FK cascades |
| **Database** | Database Passwords Secured | [x] | Configured via environment variables; never hardcoded |
| **API** | Strict Production CORS | [x] | Wildcard `*` with credentials eliminated |
| **API** | Security Headers Enabled | [x] | Frame-Options DENY, HSTS enabled |
| **API** | Sanitized Error Responses | [x] | `GlobalExceptionHandler.java` suppresses stack traces and DB details |
| **Audit** | Immutable Administrative Trail | [x] | `AdminController.java` records all KYC status changes to `admin_audit_logs` |
| **Media** | Upload File Constraints | [x] | 10 MB maximum size and strict MIME allowlist enforced in `MediaController.java` |
