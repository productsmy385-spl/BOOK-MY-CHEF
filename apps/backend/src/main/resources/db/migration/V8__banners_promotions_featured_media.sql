-- ============================================================================
-- V8: Platform campaigns, provider promotional banners, featured providers,
--     banner analytics and ImageKit media assets.
-- Purely additive: new tables, constraints, indexes and one setting.
-- Reversal: DROP the five tables below (in reverse order) and delete the setting.
-- ============================================================================

-- Every image stored in ImageKit that the platform references.
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    purpose VARCHAR(32) NOT NULL CHECK (purpose IN (
        'PLATFORM_BANNER', 'CAMPAIGN_ASSET', 'PROVIDER_BANNER',
        'PROVIDER_COVER', 'PROVIDER_PROFILE', 'PROVIDER_PORTFOLIO')),
    storage VARCHAR(16) NOT NULL DEFAULT 'IMAGEKIT' CHECK (storage = 'IMAGEKIT'),
    file_id VARCHAR(128) NOT NULL UNIQUE,
    url VARCHAR(1024) NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    mime_type VARCHAR(64) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    width INTEGER,
    height INTEGER,
    source VARCHAR(16) NOT NULL DEFAULT 'UPLOAD' CHECK (source IN ('UPLOAD', 'AI')),
    ai_prompt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_media_assets_owner ON media_assets(owner_user_id, purpose) WHERE deleted_at IS NULL;

-- Campaigns created by platform administrators.
CREATE TABLE platform_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL,
    subtitle VARCHAR(240),
    cta_text VARCHAR(40),
    destination_type VARCHAR(16) NOT NULL DEFAULT 'NONE'
        CHECK (destination_type IN ('NONE', 'EXPLORE', 'CATEGORY', 'PROVIDER', 'PATH')),
    destination_ref VARCHAR(255),
    desktop_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    mobile_asset_id UUID REFERENCES media_assets(id) ON DELETE RESTRICT,
    placements VARCHAR(16)[] NOT NULL
        CHECK (cardinality(placements) > 0
               AND placements <@ ARRAY['HOME', 'SIGN_IN', 'REGISTER', 'EXPLORE', 'CATEGORY']::VARCHAR(16)[]),
    category VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    priority INTEGER NOT NULL DEFAULT 0,
    rotation_seconds INTEGER NOT NULL DEFAULT 6 CHECK (rotation_seconds BETWEEN 3 AND 30),
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_platform_banner_window CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at),
    CONSTRAINT chk_platform_banner_category CHECK (NOT ('CATEGORY' = ANY(placements)) OR category IS NOT NULL)
);
CREATE INDEX idx_platform_banners_live ON platform_banners(status, priority DESC);

-- Promotional banners uploaded by providers; public only after admin approval.
CREATE TABLE provider_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(300),
    offer_text VARCHAR(80),
    category VARCHAR(64),
    cta_text VARCHAR(40),
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    desktop_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    mobile_asset_id UUID REFERENCES media_assets(id) ON DELETE RESTRICT,
    status VARCHAR(24) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'PAUSED', 'EXPIRED', 'ARCHIVED')),
    review_note TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_provider_banner_window CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at)
);
CREATE INDEX idx_provider_banners_provider ON provider_banners(provider_id, status);
CREATE INDEX idx_provider_banners_status ON provider_banners(status, submitted_at);

-- Admin-curated featured placements (never implies verification).
CREATE TABLE provider_featured_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    placement VARCHAR(32) NOT NULL DEFAULT 'HOME_FEATURED' CHECK (placement IN ('HOME_FEATURED', 'EXPLORE_FEATURED')),
    priority INTEGER NOT NULL DEFAULT 0,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider_id, placement),
    CONSTRAINT chk_featured_window CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at)
);

-- Impressions and clicks, de-duplicated per visitor per banner per day.
CREATE TABLE banner_events (
    id BIGSERIAL PRIMARY KEY,
    banner_kind VARCHAR(16) NOT NULL CHECK (banner_kind IN ('PLATFORM', 'PROVIDER')),
    banner_id UUID NOT NULL,
    event_type VARCHAR(16) NOT NULL CHECK (event_type IN ('IMPRESSION', 'CLICK')),
    placement VARCHAR(32),
    visitor_key CHAR(64) NOT NULL,
    event_day DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (banner_kind, banner_id, event_type, visitor_key, event_day)
);
CREATE INDEX idx_banner_events_banner ON banner_events(banner_kind, banner_id, event_type);

INSERT INTO system_settings (key, value, data_type, description) VALUES
    ('marketplace.top_rated_min_reviews', '3', 'INTEGER',
     'Minimum number of genuine reviews before a provider can appear in Top-rated sections.')
ON CONFLICT (key) DO NOTHING;
