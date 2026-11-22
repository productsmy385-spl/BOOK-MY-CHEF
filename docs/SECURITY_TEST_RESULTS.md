# BOOK MY CHEF — Automated Security Test Results

**Test Suite Executed**: 2026-11-22  
**Harness**: JUnit 5 + Maven Surefire 3.2.5 (Java 21)  
**Status**: **ALL TESTS PASSED (0 FAILURES, 0 ERRORS)**

---

## 1. Test Summary

```
-------------------------------------------------------
 T E S T S
-------------------------------------------------------
Running com.marketplace.security.ClerkTokenSecurityTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.774 s
Running com.marketplace.security.RazorpaySecurityTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.451 s

Results:
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

---

## 2. Detailed Test Cases

### A. Razorpay Payment Cryptographic Verification (`RazorpaySecurityTest.java`)

| Test Case | Description | Result |
| :--- | :--- | :--- |
| `testValidSignatureVerification` | Computes valid HMAC-SHA256 signature using authorized secret. Asserts that verification evaluates to `true`. | **PASSED** |
| `testTamperedSignatureRejection` | Attempts verification with an altered signature payload. Asserts that verification evaluates to `false` and is rejected. | **PASSED** |
| `testWrongSecretRejection` | Attempts verification with signature created by an untrusted secret key. Asserts rejection. | **PASSED** |

### B. Clerk JWT & Session Expiration (`ClerkTokenSecurityTest.java`)

| Test Case | Description | Result |
| :--- | :--- | :--- |
| `testActiveTokenValid` | Creates signed token with future `exp`. Asserts token claims are intact and expiration date is not expired. | **PASSED** |
| `testExpiredTokenDetected` | Creates token with expired timestamp (`now - 120s`). Asserts that filter identifies token as expired and denies request. | **PASSED** |
| `testMalformedTokenRejected` | Passes invalid non-JWT string. Asserts that parse exception is caught and rejected without server crash. | **PASSED** |

---

## 3. Frontend Build & Static Asset Verification

```
vite v8.3.8 building client environment for production...
transforming...
✓ 130 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.21 kB │ gzip:   0.63 kB
dist/assets/index-Csg9cd0O.css   39.01 kB │ gzip:   7.22 kB
dist/assets/index-DogxpwYa.js   622.74 kB │ gzip: 159.20 kB
✓ built in 5.05s
```

- Zero lint errors.
- Zero bundling failures.
- Runtime env script `<script src="/env-config.js"></script>` verified in `dist/index.html`.
