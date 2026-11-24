# BOOK MY CHEF — Comprehensive Security Audit Report

**Audit Conducted**: 2026-11-22  
**Target Architecture**: React (Vite) + Java Spring Boot (v3.3.5) + PostgreSQL (v16) + Clerk Phone SMS OTP + Razorpay Escrow  
**Classification System**: CRITICAL, HIGH, MEDIUM, LOW  

---

## 1. Executive Summary

A comprehensive architectural and code-level security audit of the Book My Chef platform was performed, reviewing frontend authentication, backend API authorization, Clerk identity synchronization, database constraints, payment signature processing, and deployment configurations across local and Railway cloud environments.

Five (5) CRITICAL vulnerabilities and four (4) HIGH vulnerabilities were discovered in the original codebase and have been systematically resolved and verified.

---

## 2. Vulnerability Assessment Matrix

| Finding ID | Title | Component | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CRIT-01** | Global API Authorization Bypass (`/api/v1/**` PermitAll) | Backend (`SecurityConfig.java`) | **CRITICAL** | **FIXED** |
| **CRIT-02** | Insecure Wildcard CORS with Credentials (`allowedOriginPatterns("*")`) | Backend (`SecurityConfig.java`) | **CRITICAL** | **FIXED** |
| **CRIT-03** | Razorpay HMAC-SHA256 Signature Bypass | Payments (`RazorpayService.java`) | **CRITICAL** | **FIXED** |
| **CRIT-04** | Insecure Direct Object Reference (IDOR) & User Impersonation | Bookings (`BookingController.java`) | **CRITICAL** | **FIXED** |
| **CRIT-05** | Production Information Leakage & Path Disclosure | Frontend (`ClerkAuthProvider.jsx`) | **CRITICAL** | **FIXED** |
| **HIGH-01** | Missing Docker Build Argument (`VITE_CLERK_PUBLISHABLE_KEY`) | DevOps (`apps/web/Dockerfile`) | **HIGH** | **FIXED** |
| **HIGH-02** | Missing Clerk Bearer JWT Verification Filter | Security (`ClerkJwtAuthenticationFilter.java`) | **HIGH** | **FIXED** |
| **HIGH-03** | Unprotected Platform Administrator Endpoints | Governance (`AdminController.java`) | **HIGH** | **FIXED** |
| **HIGH-04** | Missing File & KYC Upload Authorization Controls | Media (`MediaController.java`) | **HIGH** | **FIXED** |
| **MED-01** | Missing HTTP Security Headers (HSTS, Frame-Options) | Web Security (`SecurityConfig.java`) | **MEDIUM** | **FIXED** |
| **MED-02** | Lack of Server-Side Exception Sanitization (Stack Trace Leakage) | Error Handling (`GlobalExceptionHandler.java`)| **MEDIUM** | **FIXED** |

---

## 3. Detailed Vulnerability Analyses & Remediations

### CRIT-01: Global API Authorization Bypass
- **Location**: `apps/backend/src/main/java/com/marketplace/config/SecurityConfig.java`
- **Root Cause**: The Spring Security filter chain matched `/api/v1/**` with `.permitAll()`. This exposed all private endpoints, including admin analytics and booking operations, to unauthenticated internet traffic.
- **Remediation**: Reconfigured Spring Security with fine-grained RBAC matching. Protected routes require `ROLE_CUSTOMER`, `ROLE_PROVIDER`, or `ROLE_ADMIN`. Added `ClerkJwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`.

### CRIT-02: Insecure Wildcard CORS with Credentials
- **Location**: `apps/backend/src/main/java/com/marketplace/config/SecurityConfig.java`
- **Root Cause**: Setting `allowedOriginPatterns(List.of("*"))` in combination with `allowCredentials(true)` violates W3C CORS security guidelines and allows arbitrary cross-origin malicious scripts to read authenticated session responses.
- **Remediation**: Locked origins strictly to authorized domains (`http://localhost:*`, `https://*.up.railway.app`, `https://*.railway.app`).

### CRIT-03: Razorpay HMAC-SHA256 Signature Bypass
- **Location**: `apps/backend/src/main/java/com/marketplace/payments/RazorpayService.java`
- **Root Cause**: The method `verifyAndCapture()` computed `signatureValid`, but on failure merely emitted a `log.warn()` and proceeded to set status to `ESCROW_HELD` and confirmed the booking!
- **Remediation**: Throws `SecurityException("Payment signature verification failed. Untrusted payment payload rejected.")` immediately upon mismatch. Added transaction idempotency checks to prevent double-capture replays.

### CRIT-04: IDOR & Customer Impersonation
- **Location**: `apps/backend/src/main/java/com/marketplace/booking/BookingController.java`
- **Root Cause**: Controllers accepted `@RequestParam(required = false) UUID customerId` and defaulted to a static UUID fallback, allowing callers to view and create bookings on behalf of other users without credential checks.
- **Remediation**: Injected `@AuthenticationPrincipal AuthenticatedUserPrincipal principal`. Customer and provider identities are resolved exclusively from verified Clerk JWT tokens and PostgreSQL authoritative user records.

### CRIT-05 & HIGH-01: Information Leakage & Docker Build Key Loss
- **Location**: `apps/web/src/components/auth/ClerkAuthProvider.jsx` & `apps/web/Dockerfile`
- **Root Cause**: The web app rendered an intrusive banner disclosing internal file system paths (`apps/web/.env`) and a prompt in production. Furthermore, `apps/web/Dockerfile` lacked `ARG VITE_CLERK_PUBLISHABLE_KEY`, meaning Railway's Docker build stripped the environment variable during `npm run build`.
- **Remediation**:
  1. Updated `apps/web/Dockerfile` with `ARG VITE_CLERK_PUBLISHABLE_KEY` and `ARG VITE_API_BASE_URL`.
  2. Implemented `apps/web/entrypoint.sh` for runtime container environment variable injection into `/env-config.js`.
  3. Hardened `ClerkAuthProvider.jsx` to completely eliminate debug banners and internal path disclosure in production environments.
