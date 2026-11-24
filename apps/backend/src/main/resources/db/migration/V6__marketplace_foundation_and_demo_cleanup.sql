-- ============================================================================
-- V6: Marketplace foundation + removal of demonstration data
--
-- Part 1 removes the demo accounts/providers/bookings seeded by V2, V3 and V5.
--   Rows are matched ONLY by the placeholder identifiers those migrations used
--   (clerk_id values such as 'clerk_prov_*' that Clerk never issues). A seeded
--   row that a real Clerk user has since claimed no longer carries the
--   placeholder clerk_id and is therefore left untouched. A seeded provider
--   that a real customer has booked is unpublished instead of deleted, so no
--   genuine booking is lost.
-- Part 2 adds the columns, constraints, catalog rows and indexes the
--   database-driven marketplace needs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1. DEMO DATA REMOVAL
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE _seed_users ON COMMIT DROP AS
SELECT id FROM users WHERE clerk_id IN (
    'clerk_cust_ananya_01', 'clerk_prov_raghavendra_01', 'clerk_prov_anupama_02',
    'clerk_prov_caterers_03', 'clerk_prov_utsav_04', 'clerk_prov_pradeep_05',
    'clerk_prov_shreya_06', 'clerk_admin_super_01'
)
-- Accounts created by the former unauthenticated /auth/sync fallback ("user_guest_<phone>")
-- and the mock header path. Clerk user ids never contain a second underscore, so no real
-- Clerk account can match these patterns.
   OR clerk_id LIKE 'user\_guest\_%'
   OR clerk_id LIKE 'user\_mock\_%';

CREATE TEMP TABLE _seed_providers ON COMMIT DROP AS
SELECT id FROM provider_profiles WHERE user_id IN (SELECT id FROM _seed_users);

-- Demo bookings = bookings where BOTH sides are demo accounts.
CREATE TEMP TABLE _seed_bookings ON COMMIT DROP AS
SELECT id FROM bookings
WHERE customer_id IN (SELECT id FROM _seed_users)
  AND provider_id IN (SELECT id FROM _seed_providers);

DELETE FROM refunds WHERE payment_id IN (SELECT id FROM payments WHERE booking_id IN (SELECT id FROM _seed_bookings));
DELETE FROM payments WHERE booking_id IN (SELECT id FROM _seed_bookings);
DELETE FROM reviews WHERE booking_id IN (SELECT id FROM _seed_bookings);
DELETE FROM provider_earnings WHERE booking_id IN (SELECT id FROM _seed_bookings);
DELETE FROM platform_commissions WHERE booking_id IN (SELECT id FROM _seed_bookings);
DELETE FROM invoices WHERE booking_id IN (SELECT id FROM _seed_bookings);
DELETE FROM disputes WHERE booking_id IN (SELECT id FROM _seed_bookings);
DELETE FROM bookings WHERE id IN (SELECT id FROM _seed_bookings);

