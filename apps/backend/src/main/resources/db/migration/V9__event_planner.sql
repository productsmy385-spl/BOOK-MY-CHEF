-- ============================================================================
-- V9: Customer event planner (banners live in V8__banners_promotions_featured_media.sql)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Event planner: one customer event groups the services it needs and the
-- bookings made for it, with a budget tracked against real booking amounts.
-- ---------------------------------------------------------------------------
CREATE TABLE customer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    event_type VARCHAR(32) NOT NULL CHECK (event_type IN (
        'WEDDING', 'ENGAGEMENT', 'BIRTHDAY', 'HOUSEWARMING', 'FAMILY_GATHERING',
        'DINNER_PARTY', 'CORPORATE', 'FESTIVAL', 'OTHER')),
    event_date DATE NOT NULL,
    event_time TIME,
    city VARCHAR(100) NOT NULL,
    venue VARCHAR(500),
    guest_count INTEGER NOT NULL CHECK (guest_count > 0),
    budget NUMERIC(12, 2) CHECK (budget IS NULL OR budget >= 0),
    notes VARCHAR(2000),
    status VARCHAR(16) NOT NULL DEFAULT 'PLANNING' CHECK (status IN ('PLANNING', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_events_customer ON customer_events(customer_id, event_date);

CREATE TABLE customer_event_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES customer_events(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL CHECK (category IN (
        'HOME_CHEF', 'PRO_CHEF', 'PERSONAL_CHEF', 'CATERER',
        'EVENT_PLANNER', 'WEDDING_PLANNER', 'EVENT_MANAGER', 'DECORATOR',
        'PHOTOGRAPHER', 'VIDEOGRAPHER', 'BARTENDER', 'WAITER', 'KITCHEN_ASSISTANT')),
    budget_allocation NUMERIC(12, 2) CHECK (budget_allocation IS NULL OR budget_allocation >= 0),
    notes VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_need UNIQUE (event_id, category)
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES customer_events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id) WHERE event_id IS NOT NULL;
