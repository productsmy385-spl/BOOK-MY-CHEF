# REST API Specification (OpenAPI v3.1 Compliant)

**Project:** Culinary & Event Atelier ("BOOK MY CHEF") — Multi-Service Chef, Catering & Event Services Marketplace  
**Base Path:** `/api/v1`  
**Authentication Scheme:** `Bearer <Clerk_JWT>`  
**Content-Type:** `application/json`  

---

## 1. Global Response Standards

### 1.1 Success Envelope
```json
{
  "success": true,
  "timestamp": "2026-11-22T10:15:30Z",
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### 1.2 Error Envelope
```json
{
  "success": false,
  "timestamp": "2026-11-22T10:15:30Z",
  "error": {
    "code": "SLOT_CONFLICT_ERROR",
    "message": "The selected provider is already booked for this date and time slot.",
    "fieldErrors": [
      {
        "field": "eventDate",
        "rejectedValue": "2026-11-28",
        "message": "Slot already locked by another booking"
      }
    ]
  }
}
```

---

## 2. Authentication & Identity Endpoints

### 2.1 Sync Clerk Identity
- **Method / Endpoint:** `POST /api/v1/auth/sync`
- **Headers:** `Authorization: Bearer <clerk_token>`
- **Request Body:**
```json
{
  "phone": "+919876543210",
  "email": "raghavendra@atelier.in",
  "fullName": "Chef Raghavendra Rao",
  "intendedRole": "PROVIDER"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "clerkId": "user_2P3abcXYZ",
    "roles": ["ROLE_PROVIDER"],
    "profileCompleted": true,
    "providerProfileId": "7cb20e81-a9f3-4217-a0bf-7bc3343ef812"
  }
}
```

### 2.2 Get Current User Profile
- **Method / Endpoint:** `GET /api/v1/auth/me`
- **Response `200 OK`:** Returns full user profile, roles, addresses, and permissions.

---

## 3. Customer Discovery & Search Endpoints

### 3.1 Search & Filter Providers
- **Method / Endpoint:** `GET /api/v1/search/providers`
- **Query Parameters:**
  - `query` (string, optional): Full-text keyword search ("Andhra Chef", "Biryani Catering")
  - `category` (string, optional): `CHEFS`, `CATERING`, `DECORATION`, `PLANNING`
  - `cuisine` (string, optional): `ANDHRA`, `TELANGANA`, `NORTH_INDIAN`, `CHINESE`
  - `latitude` (numeric, required for distance): `17.4325`
  - `longitude` (numeric, required for distance): `78.4071`
  - `radiusKm` (integer, default: 25)
  - `eventDate` (ISO Date, optional): `2026-11-28`
  - `timeSlot` (string, optional): `LUNCH`, `DINNER`
  - `minPrice` / `maxPrice` (numeric, optional)
  - `sort` (string): `recommended`, `rating_desc`, `price_asc`, `distance_asc`
  - `page` (integer, default: 0), `size` (integer, default: 20)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "7cb20e81-a9f3-4217-a0bf-7bc3343ef812",
        "professionalName": "Chef Raghavendra Rao",
        "avatarUrl": "https://lh3.googleusercontent.com/...",
        "coverImageUrl": "https://lh3.googleusercontent.com/...",
        "primaryRole": "PRO_CHEF",
        "experienceYears": 18,
        "averageRating": 4.95,
        "totalReviews": 1240,
        "cuisines": ["Andhra Royal", "Telangana Home-Style", "Coastal Seafood"],
        "startingPrice": 1499.00,
        "pricingModel": "PER_PERSON",
        "distanceKm": 3.8,
        "verificationStatus": "VERIFIED",
        "isAvailableOnDate": true
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 48,
    "totalPages": 3
  }
}
```

### 3.2 Get Provider Profile Details
- **Method / Endpoint:** `GET /api/v1/providers/{providerId}`
- **Response `200 OK`:** Full public portfolio, biography, menu packages, service delivery modes, verification certificates, and reviews.

---

## 4. Booking & Quotation Endpoints

### 4.1 Create Booking Request (Step 1-2)
- **Method / Endpoint:** `POST /api/v1/bookings`
- **Headers:** `Authorization: Bearer <customer_token>`
- **Request Body:**
```json
{
  "providerId": "7cb20e81-a9f3-4217-a0bf-7bc3343ef812",
  "serviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventType": "FAMILY_GATHERING",
  "eventDate": "2026-11-28",
  "timeSlot": "LUNCH",
  "guestCount": 25,
  "serviceDeliveryMode": "CHEF_VISITS_HOME",
  "venueAddressId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "dietaryPreference": "PURE_VEGETARIAN",
  "spiceLevel": "MEDIUM",
  "hostSpecialInstructions": "Authentic traditional Andhra Gruhapravesam feast with gutti vankaya curry."
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "bookingId": "c4d3e2b1-0987-6543-21ba-fedcba987654",
    "bookingReference": "#BMC-8942-HYD",
    "bookingStatus": "PENDING_PROVIDER_CONFIRMATION",
    "estimatedTotal": 11000.00,
    "expiresAt": "2026-11-22T14:15:30Z"
  }
}
```

