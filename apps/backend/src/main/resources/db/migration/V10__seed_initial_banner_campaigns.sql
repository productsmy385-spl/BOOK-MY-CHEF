-- ============================================================================
-- V10: Provider-console banner placements, bundled (non-ImageKit) media assets,
--     and the initial platform campaigns.
--
-- The 14 initial banners are licensed Unsplash photographs shipped with the web app
-- (apps/web/public/banners, sources in SOURCES.md). They are ordinary campaign records:
-- admins can edit, reorder, replace, unpublish, archive or delete them, and copy the
-- images to ImageKit once credentials are configured (storage then becomes IMAGEKIT).
-- Reversal: delete these platform_banners/media_assets rows and restore the two CHECKs.
-- ============================================================================

-- Bundled assets ship with the app and have no uploading user.
ALTER TABLE media_assets ALTER COLUMN owner_user_id DROP NOT NULL;
ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS media_assets_storage_check;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_storage_check CHECK (storage IN ('IMAGEKIT', 'BUNDLED'));
ALTER TABLE media_assets ADD CONSTRAINT chk_media_assets_owner CHECK (storage = 'BUNDLED' OR owner_user_id IS NOT NULL);

-- Provider console placements. 'PROVIDER_REGISTER' is 17 characters, so the column is widened
-- first (an explicit ::varchar(16) cast would silently truncate it).
ALTER TABLE platform_banners DROP CONSTRAINT IF EXISTS platform_banners_placements_check;
ALTER TABLE platform_banners ALTER COLUMN placements TYPE VARCHAR(32)[];
ALTER TABLE platform_banners ADD CONSTRAINT platform_banners_placements_check CHECK (
    cardinality(placements) > 0
    AND placements <@ ARRAY['HOME', 'SIGN_IN', 'REGISTER', 'EXPLORE', 'CATEGORY',
                            'PROVIDER_HOME', 'PROVIDER_SIGN_IN', 'PROVIDER_REGISTER']::VARCHAR(32)[]);

