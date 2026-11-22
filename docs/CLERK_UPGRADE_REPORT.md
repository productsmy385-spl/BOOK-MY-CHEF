# Clerk React SDK Upgrade Report (v5 $\rightarrow$ v6)

**Project**: Book My Chef  
**Upgrade Type**: Major Architectural SDK Migration  
**Date**: November 22, 2026  
**Status**: COMPLETE & VERIFIED  

---

## 1. Upgrade Objectives

1. Eliminate the `"This app uses an outdated version of Clerk"` security lock.
2. Upgrade frontend authentication to official `@clerk/react` Core 3 architecture.
3. Preserve 100% of the custom UI, styling, pure white palette, and Sora typography.
4. Ensure full compatibility with genuine Indian mobile (+91) SMS OTP delivery.

---

## 2. Step-by-Step Migration Actions

### Step 1: Dependency Replacement
- Executed `npm install @clerk/react@latest` in `apps/web`.
- Executed `npm uninstall @clerk/clerk-react` in `apps/web`.
- Resulting `apps/web/package.json`:
  ```json
  "dependencies": {
    "@clerk/react": "^6.19.4",
    ...
  }
  ```

### Step 2: Provider Modernization (`ClerkAuthProvider.jsx`)
- Replaced legacy import:
  ```javascript
  // Before
  import { ClerkProvider } from '@clerk/clerk-react';

  // After
  import { ClerkProvider } from '@clerk/react';
  ```
- Retained clean environment resolution logic (`window.__ENV__` $\rightarrow$ `import.meta.env` $\rightarrow$ fallback).

### Step 3: Custom Hook Modernization (`useClerkOtp.js`)
- Replaced legacy import:
  ```javascript
  // Before
  import { useSignUp, useSignIn, useClerk } from '@clerk/clerk-react';

  // After
  import { useSignUp, useSignIn, useClerk } from '@clerk/react';
  ```
- Ensured dual-dispatch compatibility for sign-up and sign-in factors (`signUp.preparePhoneNumberVerification` and `signIn.prepareFirstFactor`).

### Step 4: Lockfile Regeneration & Build Verification
- Regenerated `apps/web/package-lock.json` with audited dependencies (0 vulnerabilities).
- Executed `npm run build`:
  - `dist/index.html` (1.33 kB)
  - `dist/assets/index-DaGaLq2x.css` (41.79 kB)
  - `dist/assets/index-BUdN0eWX.js` (687.81 kB)
  - Build finished in **7.04s** with 0 errors.

---

## 3. Breaking Changes & Deprecations Handled

| Feature / API | Deprecated Behavior | Modern Core 3 Implementation |
|---|---|---|
| Package Name | `@clerk/clerk-react` | `@clerk/react` |
| ClerkJS Engine | v5 (Triggered minimum version error) | v6.46.3+ (Fully compliant with Clerk protections) |
| Session Activation | Direct session assignment | `setActive({ session: result.createdSessionId })` |
| OTP Factor Strategy | Generic factor lookups | Explicit `strategy: 'phone_code'` with factor ID resolution |
