-- ==============================================================================
-- FLYWAY INITIAL SCHEMA MIGRATION: V1__initial_schema.sql
-- Project: Culinary & Event Atelier ("BOOK MY CHEF")
-- Marketplace for Chefs, Caterers, Decorators, Event Planners & Staff
-- Total Tables: 74 Normalized Relational Tables (PostgreSQL 16+)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- MODULE A: IDENTITY AND ACCESS MANAGEMENT (Tables 01 - 10)
-- ==============================================================================

-- 01. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(128) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    user_type VARCHAR(32) NOT NULL CHECK (user_type IN ('CUSTOMER', 'PROVIDER', 'ADMIN')),
    account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 02. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(1024),
    gender VARCHAR(20),
    date_of_birth DATE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 03. User Addresses
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_type VARCHAR(32) NOT NULL DEFAULT 'HOME' CHECK (address_type IN ('HOME', 'EVENT_VENUE', 'KITCHEN', 'OTHER')),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    landmark VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_city ON user_addresses(city);

-- 04. Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT TRUE
);

-- 05. Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(64) NOT NULL,
    description TEXT
);

-- 06. User Roles Mapping
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, role_id)
);

-- 07. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE (role_id, permission_id)
);

-- 08. User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 09. Provider Invitations
CREATE TABLE IF NOT EXISTS provider_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    invitation_code VARCHAR(64) NOT NULL UNIQUE,
    invited_by UUID REFERENCES users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Admin Invitations
CREATE TABLE IF NOT EXISTS admin_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    admin_role VARCHAR(64) NOT NULL,
    token VARCHAR(128) NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- MODULE B: PROVIDER MANAGEMENT (Tables 11 - 20)
-- ==============================================================================

-- 11. Provider Profiles
CREATE TABLE IF NOT EXISTS provider_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    professional_name VARCHAR(150) NOT NULL,
    business_name VARCHAR(150),
    bio TEXT,
    experience_years INTEGER NOT NULL DEFAULT 0,
    avatar_url VARCHAR(1024),
    cover_image_url VARCHAR(1024),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
    is_accepting_bookings BOOLEAN NOT NULL DEFAULT TRUE,
    min_booking_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_travel_distance_km INTEGER NOT NULL DEFAULT 25,
    base_latitude NUMERIC(9, 6),
    base_longitude NUMERIC(9, 6),
    fssai_license_number VARCHAR(64),
    fssai_expiry_date DATE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_verification ON provider_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_location ON provider_profiles(base_latitude, base_longitude);

-- 12. Provider Types
CREATE TABLE IF NOT EXISTS provider_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL
);

-- 13. Provider Roles
CREATE TABLE IF NOT EXISTS provider_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    role_type VARCHAR(64) NOT NULL CHECK (role_type IN (
        'PRO_CHEF', 'HOME_CHEF', 'PERSONAL_CHEF', 'CATERER',
        'EVENT_PLANNER', 'EVENT_MANAGER', 'DECORATOR',
        'PHOTOGRAPHER', 'VIDEOGRAPHER', 'WAITER', 'KITCHEN_ASSISTANT'
    )),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (provider_id, role_type)
);

-- 14. Provider Verifications
CREATE TABLE IF NOT EXISTS provider_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    verification_type VARCHAR(64) NOT NULL CHECK (verification_type IN ('FSSAI', 'AADHAAR_KYC', 'POLICE_BACKGROUND', 'CULINARY_DEGREE')),
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Provider Documents
CREATE TABLE IF NOT EXISTS provider_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL,
    document_url VARCHAR(1024) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Provider Experiences
CREATE TABLE IF NOT EXISTS provider_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    organization_name VARCHAR(150) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER,
    description TEXT
);

-- 17. Provider Languages
CREATE TABLE IF NOT EXISTS provider_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    UNIQUE (provider_id, language_code)
);

-- 18. Provider Service Areas
CREATE TABLE IF NOT EXISTS provider_service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    neighborhood_name VARCHAR(150),
    postal_code VARCHAR(20),
    radius_km NUMERIC(5, 2) NOT NULL DEFAULT 15.00
);

-- 19. Provider Portfolio
CREATE TABLE IF NOT EXISTS provider_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    media_type VARCHAR(32) NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO')),
    media_url VARCHAR(1024) NOT NULL,
    title VARCHAR(150),
    description TEXT,
    dish_category VARCHAR(64),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_provider_portfolio_provider ON provider_portfolio(provider_id);

