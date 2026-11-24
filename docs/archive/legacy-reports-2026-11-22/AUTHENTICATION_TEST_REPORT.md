# Book My Chef — Authentication Test Report

**Identity & Auth Provider:** Clerk (Custom Phone SMS OTP + Session Token)  
**Country Code Support:** Indian Mobile Numbers (`+91`)  
**Synchronization Target:** PostgreSQL `/api/v1/auth/sync`  

---

## 1. Authentication Roles & Access Matrix

| Role | Permitted Routes | Entry Screen | Verification Method |
|---|---|---|---|
| **CUSTOMER / HOST** | `/customer/*`, `/explore`, `/chef/*`, `/booking/*`, `/tracking/*` | `/auth/customer` | Indian Mobile Phone + Clerk SMS OTP |
| **SERVICE PROVIDER** | `/provider/*`, `/provider/onboarding/*`, `/provider/wallet` | `/auth/partner` | Role Selection + Phone SMS OTP + KYC |
| **PLATFORM ADMIN** | `/admin/*`, `/admin/verification`, `/admin/bookings`, `/admin/finance` | `/admin/login` | Invitation Token + Admin Phone OTP |

---

## 2. Test Execution & Verification

### Test Case 1: Real Indian Mobile Number Validation (+91)
- **Input:** `9849012345` (Valid 10-digit Telangana/AP number)
- **Formatted International String:** `+919849012345`
- **Result:** **PASS**. Dispatches Clerk SMS OTP successfully.

### Test Case 2: Invalid Mobile Number Rejection
- **Input:** `12345` or `abcd`
- **Result:** **PASS**. Inline validation halts submission before dispatching external SMS API request.

### Test Case 3: Zero Demo / Fake Data Rule
- **Check:** Verify inputs start empty without hardcoded strings or mock credentials.
- **Result:** **PASS**. All forms load with pristine, unpolluted state.

### Test Case 4: PostgreSQL Identity Synchronization
- **Trigger:** Successful Clerk OTP verification.
- **Backend Call:** `POST /api/v1/auth/sync` with `{ clerkId, phoneNumber, role }`.
- **Result:** **PASS**. User record upserted into PostgreSQL `users` table with UUID primary key. JWT token stored in secure session.

### Test Case 5: Role-Based Authorization Guards
- **Action:** Attempting to access `/admin` with `CUSTOMER` token.
- **Result:** **PASS**. Intercepted by `ProtectedRoute.jsx` and Spring Security; redirects with 403 Forbidden.
