-- ============================================================================
-- BOOK MY CHEF - PRODUCTION CATALOG, SERVICES, AND ENTERPRISE SEED (V5)
-- Establishes rich multi-role providers, service packages, customer addresses,
-- initial verified bookings, escrow payments, and administrator mapping.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Seed Subcategories if missing
-- ----------------------------------------------------------------------------
INSERT INTO service_subcategories (id, category_id, code, title)
VALUES 
    ('11111111-aaaa-bbbb-cccc-111111111111', (SELECT id FROM service_categories WHERE code = 'CHEFS' LIMIT 1), 'PRO_CHEF_SUB', 'Professional Executive Chef'),
    ('22222222-aaaa-bbbb-cccc-222222222222', (SELECT id FROM service_categories WHERE code = 'CHEFS' LIMIT 1), 'HOME_CHEF_SUB', 'Traditional Regional Home Cook'),
    ('33333333-aaaa-bbbb-cccc-333333333333', (SELECT id FROM service_categories WHERE code = 'CATERING' LIMIT 1), 'BANQUET_CATERING', 'Banquet & Live Buffet Catering'),
    ('44444444-aaaa-bbbb-cccc-444444444444', (SELECT id FROM service_categories WHERE code = 'PLANNING' LIMIT 1), 'EVENT_CURATION', 'Event Planning & Coordination'),
    ('55555555-aaaa-bbbb-cccc-555555555555', (SELECT id FROM service_categories WHERE code = 'DECORATION' LIMIT 1), 'FLORAL_MANDAP', 'Stage & Floral Styling'),
    ('66666666-aaaa-bbbb-cccc-666666666666', (SELECT id FROM service_categories WHERE code = 'CHEFS' LIMIT 1), 'BARTENDER_SUB', 'Mixology & Beverage Hospitality')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Seed 5 Additional Production Providers
-- ----------------------------------------------------------------------------

-- (1) Chef Anupama Joshi (Gourmet Pro Chef - Banjara Hills)
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'b3c4d5e6-f7a8-9012-bcde-f23456789012',
    'clerk_prov_anupama_02',
    '+919876543220',
    'chef.anupama@atelier.in',
    'PROVIDER',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE SET user_type = 'PROVIDER', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name, avatar_url)
VALUES (
    (SELECT id FROM users WHERE phone = '+919876543220'),
    'Chef Anupama Joshi',
    'Chef Anupama',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO provider_profiles (
    id, user_id, professional_name, business_name, bio, description,
    experience_years, verification_status, profile_completion, min_booking_amount, max_travel_distance_km
)
VALUES (
    'a96bf862-9c43-4d14-aa0a-cc0251428ca4',
    (SELECT id FROM users WHERE phone = '+919876543220'),
    'Chef Anupama Joshi',
    'Atelier Joshi Gourmet Studio',
    'Specialist in aristocratic Maharashtrian banquets, bespoke contemporary plating, and pure vegetarian feasts.',
    'Bespoke culinary journeys blending royal heritage recipes with contemporary presentation.',
    14,
    'VERIFIED',
    92,
    1800.00,
    30
) ON CONFLICT (user_id) DO UPDATE SET verification_status = 'VERIFIED';

INSERT INTO provider_roles (provider_id, role_type, role_name, is_primary, is_active)
VALUES 
    ('a96bf862-9c43-4d14-aa0a-cc0251428ca4', 'PRO_CHEF', 'Professional Chef', true, true),
    ('a96bf862-9c43-4d14-aa0a-cc0251428ca4', 'PERSONAL_CHEF', 'Personal Chef', false, true)
ON CONFLICT (provider_id, role_type) DO NOTHING;

-- (2) Royal Dakshin Banquet Caterers (Grand Caterer - Madhapur)
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'b4c5d6e7-f8a9-0123-bcde-f34567890123',
    'clerk_prov_caterers_03',
    '+919876543221',
    'banquets@royaldakshin.in',
    'PROVIDER',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE SET user_type = 'PROVIDER', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name, avatar_url)