INSERT INTO media_assets (purpose, storage, file_id, url, file_path, mime_type, size_bytes, width, height)
VALUES
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-home-chefs-desktop', '/banners/customer-home-chefs-desktop.jpg', 'apps/web/public/banners/customer-home-chefs-desktop.jpg', 'image/jpeg', 184637, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-home-chefs-mobile', '/banners/customer-home-chefs-mobile.jpg', 'apps/web/public/banners/customer-home-chefs-mobile.jpg', 'image/jpeg', 188588, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-chefs-near-you-desktop', '/banners/customer-chefs-near-you-desktop.jpg', 'apps/web/public/banners/customer-chefs-near-you-desktop.jpg', 'image/jpeg', 175732, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-chefs-near-you-mobile', '/banners/customer-chefs-near-you-mobile.jpg', 'apps/web/public/banners/customer-chefs-near-you-mobile.jpg', 'image/jpeg', 170570, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-wedding-catering-desktop', '/banners/customer-wedding-catering-desktop.jpg', 'apps/web/public/banners/customer-wedding-catering-desktop.jpg', 'image/jpeg', 212027, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-wedding-catering-mobile', '/banners/customer-wedding-catering-mobile.jpg', 'apps/web/public/banners/customer-wedding-catering-mobile.jpg', 'image/jpeg', 197465, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-traditional-cuisine-desktop', '/banners/customer-traditional-cuisine-desktop.jpg', 'apps/web/public/banners/customer-traditional-cuisine-desktop.jpg', 'image/jpeg', 222194, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-traditional-cuisine-mobile', '/banners/customer-traditional-cuisine-mobile.jpg', 'apps/web/public/banners/customer-traditional-cuisine-mobile.jpg', 'image/jpeg', 243840, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-birthday-catering-desktop', '/banners/customer-birthday-catering-desktop.jpg', 'apps/web/public/banners/customer-birthday-catering-desktop.jpg', 'image/jpeg', 125315, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-birthday-catering-mobile', '/banners/customer-birthday-catering-mobile.jpg', 'apps/web/public/banners/customer-birthday-catering-mobile.jpg', 'image/jpeg', 101788, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-private-dining-desktop', '/banners/customer-private-dining-desktop.jpg', 'apps/web/public/banners/customer-private-dining-desktop.jpg', 'image/jpeg', 121766, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-private-dining-mobile', '/banners/customer-private-dining-mobile.jpg', 'apps/web/public/banners/customer-private-dining-mobile.jpg', 'image/jpeg', 106514, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-book-a-chef-desktop', '/banners/customer-book-a-chef-desktop.jpg', 'apps/web/public/banners/customer-book-a-chef-desktop.jpg', 'image/jpeg', 211541, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:customer-book-a-chef-mobile', '/banners/customer-book-a-chef-mobile.jpg', 'apps/web/public/banners/customer-book-a-chef-mobile.jpg', 'image/jpeg', 209887, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-grow-business-desktop', '/banners/provider-grow-business-desktop.jpg', 'apps/web/public/banners/provider-grow-business-desktop.jpg', 'image/jpeg', 103053, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-grow-business-mobile', '/banners/provider-grow-business-mobile.jpg', 'apps/web/public/banners/provider-grow-business-mobile.jpg', 'image/jpeg', 106128, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-catering-bookings-desktop', '/banners/provider-catering-bookings-desktop.jpg', 'apps/web/public/banners/provider-catering-bookings-desktop.jpg', 'image/jpeg', 135744, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-catering-bookings-mobile', '/banners/provider-catering-bookings-mobile.jpg', 'apps/web/public/banners/provider-catering-bookings-mobile.jpg', 'image/jpeg', 141404, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-showcase-skills-desktop', '/banners/provider-showcase-skills-desktop.jpg', 'apps/web/public/banners/provider-showcase-skills-desktop.jpg', 'image/jpeg', 155574, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-showcase-skills-mobile', '/banners/provider-showcase-skills-mobile.jpg', 'apps/web/public/banners/provider-showcase-skills-mobile.jpg', 'image/jpeg', 188455, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-customers-near-you-desktop', '/banners/provider-customers-near-you-desktop.jpg', 'apps/web/public/banners/provider-customers-near-you-desktop.jpg', 'image/jpeg', 141876, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-customers-near-you-mobile', '/banners/provider-customers-near-you-mobile.jpg', 'apps/web/public/banners/provider-customers-near-you-mobile.jpg', 'image/jpeg', 160809, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-build-profile-desktop', '/banners/provider-build-profile-desktop.jpg', 'apps/web/public/banners/provider-build-profile-desktop.jpg', 'image/jpeg', 90599, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-build-profile-mobile', '/banners/provider-build-profile-mobile.jpg', 'apps/web/public/banners/provider-build-profile-mobile.jpg', 'image/jpeg', 130440, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-passion-business-desktop', '/banners/provider-passion-business-desktop.jpg', 'apps/web/public/banners/provider-passion-business-desktop.jpg', 'image/jpeg', 210753, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-passion-business-mobile', '/banners/provider-passion-business-mobile.jpg', 'apps/web/public/banners/provider-passion-business-mobile.jpg', 'image/jpeg', 203602, 1080, 1350),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-grow-earnings-desktop', '/banners/provider-grow-earnings-desktop.jpg', 'apps/web/public/banners/provider-grow-earnings-desktop.jpg', 'image/jpeg', 93113, 1920, 731),
    ('PLATFORM_BANNER', 'BUNDLED', 'bundled:provider-grow-earnings-mobile', '/banners/provider-grow-earnings-mobile.jpg', 'apps/web/public/banners/provider-grow-earnings-mobile.jpg', 'image/jpeg', 81718, 1080, 1350)
ON CONFLICT (file_id) DO NOTHING;

INSERT INTO platform_banners (title, subtitle, cta_text, destination_type, destination_ref, desktop_asset_id,
    mobile_asset_id, placements, category, status, priority, rotation_seconds, published_at)