### 4.2 Provider Accept or Reject Booking
- **Method / Endpoint:** `POST /api/v1/bookings/{bookingId}/respond`
- **Headers:** `Authorization: Bearer <provider_token>`
- **Request Body:**
```json
{
  "action": "ACCEPT", // or "REJECT", "REQUEST_QUOTATION"
  "rejectionReason": null
}
```

### 4.3 Provider Submit Custom Quotation
- **Method / Endpoint:** `POST /api/v1/bookings/{bookingId}/quotation`
- **Request Body:**
```json
{
  "items": [
    { "description": "Chef Base Visiting & Cooking Fee", "unitPrice": 1500.00, "quantity": 1 },
    { "description": "Per-Guest Feast (25 guests)", "unitPrice": 350.00, "quantity": 25 },
    { "description": "Travel & Logistics (Jubilee Hills)", "unitPrice": 300.00, "quantity": 1 },
    { "description": "Platform Escrow Protection Fee", "unitPrice": 450.00, "quantity": 1 }
  ],
  "providerNotes": "Includes fresh banana leaves and brass serving vessels."
}
```

### 4.4 Lock Slot & Confirm Advance Checkout
- **Method / Endpoint:** `POST /api/v1/bookings/{bookingId}/lock-and-checkout`
- **Response `200 OK`:** Initiates pessimistic slot lock and returns Razorpay Order details (`orderId`, `amount`, `keyId`).

---

## 5. Payment & Escrow Endpoints

### 5.1 Create Razorpay Order
- **Method / Endpoint:** `POST /api/v1/payments/create-order`
- **Request Body:**
```json
{
  "bookingId": "c4d3e2b1-0987-6543-21ba-fedcba987654",
  "paymentStage": "ADVANCE_30"
}
```
- **Response `200 OK`:** Returns Razorpay Order ID and currency amount.

### 5.2 Verify Razorpay Signature
- **Method / Endpoint:** `POST /api/v1/payments/verify`
- **Request Body:**
```json
{
  "bookingId": "c4d3e2b1-0987-6543-21ba-fedcba987654",
  "razorpayOrderId": "order_EKwxwAgIt4i987",
  "razorpayPaymentId": "pay_29QQoUBcxLE2",
  "razorpaySignature": "9ef522045516918d6e89a326314f73016d0044430f4e2b24b97ced83f8a44f3d"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "paymentId": "5e4d3c2b-1a09-8765-4321-fedcba987654",
    "status": "ESCROW_HELD",
    "bookingStatus": "CONFIRMED"
  }
}
```

### 5.3 Razorpay Server Webhook
- **Method / Endpoint:** `POST /api/v1/payments/webhook`
- **Headers:** `X-Razorpay-Signature: <hmac_sha256>`
- **Behavior:** Validates webhook signature, logs transaction idempotency, and updates escrow status.

---

## 6. Live Event Day & Review Endpoints

### 6.1 Update Provider Event Checklist
- **Method / Endpoint:** `POST /api/v1/bookings/{bookingId}/checklist`
- **Request Body:**
```json
{
  "statusStep": "EN_ROUTE", // "ARRIVED", "COOKING_STARTED", "FOOD_SERVED", "COMPLETED"
  "latitude": 17.4350,
  "longitude": 78.4090
}
```

### 6.2 Host Complete & Release Escrow
- **Method / Endpoint:** `POST /api/v1/bookings/{bookingId}/complete`
- **Headers:** `Authorization: Bearer <customer_token>`
- **Response `200 OK`:** Transitions booking to `COMPLETED`, releases escrow, credits net funds to provider earnings.

### 6.3 Submit Review & Rating
- **Method / Endpoint:** `POST /api/v1/reviews`
- **Request Body:**
```json
{
  "bookingId": "c4d3e2b1-0987-6543-21ba-fedcba987654",
  "overallRating": 5.0,
  "foodTasteRating": 5.0,
  "hygieneRating": 4.8,
  "punctualityRating": 5.0,
  "hospitalityRating": 5.0,
  "reviewText": "Chef Raghavendra prepared the most incredible Gutti Vankaya and Pappu for our housewarming. Guests were raving!",
  "imageUrls": ["https://lh3.googleusercontent.com/..."]
}
```

---

## 7. Platform Administrator Endpoints

### 7.1 Admin Overview Metrics
- **Method / Endpoint:** `GET /api/v1/admin/dashboard`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "totalGmv": 4852900.00,
    "netCommissionRevenue": 582348.00,
    "activeBookingsCount": 184,
    "activeProvidersCount": 328,
    "pendingVerificationsCount": 14,
    "disputeRatePercentage": 0.42
  }
}
```

### 7.2 Provider Verification Action
- **Method / Endpoint:** `POST /api/v1/admin/providers/{providerId}/verify`
- **Request Body:**
```json
{
  "decision": "APPROVE", // or "REJECT"
  "rejectionReason": null,
  "fssaiVerified": true,
  "kycVerified": true
}
```