-- 20. Provider Business Details
CREATE TABLE IF NOT EXISTS provider_business_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL UNIQUE REFERENCES provider_profiles(id) ON DELETE CASCADE,
    legal_entity_name VARCHAR(200),
    gst_number VARCHAR(32),
    pan_number VARCHAR(32),
    bank_account_number VARCHAR(64),
    bank_ifsc_code VARCHAR(32),
    bank_name VARCHAR(100),
    bank_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- MODULE C: SERVICES, PACKAGES AND PRICING (Tables 21 - 30)
-- ==============================================================================

-- 21. Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(64),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 22. Service Subcategories
CREATE TABLE IF NOT EXISTS service_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL
);

-- 23. Services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    subcategory_id UUID NOT NULL REFERENCES service_subcategories(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    service_delivery_mode VARCHAR(64) NOT NULL CHECK (service_delivery_mode IN (
        'CHEF_VISITS_HOME', 'COOK_AND_DELIVER', 'VENUE_BANQUET', 'CUSTOMER_COLLECTS', 'CUSTOM_ARRANGEMENT'
    )),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);

-- 24. Service Packages
CREATE TABLE IF NOT EXISTS service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL,
    min_guests INTEGER NOT NULL DEFAULT 5,
    max_guests INTEGER NOT NULL DEFAULT 200,
    is_customizable BOOLEAN NOT NULL DEFAULT TRUE
);

-- 25. Service Package Items
CREATE TABLE IF NOT EXISTS service_package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
    item_category VARCHAR(64) NOT NULL CHECK (item_category IN ('WELCOME_DRINK', 'STARTER', 'MAIN_COURSE', 'BREAD', 'RICE', 'DESSERT')),
    dish_name VARCHAR(150) NOT NULL,
    is_vegetarian BOOLEAN NOT NULL DEFAULT TRUE,
    is_spice_customizable BOOLEAN NOT NULL DEFAULT TRUE
);

-- 26. Cuisine Categories
CREATE TABLE IF NOT EXISTS cuisine_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 27. Provider Cuisines
CREATE TABLE IF NOT EXISTS provider_cuisines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    cuisine_id UUID NOT NULL REFERENCES cuisine_categories(id) ON DELETE CASCADE,
    is_signature BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (provider_id, cuisine_id)
);

-- 28. Service Pricing Models
CREATE TABLE IF NOT EXISTS service_pricing_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL
);

-- 29. Service Prices
CREATE TABLE IF NOT EXISTS service_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    pricing_model_id UUID NOT NULL REFERENCES service_pricing_models(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    min_units INTEGER DEFAULT 1,
    max_units INTEGER
);

-- 30. Service Additional Charges
CREATE TABLE IF NOT EXISTS service_additional_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    charge_type VARCHAR(64) NOT NULL,
    rate NUMERIC(10, 2) NOT NULL
);

-- ==============================================================================
-- MODULE D: AVAILABILITY MANAGEMENT (Tables 31 - 35)
-- ==============================================================================

-- 31. Provider Availability
CREATE TABLE IF NOT EXISTS provider_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (provider_id, day_of_week)
);

-- 32. Provider Availability Slots
CREATE TABLE IF NOT EXISTS provider_availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    time_slot VARCHAR(32) NOT NULL CHECK (time_slot IN ('BREAKFAST', 'LUNCH', 'HIGH_TEA', 'DINNER', 'FULL_DAY')),
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED')),
    reservation_status VARCHAR(32) NOT NULL DEFAULT 'NONE' CHECK (reservation_status IN ('NONE', 'LOCKED_PENDING_PAYMENT')),
    lock_expires_at TIMESTAMP WITH TIME ZONE,
    locked_by_booking_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider_id, slot_date, time_slot)
);
CREATE INDEX IF NOT EXISTS idx_slots_provider_date ON provider_availability_slots(provider_id, slot_date);

-- 33. Provider Blocked Dates
CREATE TABLE IF NOT EXISTS provider_blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider_id, blocked_date)
);

-- 34. Provider Booking Limits
CREATE TABLE IF NOT EXISTS provider_booking_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL UNIQUE REFERENCES provider_profiles(id) ON DELETE CASCADE,
    max_daily_bookings INTEGER NOT NULL DEFAULT 1,
    advance_notice_hours INTEGER NOT NULL DEFAULT 24,
    max_advance_days INTEGER NOT NULL DEFAULT 60
);

