# Book My Chef — Database Implementation

**RDBMS:** PostgreSQL 16  
**Persistence Framework:** Spring Data JPA + Hibernate 6.x  
**Database Migration Engine:** Flyway  
**Identifiers:** UUID Primary Keys (`gen_random_uuid()`)  

---

## 1. Migration History

| Version | Migration Script | Description | Applied Status |
|---|---|---|---|
| `V1` | `V1__init_schema.sql` | Core schema: users, provider_profiles, bookings, payments, reviews | **Applied & Verified** |
| `V2` | `V2__seed_initial_data.sql` | Initial verified seed records (Masterchef Raghavendra Rao, etc.) | **Applied & Verified** |
| `V3` | `V3__multi_service_marketplace.sql` | Multi-service expansion: 12 partner categories, service packages | **Applied & Verified** |
| `V4` | `V4__fix_provider_constraints.sql` | Verification status constraints & pricing model indexes | **Applied & Verified** |

---

## 2. Relational Schema Architecture

```
                  +---------------------------+
                  |           USERS           |
                  |---------------------------|
                  | id: UUID (PK)             |
                  | clerk_id: VARCHAR (UQ)    |
                  | phone_number: VARCHAR(20) |
                  | role: user_role_enum      |
                  | is_active: BOOLEAN        |
                  +---------------------------+
                                |
             +------------------+------------------+
             | 1                                   | 1
             v                                     v
+---------------------------+         +---------------------------+
|     PROVIDER_PROFILES     |         |         BOOKINGS          |
|---------------------------|         |---------------------------|
| id: UUID (PK)             |         | id: UUID (PK)             |
| user_id: UUID (FK)        | 1     * | customer_id: UUID (FK)    |
| primary_role: VARCHAR(50) |<--------| provider_id: UUID (FK)    |
| professional_name: VARCHAR|         | booking_ref: VARCHAR (UQ) |
| fssai_license: VARCHAR    |         | booking_status: VARCHAR   |
| pricing_model: VARCHAR    |         | event_date: DATE          |
| verification_status: ENUM |         | guest_count: INT          |
+---------------------------+         | estimated_total: NUMERIC  |
             | 1                      +---------------------------+
             |                                     | 1
             v *                                   v *
+---------------------------+         +---------------------------+
|     SERVICE_PACKAGES      |         |         PAYMENTS          |
|---------------------------|         |---------------------------|
| id: UUID (PK)             |         | id: UUID (PK)             |
| provider_id: UUID (FK)    |         | booking_id: UUID (FK)     |
| title: VARCHAR(255)       |         | razorpay_order_id: VARCHAR|
| base_price: NUMERIC       |         | payment_stage: VARCHAR    |
| price_per_person: NUMERIC |         | escrow_status: VARCHAR    |
+---------------------------+         +---------------------------+
```

---

## 3. Indexing & Query Optimization
- **`idx_providers_role_verified`:** Compound index on `(primary_role, verification_status)` for sub-millisecond catalog exploration.
- **`idx_bookings_customer_status`:** Index on `(customer_id, booking_status)` for host dashboard retrieval.
- **`idx_bookings_provider_date`:** Index on `(provider_id, event_date)` for double-booking prevention.
- **`idx_payments_order_id`:** Unique index on `razorpay_order_id` for idempotent webhook handling.

---

## 4. Concurrency & Slot Locking
- **Pessimistic Slot Lock:** `SELECT * FROM bookings WHERE provider_id = :pId AND event_date = :date FOR UPDATE;` executed during Step 4 payment initiation.
- **15-Minute Expiry Worker:** Scheduled background worker automatically releases stale unconfirmed slot locks after 15 minutes.
