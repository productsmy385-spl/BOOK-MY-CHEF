-- V4: Allow NULL service_id and venue_address_id in bookings for direct requests and custom quotations
ALTER TABLE bookings ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN venue_address_id DROP NOT NULL;
