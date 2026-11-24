# Book My Chef — API Integration Status

**Backend Architecture:** Java 21 + Spring Boot 3.3.5  
**Base REST URL (Production):** `https://book-my-chef-backend-production.up.railway.app/api/v1`  
**Base REST URL (Local Dev):** `http://localhost:8080/api/v1`  
**Client Implementation:** `apps/web/src/services/api.js` (Axios client with Bearer JWT interceptor)

---

## 1. REST Endpoint Mapping & Verification Matrix

| Endpoint Route | HTTP Method | Controller / Service | Frontend Consumer | Security & Auth | Status |
|---|---|---|---|---|---|
| `/api/v1/auth/sync` | `POST` | `AuthController.syncUser` | `CustomerAuth.jsx`, `PartnerAuth.jsx` | Authenticated (Clerk Bearer) | **Active & Verified** |
| `/api/v1/auth/me` | `GET` | `AuthController.getCurrentUser` | `useAuthStore.js` | Authenticated (Clerk Bearer) | **Active & Verified** |
| `/api/v1/search/providers` | `GET` | `SearchController.searchProviders` | `CustomerHome.jsx`, `CustomerExplore.jsx`| Public | **Active (Returns DB Providers)** |
| `/api/v1/providers/:id` | `GET` | `ProviderController.getProviderById`| `ChefProfile.jsx` | Public | **Active (Returns Chef Detail)** |
| `/api/v1/providers/profile`| `PUT` | `ProviderController.updateProfile` | `ProviderProfile.jsx` | Partner Role Required | **Active & Verified** |
| `/api/v1/bookings` | `POST` | `BookingController.createBooking` | `BookingStep3Quotation.jsx` | Host / Customer Role | **Active (Persists in Postgres)**|
| `/api/v1/bookings/my` | `GET` | `BookingController.getMyBookings` | `AdminBookings.jsx`, `CustomerBookings` | Authenticated | **Active & Verified** |
| `/api/v1/bookings/:id` | `GET` | `BookingController.getBookingById`| `CustomerLiveTracking.jsx` | Public / Tracking Permitted | **Active & Verified** |
| `/api/v1/bookings/:id/checkout`| `POST` | `BookingController.lockAndCheckout`| `BookingStep4Payment.jsx` | Pessimistic Lock in DB | **Active & Verified** |
| `/api/v1/bookings/:id/accept`| `PUT` | `BookingController.acceptBooking`| `ProviderDashboard.jsx` | Provider Role | **Active & Verified** |
| `/api/v1/bookings/:id/decline`|`PUT` | `BookingController.declineBooking`| `ProviderDashboard.jsx` | Provider Role | **Active & Verified** |
| `/api/v1/payments/create-order`|`POST`| `PaymentController.createOrder` | `BookingStep4Payment.jsx` | Host Role / Razorpay SDK | **Active & Verified** |
| `/api/v1/payments/verify` | `POST` | `PaymentController.verifyPayment` | `BookingStep4Payment.jsx` | Razorpay HMAC Verification | **Active & Verified** |
| `/api/v1/admin/metrics` | `GET` | `AdminController.getMetrics` | `AdminDashboard.jsx` | Admin Role Required | **Active & Verified** |
| `/api/v1/admin/kyc/pending`| `GET` | `AdminController.getPendingKYC` | `AdminVerificationQueue.jsx` | Admin Role Required | **Active & Verified** |
| `/api/v1/admin/providers/:id/verify`|`PUT`|`AdminController.verifyProvider`| `AdminVerificationQueue.jsx` | Admin Role Required | **Active & Verified** |
| `/api/v1/reviews` | `POST` | `ReviewController.createReview` | `CustomerLiveTracking.jsx` (Review)| Host Role / Completed Event | **Active & Verified** |

---

## 2. Real-Time WebSocket & Communications
- **Protocol:** STOMP over SockJS (`/ws/tracker` and `/ws/chat`).
- **Live Event Updates:** Dispatches real-time chef ETA coordinates and checklist status transitions directly to `CustomerLiveTracking.jsx`.
- **In-App Messaging:** Bidirectional direct chat between Host and Assigned Chef via `ProviderChat.jsx`.

---

## 3. Resilience & Offline Fallbacks
- The frontend `api.js` client utilizes Axios interceptors.
- If network disconnection occurs during local development, the client gracefully utilizes curated catalog snapshots while keeping user inputs intact, ensuring zero UI crashes.
