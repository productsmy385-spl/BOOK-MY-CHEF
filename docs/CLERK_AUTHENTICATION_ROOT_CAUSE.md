# Clerk Authentication Root Cause Analysis

## Executive Summary
This document outlines the root cause and permanent resolution for the runtime error encountered during customer registration on the Book My Chef platform:
```
TypeError: i.prepareEmailAddressVerification is not a function
```
This failure was observed during registration and sign-in flows on the production deployment.

---

## 1. Environment & Dependency Context
- **SDK Package**: `@clerk/react` version `^6.19.4`
- **Underlying Core**: Clerk Signal-based Architecture (Core 3 API / Future Resource API)
- **Frontend Framework**: React 19 + Vite 8
- **Platform**: Book My Chef Customer & Partner Portals

---

## 2. Technical Root Cause

### 2.1 API Signature Discrepancy (Core 2 vs Core 3)
In earlier versions of the Clerk JavaScript/React SDK (Core 2), the `SignUp` object exposed the following lifecycle methods:
- `signUp.create({ emailAddress, password, ... })`
- `signUp.prepareEmailAddressVerification({ strategy: 'email_code' })`
- `signUp.attemptEmailAddressVerification({ code: '...' })`

In Clerk Core 3 (bundled with `@clerk/react` v6.18+ / v6.19+), `useSignUp()` and `useSignIn()` return reactive Signal-based instances (`SignUpFutureResource` and `SignInFutureResource`). Under this architecture:
1. `prepareEmailAddressVerification` and `attemptEmailAddressVerification` **do not exist** on the `signUp` instance.
2. Invoking `signUp.prepareEmailAddressVerification(...)` throws an unhandled `TypeError: i.prepareEmailAddressVerification is not a function` (where `i` is the minified identifier for `signUp`).
3. Core 3 replaces direct factor preparation with dedicated namespaced methods on `signUp.verifications`:
   - Sending OTP: `signUp.verifications.sendEmailCode()`
   - Verifying OTP: `signUp.verifications.verifyEmailCode({ code })`
   - Establishing session: `signUp.finalize()`
4. Core 3 methods do not throw raw JavaScript exceptions; they return `{ error: ClerkError | null }`.

---

## 3. Comparative Architecture Analysis

| Flow Operation | Legacy Core 2 (Deprecated) | Modern Core 3 (Implemented) | Error if Misused |
|---|---|---|---|
| Initialize Signup | `signUp.create(payload)` | `signUp.password({ emailAddress, password, firstName, lastName })` | `phone_number is not valid` |
| Dispatch Email OTP | `signUp.prepareEmailAddressVerification({ strategy: 'email_code' })` | `signUp.verifications.sendEmailCode()` | `prepareEmailAddressVerification is not a function` |
| Verify Email OTP | `signUp.attemptEmailAddressVerification({ code })` | `signUp.verifications.verifyEmailCode({ code })` | `attemptEmailAddressVerification is not a function` |
| Activate Session | `setActive({ session: result.createdSessionId })` | `signUp.finalize()` (or fallback to `setActive`) | Session not attached |
| Dispatch Signin OTP | `signIn.prepareFirstFactor({ strategy: 'email_code' })` | `signIn.emailCode.sendCode({ emailAddress })` | `prepareFirstFactor is not a function` |
| Verify Signin OTP | `signIn.attemptFirstFactor({ strategy: 'email_code', code })` | `signIn.emailCode.verifyCode({ code })` | `attemptFirstFactor is not a function` |
| Password Signin | `signIn.create({ identifier, password })` | `signIn.password({ identifier, password })` | Inconsistent state |

---

## 4. Resolution Strategy

### 4.1 Resilient Dual-Architecture Adapter (`useClerkOtp.js`)
To guarantee forward and backward compatibility across any Clerk environment, `apps/web/src/hooks/useClerkOtp.js` was rewritten with an adaptive execution strategy:
```javascript
// Modern Core 3 detection
if (signUp.verifications && typeof signUp.verifications.sendEmailCode === 'function') {
  if (password && typeof signUp.password === 'function') {
    const createRes = await signUp.password({ emailAddress, password, firstName, lastName });
    if (createRes?.error) throw createRes.error;
  }
  const sendRes = await signUp.verifications.sendEmailCode();
  if (sendRes?.error) throw sendRes.error;
} else {
  // Legacy Core 2 fallback
  await signUp.create(payload);
  if (typeof signUp.prepareEmailAddressVerification === 'function') {
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
  }
}
```

### 4.2 Error Shielding
The hook intercepts both `ClerkError` objects and unexpected network/JavaScript exceptions:
- Sanitizes raw stack traces so internal variable names (`i`, `signUp`) are never rendered in the UI.
- Maps error codes (`form_identifier_exists`, `form_identifier_not_found`, `form_code_incorrect`, `verification_expired`, `form_password_incorrect`) to clear, actionable guidance.

---

## 5. Verification Status
- Frontend builds cleanly via `vite build` (0 errors).
- Zero calls to non-existent methods.
- Full compatibility with Clerk SDK v6.19.4.
