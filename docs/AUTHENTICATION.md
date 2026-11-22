# Authentication & Identity Architecture Specification

**Project:** Culinary & Event Atelier ("BOOK MY CHEF") — Multi-Service Chef, Catering & Event Services Marketplace  
**Identity Provider:** Clerk (OIDC, SMS Phone OTP, Session Tokens)  
**Application Identity Store:** Internal PostgreSQL 16+ Database  
**Security Standard:** RS256 Asymmetric JWT Verification via Clerk JWKS  

---

## 1. Authentication Architecture Overview

BOOK MY CHEF enforces a **Hybrid Identity Model**:
- **Clerk** manages user identity credentials, phone number OTP delivery, bot challenge protection, rate limiting on SMS attempts, and secure session management.
- **PostgreSQL** stores internal business profiles, role assignments, permissions, business addresses, banking details, and booking histories.
- **Zero Secrets in PostgreSQL:** No plaintext passwords, hashed password digests, or OTP verification codes are ever stored in the internal database.

```
 CUSTOMER / PROVIDER (Mobile/Web)
                │
                │ 1. Initiate Phone OTP
                ▼
      CLERK IDENTITY SERVICE
                │
                │ 2. Verify OTP Code & Issue RS256 JWT
                ▼
      REACT / CAPACITOR CLIENT
                │
                │ 3. Forward Bearer JWT on every HTTP request
                ▼
      SPRING BOOT BACKEND
                │
                │ 4. ClerkJwtAuthenticationFilter
                │    - Fetch & cache Clerk JWKS public keys
                │    - Verify signature, issuer, and expiration
                │    - Extract Clerk User ID (`sub`)
                ▼
      POSTGRESQL USER SYNCHRONIZATION
                │
                │ 5. Query `users` WHERE clerk_id = :sub
                │    - If new: INSERT into `users` & create default profile
                │    - If existing: Load roles and permissions
                ▼
      SPRING SECURITY CONTEXT
                │
                │ 6. Set SecurityContextHolder with `UserPrincipal`
                ▼
      AUTHORIZED CONTROLLER EXECUTION
```

---

## 2. Phone Number OTP Verification Flow

### 2.1 Customer & Provider Onboarding
1. **User Enters Phone:** User provides their mobile number (e.g., `+91 98765 43210`) in the mobile-first login drawer or modal.
2. **Clerk Dispatches OTP:** Clerk triggers an SMS OTP with rate-limiting and anti-abuse safeguards.
3. **User Submits OTP:** Client sends the 6-digit verification code back to Clerk.
4. **Token Generation:** Upon successful verification, Clerk returns a short-lived access JWT containing:
   - `sub`: Unique Clerk User ID (`user_2P3abc...`)
   - `phone_number`: Verified phone string
   - `exp`: Expiration timestamp
   - `iss`: `https://<clerk-instance>.clerk.accounts.dev`

### 2.2 Backend Identity Synchronization (`/api/v1/auth/sync`)
Immediately following token generation, the client invokes `POST /api/v1/auth/sync`:

```java
@Transactional
public AuthSyncResponse syncUser(ClerkTokenClaims claims, SyncRequest request) {
    String clerkId = claims.getSubject();
    String phone = claims.getPhoneNumber();

    User user = userRepository.findByClerkId(clerkId)
        .orElseGet(() -> {
            User newUser = User.builder()
                .clerkId(clerkId)
                .phone(phone)
                .email(request.getEmail())
                .userType(request.getIntendedRole()) // CUSTOMER or PROVIDER
                .accountStatus(AccountStatus.ACTIVE)
                .build();
            userRepository.save(newUser);

            // Assign Default Role
            Role defaultRole = roleRepository.findByCode(
                request.getIntendedRole() == UserType.PROVIDER ? "ROLE_PROVIDER" : "ROLE_CUSTOMER"
            ).orElseThrow();
            userRoleRepository.save(new UserRole(newUser, defaultRole));

            // Create Profile Skeleton
            userProfileRepository.save(UserProfile.builder()
                .userId(newUser.getId())
                .fullName(request.getFullName())
                .build());

            return newUser;
        });

    return AuthSyncResponse.from(user);
}
```

---

## 3. Platform Administrator Invitation Architecture

To maintain strict enterprise security, **public administrator registration is physically impossible**.

### 3.1 Invitation & Onboarding Protocol
1. **Super Admin Issues Invitation:** A Super Admin generates an invite via the Admin Console or Clerk Dashboard targeting the prospective admin's corporate email.
2. **Database Invitation Record:** An entry is created in `admin_invitations` containing the target email, assigned role (`OPERATIONS_ADMIN`, `VERIFICATION_ADMIN`, `FINANCE_ADMIN`), and cryptographic token.
3. **Clerk Magic Link / OTP:** The invitee receives a secure Clerk invitation link.
4. **First-Time Sign-In:** The administrator completes Clerk OTP verification.
5. **Backend Authorization Guard:** During `/api/v1/auth/sync`, the backend checks:
   ```sql
   SELECT * FROM admin_invitations 
   WHERE email = :email AND status = 'PENDING' AND expires_at > NOW();
   ```
   - If an active invitation is found, the user is created with `user_type = 'ADMIN'` and granted the specific admin role. The invitation is marked `ACCEPTED`.
   - If no valid invitation exists, the request is rejected with `403 FORBIDDEN` and logged as a security alert.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Endpoint Namespace | Required Role | Allowed Users |
|---|---|---|
| `/api/v1/customers/**` | `ROLE_CUSTOMER` | Verified hosts & customers |
| `/api/v1/providers/**` | `ROLE_PROVIDER` | Verified culinary & event providers |
| `/api/v1/bookings/{id}/quotation` | `ROLE_PROVIDER` | Provider assigned to the booking |
| `/api/v1/bookings/{id}/complete` | `ROLE_CUSTOMER` | Host who created the booking |
| `/api/v1/admin/dashboard` | `ROLE_ADMIN_*` | Any invited administrator |
| `/api/v1/admin/providers/*/verify` | `ROLE_VERIFICATION_ADMIN`, `ROLE_SUPER_ADMIN` | Verification & Super Admins |
| `/api/v1/admin/payouts/**` | `ROLE_FINANCE_ADMIN`, `ROLE_SUPER_ADMIN` | Finance & Super Admins |

---

## 5. Session Handling & Token Refresh

- **Access Token TTL:** Clerk JWT access tokens have a short lifespan of 15 minutes.
- **Refresh Mechanism:** The frontend React application utilizes Clerk's automatic background token refresh via `@clerk/clerk-react`.
- **Axios Request Interceptor:** Injects the fresh Bearer token on every outgoing API request.
- **Token Invalidation:** When a user logs out or is suspended by an administrator, the backend marks active sessions in `user_sessions` as revoked.