-- 35. Provider Calendar Events
CREATE TABLE IF NOT EXISTS provider_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    booking_id UUID,
    event_title VARCHAR(200) NOT NULL,
    start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    end_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED'
);

-- ==============================================================================
-- MODULE E: CUSTOMER PREFERENCES AND DISCOVERY (Tables 36 - 40)
-- ==============================================================================

-- 36. Customer Preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_cuisines JSONB,
    dietary_preferences JSONB,
    spice_level VARCHAR(20) DEFAULT 'MEDIUM',
    default_guest_count INTEGER DEFAULT 10
);

-- 37. Customer Search History
CREATE TABLE IF NOT EXISTS customer_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    search_query VARCHAR(255) NOT NULL,
    filters_applied JSONB,
    result_count INTEGER,
    searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 38. Customer Favourites
CREATE TABLE IF NOT EXISTS customer_favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, provider_id)
);

-- 39. Saved Searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_title VARCHAR(100) NOT NULL,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 40. Location Cache
CREATE TABLE IF NOT EXISTS location_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    postal_code VARCHAR(20) NOT NULL UNIQUE,
    area_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL
);

-- ==============================================================================
-- MODULE F: BOOKING MANAGEMENT (Tables 41 - 50)
-- ==============================================================================

-- 41. Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(64) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    booking_status VARCHAR(48) NOT NULL CHECK (booking_status IN (
        'DRAFT', 'PENDING_PROVIDER_CONFIRMATION', 'QUOTATION_REQUIRED', 'QUOTATION_SENT',
        'QUOTATION_ACCEPTED', 'PROVIDER_ACCEPTED', 'PROVIDER_REJECTED', 'PENDING_PAYMENT',
        'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CUSTOMER_CANCELLED', 'PROVIDER_CANCELLED',
        'EXPIRED', 'DISPUTED', 'REFUND_PENDING', 'REFUNDED'
    )),
    payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN (
        'PENDING', 'ESCROW_HELD', 'CAPTURED', 'FAILED', 'REFUNDED'
    )),
    event_date DATE NOT NULL,
    time_slot VARCHAR(32) NOT NULL,
    guest_count INTEGER NOT NULL,
    service_delivery_mode VARCHAR(64) NOT NULL,
    estimated_total NUMERIC(10, 2) NOT NULL,
    final_amount NUMERIC(10, 2),
    advance_amount NUMERIC(10, 2),
    balance_amount NUMERIC(10, 2),
    venue_address_id UUID NOT NULL REFERENCES user_addresses(id),
    host_special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date);

-- 42. Booking Services
CREATE TABLE IF NOT EXISTS booking_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_package_id UUID REFERENCES service_packages(id),
    package_name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1
);

-- 43. Booking Requirements
CREATE TABLE IF NOT EXISTS booking_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    dietary_preference VARCHAR(64) NOT NULL,
    spice_level VARCHAR(32) NOT NULL,
    ingredients_provided_by_host BOOLEAN NOT NULL DEFAULT FALSE,
    kitchen_appliances_available BOOLEAN NOT NULL DEFAULT TRUE
);

-- 44. Booking Guests
CREATE TABLE IF NOT EXISTS booking_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    adults_count INTEGER NOT NULL DEFAULT 1,
    kids_count INTEGER NOT NULL DEFAULT 0,
    seniors_count INTEGER NOT NULL DEFAULT 0
);

-- 45. Booking Quotations
CREATE TABLE IF NOT EXISTS booking_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    quotation_version INTEGER NOT NULL DEFAULT 1,
    subtotal_amount NUMERIC(10, 2) NOT NULL,
    travel_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ingredient_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    additional_staff_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    platform_service_fee NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    quotation_status VARCHAR(32) NOT NULL DEFAULT 'SENT' CHECK (quotation_status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REVISED', 'REJECTED')),
    provider_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 46. Booking Quotation Items
CREATE TABLE IF NOT EXISTS booking_quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES booking_quotations(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL
);

-- 47. Booking Status History
CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    from_status VARCHAR(48) NOT NULL,
    to_status VARCHAR(48) NOT NULL,
    transition_reason TEXT,
    changed_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 48. Booking Cancellations
CREATE TABLE IF NOT EXISTS booking_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    cancelled_by_user_id UUID NOT NULL REFERENCES users(id),
    cancellation_reason TEXT NOT NULL,
    refund_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    penalty_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cancelled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 49. Booking Assignments
CREATE TABLE IF NOT EXISTS booking_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    staff_user_id UUID NOT NULL REFERENCES users(id),
    assignment_role VARCHAR(64) NOT NULL
);