VALUES (
    (SELECT id FROM users WHERE phone = '+919876543221'),
    'Royal Dakshin Banquet Caterers',
    'Royal Dakshin',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO provider_profiles (
    id, user_id, professional_name, business_name, bio, description,
    experience_years, verification_status, profile_completion, min_booking_amount, max_travel_distance_km
)
VALUES (
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    (SELECT id FROM users WHERE phone = '+919876543221'),
    'Royal Dakshin Banquet Caterers',
    'Royal Dakshin Catering Enterprises',
    'Full-service luxury banquet catering for 50 to 1,500 guests with live counters, tandoors, and silver-service staff.',
    'Specializing in grand wedding buffets, corporate galas, and live culinary stations.',
    22,
    'VERIFIED',
    98,
    25000.00,
    60
) ON CONFLICT (user_id) DO UPDATE SET verification_status = 'VERIFIED';

INSERT INTO provider_roles (provider_id, role_type, role_name, is_primary, is_active)
VALUES 
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'CATERER', 'Caterer', true, true)
ON CONFLICT (provider_id, role_type) DO NOTHING;

-- (3) Utsav Event Planners & Decor (Planners & Decorators - Jubilee Hills)
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'b5c6d7e8-f9a0-1234-bcde-f45678901234',
    'clerk_prov_utsav_04',
    '+919876543222',
    'curators@utsavevents.in',
    'PROVIDER',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE SET user_type = 'PROVIDER', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name, avatar_url)
VALUES (
    (SELECT id FROM users WHERE phone = '+919876543222'),
    'Utsav Event Planners & Decor',
    'Utsav Events',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO provider_profiles (
    id, user_id, professional_name, business_name, bio, description,
    experience_years, verification_status, profile_completion, min_booking_amount, max_travel_distance_km
)
VALUES (
    'e5f6a7b8-c9d0-1234-efab-345678901234',
    (SELECT id FROM users WHERE phone = '+919876543222'),
    'Utsav Event Planners & Decor',
    'Utsav Luxury Celebrations LLP',
    'Bespoke wedding mandaps, mood lighting, live floral installations, and complete celebration logistics.',
    'Flawless on-ground coordination and breathtaking aesthetic design for milestone events.',
    16,
    'VERIFIED',
    96,
    18000.00,
    50
) ON CONFLICT (user_id) DO UPDATE SET verification_status = 'VERIFIED';

INSERT INTO provider_roles (provider_id, role_type, role_name, is_primary, is_active)
VALUES 
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 'EVENT_PLANNER', 'Event Planner', true, true),
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 'DECORATOR', 'Decorator', false, true)
ON CONFLICT (provider_id, role_type) DO NOTHING;

-- (4) Chef Pradeep Varma (Home Chef - Regional Telangana)
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'b6c7d8e9-f0a1-2345-bcde-f56789012345',
    'clerk_prov_pradeep_05',
    '+919876543223',
    'chef.pradeep@atelier.in',
    'PROVIDER',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE SET user_type = 'PROVIDER', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name, avatar_url)
VALUES (
    (SELECT id FROM users WHERE phone = '+919876543223'),
    'Chef Pradeep Varma',
    'Chef Pradeep',
    'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=600&q=80'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO provider_profiles (
    id, user_id, professional_name, business_name, bio, description,
    experience_years, verification_status, profile_completion, min_booking_amount, max_travel_distance_km
)
VALUES (
    'f6a7b8c9-d0e1-2345-fabc-456789012345',
    (SELECT id FROM users WHERE phone = '+919876543223'),
    'Chef Pradeep Varma',
    'Varma Regional Kitchens',
    'Telangana country-style slow cooked meats, hand-pounded masalas, and heirloom village recipes.',
    'Authentic earthen pot slow cooking with zero artificial colors or preservatives.',
    12,
    'VERIFIED',
    90,
    1250.00,
    25
) ON CONFLICT (user_id) DO UPDATE SET verification_status = 'VERIFIED';

INSERT INTO provider_roles (provider_id, role_type, role_name, is_primary, is_active)
VALUES 
    ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'HOME_CHEF', 'Home Chef', true, true)
ON CONFLICT (provider_id, role_type) DO NOTHING;

-- (5) Shreya Sen (Artisanal Mixologist & Bartender - Hitec City)
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'b7c8d9e0-f1a2-3456-bcde-f67890123456',
    'clerk_prov_shreya_06',
    '+919876543224',
    'shreya.mixology@atelier.in',
    'PROVIDER',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE SET user_type = 'PROVIDER', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name, avatar_url)
