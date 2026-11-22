# EL100 Relational Database Schema Specification

**Project:** Book My Chef — Culinary & Event Atelier  
**Database:** PostgreSQL 16+  
**ORM / Data Access:** Spring Data JPA / Hibernate  
**Migration Framework:** Flyway  
**Implementation ID:** EL100

---

## 1. Domain ERD & Module Architecture

```
BOOK_MY_CHEF_DB
│
├── IDENTITY & AUTHENTICATION
│   ├── users (id, clerk_id, phone, email, user_type, account_status)
│   ├── user_profiles (id, user_id, full_name, display_name, avatar_url, preferred_language)
│   ├── user_addresses (id, user_id, address_type, address_line1, city, state, postal_code, is_default)
│   ├── admin_users (id, user_id, admin_role, status, invited_by)
│   └── admin_invitations (id, email, phone_number, admin_role, invitation_status, expires_at)
│
├── PROVIDER & ATELIER PROFILES
│   ├── provider_profiles (id, user_id, professional_name, business_name, bio, verification_status, min_booking_amount)
│   ├── provider_roles (id, provider_id, role_type, role_name, is_primary, is_active)
│   ├── cuisine_categories (id, code, name, description)
│   ├── provider_cuisines (id, provider_id, cuisine_id, is_signature)
│   └── provider_availability_slots (id, provider_id, slot_date, time_slot, status, locked_until)
│
├── CATALOG & SERVICES
│   ├── service_categories (id, code, title, icon_name, sort_order)
│   ├── service_subcategories (id, category_id, code, title)
│   ├── services (id, provider_id, subcategory_id, title, service_delivery_mode)
│   └── service_packages (id, service_id, name, description, base_price, min_guests, max_guests)
│
├── BOOKINGS & WORKFLOW
│   ├── bookings (id, booking_reference, customer_id, provider_id, booking_status, payment_status, event_date, time_slot, guest_count, estimated_total, final_amount, advance_amount, balance_amount)
│   ├── booking_quotations (id, booking_id, provider_id, total_amount, provider_notes)
│   └── booking_quotation_items (id, quotation_id, item_name, unit_price, quantity)
│
├── PAYMENTS & ESCROW
│   ├── payments (id, booking_id, razorpay_order_id, razorpay_payment_id, payment_stage, amount, status)
│   └── payment_transactions (id, payment_id, transaction_reference, gateway_response)
│
├── CUSTOMER ENGAGEMENT
│   ├── customer_favourites (id, user_id, provider_id, saved_at)
│   └── reviews (id, booking_id, customer_id, provider_id, overall_rating, review_text)
│
└── PLATFORM OVERSIGHT
    └── admin_audit_logs (id, admin_user_id, action, entity_type, entity_id, performed_at, ip_address)
```

---

## 2. Table Schemas & Foreign Key Constraints

### 2.1 `users`
- `id` UUID PK
- `clerk_id` VARCHAR(128) NOT NULL UNIQUE
- `phone` VARCHAR(64) UNIQUE
- `email` VARCHAR(255) UNIQUE
- `user_type` VARCHAR(32) NOT NULL (`CUSTOMER`, `PROVIDER`, `ADMIN`)
- `account_status` VARCHAR(32) NOT NULL (`ACTIVE`, `SUSPENDED`, `DELETED`)

### 2.2 `customer_favourites`
- `id` UUID PK
- `user_id` UUID NOT NULL FK $\rightarrow$ `users(id)` ON DELETE CASCADE
- `provider_id` UUID NOT NULL FK $\rightarrow$ `provider_profiles(id)` ON DELETE CASCADE
- `saved_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_user_provider_favourite` UNIQUE (`user_id`, `provider_id`)

### 2.3 `user_addresses`
- `id` UUID PK
- `user_id` UUID NOT NULL FK $\rightarrow$ `users(id)` ON DELETE CASCADE
- `address_type` VARCHAR(32) NOT NULL (`HOME`, `EVENT_VENUE`, `KITCHEN`, `OTHER`)
- `address_line1` VARCHAR(255) NOT NULL
- `city` VARCHAR(100) NOT NULL
- `state` VARCHAR(100) NOT NULL
- `postal_code` VARCHAR(20) NOT NULL
- `is_default` BOOLEAN NOT NULL DEFAULT FALSE

### 2.4 `bookings`
- `id` UUID PK
- `booking_reference` VARCHAR(64) NOT NULL UNIQUE (e.g. `#BMC-6821-HYD`)
- `customer_id` UUID NOT NULL FK $\rightarrow$ `users(id)`
- `provider_id` UUID NOT NULL FK $\rightarrow$ `provider_profiles(id)`
- `booking_status` VARCHAR(64) NOT NULL (`PENDING_PROVIDER_CONFIRMATION`, `PROVIDER_ACCEPTED`, `PROVIDER_REJECTED`, `QUOTATION_SENT`, `PENDING_PAYMENT`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- `payment_status` VARCHAR(32) NOT NULL (`PENDING`, `ESCROW_HELD`, `CAPTURED`, `REFUNDED`)
- `event_date` DATE NOT NULL
- `time_slot` VARCHAR(32) NOT NULL (`LUNCH`, `DINNER`, `FULL_DAY`)
- `guest_count` INT NOT NULL
- `estimated_total` NUMERIC(10, 2) NOT NULL
- `advance_amount` NUMERIC(10, 2) NOT NULL
- `balance_amount` NUMERIC(10, 2) NOT NULL
