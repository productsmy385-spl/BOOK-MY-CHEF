# Security & Data Isolation Architecture

**Project:** Culinary & Event Atelier ("BOOK MY CHEF") — Multi-Service Chef, Catering & Event Services Marketplace  
**Security Lead:** Principal Software Architect & Application Security Engineer  
**Compliance Standards:** OWASP Top 10, RBI Payment Security Guidelines, Indian Digital Personal Data Protection Act (DPDP)  

---

## 1. Core Security Principles & Data Isolation

Data isolation is strictly enforced across all layers of the stack. A customer must never be able to view another customer's private booking details or addresses, and a provider must never access another provider's earnings, banking records, or quotation drafts.

```
       [ INCOMING API REQUEST ]
                  │
                  ▼
   [ 1. CLERK JWT SIGNATURE VERIFICATION ]
   - Validate RS256 signature against Clerk JWKS
   - Check token expiration & issuer claims
                  │
                  ▼
   [ 2. SPRING SECURITY FILTER CHAIN ]
   - Extract internal UserPrincipal (userId, roles, permissions)
   - Verify required `@PreAuthorize("hasRole('ROLE_...')")`
                  │
                  ▼
   [ 3. SERVICE-LAYER TENANT ENFORCEMENT ]
   - Validate that authenticated userId matches resource ownership
   - Reject cross-tenant access with 403 AccessDeniedException
                  │
                  ▼
   [ 4. REPOSITORY-LAYER ISOLATION ]
   - Queries enforce `WHERE customer_id = :userId` or `WHERE provider_id = :providerId`
                  │
                  ▼
   [ 5. IMMUTABLE AUDIT LOGGING ]
   - Record administrative overrides, status changes, and financial triggers
```

---

## 2. Resource Ownership Enforcement

Ownership validation is implemented at the Java Service Layer and never left to frontend route guards alone.

### 2.1 Customer Booking Isolation
```java
@Service
@Transactional(readOnly = true)
public class BookingSecurityService {

    public void verifyBookingAccess(Booking booking, UserPrincipal currentUser) {
        if (currentUser.hasRole("ROLE_SUPER_ADMIN") || currentUser.hasRole("ROLE_OPS_ADMIN")) {
            return; // Authorized administrative access
        }

        UUID userId = currentUser.getId();
        boolean isCustomer = booking.getCustomer().getId().equals(userId);
        boolean isProvider = booking.getProvider().getUser().getId().equals(userId);

        if (!isCustomer && !isProvider) {
            throw new AccessDeniedException("Unauthorized: You do not have permission to view or modify this booking.");
        }
    }
}
```

### 2.2 Provider Financial Data Protection
All provider earnings and banking details queries require verifying that the `provider_id` belongs to the authenticated user.
```java
@Query("SELECT e FROM ProviderEarnings e WHERE e.provider.id = :providerId AND e.provider.user.id = :authenticatedUserId")
List<ProviderEarnings> findMyEarnings(@Param("providerId") UUID providerId, @Param("authenticatedUserId") UUID authenticatedUserId);
```

---

## 3. Concurrency Protection & Anti-Double-Booking Guarantee

To ensure two customers cannot simultaneously reserve the same provider for the same calendar date and time slot:

1. **Pessimistic Database Write Locks:** When a booking is submitted or accepted, the database executes:
   ```sql
   SELECT * FROM provider_availability_slots 
   WHERE provider_id = :providerId 
     AND slot_date = :eventDate 
     AND time_slot = :timeSlot 
   FOR UPDATE;
   ```
2. **Lease Expiration Worker:** Unpaid bookings holding a reservation lock automatically expire after 15 minutes via a Spring `@Scheduled` background worker:
   ```java
   @Scheduled(fixedRate = 60000)
   @Transactional
   public void releaseExpiredSlotLocks() {
       Instant cutoff = Instant.now();
       List<ProviderAvailabilitySlot> expiredSlots = slotRepository
           .findByReservationStatusAndLockExpiresAtBefore(
               ReservationStatus.LOCKED_PENDING_PAYMENT, cutoff
           );
       
       for (ProviderAvailabilitySlot slot : expiredSlots) {
           slot.setReservationStatus(ReservationStatus.NONE);
           slot.setStatus(SlotStatus.AVAILABLE);
           slot.setLockExpiresAt(null);
           slot.setLockedByBookingId(null);
       }
       slotRepository.saveAll(expiredSlots);
   }
   ```
3. **Database Unique Composite Constraint:** `UNIQUE (provider_id, slot_date, time_slot)` provides an uncompromisable second line of defense against race conditions.

---

## 4. Razorpay Webhook Signature Verification

Payment webhooks are guarded against forgery using HMAC-SHA256 signature verification.

```java
@Service
public class RazorpayWebhookVerifier {

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    public void verifySignature(String payload, String receivedSignature) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);

            byte[] hash = sha256_HMAC.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = Hex.encodeHexString(hash);

            if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), 
                                       receivedSignature.getBytes(StandardCharsets.UTF_8))) {
                throw new SecurityException("Invalid Razorpay webhook signature");
            }
        } catch (Exception e) {
            throw new SecurityException("Webhook signature verification failed", e);
        }
    }
}
```

---

## 5. Input Validation & Injection Prevention

- **Jakarta Bean Validation:** All REST DTOs apply `@NotNull`, `@NotBlank`, `@Size`, `@Pattern`, `@Positive`, and `@FutureOrPresent` annotations.
- **SQL Injection Prevention:** 100% of queries use Spring Data JPA method names or parameterized JPQL queries. No string concatenation in SQL queries.
- **Cross-Site Scripting (XSS) Prevention:** React inherently escapes all rendered variables. Markdown reviews are sanitized using DOMPurify before display.
- **Content Security Policy (CSP):**
  ```
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://checkout.razorpay.com;
  img-src 'self' data: https://lh3.googleusercontent.com https://ik.imagekit.io;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.clerk.accounts.dev https://api.razorpay.com;
  frame-src https://api.razorpay.com;
  ```

---

## 6. Audit Logging & Administrative Accountability

All state modifications performed by administrators are recorded in `admin_audit_logs`:
- Admin User ID
- Action Type (`APPROVE_PROVIDER`, `OVERRIDE_REFUND`, `SUSPEND_USER`)
- Target Entity Type and UUID
- Complete JSON snapshot of previous values and new values
- Client IP address and timestamp
