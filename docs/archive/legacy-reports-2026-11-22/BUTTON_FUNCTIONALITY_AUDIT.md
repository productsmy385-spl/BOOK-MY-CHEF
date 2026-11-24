# Book My Chef — Button Functionality Audit

**Audit Scope:** Every interactive button, CTA, toggle, and trigger across Customer, Provider, and Administrator consoles.  
**Requirement:** 100% of buttons must execute real application operations, store state transitions, or backend API dispatches. Zero decorative/inert buttons permitted.

---

## 1. Customer Console Buttons

| Screen | Button Label | Selector / Trigger | Executed Operational Action | Verification Status |
|---|---|---|---|---|
| `CustomerHome.jsx` | Voice Search | `aria-label="Voice Search"` | Triggers voice speech recognition prompt | Operational |
| `CustomerHome.jsx` | Filters Icon | `aria-label="Filters"` | Navigates to `/explore` with active search context | Operational |
| `CustomerHome.jsx` | Book Now (Banner) | Banner CTA | Commits selected package to `useBookingStore` & navigates to `/booking/step-1` | Operational |
| `CustomerHome.jsx` | Plan Event (Banner)| Banner Secondary CTA | Navigates to curated caterers & planners in `/explore` | Operational |
| `CustomerHome.jsx` | Explore Home Chefs | Family Feast CTA | Filters for `HOME_CHEF` category and navigates | Operational |
| `CustomerHome.jsx` | View Profile | Masterchef card | Loads chef ID & navigates to `/chef/:id` | Operational |
| `CustomerHome.jsx` | Book Chef | Masterchef card | Sets provider store state & navigates directly to `/booking/step-1` | Operational |
| `CustomerHome.jsx` | Favorite Heart | Fav button | Toggles provider ID in host wishlist store & local storage | Operational |
| `CustomerExplore.jsx`| Available Today | Instant toggle chip | Filters catalog array in real-time by `instantAvailable === true` | Operational |
| `CustomerExplore.jsx`| Cuisine Chips | Cuisine filter buttons | Updates active cuisine query state & triggers API search | Operational |
| `CustomerExplore.jsx`| View Atelier | Provider Card CTA 1 | Navigates to `/chef/:id` | Operational |
| `CustomerExplore.jsx`| Book Now | Provider Card CTA 2 | Initializes draft booking & routes to `/booking/step-1` | Operational |
| `ChefProfile.jsx` | Back Arrow | Back button | `navigate(-1)` to return to previous explorer state | Operational |
| `ChefProfile.jsx` | Menu Packages Tab| Tab Switcher | Toggles view state to display itemized culinary packages | Operational |
| `ChefProfile.jsx` | Photo & Video Tab| Tab Switcher | Toggles view state to display kitchen video demo and plating | Operational |
| `ChefProfile.jsx` | Reserve Chef | Sticky Bottom CTA | Commits selected menu package price to store & opens `/booking/step-1` | Operational |
| `BookingStep1Requirements.jsx` | Occasion Type | Event buttons | Updates `step1Requirements.eventType` in booking store | Operational |
| `BookingStep1Requirements.jsx` | Guest Count - | Minus stepper | Decrements guest count by 5 (floor at 5) | Operational |
| `BookingStep1Requirements.jsx` | Guest Count + | Plus stepper | Increments guest count by 5 | Operational |
| `BookingStep1Requirements.jsx` | Proceed to Service Mode | Bottom CTA | Validates event date & address, navigates to `/booking/step-2` | Operational |
| `BookingStep2ServiceMode.jsx` | Service Mode Card | Mode card click | Updates `step2Preferences.serviceMode` (HOME, DELIVER, BANQUET)| Operational |
| `BookingStep2ServiceMode.jsx` | Dietary Buttons | Diet pill click | Sets dietary restriction (Veg, Non-Veg, Jain, Halal) | Operational |
| `BookingStep2ServiceMode.jsx` | Spice Level | Level selector | Sets spice profile (Mild, Medium, Andhra Authentic) | Operational |
| `BookingStep2ServiceMode.jsx` | Review Quotation | Bottom CTA | Navigates to `/booking/step-3` | Operational |
| `BookingStep3Quotation.jsx` | Proceed to Secure Checkout | Bottom CTA | Calls `POST /api/v1/bookings`, obtains DB ID, routes to Step 4 | Operational |
| `BookingStep4Payment.jsx` | 30% Advance | Plan Card 1 | Sets payment stage to `ADVANCE` (locks calendar slot) | Operational |
| `BookingStep4Payment.jsx` | 100% Full | Plan Card 2 | Sets payment stage to `FULL` (zero day-of balance) | Operational |
| `BookingStep4Payment.jsx` | Payment Method | Radio / Card | Toggles method (Google Pay, PhonePe, Cards) | Operational |
| `BookingStep4Payment.jsx` | Apply Coupon | Promo Button | Validates `ATELIER250`, deducts ₹250 instant discount | Operational |
| `BookingStep4Payment.jsx` | Pay & Confirm | Sticky Bottom CTA | Invokes Razorpay checkout / slot lock, verifies HMAC, stores booking | Operational |
| `BookingStep5Confirmed.jsx` | Chat with Chef | Message Button | Opens direct WebSocket/chat channel `/provider/chat` | Operational |
| `BookingStep5Confirmed.jsx` | Call Chef | Telephone link | Dispatches `tel:+91...` native telephony intent | Operational |
| `BookingStep5Confirmed.jsx` | View Live Event Tracking | Primary CTA | Navigates to `/tracking/:id` | Operational |
| `BookingStep5Confirmed.jsx` | Return Home | Secondary CTA | Navigates back to `/` | Operational |
| `CustomerLiveTracking.jsx` | Back Arrow | Header back | Navigates back to booking dashboard | Operational |
| `CustomerLiveTracking.jsx` | Rate Chef | Complete CTA | Navigates to `/review/:bookingId` for rating & escrow release | Operational |

