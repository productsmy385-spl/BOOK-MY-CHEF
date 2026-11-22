# SMS OTP Authentication Test & Validation Results

**Project**: Book My Chef  
**Validation Date**: November 22, 2026  
**Scope**: Phone Normalization, Clerk SDK Dispatches, and Error Translation  

---

## 1. Indian Mobile Number & E.164 Normalization Tests

All phone inputs pass through strict E.164 normalization before invoking Clerk API endpoints.

| Input Test String | Normalized E.164 | Prefix Check (6,7,8,9) | Format Valid? | Result |
|---|---|---|---|---|
| `9876543210` | `+919876543210` | Starts with 9 | YES | **PASS** |
| `+91 98401 12044` | `+919840112044` | Starts with 9 | YES | **PASS** |
| `09840112044` | `+919840112044` | Starts with 9 | YES | **PASS** |
| `8123456789` | `+918123456789` | Starts with 8 | YES | **PASS** |
| `7987654321` | `+917987654321` | Starts with 7 | YES | **PASS** |
| `6301234567` | `+916301234567` | Starts with 6 | YES | **PASS** |
| `5123456789` | `+915123456789` | Starts with 5 (Invalid) | NO | **REJECTED** (Correct) |
| `98765` | `+9198765` | Too short (< 10 digits) | NO | **REJECTED** (Correct) |
| `abcd` | `+91` | Non-numeric | NO | **REJECTED** (Correct) |

---

## 2. Clerk SDK Method Execution Matrix

The application leverages `@clerk/clerk-react` with dual method support across versions:

| Authentication Flow | Primary SDK Call | Fallback SDK Call | Expected FAPI Response |
|---|---|---|---|
| **Sign-Up (Register)** | `signUp.create({ phoneNumber })` | N/A | HTTP 200 $\rightarrow$ Created sign-up object |
| **Send Sign-Up OTP** | `signUp.preparePhoneNumberVerification({ strategy: 'phone_code' })` | `signUp.verifications.sendPhoneCode()` | HTTP 200 $\rightarrow$ `status: "needs_attempt"` |
| **Verify Sign-Up OTP** | `signUp.attemptPhoneNumberVerification({ code })` | `signUp.verifications.verifyPhoneCode({ code })` | HTTP 200 $\rightarrow$ `status: "complete"` |
| **Sign-In (Login)** | `signIn.create({ identifier })` | N/A | HTTP 200 $\rightarrow$ `status: "needs_first_factor"` |
| **Send Sign-In OTP** | `signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId })` | N/A | HTTP 200 $\rightarrow$ `status: "needs_first_factor"` |
| **Verify Sign-In OTP** | `signIn.attemptFirstFactor({ strategy: 'phone_code', code })` | N/A | HTTP 200 $\rightarrow$ `status: "complete"` |

---

## 3. Error Interception & User Guidance Verification

| Clerk API Error Code | Raw Clerk Error Message | BMC Intercepted User Message | Actionable Guidance |
|---|---|---|---|
| `form_param_unknown` | `phone_number is not a valid parameter for this request` | `"Clerk Phone authentication is not enabled in your Clerk dashboard. Please enable 'Phone number' under User & authentication > Email, Phone, Username in dashboard.clerk.com."` | User is instructed exactly where to toggle Phone in Clerk |
| `form_identifier_not_found` | `Identifier is invalid.` | `"No account found for this mobile number. Please switch to Sign Up to create your account."` | Prompts user to register rather than failing silently |
| `form_code_incorrect` | `Incorrect verification code` | `"Incorrect verification code. Please check the SMS and re-enter the 6 digits."` | Prompts re-entry |
| `verification_expired` | `The verification has expired` | `"Verification code has expired. Please tap 'Resend Code' to receive a new OTP."` | Prompts new OTP dispatch |
| `network_error` | `Failed to fetch` | `"Network connection error. Please check your internet connection and try again."` | Handles connectivity drops |

---

## 4. Backend Database Synchronization Verification

Once Clerk validates the OTP and issues a Clerk Session, `syncUserWithPostgres` is invoked:

```http
POST /api/v1/auth/sync HTTP/1.1
Host: book-my-chef-backend-production.up.railway.app
Content-Type: application/json

{
  "clerkId": "user_2test123456789",
  "phone": "+919876543210",
  "email": "customer@example.com",
  "fullName": "Meera Nambiar",
  "userType": "CUSTOMER",
  "roles": []
}
```

- **HTTP Status**: `200 OK`
- **Response**: Synchronized user entity from PostgreSQL with assigned `CUSTOMER` role, JWT session token, and profile ID.
- **Verification Result**: **PASS**
