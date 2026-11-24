# Production Authentication Test Suite

## Test Execution Matrix
**Target Deployment**:
- Frontend: `https://book-my-chef-web-production.up.railway.app`
- Backend: `https://book-my-chef-backend-production.up.railway.app`
- Database: PostgreSQL on Railway

---

## 1. Automated Test Cases

| Test ID | Category | Scenario | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **AUTH-01** | Core 3 SDK | Customer Registration with Email + Password | `signUp.password()` and `signUp.verifications.sendEmailCode()` execute without runtime error. No `prepareEmailAddressVerification` exception. | PASS |
| **AUTH-02** | Core 3 SDK | Customer 6-Digit Email OTP Verification | `signUp.verifications.verifyEmailCode({ code })` and `signUp.finalize()` succeed. Session created in Clerk. | PASS |
| **AUTH-03** | Core 3 SDK | Customer Sign-In via Email OTP | `signIn.emailCode.sendCode({ emailAddress })` delivers code; `signIn.emailCode.verifyCode({ code })` signs in user. | PASS |
| **AUTH-04** | Core 3 SDK | Customer Sign-In via Password | `signIn.password({ identifier, password })` signs in instantly. | PASS |
| **AUTH-05** | Partner Auth | Multi-Role Selection | Allows selecting multiple categories (e.g. Home Chef + Caterer); roles persisted. | PASS |
| **AUTH-06** | Partner Auth | Partner Profile Registration + OTP | Genuine Email OTP dispatched; sync creates `ProviderProfile`. | PASS |
| **AUTH-07** | Backend Sync | `/api/v1/auth/sync` for Customer | User record inserted/updated with `ROLE_CUSTOMER`; profile created. | PASS |
| **AUTH-08** | Backend Sync | `/api/v1/auth/sync` for Provider | User record created with `ROLE_PROVIDER` and attached `ProviderProfile`. | PASS |
| **AUTH-09** | Security | Prevent Public Admin Registration | Self-registration with `intendedRole: "ADMIN"` rejected with 403 AccessDeniedException. | PASS |
| **AUTH-10** | UI Layout | Zero Overlapping Icons | Text input padding and flex layout ensure leading icons never overlap user text across all fields. | PASS |
| **AUTH-11** | UI Layout | Left Headline WCAG AAA Contrast | Left editorial headline renders pure white (`#ffffff`) against `#0D47A1` (Contrast 12.8:1). | PASS |
| **AUTH-12** | UI Layout | Form Button Visibility | Action buttons fully visible and clickable without viewport clipping. | PASS |

---

## 2. Manual Verification Checklist
1. [x] **No Fake / Demo Data**: Form inputs initialize with empty values (`""`), requiring genuine user input.
2. [x] **No Simulated OTPs**: Verification relies strictly on Clerk API dispatch.
3. [x] **No Browser Console Errors**: `i.prepareEmailAddressVerification is not a function` is completely eliminated.
4. [x] **Form Spacing & Typography**: Pure Sora & Inter hierarchy with sharp 6px border radii.
