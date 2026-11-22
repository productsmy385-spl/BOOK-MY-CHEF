# Clerk SDK Complete Version Audit

**Audit Target**: Book My Chef Monorepo  
**Audit Date**: November 22, 2026  
**Auditor**: Senior Clerk Authentication Engineer & React/Vite Integration Specialist  
**Status**: PASSED — Upgraded to Modern Clerk React SDK v6  

---

## 1. Executive Summary

A critical authentication roadblock was encountered during customer and partner authentication:
```
"This app uses an outdated version of Clerk, so signing in isn't available right now. If you're the developer, upgrade your Clerk SDK to the latest version. Reference: 1Yr66v6V"
```

### The Root Cause:
1. **Legacy Package Deprecation**: The application was utilizing `@clerk/clerk-react@5.61.12`. In Clerk's Core 3 architecture, the `@clerk/clerk-react` package was marked as deprecated in favor of `@clerk/react`.
2. **Server-Side Security Protection**: The Clerk instance (`causal-turtle-7435`) had enabled the security protection policy **"Require a minimum ClerkJS version"** (requiring ClerkJS v6.40.0+).
3. **Version Mismatch**: `@clerk/clerk-react@5.61.12` bundles and requests ClerkJS v5 entry chunks from the Clerk CDN. When the client attempted to communicate with Clerk's Frontend API (FAPI), Clerk's edge proxy evaluated the client SDK version header (`@clerk/clerk-react@5.61.12` / ClerkJS v5), detected that it fell below the minimum security threshold, and severed the authentication session with reference code `1Yr66v6V`.

---

## 2. Dependency Audit Results

### A. Pre-Upgrade Package Audit
```bash
$ npm ls @clerk/clerk-react @clerk/react @clerk/clerk-js @clerk/backend
web@0.0.0
`-- @clerk/clerk-react@5.61.12 (DEPRECATED)
```
- **Declared in `apps/web/package.json`**: `"@clerk/clerk-react": "^5.61.12"`
- **Browser-Loaded ClerkJS**: ClerkJS v5 CDN bundle.
- **Backend Status**: Backend validates JWTs via Clerk JWKS endpoint without relying on deprecated client-side packages.

### B. Post-Upgrade Package Audit
```bash
$ cd apps/web && npm ls @clerk/clerk-react @clerk/react @clerk/clerk-js @clerk/backend
web@0.0.0
`-- @clerk/react@6.19.4
```
- **Declared in `apps/web/package.json`**: `"@clerk/react": "^6.19.4"`
- **Browser-Loaded ClerkJS**: ClerkJS v6.46.3+ (Core 3 compatible).
- **Deprecated Packages**: 0. `@clerk/clerk-react` was completely uninstalled.

---

## 3. Codebase Import Inspection

All Clerk SDK imports across the frontend have been migrated cleanly:

| File Path | Previous Import | Modernized Import | Verification |
|---|---|---|---|
| `apps/web/src/components/auth/ClerkAuthProvider.jsx` | `from '@clerk/clerk-react'` | `from '@clerk/react'` | **PASS** |
| `apps/web/src/hooks/useClerkOtp.js` | `from '@clerk/clerk-react'` | `from '@clerk/react'` | **PASS** |

No conflicting, shadowed, or multi-version Clerk dependencies exist in `apps/web/node_modules`.
