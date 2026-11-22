-- ============================================================================
-- BOOK MY CHEF - ROLE-BASED AUTHENTICATION & CONSOLE ROUTING MIGRATION (V2)
-- Enforces account_type, multi-role provider mappings, admin invitations, and session tracking
-- ============================================================================

-- 1. Ensure admin_users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_role VARCHAR(64) NOT NULL DEFAULT 'SUPER_ADMIN',
    invited_by UUID REFERENCES users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_admin_users_user_id UNIQUE (user_id)
);

-- 2. Ensure authentication_sessions Table
CREATE TABLE IF NOT EXISTS authentication_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON authentication_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON authentication_sessions(session_token_hash);

-- 3. Enhance provider_profiles with profile_completion & description alias
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS profile_completion INTEGER NOT NULL DEFAULT 85;

-- 4. Enhance provider_roles with role_name and is_active columns
ALTER TABLE provider_roles ADD COLUMN IF NOT EXISTS role_name VARCHAR(100);
ALTER TABLE provider_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 5. Seed / Update Authoritative Accounts
-- (A) Customer Account: Ananya Rao
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'clerk_cust_ananya_01',
    '+91 98765 43210',
    'ananya.rao@example.com',
    'CUSTOMER',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE SET user_type = 'CUSTOMER', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name, avatar_url, preferred_language)
VALUES (
    (SELECT id FROM users WHERE phone = '+91 98765 43210'),
    'Ananya Rao',
    'Ananya',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBzVJYoUg9l_WapT91NCMpJ9iJlGjuNoA1q-qCymzZ65caGbUFugoC_xxFbEKWuicSkRS6oMM21LaYesuK4kkQg81Z_njJ4Pv38_DjNF-82J_zm3YedtpYTS5kopHlaEKmNriUhcAMatpvufPFitsu3nK1gAkaJ7hxCJiXzr_HnPtpUbBp7pUwy4V5uESyTrM9Nz4aikNcmXUHLRJt_hJ9Q-yr8KRHDh9iU4KUqqLY',
    'en'
) ON CONFLICT (user_id) DO NOTHING;

-- (B) Service Provider Account: Chef Raghavendra Rao
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'clerk_prov_raghavendra_01',
    '+91 98765 43211',
    'chef.raghavendra@atelier.in',
    'PROVIDER',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE SET user_type = 'PROVIDER', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name, avatar_url)
VALUES (
    (SELECT id FROM users WHERE phone = '+91 98765 43211'),
    'Chef Raghavendra Rao',
    'Chef Raghavendra',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDxC3g4D4M9B6kI7hT5rV1nZ3lX9yQ2sF8uK0eN4pW6tJ5rV7nM9bC1xZ8vL3kP0eN6tJ8rV9nZ1mX7yQ4sF5uK2eN0pW8t'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO provider_profiles (
    id, user_id, professional_name, business_name, bio, description,
    experience_years, verification_status, profile_completion, min_booking_amount, max_travel_distance_km
)
VALUES (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    (SELECT id FROM users WHERE phone = '+91 98765 43211'),
    'Chef Raghavendra Rao',
    'Royal Dakshin Culinary Studio',
    'Master of Royal Hyderabadi & Coastal Andhra Haute Cuisine with 18+ years of culinary excellence.',
    'Fine dining, live banquet catering, and royal culinary experiences across Telangana and Andhra Pradesh.',
    18,
    'VERIFIED',
    95,
    3500.00,
    40
) ON CONFLICT (user_id) DO UPDATE SET profile_completion = 95, verification_status = 'VERIFIED';

-- Multi-Role Mapping for Partner: Chef + Caterer + Event Manager
INSERT INTO provider_roles (provider_id, role_type, role_name, is_primary, is_active)
VALUES 
    ((SELECT id FROM provider_profiles WHERE professional_name = 'Chef Raghavendra Rao' LIMIT 1), 'PRO_CHEF', 'Professional Chef', true, true),
    ((SELECT id FROM provider_profiles WHERE professional_name = 'Chef Raghavendra Rao' LIMIT 1), 'CATERER', 'Caterer', false, true),
    ((SELECT id FROM provider_profiles WHERE professional_name = 'Chef Raghavendra Rao' LIMIT 1), 'EVENT_MANAGER', 'Event Manager', false, true)
ON CONFLICT (provider_id, role_type) DO UPDATE SET is_active = true, role_name = EXCLUDED.role_name;

-- (C) Platform Administrator Account: Vikram Aditya (Super Admin)
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'clerk_admin_super_01',
    '+91 98765 43212',
    'superadmin@atelier.in',
    'ADMIN',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE SET user_type = 'ADMIN', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name)
VALUES (
    (SELECT id FROM users WHERE phone = '+91 98765 43212'),
    'Vikram Aditya',
    'Super Admin'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admin_users (user_id, admin_role, status)
VALUES (
    (SELECT id FROM users WHERE phone = '+91 98765 43212'),
    'SUPER_ADMIN',
    'ACTIVE'
) ON CONFLICT (user_id) DO NOTHING;