VALUES (
    (SELECT id FROM users WHERE phone = '+919876543224'),
    'Shreya Sen',
    'Shreya Sen',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO provider_profiles (
    id, user_id, professional_name, business_name, bio, description,
    experience_years, verification_status, profile_completion, min_booking_amount, max_travel_distance_km
)
VALUES (
    'a7b8c9d0-e1f2-3456-abcd-567890123456',
    (SELECT id FROM users WHERE phone = '+919876543224'),
    'Shreya Sen',
    'Sen Mixology Atelier',
    'Curated botanical infusions, smoke-infused spirits, bespoke mocktails, and bar flair hospitality.',
    'Transforming private celebrations with handcrafted syrups, signature bitters, and artisanal bar styling.',
    8,
    'VERIFIED',
    88,
    15000.00,
    35
) ON CONFLICT (user_id) DO UPDATE SET verification_status = 'VERIFIED';

INSERT INTO provider_roles (provider_id, role_type, role_name, is_primary, is_active)
VALUES 
    ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'BARTENDER', 'Bartender', true, true)
ON CONFLICT (provider_id, role_type) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Link Cuisines to Providers
-- ----------------------------------------------------------------------------
INSERT INTO provider_cuisines (provider_id, cuisine_id, is_signature)
VALUES 
    -- Chef Raghavendra Rao
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', (SELECT id FROM cuisine_categories WHERE code = 'ANDHRA' LIMIT 1), true),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', (SELECT id FROM cuisine_categories WHERE code = 'TELANGANA' LIMIT 1), false),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', (SELECT id FROM cuisine_categories WHERE code = 'SOUTH_INDIAN' LIMIT 1), true),
    -- Chef Anupama Joshi
    ('a96bf862-9c43-4d14-aa0a-cc0251428ca4', (SELECT id FROM cuisine_categories WHERE code = 'SOUTH_INDIAN' LIMIT 1), false),
    ('a96bf862-9c43-4d14-aa0a-cc0251428ca4', (SELECT id FROM cuisine_categories WHERE code = 'NORTH_INDIAN' LIMIT 1), true),
    -- Royal Dakshin
    ('d4e5f6a7-b8c9-0123-defa-234567890123', (SELECT id FROM cuisine_categories WHERE code = 'SOUTH_INDIAN' LIMIT 1), true),
    ('d4e5f6a7-b8c9-0123-defa-234567890123', (SELECT id FROM cuisine_categories WHERE code = 'NORTH_INDIAN' LIMIT 1), false),
    -- Chef Pradeep Varma
    ('f6a7b8c9-d0e1-2345-fabc-456789012345', (SELECT id FROM cuisine_categories WHERE code = 'TELANGANA' LIMIT 1), true)