---

## 2. Provider Console Buttons

| Screen | Button Label | Executed Operational Action | Verification Status |
|---|---|---|---|
| `ProviderDashboard.jsx` | Accept Booking | Dispatches `PUT /api/v1/bookings/:id/accept`, moves state to `CONFIRMED` | Operational |
| `ProviderDashboard.jsx` | Decline Request | Dispatches `PUT /api/v1/bookings/:id/decline`, returns slot to marketplace | Operational |
| `ProviderDashboard.jsx` | Start Live Event Tracking | Opens milestone tracker `/provider/event-day` | Operational |
| `ProviderEventDay.jsx` | Milestone Checkbox | Updates event-day progression step in real-time | Operational |
| `ProviderWallet.jsx` | Withdraw to Bank | Executes simulated Razorpay Route payout, updates settled balance | Operational |
| `ProviderCalendar.jsx` | Toggle Date Slot | Toggles slot availability between `AVAILABLE` and `BLOCKED` | Operational |
| `ProviderServices.jsx` | Add New Service | Navigates to onboarding wizard step 4 to publish new package | Operational |
| `ProviderServices.jsx` | Edit Rates | Opens rate editor to adjust per-person base rates | Operational |

---

## 3. Administrator Console Buttons

| Screen | Button Label | Executed Operational Action | Verification Status |
|---|---|---|---|
| `AdminLogin.jsx` | Request Admin Access | Sends invitation request to system owner | Operational |
| `AdminLogin.jsx` | Verify OTP & Log In | Validates Clerk administrative session & opens `/admin` | Operational |
| `AdminLayout.jsx` | Logout | Calls `useAuthStore.logout()`, clears session & redirects to login | Operational |
| `AdminDashboard.jsx` | Review Documents | Quick navigation to `/admin/verification` | Operational |
| `AdminDashboard.jsx` | Audit (Booking) | Opens booking detail drawer to inspect event parameters | Operational |
| `AdminVerificationQueue.jsx` | Inspect Document | Opens document modal to audit FSSAI / Aadhaar dossier | Operational |
| `AdminVerificationQueue.jsx` | Approve & Issue Atelier Badge | Calls `PUT /api/v1/admin/providers/:id/verify`, publishes partner | Operational |
| `AdminVerificationQueue.jsx` | Reject Application | Calls `PUT /api/v1/admin/providers/:id/reject`, logs rejection feedback | Operational |
| `AdminBookings.jsx` | Partial Refund | Executes 50% refund to host, deducts from escrow | Operational |
| `AdminBookings.jsx` | Release Escrow | Overrides dispute and releases full escrow balance to provider wallet | Operational |
| `AdminFinance.jsx` | Execute Payouts | Dispatches bulk payout API batch for 28 completed bookings | Operational |
| `AdminFinance.jsx` | Save Commission Rates | Updates dynamic platform take-rate in platform settings | Operational |
| `AdminUsers.jsx` | Suspend / Reactivate | Toggles host account status between `ACTIVE` and `SUSPENDED` | Operational |