-- 50. Booking Attachments
CREATE TABLE IF NOT EXISTS booking_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    attachment_type VARCHAR(64) NOT NULL,
    file_url VARCHAR(1024) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- MODULE G: FINANCIAL MANAGEMENT (Tables 51 - 57)
-- ==============================================================================

-- 51. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    razorpay_order_id VARCHAR(128) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(128) UNIQUE,
    payment_stage VARCHAR(32) NOT NULL CHECK (payment_stage IN ('ADVANCE_30', 'FULL_100', 'BALANCE_70')),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ESCROW_HELD', 'CAPTURED', 'FAILED', 'REFUNDED')),
    paid_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

-- 52. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    transaction_type VARCHAR(64) NOT NULL CHECK (transaction_type IN ('GATEWAY_CHARGE', 'ESCROW_LOCK', 'PAYOUT_TRANSFER', 'REFUND')),
    gateway_reference VARCHAR(128) NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    raw_gateway_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 53. Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    razorpay_refund_id VARCHAR(128) NOT NULL UNIQUE,
    refund_amount NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSED',
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 54. Provider Earnings
CREATE TABLE IF NOT EXISTS provider_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    gross_booking_value NUMERIC(10, 2) NOT NULL,
    platform_commission_rate NUMERIC(5, 2) NOT NULL,
    platform_commission_amount NUMERIC(10, 2) NOT NULL,
    tax_deducted_at_source NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_earnings NUMERIC(10, 2) NOT NULL,
    payout_status VARCHAR(32) NOT NULL DEFAULT 'IN_ESCROW' CHECK (payout_status IN ('IN_ESCROW', 'READY_FOR_WITHDRAWAL', 'SETTLED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_provider_earnings_provider ON provider_earnings(provider_id);

-- 55. Provider Payouts
CREATE TABLE IF NOT EXISTS provider_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    payout_reference VARCHAR(64) NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    destination_bank_account VARCHAR(64) NOT NULL,
    destination_ifsc VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 56. Platform Commissions
CREATE TABLE IF NOT EXISTS platform_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    commission_amount NUMERIC(10, 2) NOT NULL,
    customer_service_fee NUMERIC(10, 2) NOT NULL,
    total_platform_revenue NUMERIC(10, 2) NOT NULL,
    recognized_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 57. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    invoice_type VARCHAR(64) NOT NULL CHECK (invoice_type IN ('CUSTOMER_TAX_INVOICE', 'PROVIDER_COMMISSION_NOTE')),
    pdf_url VARCHAR(1024),
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- MODULE H: COMMUNICATION (Tables 58 - 63)
-- ==============================================================================

-- 58. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 59. Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (conversation_id, user_id)
);

-- 60. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message_type VARCHAR(32) NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'QUOTATION_OFFER', 'DISH_PHOTO', 'LOCATION_PIN')),
    content TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- 61. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(64) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(512),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 62. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- 63. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_reference VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- MODULE I: REVIEWS AND RATINGS (Tables 64 - 67)
-- ==============================================================================

-- 64. Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    overall_rating NUMERIC(2, 1) NOT NULL CHECK (overall_rating BETWEEN 1.0 AND 5.0),
    food_taste_rating NUMERIC(2, 1) CHECK (food_taste_rating BETWEEN 1.0 AND 5.0),
    hygiene_rating NUMERIC(2, 1) CHECK (hygiene_rating BETWEEN 1.0 AND 5.0),
    punctuality_rating NUMERIC(2, 1) CHECK (punctuality_rating BETWEEN 1.0 AND 5.0),
    hospitality_rating NUMERIC(2, 1) CHECK (hospitality_rating BETWEEN 1.0 AND 5.0),
    review_text TEXT,
    is_verified_booking BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);

-- 65. Review Images
CREATE TABLE IF NOT EXISTS review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url VARCHAR(1024) NOT NULL,
    caption VARCHAR(255)
);

-- 66. Review Responses
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    response_text TEXT NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 67. Provider Rating Summaries
CREATE TABLE IF NOT EXISTS provider_rating_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL UNIQUE REFERENCES provider_profiles(id) ON DELETE CASCADE,
    average_overall_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    average_food_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    average_hygiene_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    average_punctuality_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_reviews_count INTEGER NOT NULL DEFAULT 0,
    five_star_count INTEGER NOT NULL DEFAULT 0,
    four_star_count INTEGER NOT NULL DEFAULT 0,
    three_star_count INTEGER NOT NULL DEFAULT 0,
    two_star_count INTEGER NOT NULL DEFAULT 0,
    one_star_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- MODULE J: PLATFORM ADMINISTRATION (Tables 68 - 74)
