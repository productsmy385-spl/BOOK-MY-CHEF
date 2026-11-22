# BOOK MY CHEF — EL100 API DOCUMENTATION
**Implementation Identifier:** EL100  
**Version:** 1.0.0-PROD  
**Base URL:** `https://book-my-chef-backend-production.up.railway.app/api/v1` (Production) / `http://localhost:8080/api/v1` (Local Dev)  
**Security Standard:** Bearer JWT (Clerk authenticated subject mapped to PostgreSQL UUID) / Webhook HMAC signatures  

---

## 1. Authentication & User Identity

### `POST /auth/sync`
Synchronizes Clerk user session with PostgreSQL `users` and `user_profiles` records.
- **Request Body:**
  ```json
  {
    "clerkId": "user_2xxxxxxxxx",
    "email": "host.ananya@atelier.in",
    "fullName": "Ananya Rao",
    "phone": "+918464091436",
    "intendedRole": "CUSTOMER",
    "businessName": null
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "User synchronized successfully",
    "data": {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "clerkId": "user_2xxxxxxxxx",
      "email": "host.ananya@atelier.in",
      "role": "CUSTOMER",
      "accountStatus": "ACTIVE"
    }
  }
  ```

### `GET /auth/me`
Fetches authenticated user identity profile, assigned permissions, and linked atelier.
- **Headers:** `Authorization: Bearer <clerk_session_token>`
- **Response `200 OK`:** Returns current `User` entity with role and profile.

---

## 2. Customer Experience

### `GET /customer/favourites`
Retrieves saved favorite providers for the host.
- **Query Parameters:** `customerId` (UUID, optional)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "professionalName": "Chef Raghavendra Rao",
        "primaryRole": "PRO_CHEF",
        "startingPrice": 1499.00,
        "pricingModel": "PER_PERSON",
        "averageRating": 4.95,
        "cuisines": ["Andhra Royal", "Telangana Heritage"]
      }
    ]
  }
  ```

### `POST /customer/favourites/{providerId}`
Adds a provider to customer's saved list.
- **Response `200 OK`:** `{"success": true, "message": "Provider added to favourites"}`

### `DELETE /customer/favourites/{providerId}`
Removes a provider from customer's saved list.
- **Response `200 OK`:** `{"success": true, "message": "Provider removed from favourites"}`

### `GET /customer/addresses`
Retrieves customer's saved banquet and dining locations.
- **Response `200 OK`:** Array of `UserAddress` records.

### `POST /customer/addresses`
Saves a new celebration address to PostgreSQL.
- **Request Body:**
  ```json
  {
    "label": "Home Banquet",
    "addressLine1": "Villa 42, Palm Meadows",
    "addressLine2": "Jubilee Hills",
    "city": "Hyderabad",
    "postalCode": "500033",
    "isDefault": true
  }
  ```

---

## 3. Service Provider Discovery & Profiles

### `GET /search/providers`
Full dynamic search and multi-faceted catalog filtering.
- **Query Parameters:**
  - `query` (string): Text search across chef name, bio, and business.
  - `category` (string): `PRO_CHEF`, `HOME_CHEF`, `CATERER`, `EVENT_PLANNER`.
  - `cuisine` (string): Regional filter (`ANDHRA`, `TELANGANA`, `SOUTH_INDIAN`, etc.).
  - `budget` (number): Max starting price filter.
- **Response `200 OK`:** Array of `ProviderCardDto` records from PostgreSQL.

### `GET /providers/{id}`
Returns complete provider dossier, portfolio images, certifications, and reviews.

### `GET /providers/{id}/services`
Returns itemized service packages offered by provider from `service_packages` table.

### `POST /providers/profile`
Creates or updates provider professional atelier, FSSAI registration, and coverage radius.

---

## 4. Bookings & 17-State FSM Lifecycle

### `POST /bookings`
Creates initial booking reservation or quotation request.
- **Request Body:**
  ```json
  {
    "providerId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "eventDate": "2026-12-15",
    "timeSlot": "LUNCH",
    "guestCount": 25,
    "serviceDeliveryMode": "AT_HOST_HOME",
    "estimatedTotal": 14990.00,
    "hostSpecialInstructions": "Allergens: Nut-free traditional Andhra meal"
  }
  ```

### `GET /bookings/customer/{customerId}`
Retrieves all real PostgreSQL bookings for a customer.

### `GET /bookings/provider/{providerId}`
Retrieves all real bookings assigned to a provider.

### `PUT /bookings/{id}/status?status={NEW_STATUS}`
Executes finite state machine transition (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).

### `POST /bookings/{id}/cancel`
Cancels booking and marks payment status as `REFUNDED`.

### `POST /bookings/{id}/lock-and-checkout`
Enforces pessimistic calendar slot lock for 15 minutes and transitions status to `PENDING_PAYMENT`.

### `POST /bookings/{id}/complete`
Customer confirms service completion, triggering escrow capture to provider wallet.

---

## 5. Availability & Calendar

### `GET /availability/provider/{providerId}`
Retrieves calendar slots and blocked dates for date range.

### `POST /availability/provider/{providerId}/block?date=YYYY-MM-DD`
Provider blocks date/slot from accepting bookings.

### `POST /availability/provider/{providerId}/unblock?date=YYYY-MM-DD`
Provider unblocks date, making it available for host discovery.

---

## 6. Platform Administration & Financials

### `GET /admin/dashboard`
Live calculated GMV, 12% net commission, active bookings, provider counts, and dispute metrics.

### `GET /admin/bookings`
Returns full platform booking ledger with status filter.

### `GET /admin/users`
Returns registered user directory with moderation status.

### `POST /admin/users/{id}/suspend`
Suspends user account and writes to `admin_audit_logs`.

### `POST /admin/users/{id}/restore`
Restores user account to active and writes to `admin_audit_logs`.

### `GET /admin/finance`
Escrow summary: total escrow locked, completed payouts, refunds, and platform commission.
