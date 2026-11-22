# Entity Relationship Diagram (ERD)

**Project:** Culinary & Event Atelier ("BOOK MY CHEF") — Multi-Service Chef, Catering & Event Services Marketplace  
**Engine:** PostgreSQL 16+ Relational Architecture  
**Primary Key Standard:** UUID v4  
**Audit Standard:** `created_at`, `updated_at`, `deleted_at` (Soft Delete)  
**Total Tables:** 74 Normalized Tables  

---

## 1. High-Level Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o| user_profiles : "has profile"
    users ||--o{ user_addresses : "maintains"
    users ||--o{ user_roles : "assigned"
    roles ||--o{ user_roles : "maps"
    roles ||--o{ role_permissions : "grants"
    permissions ||--o{ role_permissions : "defines"
    
    users ||--o| provider_profiles : "registers as"
    provider_profiles ||--o{ provider_roles : "serves as"
    provider_profiles ||--o{ provider_verifications : "undergoes"
    provider_profiles ||--o{ provider_documents : "attaches"
    provider_profiles ||--o{ provider_portfolio : "showcases"
    provider_profiles ||--o{ provider_service_areas : "covers"
    provider_profiles ||--o{ provider_cuisines : "cooks"
    cuisine_categories ||--o{ provider_cuisines : "categorizes"
    
    provider_profiles ||--o{ services : "publishes"
    service_categories ||--o{ services : "organizes"
    services ||--o{ service_packages : "bundles"
    service_packages ||--o{ service_package_items : "contains"
    services ||--o{ service_prices : "priced via"
    service_pricing_models ||--o{ service_prices : "defines model"
    
    provider_profiles ||--o{ provider_availability : "configures"
    provider_profiles ||--o{ provider_availability_slots : "schedules"
    provider_profiles ||--o{ provider_blocked_dates : "blocks"
    
    users ||--o{ customer_favourites : "saves"
    users ||--o{ bookings : "creates (as host)"
    provider_profiles ||--o{ bookings : "receives (as provider)"
    
    bookings ||--o{ booking_services : "includes"
    bookings ||--o| booking_requirements : "details"
    bookings ||--o{ booking_quotations : "negotiates"
    booking_quotations ||--o{ booking_quotation_items : "breaks down"
    bookings ||--o{ booking_status_history : "tracks"
    bookings ||--o| booking_cancellations : "records"
    
    bookings ||--o{ payments : "paid via"
    payments ||--o{ payment_transactions : "logs"
    payments ||--o{ refunds : "issues"
    bookings ||--o| provider_earnings : "generates"
    provider_profiles ||--o{ provider_payouts : "withdraws"
    bookings ||--o| platform_commissions : "charges"
    
    users ||--o{ reviews : "authors"
    provider_profiles ||--o{ reviews : "evaluated in"
    bookings ||--o| reviews : "reviewed for"
    reviews ||--o{ review_images : "includes"
    provider_profiles ||--o| provider_rating_summaries : "summarizes"
    
    users ||--o{ conversation_participants : "participates"
    conversations ||--o{ conversation_participants : "includes"
    conversations ||--o{ messages : "contains"
    users ||--o{ notifications : "receives"
    
    users ||--o{ admin_audit_logs : "performed by"
    bookings ||--o{ disputes : "disputed in"
```

---

## 2. Exhaustive Modular Database Schema Maps (74 Tables)

### Module A: Identity & Access Management (Tables 01-10)

```mermaid
erDiagram
    users {
        uuid id PK
        varchar clerk_id UK "Clerk sub identifier"
        varchar phone UK "E.164 Mobile number"
        varchar email UK "Optional email"
        varchar user_type "CUSTOMER, PROVIDER, ADMIN"
        varchar account_status "ACTIVE, SUSPENDED, DELETED"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    user_profiles {
        uuid id PK
        uuid user_id FK, UK
        varchar full_name
        varchar display_name
        varchar avatar_url
        varchar gender
        date date_of_birth
        varchar preferred_language
        timestamp created_at
        timestamp updated_at
    }

    user_addresses {
        uuid id PK
        uuid user_id FK
        varchar address_type "HOME, EVENT_VENUE, KITCHEN"
        varchar address_line1
        varchar address_line2
        varchar landmark
        varchar city
        varchar state
        varchar postal_code
        decimal latitude
        decimal longitude
        boolean is_default
        timestamp created_at
    }

    roles {
        uuid id PK
        varchar code UK "ROLE_CUSTOMER, ROLE_PROVIDER, ROLE_SUPER_ADMIN"
        varchar name
        text description
        boolean is_system_role
    }

    permissions {
        uuid id PK
        varchar code UK "BOOKING_READ, DISPUTE_MANAGE, PROVIDER_VERIFY"
        varchar module
        text description
    }

    user_roles {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        timestamp assigned_at
    }

    role_permissions {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
    }

    user_sessions {
        uuid id PK
        uuid user_id FK
        varchar session_token UK
        varchar ip_address
        varchar user_agent
        timestamp expires_at
        timestamp created_at
    }

    provider_invitations {
        uuid id PK
        varchar phone
        varchar invitation_code UK
        uuid invited_by FK
        varchar status "PENDING, ACCEPTED, EXPIRED"
        timestamp expires_at
    }

    admin_invitations {
        uuid id PK
        varchar email UK
        varchar admin_role "OPERATIONS, VERIFICATION, FINANCE"
        varchar token UK
        uuid invited_by FK
        varchar status "PENDING, ACCEPTED, REVOKED"
        timestamp expires_at
    }

    users ||--o| user_profiles : "has"
    users ||--o{ user_addresses : "owns"
    users ||--o{ user_roles : "has"
    roles ||--o{ user_roles : "granted"
    roles ||--o{ role_permissions : "includes"
    permissions ||--o{ role_permissions : "mapped"
    users ||--o{ user_sessions : "maintains"
```

---

### Module B: Provider Management & Credentials (Tables 11-20)

```mermaid
erDiagram
    provider_profiles {
        uuid id PK
        uuid user_id FK, UK
        varchar professional_name
        varchar business_name
        text bio
        integer experience_years
        varchar avatar_url
        varchar cover_image_url
        varchar verification_status "PENDING, VERIFIED, REJECTED, SUSPENDED"
        boolean is_accepting_bookings
        decimal min_booking_amount
        integer max_travel_distance_km
        decimal base_latitude
        decimal base_longitude
        varchar fssai_license_number
        timestamp fssai_expiry_date
        timestamp verified_at
        timestamp created_at
        timestamp updated_at
    }

    provider_types {
        uuid id PK
        varchar code UK "INDIVIDUAL_CHEF, CATERER, EVENT_AGENCY"
        varchar title
    }

    provider_roles {
        uuid id PK
        uuid provider_id FK
        varchar role_type "PRO_CHEF, HOME_CHEF, CATERER, PLANNER, DECORATOR"
        boolean is_primary
    }

    provider_verifications {
        uuid id PK
        uuid provider_id FK
        varchar verification_type "FSSAI, AADHAAR_KYC, POLICE_BACKGROUND"
        varchar status "SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED"
        text rejection_reason
        uuid verified_by FK "Admin user ID"
        timestamp verified_at
    }

    provider_documents {
        uuid id PK
        uuid provider_id FK
        varchar document_type "FSSAI_CERT, AADHAAR, CHEF_DIPLOMA"
        varchar document_url
        varchar file_name
        varchar verification_status
        timestamp uploaded_at
    }

    provider_experiences {
        uuid id PK
        uuid provider_id FK
        varchar organization_name
        varchar designation
        integer start_year
        integer end_year
        text description
    }

    provider_languages {
        uuid id PK
        uuid provider_id FK
        varchar language_code "EN, TE, HI, TA, KN"
    }

    provider_service_areas {
        uuid id PK
        uuid provider_id FK
        varchar city
        varchar neighborhood_name
        varchar postal_code
        decimal radius_km
    }

    provider_portfolio {
        uuid id PK
        uuid provider_id FK
        varchar media_type "IMAGE, VIDEO"
        varchar media_url
        varchar title
        text description
        varchar dish_category
        boolean is_featured
        integer sort_order
    }

    provider_business_details {
        uuid id PK
        uuid provider_id FK, UK
        varchar legal_entity_name
        varchar gst_number
        varchar pan_number
        varchar bank_account_number
        varchar bank_ifsc_code
        varchar bank_name
        boolean bank_verified
    }

    provider_profiles ||--o{ provider_roles : "holds"
    provider_profiles ||--o{ provider_verifications : "tracked in"
    provider_profiles ||--o{ provider_documents : "attaches"
    provider_profiles ||--o{ provider_experiences : "lists"
    provider_profiles ||--o{ provider_languages : "speaks"
    provider_profiles ||--o{ provider_service_areas : "services"
    provider_profiles ||--o{ provider_portfolio : "contains"
    provider_profiles ||--o| provider_business_details : "owns"
```

---

### Module C: Services, Cuisines & Pricing (Tables 21-30)

```mermaid
erDiagram
    service_categories {
        uuid id PK
        varchar code UK "CHEFS, CATERING, DECORATION, PLANNING"
        varchar title
        text description
        varchar icon_name
        boolean is_active
        integer sort_order
    }

    service_subcategories {
        uuid id PK
        uuid category_id FK
        varchar code UK "HOME_CHEF, PRO_CHEF, MANDAP_DECOR"
        varchar title
    }

    services {
        uuid id PK
        uuid provider_id FK
        uuid subcategory_id FK
        varchar title
        text description
        varchar service_delivery_mode "CHEF_VISITS_HOME, COOK_AND_DELIVER, VENUE_BANQUET"
        boolean is_active
        timestamp created_at
    }

    service_packages {
        uuid id PK
        uuid service_id FK
        varchar name "Royal Andhra 5-Course, Premium Buffet"
        text description
        decimal base_price
        integer min_guests
        integer max_guests
        boolean is_customizable
    }

    service_package_items {
        uuid id PK
        uuid package_id FK
        varchar item_category "STARTER, MAIN_COURSE, RICE, BREAD, DESSERT"
        varchar dish_name
        boolean is_vegetarian
        boolean is_spice_customizable
    }

    cuisine_categories {
        uuid id PK
        varchar code UK "ANDHRA, TELANGANA, NORTH_INDIAN, CHINESE, CONTINENTAL"
        varchar name
        text description
    }

    provider_cuisines {
        uuid id PK
        uuid provider_id FK
        uuid cuisine_id FK
        boolean is_signature
    }

    service_pricing_models {
        uuid id PK
        varchar code UK "PER_PERSON, PER_EVENT, PER_HOUR, BASE_PLUS_INGREDIENTS"
        varchar title
    }

    service_prices {
        uuid id PK
        uuid service_id FK
        uuid pricing_model_id FK
        decimal amount
        varchar currency "INR"
        integer min_units
        integer max_units
    }

    service_additional_charges {
        uuid id PK
        uuid service_id FK
        varchar charge_type "TRAVEL_PER_KM, CLEANING_FEE, EXTRA_WAITER"
        decimal rate
    }

    service_categories ||--o{ service_subcategories : "branches into"
    service_subcategories ||--o{ services : "classifies"
    services ||--o{ service_packages : "offers"
    service_packages ||--o{ service_package_items : "includes"
    cuisine_categories ||--o{ provider_cuisines : "categorizes"
    services ||--o{ service_prices : "structured by"
    service_pricing_models ||--o{ service_prices : "defines"
    services ||--o{ service_additional_charges : "applies"
```

---

### Module D: Availability & Concurrency Engine (Tables 31-35)

```mermaid
erDiagram
    provider_availability {
        uuid id PK
        uuid provider_id FK
        integer day_of_week "1 = Monday, 7 = Sunday"
        time start_time
        time end_time
        boolean is_active
    }

    provider_availability_slots {
        uuid id PK
        uuid provider_id FK
        date slot_date
        varchar time_slot "BREAKFAST, LUNCH, HIGH_TEA, DINNER"
        varchar status "AVAILABLE, RESERVED, BOOKED, BLOCKED"
        varchar reservation_status "NONE, LOCKED_PENDING_PAYMENT"
        timestamp lock_expires_at
        uuid locked_by_booking_id
        timestamp created_at
        timestamp updated_at
    }

    provider_blocked_dates {
        uuid id PK
        uuid provider_id FK
        date blocked_date
        varchar reason
        timestamp created_at
    }

    provider_booking_limits {
        uuid id PK
        uuid provider_id FK, UK
        integer max_daily_bookings
        integer advance_notice_hours
        integer max_advance_days
    }

    provider_calendar_events {
        uuid id PK
        uuid provider_id FK
        uuid booking_id FK
        varchar event_title
        timestamp start_timestamp
        timestamp end_timestamp
        varchar status
    }

    provider_availability_slots ||--|| bookings : "locks against"
```

---

### Module E & F: Bookings, Quotations & Event Tracking (Tables 41-50)

```mermaid
erDiagram
    bookings {
        uuid id PK
        varchar booking_reference UK "#BMC-XXXX-HYD"
        uuid customer_id FK
        uuid provider_id FK
        uuid service_id FK
        varchar booking_status "17 Finite States"
        varchar payment_status "PENDING, ESCROW_HELD, CAPTURED, REFUNDED"
        date event_date
        varchar time_slot
        integer guest_count
        varchar service_delivery_mode
        decimal estimated_total
        decimal final_amount
        decimal advance_amount
        decimal balance_amount
        uuid venue_address_id FK
        text host_special_instructions
        timestamp created_at
        timestamp updated_at
    }

    booking_services {
        uuid id PK
        uuid booking_id FK
        uuid service_package_id FK
        varchar package_name
        decimal unit_price
        integer quantity
    }

    booking_requirements {
        uuid id PK
        uuid booking_id FK, UK
        varchar event_type "HOUSEWARMING, BIRTHDAY, WEDDING"
        varchar dietary_preference "VEG, NON_VEG, JAIN, HALAL"
        varchar spice_level "MILD, MEDIUM, SPICY"
        boolean ingredients_provided_by_host
        boolean kitchen_appliances_available
    }

    booking_guests {
        uuid id PK
        uuid booking_id FK
        integer adults_count
        integer kids_count
        integer seniors_count
    }

    booking_quotations {
        uuid id PK
        uuid booking_id FK
        integer quotation_version
        decimal subtotal_amount
        decimal travel_charges
        decimal ingredient_charges
        decimal additional_staff_charges
        decimal platform_service_fee
        decimal tax_amount
        decimal total_amount
        varchar quotation_status "DRAFT, SENT, ACCEPTED, REVISED, REJECTED"
        text provider_notes
        timestamp created_at
    }

    booking_quotation_items {
        uuid id PK
        uuid quotation_id FK
        varchar description
        decimal unit_price
        integer quantity
        decimal total_price
    }

    booking_status_history {
        uuid id PK
        uuid booking_id FK
        varchar from_status
        varchar to_status
        text transition_reason
        uuid changed_by_user_id FK
        timestamp created_at
    }

    booking_cancellations {
        uuid id PK
        uuid booking_id FK, UK
        uuid cancelled_by_user_id FK
        varchar cancellation_reason
        decimal refund_amount
        decimal penalty_amount
        timestamp cancelled_at
    }

    booking_assignments {
        uuid id PK
        uuid booking_id FK
        uuid staff_user_id FK "Assistant / Waiter"
        varchar assignment_role
    }

    booking_attachments {
        uuid id PK
        uuid booking_id FK
        varchar attachment_type "HOST_INSPIRATION, CHEF_MENU_DOC"
        varchar file_url
        timestamp uploaded_at
    }

    bookings ||--o{ booking_services : "contains"
    bookings ||--o| booking_requirements : "details"
    bookings ||--o| booking_guests : "counts"
    bookings ||--o{ booking_quotations : "negotiates"
    booking_quotations ||--o{ booking_quotation_items : "breaks down"
    bookings ||--o{ booking_status_history : "logs"
    bookings ||--o| booking_cancellations : "terminated by"
```

---

### Module G: Finance, Escrow & Settlements (Tables 51-57)

```mermaid
erDiagram
    payments {
        uuid id PK
        uuid booking_id FK
        varchar razorpay_order_id UK
        varchar razorpay_payment_id UK
        varchar payment_stage "ADVANCE_30, FULL_100, BALANCE_70"
        decimal amount
        varchar currency "INR"
        varchar payment_method "UPI, CARD, NETBANKING"
        varchar status "PENDING, ESCROW_HELD, CAPTURED, FAILED, REFUNDED"
        timestamp paid_at
    }

    payment_transactions {
        uuid id PK
        uuid payment_id FK
        varchar transaction_type "GATEWAY_CHARGE, ESCROW_LOCK, PAYOUT_TRANSFER, REFUND"
        varchar gateway_reference
        decimal amount
        varchar status
        jsonb raw_gateway_payload
        timestamp created_at
    }

    refunds {
        uuid id PK
        uuid payment_id FK
        varchar razorpay_refund_id UK
        decimal refund_amount
        varchar reason
        varchar status "PROCESSED, FAILED"
        timestamp processed_at
    }

    provider_earnings {
        uuid id PK
        uuid provider_id FK
        uuid booking_id FK, UK
        decimal gross_booking_value
        decimal platform_commission_rate
        decimal platform_commission_amount
        decimal tax_deducted_at_source "TDS"
        decimal net_earnings
        varchar payout_status "IN_ESCROW, READY_FOR_WITHDRAWAL, SETTLED"
        timestamp created_at
    }

    provider_payouts {
        uuid id PK
        uuid provider_id FK
        varchar payout_reference UK
        decimal amount
        varchar destination_bank_account
        varchar destination_ifsc
        varchar status "INITIATED, PROCESSING, COMPLETED, FAILED"
        timestamp initiated_at
        timestamp completed_at
    }

    platform_commissions {
        uuid id PK
        uuid booking_id FK, UK
        decimal commission_amount
        decimal customer_service_fee
        decimal total_platform_revenue
        timestamp recognized_at
    }

    invoices {
        uuid id PK
        uuid booking_id FK
        varchar invoice_number UK
        varchar invoice_type "CUSTOMER_TAX_INVOICE, PROVIDER_COMMISSION_NOTE"
        varchar pdf_url
        timestamp generated_at
    }

    bookings ||--o{ payments : "funds"
    payments ||--o{ payment_transactions : "audits"
    payments ||--o{ refunds : "reverses"
    bookings ||--o| provider_earnings : "credits"
    bookings ||--o| platform_commissions : "yields"
    bookings ||--o{ invoices : "documents"
```

---

### Module H, I & J: Communication, Reviews, Admin & Auditing (Tables 58-74)

```mermaid
erDiagram
    conversations {
        uuid id PK
        uuid booking_id FK
        timestamp created_at
        timestamp last_message_at
    }

    conversation_participants {
        uuid id PK
        uuid conversation_id FK
        uuid user_id FK
        timestamp joined_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        varchar message_type "TEXT, QUOTATION_OFFER, DISH_PHOTO, LOCATION_PIN"
        text content
        jsonb metadata
        boolean is_read
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        varchar notification_type "BOOKING_REQUEST, QUOTATION_RECEIVED, ESCROW_RELEASED"
        varchar title
        text message
        varchar action_url
        boolean is_read
        timestamp created_at
    }

    reviews {
        uuid id PK
        uuid booking_id FK, UK
        uuid customer_id FK
        uuid provider_id FK
        decimal overall_rating
        decimal food_taste_rating
        decimal hygiene_rating
        decimal punctuality_rating
        decimal hospitality_rating
        text review_text
        boolean is_verified_booking
        timestamp created_at
    }

    review_images {
        uuid id PK
        uuid review_id FK
        varchar image_url
        varchar caption
    }

    review_responses {
        uuid id PK
        uuid review_id FK, UK
        uuid provider_id FK
        text response_text
        timestamp responded_at
    }

    provider_rating_summaries {
        uuid id PK
        uuid provider_id FK, UK
        decimal average_overall_rating
        decimal average_food_rating
        decimal average_hygiene_rating
        decimal average_punctuality_rating
        integer total_reviews_count
        integer five_star_count
        integer four_star_count
        integer three_star_count
        integer two_star_count
        integer one_star_count
        timestamp updated_at
    }

    admin_audit_logs {
        uuid id PK
        uuid admin_user_id FK
        varchar action "VERIFY_PROVIDER, FREEZE_ESCROW, OVERRIDE_COMMISSION, SUSPEND_USER"
        varchar entity_type
        uuid entity_id
        jsonb old_values
        jsonb new_values
        varchar ip_address
        timestamp performed_at
    }

    disputes {
        uuid id PK
        uuid booking_id FK
        uuid raised_by_user_id FK
        varchar dispute_category "NO_SHOW, POOR_HYGIENE, FOOD_SHORTAGE, UNEXPECTED_CHARGES"
        text claim_description
        varchar dispute_status "OPEN, UNDER_INVESTIGATION, RESOLVED, DISMISSED"
        uuid assigned_admin_id FK
        decimal refund_awarded
        timestamp created_at
        timestamp resolved_at
    }

    system_settings {
        varchar key PK
        varchar value
        varchar data_type
        text description
        timestamp updated_at
    }

    platform_feature_flags {
        varchar flag_name PK
        boolean is_enabled
        text description
        jsonb rollout_rules
    }
```
