-- ============================================================================
-- V7: Provider menus and menu-based pricing
--
-- menu_items          a provider's dishes, each priced per person
-- menus               set menus ("Wedding lunch, ₹450/person") made of sections
-- menu_sections       "Pick 2 starters" — how many dishes the customer chooses
-- menu_section_items  which dishes a section offers, with an optional surcharge
-- booking_menu_lines  snapshot of the dishes and prices a booking was made with,
--                     so later menu edits never change an existing booking
--
-- The unused V1 tables service_packages / service_package_items / booking_services
-- are left in place (no code reads them); they can be dropped in a later cleanup.
-- ============================================================================

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    course VARCHAR(32) NOT NULL CHECK (course IN (
        'WELCOME_DRINK', 'STARTER', 'SOUP', 'MAIN_COURSE', 'BREAD', 'RICE',
        'SIDE', 'DESSERT', 'SNACK', 'BEVERAGE')),
    diet VARCHAR(16) NOT NULL CHECK (diet IN ('VEG', 'EGG', 'NON_VEG', 'VEGAN')),
    spice_level VARCHAR(16) NOT NULL DEFAULT 'MEDIUM' CHECK (spice_level IN ('NONE', 'MILD', 'MEDIUM', 'HOT')),
    -- Comma-separated allergen codes, validated by the API (MenuCatalog.ALLERGENS)
    allergens VARCHAR(255),
    price_per_person NUMERIC(10, 2) NOT NULL CHECK (price_per_person >= 0),
    -- Smallest guest count this dish is prepared for (NULL = any)
    min_servings INTEGER CHECK (min_servings IS NULL OR min_servings > 0),
    image_url VARCHAR(1024),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_menu_items_provider_name ON menu_items(provider_id, lower(name));
CREATE INDEX idx_menu_items_provider ON menu_items(provider_id, is_available, course);

CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    meal_type VARCHAR(16) NOT NULL DEFAULT 'ANY' CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'ANY')),
    price_per_person NUMERIC(10, 2) NOT NULL CHECK (price_per_person > 0),
    min_guests INTEGER CHECK (min_guests IS NULL OR min_guests > 0),
    max_guests INTEGER CHECK (max_guests IS NULL OR max_guests > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_menus_guests CHECK (min_guests IS NULL OR max_guests IS NULL OR min_guests <= max_guests)
);
CREATE UNIQUE INDEX uq_menus_provider_name ON menus(provider_id, lower(name));
CREATE INDEX idx_menus_provider ON menus(provider_id, is_active);

CREATE TABLE menu_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    choose_min INTEGER NOT NULL DEFAULT 1 CHECK (choose_min >= 0),
    choose_max INTEGER NOT NULL DEFAULT 1 CHECK (choose_max >= 1),
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_menu_sections_choices CHECK (choose_min <= choose_max)
);
CREATE INDEX idx_menu_sections_menu ON menu_sections(menu_id, sort_order);

CREATE TABLE menu_section_items (
    section_id UUID NOT NULL REFERENCES menu_sections(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    extra_price_per_person NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (extra_price_per_person >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (section_id, item_id)
);
CREATE INDEX idx_menu_section_items_item ON menu_section_items(item_id);

CREATE TABLE booking_menu_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    line_type VARCHAR(16) NOT NULL CHECK (line_type IN ('SET_MENU', 'MENU_CHOICE', 'A_LA_CARTE')),
    menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    section_title VARCHAR(100),
    name VARCHAR(150) NOT NULL,
    course VARCHAR(32),
    diet VARCHAR(16),
    unit_price_per_person NUMERIC(10, 2) NOT NULL CHECK (unit_price_per_person >= 0),
    guests INTEGER NOT NULL CHECK (guests > 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_booking_menu_lines_booking ON booking_menu_lines(booking_id, sort_order);

-- How a booking's estimate was put together (see MenuPricing):
--   service_charge  the service's own price component (NULL when a menu replaces it)
--   food_cost       menu cost per person x guests (NULL when no menu was chosen)
--   menu_pricing    SERVICE_ONLY | MENU_REPLACES_SERVICE | SERVICE_PLUS_MENU | QUOTE_WITH_MENU
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_charge NUMERIC(12, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS food_cost NUMERIC(12, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS menu_pricing VARCHAR(32);
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_menu_pricing CHECK (menu_pricing IS NULL OR menu_pricing IN (
    'SERVICE_ONLY', 'MENU_REPLACES_SERVICE', 'SERVICE_PLUS_MENU', 'QUOTE_WITH_MENU'));
