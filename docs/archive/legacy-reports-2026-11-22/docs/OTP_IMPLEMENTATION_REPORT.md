# Production OTP Implementation Report

## Project: BOOK MY CHEF
**Component**: Authentication & Verification Subsystem  
**Authentication Provider**: Clerk  
**Persistence Layer**: PostgreSQL (`users`, `user_profiles`, `provider_profiles`)  
**Deployment**: Railway Production (`book-my-chef-web`, `book-my-chef-backend`)

---

## 1. Authentication Modalities Implemented

### 1.1 Customer Portal (`/auth/customer`)
1. **Registration**:
   - Fields: Full Name, Email Address, Password (min 8 chars), Host City / Location, Terms acceptance checkbox.
   - Flow:
     1. Form submission calls `signUp.password({ emailAddress, password, firstName, lastName })`.
     2. Dispatches real Clerk 6-digit Email Verification OTP via `signUp.verifications.sendEmailCode()`.
     3. Transition to 6-box individual digit verification interface (`OtpInput6`).
     4. Code entry triggers `signUp.verifications.verifyEmailCode({ code })` and `signUp.finalize()`.
     5. Backend synchronization via `/api/v1/auth/sync` saves user in PostgreSQL.
     6. Client redirect to `/customer/home`.
2. **Sign In**:
   - Modality A (Email OTP): User enters registered email; genuine OTP sent via `signIn.emailCode.sendCode()`; verified via `signIn.emailCode.verifyCode()`; finalized with `signIn.finalize()`.
   - Modality B (Password): User enters email and password; instant authenticated session established via `signIn.password()` and `signIn.finalize()`.

### 1.2 Service Partner Portal (`/auth/partner`)
1. **Multi-Role First Selection**:
   - 12 authoritative roles (Home Chef, Professional Chef, Personal Chef, Caterer, Event Planner, Event Manager, Decorator, Photographer, Videographer, Bartender, Server, Kitchen Assistant).
   - Partners can select multiple roles simultaneously.
2. **Profile & Verification**:
   - Fields: Professional Name, Culinary Brand/Studio (Optional), Email Address, Password (min 8 chars), Operating Base City.
   - Genuine Clerk Email OTP dispatched and verified.
   - Backend synchronization creates `ProviderProfile` linked to verified PostgreSQL `User`.
   - Client redirect to `/provider/dashboard`.

---

## 2. API Contract & Data Synchronization

### 2.1 Backend Contract (`/api/v1/auth/sync`)
- Method: `POST`
- Payload:
  ```json
  {
    "email": "chef.raghavendra@atelier.in",
    "fullName": "Chef Raghavendra Rao",
    "intendedRole": "PROVIDER",
    "businessName": "Royal Dakshin Culinary Studio",
    "roles": ["PRO_CHEF", "CATERER"]
  }
  ```
- Response:
  ```json
  {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "clerkId": "user_2xxxxxxxxx",
    "roles": ["ROLE_PROVIDER"],
    "profileCompleted": true,
    "providerProfileId": "7b134889-10cf-481b-a9a3-5c2f34e6d4c1",
    "fullName": "Chef Raghavendra Rao",
    "email": "chef.raghavendra@atelier.in"
  }
  ```

---

## 3. Security & Anti-Fraud Measures
- **No Mocking**: Zero hardcoded codes, simulated timeouts, or browser-generated OTPs.
- **Rate-Limiting**: 60-second client-side resend cooldown timer + Clerk platform-level rate limiting.
- **Credential Separation**: `VITE_CLERK_PUBLISHABLE_KEY` is public; `CLERK_SECRET_KEY` remains strictly contained on the backend.
- **Admin Shielding**: Administrative self-registration via public sign-up is strictly rejected by `AuthService.java`.
