# EL100 Database Migrations Log

**Project:** Book My Chef — Culinary & Event Atelier  
**Database Tool:** Flyway Migration System  
**Implementation ID:** EL100

---

## 1. Migration History

| Version | File | Purpose | Verification |
|---|---|---|---|
| **V1** | `V1__initial_schema.sql` | 74 Core tables across IAM, Profiles, Services, Bookings, Payments, Reviews | Applied |
| **V2** | `V2__role_auth_schema.sql` | `admin_users`, `authentication_sessions`, provider multi-role support, initial seeds | Applied |
| **V3** | `V3__clerk_sms_otp_schema.sql` | Aliases for Clerk user ID, phone numbers, automated trigger synchronization | Applied |
| **V4** | `V4__allow_null_service_venue_in_bookings.sql` | Nullable service and venue foreign keys for custom quotations | Applied |
| **V5** | `V5__seed_production_catalog_and_features.sql` | Full enterprise seed: 5 multi-role providers, service packages, customer addresses, real bookings, payments | Staged & Verified |

---

## 2. Integrity & Constraint Verification
- All foreign keys enforce `ON DELETE CASCADE` or `RESTRICT` appropriately.
- Financial fields use `NUMERIC(10, 2)` preventing floating-point precision issues.
- `pgcrypto` extension is enabled for native UUID generation (`gen_random_uuid()`).
- Automated triggers keep alias columns synchronized across Clerk and phone number fields.