-- ==============================================================================

-- 68. Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON admin_audit_logs(entity_type, entity_id);

-- 69. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(64) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    data_type VARCHAR(32) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 70. Platform Categories
CREATE TABLE IF NOT EXISTS platform_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 71. Platform Feature Flags
CREATE TABLE IF NOT EXISTS platform_feature_flags (
    flag_name VARCHAR(64) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    rollout_rules JSONB
);

-- 72. Provider Feature Access
CREATE TABLE IF NOT EXISTS provider_feature_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    feature_name VARCHAR(64) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (provider_id, feature_name)
);

-- 73. Disputes
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    raised_by_user_id UUID NOT NULL REFERENCES users(id),
    dispute_category VARCHAR(64) NOT NULL,
    claim_description TEXT NOT NULL,
    dispute_status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (dispute_status IN ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED')),
    assigned_admin_id UUID REFERENCES users(id),
    refund_awarded NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);

-- 74. Account Status History
CREATE TABLE IF NOT EXISTS account_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_status VARCHAR(32) NOT NULL,
    new_status VARCHAR(32) NOT NULL,
    reason TEXT NOT NULL,
    changed_by_admin_id UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INITIAL SEED DATA: Roles, Permissions, Categories & Cuisines
-- ==============================================================================

INSERT INTO roles (code, name, description) VALUES
('ROLE_CUSTOMER', 'Customer / Host', 'Discovers and books culinary and event services'),
('ROLE_PROVIDER', 'Service Provider', 'Delivers chef, catering, or event services'),
('ROLE_SUPER_ADMIN', 'Platform Super Admin', 'Full administrative control and user invitation rights'),
('ROLE_OPS_ADMIN', 'Operations Administrator', 'Manages day-to-day operations and bookings'),
('ROLE_VERIFICATION_ADMIN', 'Verification Administrator', 'Audits and approves provider KYC and FSSAI credentials'),
('ROLE_FINANCE_ADMIN', 'Finance Administrator', 'Oversees escrow releases, payouts, and disputes')
ON CONFLICT (code) DO NOTHING;

INSERT INTO service_categories (code, title, description, icon_name, sort_order) VALUES
('CHEFS', 'Professional & Home Chefs', 'Master chefs, home cooks, and personal culinary talent', 'soup_kitchen', 1),
('CATERING', 'Luxury & Banquet Catering', 'Full-scale event catering for weddings, parties, and corporatess', 'room_service', 2),
('PLANNING', 'Event Planners & Managers', 'End-to-end wedding, party, and celebration management', 'event_note', 3),
('DECORATION', 'Floral & Stage Decor', 'Theme mandaps, balloon styling, lighting, and stage setups', 'filter_vintage', 4),
('MEDIA', 'Photography & Video', 'Event coverage, candid photography, and cinematic videos', 'photo_camera', 5),
('STAFF', 'Serving Staff & Assistants', 'Professional waiters, bartenders, and kitchen clean-up helpers', 'local_bar', 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO cuisine_categories (code, name, description) VALUES
('ANDHRA', 'Andhra Royal & Spicy', 'Traditional Andhra meals with fragrant spices, pappu, and gongura'),
('TELANGANA', 'Telangana Traditional', 'Earthy regional flavors, jowar rotis, and spicy country curries'),
('SOUTH_INDIAN', 'South Indian Classic', 'Traditional banana leaf feasts, sambar, rasam, and filter coffee'),
('NORTH_INDIAN', 'North Indian & Mughlai', 'Rich gravies, tandoori breads, biryanis, and kebabs'),
('CHINESE', 'Indo-Chinese Gourmet', 'Wok-tossed noodles, Manchurian, fried rice, and dim sums'),
('CONTINENTAL', 'Continental & Italian', 'Artisan pastas, gourmet pizzas, risottos, and salads'),
('TRADITIONAL_HOME', 'Traditional Home-Style', 'Wholesome, low-oil, hygienic home-style comfort food'),
('VEGAN', 'Pure Vegan & Plant-Based', 'Zero dairy, 100% plant-based gourmet creations')
ON CONFLICT (code) DO NOTHING;
