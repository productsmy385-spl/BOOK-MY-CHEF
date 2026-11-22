# Clerk Configuration Guide — Phone SMS OTP

**Target Audience**: Developers, DevOps, Platform Administrators  
**Platform**: Book My Chef  
**Updated**: November 22, 2026  

---

## 1. Prerequisites Checklist

To allow real SMS OTP delivery in India (+91) without API errors (`form_param_unknown`), the following settings **must be enabled** in the active Clerk Dashboard.

| Step | Section | Setting Name | Required Value | Purpose |
|---|---|---|---|---|
| **1** | **User & authentication** $\rightarrow$ **Email, Phone, Username** | **Phone number** | `ON` (Checked) | Adds phone attribute to user schema |
| **2** | **User & authentication** $\rightarrow$ **Email, Phone, Username** | **Sign-up with phone** | `ON` (Checked) | Permits customer & partner registration |
| **3** | **User & authentication** $\rightarrow$ **Email, Phone, Username** | **Sign-in with phone** | `ON` (Checked) | Permits return login via phone |
| **4** | **User & authentication** $\rightarrow$ **Email, Phone, Username** | **Verify at sign-up** | `SMS verification code` | Mandates real OTP verification |
| **5** | **SMS** $\rightarrow$ **Settings** | **Country Allowlist** | Add `India (+91)` | Permits SMS dispatch to Indian carriers |
| **6** | **API Keys** | **Publishable Key & Secret Key** | Match active instance | Frontend & Backend must use same instance |

---

## 2. Step-by-Step Dashboard Setup

### Step 1: Enable Phone Numbers in User Schema
1. Open the [Clerk Dashboard](https://dashboard.clerk.com/).
2. Select your Book My Chef application instance (`causal-turtle-7435`).
3. In the left navigation, click **Configure** $\rightarrow$ **User & authentication** $\rightarrow$ **Email, Phone, Username**.
4. Locate the **Phone number** row:
   - Check the box to enable **Phone number**.
   - Check **Sign-up with phone**.
   - Check **Sign-in with phone**.
   - Under *Verification strategy*, select **SMS verification code**.
5. Click **Save changes** at the bottom of the page.

> [!IMPORTANT]
> If "Phone number" is disabled in this screen, Clerk will reject any registration attempt with:  
> `phone_number is not a valid parameter for this request` (`form_param_unknown`).

---

### Step 2: Configure SMS Country Allowlist for India (+91)
1. In the left navigation, click **Configure** $\rightarrow$ **SMS** $\rightarrow$ **Settings** (or **Phone numbers** / **SMS settings**).
2. Locate the **Allowed countries** list.
3. Ensure **India (+91)** is checked.
4. Save changes.

> [!NOTE]
> Clerk development instances include a generous allocation of free SMS test verification codes per month to all allowlisted country destinations. In production, ensure an SMS provider (Twilio or Clerk Managed SMS) is funded.

---

### Step 3: Match Frontend and Backend API Keys

Verify that both frontend and backend are pointing to the exact same Clerk instance:

#### A. Frontend (`apps/web/.env` and Railway `book-my-chef-web`):
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2F1c2FsLXR1cnRsZS03NDM1LmNsZXJrLmFjY291bnRzLmRldiQ
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2F1c2FsLXR1cnRsZS03NDM1LmNsZXJrLmFjY291bnRzLmRldiQ
VITE_API_BASE_URL=https://book-my-chef-backend-production.up.railway.app/api/v1
```

#### B. Backend (`apps/backend/.env` and Railway `book-my-chef-backend`):
```bash
CLERK_SECRET_KEY=sk_test_qqpiHlY4VgvjSs8eTzWo3pZrMF6bmEgOzlboOKcyJS
CLERK_ISSUER=https://causal-turtle-7435.clerk.accounts.dev
CLERK_JWKS_URL=https://causal-turtle-7435.clerk.accounts.dev/.well-known/jwks.json
```

> [!WARNING]
> Never put `CLERK_SECRET_KEY` in `apps/web/.env` or any frontend bundle. Secret keys are strictly server-side.

---

## 3. Custom Flow Code Implementation

The application uses custom React hooks wrapping `@clerk/clerk-react`:

- **Initiate Sign-Up**:
  ```javascript
  const res = await signUp.create({
    phoneNumber: '+9198XXXXXXXX'
  });
  await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
  ```

- **Verify Sign-Up**:
  ```javascript
  const completeSignUp = await signUp.attemptPhoneNumberVerification({
    code: '123456'
  });
  await setActive({ session: completeSignUp.createdSessionId });
  ```

- **Initiate Sign-In**:
  ```javascript
  const { supportedFirstFactors } = await signIn.create({
    identifier: '+9198XXXXXXXX'
  });
  const phoneFactor = supportedFirstFactors.find(f => f.strategy === 'phone_code');
  await signIn.prepareFirstFactor({
    strategy: 'phone_code',
    phoneNumberId: phoneFactor.phoneNumberId
  });
  ```

- **Verify Sign-In**:
  ```javascript
  const completeSignIn = await signIn.attemptFirstFactor({
    strategy: 'phone_code',
    code: '123456'
  });
  await setActive({ session: completeSignIn.createdSessionId });
  ```