-- Demo users/providers that still have bookings with real counterparts are kept
-- (to preserve the real party's history) but are disabled and hidden.
CREATE TEMP TABLE _kept_users ON COMMIT DROP AS
SELECT DISTINCT u.id FROM _seed_users u
WHERE EXISTS (SELECT 1 FROM bookings b WHERE b.customer_id = u.id)
   OR EXISTS (SELECT 1 FROM bookings b JOIN provider_profiles p ON p.id = b.provider_id WHERE p.user_id = u.id);

UPDATE users SET account_status = 'SUSPENDED' WHERE id IN (SELECT id FROM _kept_users);
UPDATE user_profiles SET full_name = 'Former demo account', display_name = NULL, avatar_url = NULL
WHERE user_id IN (SELECT id FROM _kept_users);
UPDATE provider_profiles SET is_accepting_bookings = FALSE, verification_status = 'SUSPENDED'
WHERE user_id IN (SELECT id FROM _kept_users);

DELETE FROM _seed_users WHERE id IN (SELECT id FROM _kept_users);
DELETE FROM _seed_providers WHERE id NOT IN (SELECT p.id FROM provider_profiles p JOIN _seed_users u ON u.id = p.user_id);

-- Remaining references to deletable demo users/providers
DELETE FROM review_responses WHERE provider_id IN (SELECT id FROM _seed_providers);
DELETE FROM reviews WHERE customer_id IN (SELECT id FROM _seed_users) OR provider_id IN (SELECT id FROM _seed_providers);
DELETE FROM provider_payouts WHERE provider_id IN (SELECT id FROM _seed_providers);
DELETE FROM messages WHERE sender_id IN (SELECT id FROM _seed_users);
DELETE FROM admin_audit_logs WHERE admin_user_id IN (SELECT id FROM _seed_users);
DELETE FROM admin_invitations WHERE invited_by IN (SELECT id FROM _seed_users) OR token = 'tok_inv_superadmin_01';
UPDATE provider_invitations SET invited_by = NULL WHERE invited_by IN (SELECT id FROM _seed_users);
UPDATE provider_verifications SET verified_by = NULL WHERE verified_by IN (SELECT id FROM _seed_users);
UPDATE booking_status_history SET changed_by_user_id = NULL WHERE changed_by_user_id IN (SELECT id FROM _seed_users);
UPDATE disputes SET assigned_admin_id = NULL WHERE assigned_admin_id IN (SELECT id FROM _seed_users);
UPDATE account_status_history SET changed_by_admin_id = NULL WHERE changed_by_admin_id IN (SELECT id FROM _seed_users);
DELETE FROM support_tickets WHERE user_id IN (SELECT id FROM _seed_users);
DELETE FROM admin_users WHERE user_id IN (SELECT id FROM _seed_users);

-- provider_profiles -> services/packages/cuisines/roles/etc. cascade
DELETE FROM provider_profiles WHERE id IN (SELECT id FROM _seed_providers);
-- users -> profiles/addresses/favourites/notifications cascade
DELETE FROM users WHERE id IN (SELECT id FROM _seed_users);

-- Subcategories invented by V5 (fixed demo UUIDs), only if nothing real uses them
DELETE FROM service_subcategories s
WHERE s.id IN (
    '11111111-aaaa-bbbb-cccc-111111111111', '22222222-aaaa-bbbb-cccc-222222222222',
    '33333333-aaaa-bbbb-cccc-333333333333', '44444444-aaaa-bbbb-cccc-444444444444',
    '55555555-aaaa-bbbb-cccc-555555555555', '66666666-aaaa-bbbb-cccc-666666666666')
  AND NOT EXISTS (SELECT 1 FROM services sv WHERE sv.subcategory_id = s.id);

-- Providers were previously auto-marked VERIFIED on profile save without any
-- admin review (no verified_at). Verification must come from an administrator.
UPDATE provider_profiles SET verification_status = 'PENDING'
WHERE verification_status = 'VERIFIED' AND verified_at IS NULL;

-- ----------------------------------------------------------------------------
-- PART 2. USERS: remove duplicate alias columns, allow email-only accounts
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_user_aliases ON users;
DROP FUNCTION IF EXISTS sync_user_aliases();
DROP INDEX IF EXISTS idx_users_clerk_user_id;
DROP INDEX IF EXISTS idx_users_phone_number;
ALTER TABLE users DROP COLUMN IF EXISTS clerk_user_id;
ALTER TABLE users DROP COLUMN IF EXISTS phone_number;
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
ALTER TABLE users DROP COLUMN IF EXISTS account_type;
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
-- Placeholder phones generated for email-only sign-ups
UPDATE users SET phone = NULL WHERE phone LIKE 'usr\_%' OR phone = '+910000000000';

-- Customer's home city, collected at registration and used as the default search location
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE admin_invitations DROP COLUMN IF EXISTS phone_number;
ALTER TABLE admin_invitations DROP COLUMN IF EXISTS assigned_admin_role;
ALTER TABLE admin_invitations DROP COLUMN IF EXISTS invitation_status;
ALTER TABLE admin_invitations ALTER COLUMN invited_by DROP NOT NULL;

-- ----------------------------------------------------------------------------
-- PART 3. PROVIDER PROFILE: location, publication state
-- ----------------------------------------------------------------------------
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS locality VARCHAR(150);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS custom_cuisines VARCHAR(255);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE provider_profiles DROP COLUMN IF EXISTS profile_completion;
ALTER TABLE provider_profiles ALTER COLUMN onboarding_status SET DEFAULT 'DRAFT';
-- Previous 'COMPLETED' meant nothing more than "row exists"; providers must now publish.
UPDATE provider_profiles SET onboarding_status = 'DRAFT' WHERE onboarding_status NOT IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');
ALTER TABLE provider_profiles ADD CONSTRAINT chk_provider_onboarding_status
    CHECK (onboarding_status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED'));
-- min_booking_amount defaulted to an invented 1500 for every provider; it is now optional.
ALTER TABLE provider_profiles ALTER COLUMN min_booking_amount DROP NOT NULL;
ALTER TABLE provider_profiles ALTER COLUMN min_booking_amount DROP DEFAULT;

CREATE INDEX IF NOT EXISTS idx_provider_profiles_onboarding ON provider_profiles(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city ON provider_profiles(lower(city));

ALTER TABLE provider_roles DROP CONSTRAINT IF EXISTS provider_roles_role_type_check;
ALTER TABLE provider_roles ADD CONSTRAINT provider_roles_role_type_check CHECK (role_type IN (
    'HOME_CHEF', 'PRO_CHEF', 'PERSONAL_CHEF', 'CATERER',
    'EVENT_PLANNER', 'WEDDING_PLANNER', 'EVENT_MANAGER', 'DECORATOR',
    'PHOTOGRAPHER', 'VIDEOGRAPHER', 'BARTENDER', 'WAITER', 'KITCHEN_ASSISTANT'
));
CREATE INDEX IF NOT EXISTS idx_provider_roles_role_type ON provider_roles(role_type, provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_cuisines_cuisine ON provider_cuisines(cuisine_id, provider_id);

-- ----------------------------------------------------------------------------
-- PART 4. CUISINE CATALOG: plain names, Italian separate from Continental
-- ----------------------------------------------------------------------------
UPDATE cuisine_categories SET name = 'Andhra' WHERE code = 'ANDHRA';
UPDATE cuisine_categories SET name = 'Telangana' WHERE code = 'TELANGANA';
UPDATE cuisine_categories SET name = 'South Indian' WHERE code = 'SOUTH_INDIAN';
UPDATE cuisine_categories SET name = 'North Indian' WHERE code = 'NORTH_INDIAN';
UPDATE cuisine_categories SET name = 'Chinese' WHERE code = 'CHINESE';
UPDATE cuisine_categories SET name = 'Continental' WHERE code = 'CONTINENTAL';
UPDATE cuisine_categories SET name = 'Traditional home-style' WHERE code = 'TRADITIONAL_HOME';
UPDATE cuisine_categories SET name = 'Vegan' WHERE code = 'VEGAN';
INSERT INTO cuisine_categories (code, name) VALUES ('ITALIAN', 'Italian') ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- PART 5. SERVICES & PRICING
-- ----------------------------------------------------------------------------
ALTER TABLE services ALTER COLUMN subcategory_id DROP NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS role_type VARCHAR(64);
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_guests INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_guests INTEGER;
ALTER TABLE services ADD CONSTRAINT chk_services_role_type CHECK (role_type IS NULL OR role_type IN (
    'HOME_CHEF', 'PRO_CHEF', 'PERSONAL_CHEF', 'CATERER',
    'EVENT_PLANNER', 'WEDDING_PLANNER', 'EVENT_MANAGER', 'DECORATOR',
    'PHOTOGRAPHER', 'VIDEOGRAPHER', 'BARTENDER', 'WAITER', 'KITCHEN_ASSISTANT'
));
ALTER TABLE services ADD CONSTRAINT chk_services_guests CHECK (
    (min_guests IS NULL OR min_guests > 0) AND (max_guests IS NULL OR max_guests > 0)
    AND (min_guests IS NULL OR max_guests IS NULL OR min_guests <= max_guests));
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_service_delivery_mode_check;
ALTER TABLE services ADD CONSTRAINT services_service_delivery_mode_check CHECK (service_delivery_mode IN (
    'CHEF_VISITS_HOME', 'PROVIDER_KITCHEN', 'COOK_AND_DELIVER', 'VENUE_BANQUET',
    'ON_SITE', 'CUSTOMER_COLLECTS', 'CUSTOM_ARRANGEMENT'
));
CREATE INDEX IF NOT EXISTS idx_services_role_active ON services(role_type, is_active, provider_id);

INSERT INTO service_pricing_models (code, title) VALUES
    ('PER_HOUR', 'Per hour'),
    ('PER_DAY', 'Per day'),
    ('PER_EVENT', 'Per event'),
    ('PER_PERSON', 'Per person'),
    ('PER_PLATE', 'Per plate'),
    ('PER_100_GUESTS', 'Per 100 guests'),
    ('PER_PACKAGE', 'Per package'),
    ('PER_SETUP', 'Per setup'),
    ('CUSTOM_QUOTE', 'Custom quotation')
ON CONFLICT (code) DO NOTHING;

-- One price row per service; amount is NULL only for CUSTOM_QUOTE.
ALTER TABLE service_prices ALTER COLUMN amount DROP NOT NULL;
ALTER TABLE service_prices ADD CONSTRAINT uq_service_prices_service UNIQUE (service_id);
ALTER TABLE service_prices ADD CONSTRAINT chk_service_prices_amount CHECK (amount IS NULL OR amount >= 0);
CREATE INDEX IF NOT EXISTS idx_service_prices_amount ON service_prices(amount);

-- ----------------------------------------------------------------------------
-- PART 6. BOOKINGS
-- ----------------------------------------------------------------------------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_city VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cuisine_preference VARCHAR(150);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_category VARCHAR(64);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(32);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_title VARCHAR(150);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_message TEXT;
-- estimated_total is NULL when the service is quoted on request
ALTER TABLE bookings ALTER COLUMN estimated_total DROP NOT NULL;
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_guest_count CHECK (guest_count > 0);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
UPDATE bookings SET payment_status = 'ESCROW_HELD' WHERE payment_status = 'ESCROW_LOCKED';
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN (
    'PENDING', 'NOT_REQUIRED', 'ESCROW_HELD', 'CAPTURED', 'FAILED', 'REFUNDED'
));
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date ON bookings(provider_id, event_date);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking ON booking_status_history(booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_booking_quotations_booking ON booking_quotations(booking_id);

-- ----------------------------------------------------------------------------
-- PART 7. PLATFORM SETTINGS (read by the API; editable by administrators)
-- ----------------------------------------------------------------------------
INSERT INTO system_settings (key, value, data_type, description) VALUES
    ('booking.payment_required', 'false', 'BOOLEAN',
     'When true, accepted bookings wait for online payment before they are confirmed.'),
    ('booking.request_expiry_hours', '48', 'INTEGER',
     'Booking requests with no provider response expire after this many hours.'),
    ('marketplace.require_verification_to_list', 'false', 'BOOLEAN',
     'When true, only administrator-verified providers appear in customer search.'),
    ('platform.commission_rate', '10.00', 'DECIMAL',
     'Platform commission percentage applied to completed bookings.')
ON CONFLICT (key) DO NOTHING;
