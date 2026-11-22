-- ============================================================================
-- BOOK MY CHEF - PRODUCTION CLERK SMS OTP & ACCOUNT SYNCHRONIZATION (V3)
-- Bridges Clerk Phone Verification with internal PostgreSQL schema
-- ============================================================================

-- 1. Enhance users table with explicit Clerk & phone verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Backfill existing data
UPDATE users SET 
    clerk_user_id = clerk_id,
    phone_number = phone,
    account_type = user_type,
    phone_verified_at = CURRENT_TIMESTAMP
WHERE clerk_user_id IS NULL;

-- Keep clerk_user_id, phone_number, account_type synced
CREATE OR REPLACE FUNCTION sync_user_aliases()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clerk_user_id IS NULL AND NEW.clerk_id IS NOT NULL THEN
        NEW.clerk_user_id := NEW.clerk_id;
    END IF;
    IF NEW.clerk_id IS NULL AND NEW.clerk_user_id IS NOT NULL THEN
        NEW.clerk_id := NEW.clerk_user_id;
    END IF;
    IF NEW.phone_number IS NULL AND NEW.phone IS NOT NULL THEN
        NEW.phone_number := NEW.phone;
    END IF;
    IF NEW.phone IS NULL AND NEW.phone_number IS NOT NULL THEN
        NEW.phone := NEW.phone_number;
    END IF;
    IF NEW.account_type IS NULL AND NEW.user_type IS NOT NULL THEN
        NEW.account_type := NEW.user_type;
    END IF;
    IF NEW.user_type IS NULL AND NEW.account_type IS NOT NULL THEN
        NEW.user_type := NEW.account_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_aliases ON users;
CREATE TRIGGER trg_sync_user_aliases
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION sync_user_aliases();

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- 2. Enhance provider_profiles with onboarding_status
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED';

-- 3. Enhance admin_invitations with phone_number & assigned_admin_role
ALTER TABLE admin_invitations ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE admin_invitations ADD COLUMN IF NOT EXISTS assigned_admin_role VARCHAR(64) DEFAULT 'SUPER_ADMIN';
ALTER TABLE admin_invitations ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(32) DEFAULT 'PENDING';

-- Backfill admin invitations
UPDATE admin_invitations SET 
    assigned_admin_role = admin_role,
    invitation_status = status
WHERE assigned_admin_role IS NULL;

-- Seed an invitation for the test admin phone (+91 98765 43212)
INSERT INTO admin_invitations (
    email, phone_number, admin_role, assigned_admin_role, token, invited_by, status, invitation_status, expires_at
)
VALUES (
    'superadmin@atelier.in',
    '+919876543212',
    'SUPER_ADMIN',
    'SUPER_ADMIN',
    'tok_inv_superadmin_01',
    (SELECT id FROM users WHERE email = 'superadmin@atelier.in' LIMIT 1),
    'ACCEPTED',
    'ACCEPTED',
    CURRENT_TIMESTAMP + INTERVAL '30 days'
)
ON CONFLICT (email) DO UPDATE SET phone_number = '+919876543212', invitation_status = 'ACCEPTED';