SELECT * FROM (VALUES
    ('Discover professional home chefs', 'Traditional, home-style food cooked fresh in your own kitchen.', 'Explore home chefs', 'CATEGORY', 'HOME_CHEF',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-home-chefs-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-home-chefs-mobile'),
     ARRAY['HOME', 'SIGN_IN', 'CATEGORY']::varchar(32)[], 'HOME_CHEF', 'PUBLISHED', 70, 5, now()),
    ('Find the best chefs near you', 'Compare real profiles, menus and prices from chefs who serve your area.', 'Find chefs', 'EXPLORE', NULL,
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-chefs-near-you-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-chefs-near-you-mobile'),
     ARRAY['HOME', 'REGISTER']::varchar(32)[], NULL, 'PUBLISHED', 65, 5, now()),
    ('Wedding and event catering', 'From intimate ceremonies to grand receptions, caterers who plan every plate.', 'Explore caterers', 'CATEGORY', 'CATERER',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-wedding-catering-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-wedding-catering-mobile'),
     ARRAY['HOME', 'SIGN_IN', 'EXPLORE', 'CATEGORY']::varchar(32)[], 'CATERER', 'PUBLISHED', 60, 5, now()),
    ('Authentic Indian traditional cuisine', 'Andhra, Telangana, South and North Indian classics, made the way they should be.', 'Find regional cooks', 'PATH', '/explore?cuisine=ANDHRA,TELANGANA,SOUTH_INDIAN,NORTH_INDIAN,TRADITIONAL_HOME',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-traditional-cuisine-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-traditional-cuisine-mobile'),
     ARRAY['HOME', 'REGISTER']::varchar(32)[], NULL, 'PUBLISHED', 55, 5, now()),
    ('Birthday and special-occasion catering', 'Celebrate with food everyone remembers, planned around your guests and budget.', 'Plan your party', 'PATH', '/explore?category=CATERER,EVENT_PLANNER,DECORATOR',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-birthday-catering-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-birthday-catering-mobile'),
     ARRAY['HOME', 'EXPLORE']::varchar(32)[], NULL, 'PUBLISHED', 50, 5, now()),
    ('Premium private dining experiences', 'A personal chef, a curated menu and an evening at your own table.', 'Book a private chef', 'CATEGORY', 'PERSONAL_CHEF',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-private-dining-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-private-dining-mobile'),
     ARRAY['HOME', 'SIGN_IN', 'CATEGORY']::varchar(32)[], 'PERSONAL_CHEF', 'PUBLISHED', 45, 5, now()),
    ('Book your perfect chef today', 'Send your requirements in minutes. Chefs reply with availability and prices.', 'Get started', 'EXPLORE', NULL,
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-book-a-chef-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:customer-book-a-chef-mobile'),
     ARRAY['HOME', 'REGISTER']::varchar(32)[], NULL, 'PUBLISHED', 40, 5, now()),
    ('Grow your chef business with Book My Chef', 'Reach customers who are actively looking for chefs, caterers and event professionals.', 'Complete your setup', 'PATH', '/provider/setup',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-grow-business-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-grow-business-mobile'),
     ARRAY['PROVIDER_HOME', 'PROVIDER_SIGN_IN']::varchar(32)[], NULL, 'PUBLISHED', 70, 5, now()),
    ('Get more catering bookings', 'List your packages with clear per-plate or per-event prices so customers book with confidence.', 'Add your services', 'PATH', '/provider/services',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-catering-bookings-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-catering-bookings-mobile'),
     ARRAY['PROVIDER_HOME', 'PROVIDER_REGISTER']::varchar(32)[], NULL, 'PUBLISHED', 65, 5, now()),
    ('Showcase your culinary skills', 'Add photos of your best dishes and events. Profiles with a portfolio stand out.', 'Update your portfolio', 'PATH', '/provider/profile',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-showcase-skills-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-showcase-skills-mobile'),
     ARRAY['PROVIDER_HOME', 'PROVIDER_SIGN_IN']::varchar(32)[], NULL, 'PUBLISHED', 60, 5, now()),
    ('Connect with customers near you', 'Set your service area and travel radius to appear in nearby searches.', 'Set your service area', 'PATH', '/provider/profile',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-customers-near-you-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-customers-near-you-mobile'),
     ARRAY['PROVIDER_HOME', 'PROVIDER_REGISTER']::varchar(32)[], NULL, 'PUBLISHED', 55, 5, now()),
    ('Build your professional chef profile', 'A complete, verified profile earns more trust and more requests.', 'Edit your profile', 'PATH', '/provider/profile',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-build-profile-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-build-profile-mobile'),
     ARRAY['PROVIDER_HOME', 'PROVIDER_SIGN_IN']::varchar(32)[], NULL, 'PUBLISHED', 50, 5, now()),
    ('Turn your passion into a business', 'Home cooks welcome: share your specialities and set your own prices.', 'Start your profile', 'PATH', '/provider/setup',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-passion-business-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-passion-business-mobile'),
     ARRAY['PROVIDER_HOME', 'PROVIDER_REGISTER']::varchar(32)[], NULL, 'PUBLISHED', 45, 5, now()),
    ('Manage your bookings and grow your earnings', 'Respond to requests, send quotations and track every booking in one place.', 'View bookings', 'PATH', '/provider/bookings',
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-grow-earnings-desktop'),
     (SELECT id FROM media_assets WHERE file_id = 'bundled:provider-grow-earnings-mobile'),
     ARRAY['PROVIDER_HOME']::varchar(32)[], NULL, 'PUBLISHED', 40, 5, now())
) AS seed(title, subtitle, cta_text, destination_type, destination_ref,
          desktop_asset_id, mobile_asset_id, placements, category, status, priority, rotation_seconds, published_at)
WHERE NOT EXISTS (SELECT 1 FROM platform_banners pb WHERE pb.title = seed.title);