ON CONFLICT (provider_id, cuisine_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Seed Services and Service Packages
-- ----------------------------------------------------------------------------

-- Service 1 for Raghavendra
INSERT INTO services (id, provider_id, subcategory_id, title, description, service_delivery_mode)
VALUES (
    '88888888-1111-2222-3333-444444444441',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    '11111111-aaaa-bbbb-cccc-111111111111',
    'Chef Visits Home Live Feast',
    'Chef Raghavendra cooks on-site in customer kitchen using traditional brass and copper vessels.',
    'CHEF_VISITS_HOME'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO service_packages (id, service_id, name, description, base_price, min_guests, max_guests, is_customizable)
VALUES 
    (
        '99999999-1111-2222-3333-444444444441',
        '88888888-1111-2222-3333-444444444441',
        'Royal Andhra 5-Course Festive Feast',
        'Authentic festive banquet on banana leaves with pure cow ghee and freshly hand-pounded spices.',
        1499.00,
        10,
        50,
        true
    ),
    (
        '99999999-1111-2222-3333-444444444442',
        '88888888-1111-2222-3333-444444444441',
        'Telangana Heritage Country Feast',
        'Earthy regional specialities with jowar rotis and slow-cooked country chicken or gutti tamata.',
        1650.00,
        15,
        60,
        true
    )
ON CONFLICT (id) DO NOTHING;

-- Service 2 for Anupama
INSERT INTO services (id, provider_id, subcategory_id, title, description, service_delivery_mode)
VALUES (
    '88888888-1111-2222-3333-444444444442',
    'a96bf862-9c43-4d14-aa0a-cc0251428ca4',
    '11111111-aaaa-bbbb-cccc-111111111111',
    'Aristocratic Plated Dinner',
    'Exquisite fine dining course prepared live with luxury tableware styling.',
    'CHEF_VISITS_HOME'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO service_packages (id, service_id, name, description, base_price, min_guests, max_guests, is_customizable)
VALUES (
    '99999999-1111-2222-3333-444444444443',
    '88888888-1111-2222-3333-444444444442',
    'Bespoke Royal Plating Menu',
    'Multi-course plated dinner featuring heirloom vegetarian delicacies.',
    1800.00,
    8,
    30,
    true
) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Seed Customer Saved Addresses
-- ----------------------------------------------------------------------------
INSERT INTO user_addresses (id, user_id, address_type, address_line1, address_line2, landmark, city, state, postal_code, is_default)
VALUES 
    (
        '77777777-1111-2222-3333-444444444441',
        (SELECT id FROM users WHERE phone = '+91 98765 43210' LIMIT 1),
        'HOME',
        'Villa 42, Palm Meadows Enclave',
        'Road No. 10, Jubilee Hills',
        'Opposite Apollo Cradle',
        'Hyderabad',
        'Telangana',
        '500033',
        true
    ),
    (
        '77777777-1111-2222-3333-444444444442',
        (SELECT id FROM users WHERE phone = '+91 98765 43210' LIMIT 1),
        'EVENT_VENUE',
        'Atelier Grand Pavilion, Flat 302',
        'Cyber Heights, Hitec City',
        'Near Shilparamam',
        'Hyderabad',
        'Telangana',
        '500081',
        false
    )
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Seed Customer Favourites
-- ----------------------------------------------------------------------------
INSERT INTO customer_favourites (user_id, provider_id)
VALUES 
    (
        (SELECT id FROM users WHERE phone = '+91 98765 43210' LIMIT 1),
        'c3d4e5f6-a7b8-9012-cdef-123456789012' -- Chef Raghavendra Rao
    ),
    (
        (SELECT id FROM users WHERE phone = '+91 98765 43210' LIMIT 1),
        'e5f6a7b8-c9d0-1234-efab-345678901234' -- Utsav Event Planners
    )
ON CONFLICT (user_id, provider_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Seed Real Production Bookings & Payments
-- ----------------------------------------------------------------------------

-- Booking 1: CONFIRMED with Advance in Escrow
INSERT INTO bookings (
    id, booking_reference, customer_id, provider_id, booking_status, payment_status,
    event_date, time_slot, guest_count, service_delivery_mode,
    estimated_total, final_amount, advance_amount, balance_amount, host_special_instructions
)
VALUES (
    '5f154cff-3dcf-43ad-b22a-793b3fac436a',
    '#BMC-6821-HYD',
    (SELECT id FROM users WHERE phone = '+91 98765 43210' LIMIT 1),
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'CONFIRMED',
    'ESCROW_HELD',
    CURRENT_DATE + INTERVAL '6 days',
    'LUNCH',
    25,
    'CHEF_VISITS_HOME',
    11000.00,
    11000.00,
    3300.00,
    7700.00,
    'Authentic banana leaf service. Mild spice for elderly guests.'
) ON CONFLICT (id) DO UPDATE SET booking_status = 'CONFIRMED', payment_status = 'ESCROW_HELD';

INSERT INTO payments (
    id, booking_id, razorpay_order_id, razorpay_payment_id, payment_stage,
    amount, currency, payment_method, status, paid_at
)
VALUES (
    '66666666-1111-2222-3333-444444444441',
    '5f154cff-3dcf-43ad-b22a-793b3fac436a',
    'order_bmc_6821_adv',
    'pay_bmc_6821_success',
    'ADVANCE_30',
    3300.00,
    'INR',
    'UPI_GPAY',
    'ESCROW_HELD',
    CURRENT_TIMESTAMP
) ON CONFLICT (razorpay_order_id) DO NOTHING;

-- Booking 2: IN_PROGRESS (Live Today)
INSERT INTO bookings (
    id, booking_reference, customer_id, provider_id, booking_status, payment_status,
    event_date, time_slot, guest_count, service_delivery_mode,
    estimated_total, final_amount, advance_amount, balance_amount, host_special_instructions
)
VALUES (
    '5f154cff-3dcf-43ad-b22a-793b3fac436b',
    '#BMC-8942-HYD',
    (SELECT id FROM users WHERE phone = '+91 98765 43210' LIMIT 1),
    'a96bf862-9c43-4d14-aa0a-cc0251428ca4',
    'IN_PROGRESS',
    'ESCROW_HELD',
    CURRENT_DATE,
    'DINNER',
    12,
    'CHEF_VISITS_HOME',
    18000.00,
    18000.00,
    5400.00,
    12600.00,
    'Bespoke dinner party celebration.'
) ON CONFLICT (id) DO UPDATE SET booking_status = 'IN_PROGRESS', payment_status = 'ESCROW_HELD';

INSERT INTO payments (
    id, booking_id, razorpay_order_id, razorpay_payment_id, payment_stage,
    amount, currency, payment_method, status, paid_at
)
VALUES (
    '66666666-1111-2222-3333-444444444442',
    '5f154cff-3dcf-43ad-b22a-793b3fac436b',
    'order_bmc_8942_adv',
    'pay_bmc_8942_success',
    'ADVANCE_30',
    5400.00,
    'INR',
    'UPI_NETBANKING',
    'ESCROW_HELD',
    CURRENT_TIMESTAMP
) ON CONFLICT (razorpay_order_id) DO NOTHING;

-- Booking 3: COMPLETED (Settled)
INSERT INTO bookings (
    id, booking_reference, customer_id, provider_id, booking_status, payment_status,
    event_date, time_slot, guest_count, service_delivery_mode,
    estimated_total, final_amount, advance_amount, balance_amount, host_special_instructions
)
VALUES (
    '5f154cff-3dcf-43ad-b22a-793b3fac436c',
    '#BMC-7720-HYD',
    (SELECT id FROM users WHERE phone = '+91 98765 43210' LIMIT 1),
    'e5f6a7b8-c9d0-1234-efab-345678901234',
    'COMPLETED',
    'CAPTURED',
    CURRENT_DATE - INTERVAL '14 days',
    'DINNER',
    100,
    'VENUE_BANQUET',
    25000.00,
    25000.00,
    7500.00,
    17500.00,
    'Gruhapravesam traditional housewarming decor.'
) ON CONFLICT (id) DO UPDATE SET booking_status = 'COMPLETED', payment_status = 'CAPTURED';

INSERT INTO payments (
    id, booking_id, razorpay_order_id, razorpay_payment_id, payment_stage,
    amount, currency, payment_method, status, paid_at
)
VALUES (
    '66666666-1111-2222-3333-444444444443',
    '5f154cff-3dcf-43ad-b22a-793b3fac436c',
    'order_bmc_7720_adv',
    'pay_bmc_7720_success',
    'FULL_100',
    25000.00,
    'INR',
    'CARD_VISA',
    'CAPTURED',
    CURRENT_TIMESTAMP - INTERVAL '14 days'
) ON CONFLICT (razorpay_order_id) DO NOTHING;

-- Booking 4: PENDING_PROVIDER_CONFIRMATION
INSERT INTO bookings (
    id, booking_reference, customer_id, provider_id, booking_status, payment_status,
    event_date, time_slot, guest_count, service_delivery_mode,
    estimated_total, final_amount, advance_amount, balance_amount, host_special_instructions
)
VALUES (
    '5f154cff-3dcf-43ad-b22a-793b3fac436d',
    '#BMC-9102-HYD',
    (SELECT id FROM users WHERE phone = '+91 98765 43210' LIMIT 1),
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'PENDING_PROVIDER_CONFIRMATION',
    'PENDING',
    CURRENT_DATE + INTERVAL '12 days',
    'LUNCH',
    80,
    'VENUE_BANQUET',
    36000.00,
    36000.00,
    10800.00,
    25200.00,
    'Silver jubilee wedding anniversary celebration banquet.'
) ON CONFLICT (id) DO UPDATE SET booking_status = 'PENDING_PROVIDER_CONFIRMATION';

-- ----------------------------------------------------------------------------
-- 8. Seed Administrator Account & Mapping
-- ----------------------------------------------------------------------------
INSERT INTO users (id, clerk_id, phone, email, user_type, account_status)
VALUES (
    'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    'clerk_admin_super_01',
    '+919876543212',
    'superadmin@atelier.in',
    'ADMIN',
    'ACTIVE'
) ON CONFLICT (email) DO UPDATE SET user_type = 'ADMIN', account_status = 'ACTIVE';

INSERT INTO user_profiles (user_id, full_name, display_name)
VALUES (
    (SELECT id FROM users WHERE email = 'superadmin@atelier.in' LIMIT 1),
    'Gopala Krishna (Platform Admin)',
    'Super Administrator'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admin_users (user_id, admin_role, status)
VALUES (
    (SELECT id FROM users WHERE email = 'superadmin@atelier.in' LIMIT 1),
    'SUPER_ADMIN',
    'ACTIVE'
) ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE';
