package com.marketplace.provider;

import com.marketplace.booking.BookingStatus;
import com.marketplace.catalog.ServiceCatalog;
import com.marketplace.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

/**
 * Everything a provider can change about their own business. The provider id
 * is always resolved from the authenticated user, so one provider can never
 * touch another provider's data.
 */
@Service
@RequiredArgsConstructor
public class ProviderSelfService {

    private final NamedParameterJdbcTemplate jdbc;
    private final ProviderRepository providers;

    // ------------------------------------------------------------------ read

    @Transactional(readOnly = true)
    public Map<String, Object> me(UUID userId) {
        UUID pid = providers.requireIdByUserId(userId);
        Map<String, Object> detail = providers.detail(pid, true);
        detail.put("publishChecklist", checklist(detail));
        return detail;
    }

    /** Publication requirements, each with whether it is met. */
    @SuppressWarnings("unchecked")
    List<Map<String, Object>> checklist(Map<String, Object> d) {
        List<String> categories = (List<String>) d.get("categories");
        List<Map<String, Object>> services = (List<Map<String, Object>>) d.get("services");
        List<Map<String, Object>> cuisines = (List<Map<String, Object>>) d.get("cuisines");
        boolean culinary = categories.stream().anyMatch(c -> ServiceCatalog.find(c).map(ServiceCatalog.Category::culinary).orElse(false));
        boolean hasCuisine = !cuisines.isEmpty() || notBlank((String) d.get("customCuisines"));
        String bio = (String) d.get("bio");

        List<Map<String, Object>> items = new ArrayList<>();
        items.add(item("profile", "Name, city and a short description (30+ characters)",
                notBlank((String) d.get("name")) && notBlank((String) d.get("city")) && bio != null && bio.trim().length() >= 30));
        items.add(item("categories", "At least one service category", !categories.isEmpty()));
        if (culinary) items.add(item("cuisines", "At least one cuisine", hasCuisine));
        items.add(item("services", "At least one active, priced service",
                services.stream().anyMatch(s -> Boolean.TRUE.equals(s.get("active")) && s.get("pricingModel") != null)));
        return items;
    }

    // ------------------------------------------------------------------ profile

    @Transactional
    public void updateProfile(UUID userId, ProviderRequests.ProfileUpdate r) {
        UUID pid = providers.requireIdByUserId(userId);
        if ((r.baseLatitude() == null) != (r.baseLongitude() == null)) {
            throw ApiException.invalid("Location needs both latitude and longitude.");
        }
        jdbc.update("""
                UPDATE provider_profiles SET professional_name = :name, business_name = :business, bio = :bio,
                    experience_years = :exp, avatar_url = :avatar, cover_image_url = :cover, city = :city,
                    locality = :locality, base_latitude = :lat, base_longitude = :lng,
                    max_travel_distance_km = :radius, fssai_license_number = :fssai,
                    is_accepting_bookings = :accepting, updated_at = now()
                WHERE id = :id""", new MapSqlParameterSource()
                .addValue("id", pid)
                .addValue("name", r.name().trim())
                .addValue("business", blankToNull(r.businessName()))
                .addValue("bio", blankToNull(r.bio()))
                .addValue("exp", r.experienceYears() == null ? 0 : r.experienceYears())
                .addValue("avatar", blankToNull(r.avatarUrl()))
                .addValue("cover", blankToNull(r.coverImageUrl()))
                .addValue("city", r.city().trim())
                .addValue("locality", blankToNull(r.locality()))
                .addValue("lat", r.baseLatitude())
                .addValue("lng", r.baseLongitude())
                .addValue("radius", r.maxTravelDistanceKm() == null ? 25 : r.maxTravelDistanceKm())
                .addValue("fssai", blankToNull(r.fssaiLicenseNumber()))
                .addValue("accepting", r.acceptingBookings() == null || r.acceptingBookings()));
        unpublishIfIncomplete(userId);
    }

    @Transactional
    public void setCategories(UUID userId, List<String> categories) {
        UUID pid = providers.requireIdByUserId(userId);
        List<String> clean = categories.stream().distinct().toList();
        if (clean.stream().anyMatch(c -> !ServiceCatalog.isCategory(c))) {
            throw ApiException.invalid("Unknown service category.");
        }
        Map<String, Object> p = Map.of("pid", pid);
        jdbc.update("UPDATE provider_roles SET is_active = FALSE, is_primary = FALSE WHERE provider_id = :pid", p);
        for (int i = 0; i < clean.size(); i++) {
            jdbc.update("""
                    INSERT INTO provider_roles (provider_id, role_type, is_primary, is_active)
                    VALUES (:pid, :role, :primary, TRUE)
                    ON CONFLICT (provider_id, role_type) DO UPDATE SET is_active = TRUE, is_primary = EXCLUDED.is_primary""",
                    new MapSqlParameterSource().addValue("pid", pid).addValue("role", clean.get(i)).addValue("primary", i == 0));
        }
        // Services in categories the provider no longer offers are hidden, not deleted (bookings may reference them).
        jdbc.update("UPDATE services SET is_active = FALSE, updated_at = now() WHERE provider_id = :pid AND role_type NOT IN (:roles)",
                new MapSqlParameterSource().addValue("pid", pid).addValue("roles", clean));
        unpublishIfIncomplete(userId);
    }

    @Transactional
    public void setCuisines(UUID userId, ProviderRequests.Cuisines r) {
        UUID pid = providers.requireIdByUserId(userId);
        List<String> codes = r.cuisines() == null ? List.of() : r.cuisines().stream().distinct().toList();
        if (!codes.isEmpty()) {
            Integer known = jdbc.queryForObject("SELECT COUNT(*) FROM cuisine_categories WHERE code IN (:codes)",
                    Map.of("codes", codes), Integer.class);
            if (known == null || known != codes.size()) throw ApiException.invalid("Unknown cuisine.");
        }
        jdbc.update("DELETE FROM provider_cuisines WHERE provider_id = :pid", Map.of("pid", pid));
        for (int i = 0; i < codes.size(); i++) {
            jdbc.update("""
                    INSERT INTO provider_cuisines (provider_id, cuisine_id, is_signature)
                    SELECT :pid, id, :sig FROM cuisine_categories WHERE code = :code""",
                    new MapSqlParameterSource().addValue("pid", pid).addValue("code", codes.get(i)).addValue("sig", i == 0));
        }
        jdbc.update("UPDATE provider_profiles SET custom_cuisines = :custom, updated_at = now() WHERE id = :pid",
                new MapSqlParameterSource().addValue("pid", pid).addValue("custom", blankToNull(r.customCuisines())));
        unpublishIfIncomplete(userId);
    }

    // ------------------------------------------------------------------ services

    @Transactional
    public UUID createService(UUID userId, ProviderRequests.ServiceUpsert r) {
        UUID pid = providers.requireIdByUserId(userId);
        validateService(pid, r);
        UUID serviceId = jdbc.queryForObject("""
                INSERT INTO services (provider_id, role_type, title, description, service_delivery_mode, min_guests, max_guests, is_active)
                VALUES (:pid, :cat, :title, :desc, :mode, :minG, :maxG, :active) RETURNING id""",
                serviceParams(r).addValue("pid", pid), UUID.class);
        upsertPrice(serviceId, r);
        return serviceId;
    }

    @Transactional
    public void updateService(UUID userId, UUID serviceId, ProviderRequests.ServiceUpsert r) {
        UUID pid = providers.requireIdByUserId(userId);
        requireOwnService(pid, serviceId);
        validateService(pid, r);
        jdbc.update("""
                UPDATE services SET role_type = :cat, title = :title, description = :desc, service_delivery_mode = :mode,
                    min_guests = :minG, max_guests = :maxG, is_active = :active, updated_at = now()
                WHERE id = :sid AND provider_id = :pid""",
                serviceParams(r).addValue("pid", pid).addValue("sid", serviceId));
        upsertPrice(serviceId, r);
        unpublishIfIncomplete(userId);
    }

    @Transactional
    public void deleteService(UUID userId, UUID serviceId) {
        UUID pid = providers.requireIdByUserId(userId);
        requireOwnService(pid, serviceId);
        Integer refs = jdbc.queryForObject("SELECT COUNT(*) FROM bookings WHERE service_id = :sid",
                Map.of("sid", serviceId), Integer.class);
        if (refs != null && refs > 0) {
            // Keep it for booking history; just hide it.
            jdbc.update("UPDATE services SET is_active = FALSE, updated_at = now() WHERE id = :sid", Map.of("sid", serviceId));
        } else {
            jdbc.update("DELETE FROM services WHERE id = :sid AND provider_id = :pid", Map.of("sid", serviceId, "pid", pid));
        }
        unpublishIfIncomplete(userId);
    }

    private void validateService(UUID pid, ProviderRequests.ServiceUpsert r) {
        ServiceCatalog.Category cat = ServiceCatalog.find(r.category())
                .orElseThrow(() -> ApiException.invalid("Unknown service category."));
        Boolean offers = jdbc.queryForObject("""
                SELECT EXISTS (SELECT 1 FROM provider_roles WHERE provider_id = :pid AND role_type = :cat AND is_active)""",
                Map.of("pid", pid, "cat", r.category()), Boolean.class);
        if (!Boolean.TRUE.equals(offers)) {
            throw ApiException.invalid("Add " + cat.label() + " to your service categories first.");
        }
        if (!cat.pricingModels().contains(r.pricingModel())) {
            throw ApiException.invalid(cat.label() + " cannot be priced " + ServiceCatalog.PRICING_LABELS.getOrDefault(r.pricingModel(), r.pricingModel()) + ".");
        }
        if (!cat.deliveryModes().contains(r.deliveryMode())) {
            throw ApiException.invalid("That service mode is not available for " + cat.label() + ".");
        }
        if (!"CUSTOM_QUOTE".equals(r.pricingModel()) && r.price() == null) {
            throw ApiException.invalid("Enter a price, or choose custom quotation.");
        }
        if (r.minGuests() != null && r.maxGuests() != null && r.minGuests() > r.maxGuests()) {
            throw ApiException.invalid("Minimum guests cannot be more than maximum guests.");
        }
    }

    private MapSqlParameterSource serviceParams(ProviderRequests.ServiceUpsert r) {
        return new MapSqlParameterSource()
                .addValue("cat", r.category())
                .addValue("title", r.title().trim())
                .addValue("desc", blankToNull(r.description()))
                .addValue("mode", r.deliveryMode())
                .addValue("minG", r.minGuests())
                .addValue("maxG", r.maxGuests())
                .addValue("active", r.active() == null || r.active());
    }

    private void upsertPrice(UUID serviceId, ProviderRequests.ServiceUpsert r) {
        jdbc.update("""
                INSERT INTO service_prices (service_id, pricing_model_id, amount, currency)
                SELECT :sid, id, :amount, 'INR' FROM service_pricing_models WHERE code = :model
                ON CONFLICT (service_id) DO UPDATE SET pricing_model_id = EXCLUDED.pricing_model_id, amount = EXCLUDED.amount""",
                new MapSqlParameterSource()
                        .addValue("sid", serviceId)
                        .addValue("model", r.pricingModel())
                        .addValue("amount", "CUSTOM_QUOTE".equals(r.pricingModel()) ? null : r.price()));
    }

    private void requireOwnService(UUID pid, UUID serviceId) {
        Boolean own = jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM services WHERE id = :sid AND provider_id = :pid)",
                Map.of("sid", serviceId, "pid", pid), Boolean.class);
        if (!Boolean.TRUE.equals(own)) throw ApiException.notFound("Service");
    }

    // ------------------------------------------------------------------ availability

    @Transactional
    public void setAvailability(UUID userId, ProviderRequests.Availability r) {
        UUID pid = providers.requireIdByUserId(userId);
        Set<Integer> seen = new HashSet<>();
        for (ProviderRequests.WeeklySlot s : r.weekly()) {
            if (!seen.add(s.dayOfWeek())) throw ApiException.invalid("Each weekday can appear only once.");
            if (!LocalTime.parse(s.startTime()).isBefore(LocalTime.parse(s.endTime()))) {
                throw ApiException.invalid("Start time must be before end time.");
            }
        }
        Map<String, Object> p = Map.of("pid", pid);
        jdbc.update("DELETE FROM provider_availability WHERE provider_id = :pid", p);
        for (ProviderRequests.WeeklySlot s : r.weekly()) {
            jdbc.update("""
                    INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_active)
                    VALUES (:pid, :dow, CAST(:start AS time), CAST(:end AS time), :active)""",
                    new MapSqlParameterSource().addValue("pid", pid).addValue("dow", s.dayOfWeek())
                            .addValue("start", s.startTime()).addValue("end", s.endTime()).addValue("active", s.active()));
        }
        jdbc.update("""
                INSERT INTO provider_booking_limits (provider_id, advance_notice_hours, max_daily_bookings, max_advance_days)
                VALUES (:pid, :notice, :daily, :advance)
                ON CONFLICT (provider_id) DO UPDATE SET advance_notice_hours = EXCLUDED.advance_notice_hours,
                    max_daily_bookings = EXCLUDED.max_daily_bookings, max_advance_days = EXCLUDED.max_advance_days""",
                new MapSqlParameterSource().addValue("pid", pid).addValue("notice", r.advanceNoticeHours())
                        .addValue("daily", r.maxDailyBookings()).addValue("advance", r.maxAdvanceDays()));
    }

    @Transactional
    public void blockDate(UUID userId, ProviderRequests.BlockedDate r) {
        UUID pid = providers.requireIdByUserId(userId);
        Integer booked = jdbc.queryForObject("""
                SELECT COUNT(*) FROM bookings WHERE provider_id = :pid AND event_date = :d AND booking_status IN (%s)"""
                .formatted(BookingStatus.sqlList(BookingStatus.OCCUPYING)), Map.of("pid", pid, "d", r.date()), Integer.class);
        if (booked != null && booked > 0) {
            throw ApiException.conflict("You already have a confirmed booking on this date. Cancel it before blocking the day.");
        }
        jdbc.update("""
                INSERT INTO provider_blocked_dates (provider_id, blocked_date, reason) VALUES (:pid, :d, :reason)
                ON CONFLICT (provider_id, blocked_date) DO UPDATE SET reason = EXCLUDED.reason""",
                new MapSqlParameterSource().addValue("pid", pid).addValue("d", r.date()).addValue("reason", blankToNull(r.reason())));
    }

    @Transactional
    public void unblockDate(UUID userId, LocalDate date) {
        UUID pid = providers.requireIdByUserId(userId);
        jdbc.update("DELETE FROM provider_blocked_dates WHERE provider_id = :pid AND blocked_date = :d", Map.of("pid", pid, "d", date));
    }

    // ------------------------------------------------------------------ portfolio & documents

    @Transactional
    public UUID addPortfolio(UUID userId, ProviderRequests.PortfolioItem r) {
        UUID pid = providers.requireIdByUserId(userId);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM provider_portfolio WHERE provider_id = :pid", Map.of("pid", pid), Integer.class);
        if (count != null && count >= 30) throw ApiException.invalid("You can keep up to 30 portfolio items.");
        return jdbc.queryForObject("""
                INSERT INTO provider_portfolio (provider_id, media_type, media_url, title, sort_order)
                VALUES (:pid, :type, :url, :title, :sort) RETURNING id""",
                new MapSqlParameterSource().addValue("pid", pid).addValue("type", r.mediaType()).addValue("url", r.url())
                        .addValue("title", blankToNull(r.title())).addValue("sort", count == null ? 0 : count), UUID.class);
    }

    @Transactional
    public void deletePortfolio(UUID userId, UUID itemId) {
        UUID pid = providers.requireIdByUserId(userId);
        if (jdbc.update("DELETE FROM provider_portfolio WHERE id = :id AND provider_id = :pid", Map.of("id", itemId, "pid", pid)) == 0) {
            throw ApiException.notFound("Portfolio item");
        }
    }

    @Transactional
    public UUID addDocument(UUID userId, ProviderRequests.Document r) {
        UUID pid = providers.requireIdByUserId(userId);
        return jdbc.queryForObject("""
                INSERT INTO provider_documents (provider_id, document_type, document_url, file_name, verification_status)
                VALUES (:pid, :type, :url, :name, 'PENDING') RETURNING id""",
                new MapSqlParameterSource().addValue("pid", pid).addValue("type", r.documentType())
                        .addValue("url", r.url()).addValue("name", r.fileName()), UUID.class);
    }

    // ------------------------------------------------------------------ publishing

    @Transactional
    public Map<String, Object> publish(UUID userId) {
        UUID pid = providers.requireIdByUserId(userId);
        Map<String, Object> detail = providers.detail(pid, true);
        List<Map<String, Object>> list = checklist(detail);
        List<String> missing = list.stream().filter(i -> !Boolean.TRUE.equals(i.get("done"))).map(i -> (String) i.get("label")).toList();
        if (!missing.isEmpty()) {
            throw ApiException.invalid("Complete these before publishing: " + String.join("; ", missing) + ".");
        }
        String status = (String) detail.get("verificationStatus");
        if ("REJECTED".equals(status) || "SUSPENDED".equals(status)) {
            throw ApiException.conflict("Your profile cannot be published while verification is " + status.toLowerCase() + ". Please contact support.");
        }
        jdbc.update("""
                UPDATE provider_profiles SET onboarding_status = 'PUBLISHED',
                    published_at = COALESCE(published_at, now()), updated_at = now() WHERE id = :pid""", Map.of("pid", pid));
        return me(userId);
    }

    @Transactional
    public void unpublish(UUID userId) {
        UUID pid = providers.requireIdByUserId(userId);
        jdbc.update("UPDATE provider_profiles SET onboarding_status = 'UNPUBLISHED', updated_at = now() WHERE id = :pid AND onboarding_status = 'PUBLISHED'",
                Map.of("pid", pid));
    }

    /** A published profile that no longer meets the requirements is taken off the marketplace. */
    private void unpublishIfIncomplete(UUID userId) {
        UUID pid = providers.requireIdByUserId(userId);
        Map<String, Object> detail = providers.detail(pid, true);
        if ("PUBLISHED".equals(detail.get("onboardingStatus"))
                && checklist(detail).stream().anyMatch(i -> !Boolean.TRUE.equals(i.get("done")))) {
            jdbc.update("UPDATE provider_profiles SET onboarding_status = 'DRAFT' WHERE id = :pid", Map.of("pid", pid));
        }
    }

    // ------------------------------------------------------------------ dashboard

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard(UUID userId) {
        UUID pid = providers.requireIdByUserId(userId);
        Map<String, Object> m = new LinkedHashMap<>(jdbc.queryForMap("""
                SELECT
                  COUNT(*) FILTER (WHERE booking_status = 'PENDING_PROVIDER_CONFIRMATION') AS "newRequests",
                  COUNT(*) FILTER (WHERE booking_status IN ('QUOTATION_SENT', 'PENDING_PAYMENT')) AS "awaitingCustomer",
                  COUNT(*) FILTER (WHERE booking_status IN ('CONFIRMED', 'IN_PROGRESS') AND event_date >= CURRENT_DATE) AS "upcoming",
                  COUNT(*) FILTER (WHERE booking_status = 'COMPLETED') AS "completed",
                  COUNT(*) FILTER (WHERE booking_status IN ('CUSTOMER_CANCELLED', 'PROVIDER_CANCELLED')) AS "cancelled",
                  COALESCE(SUM(COALESCE(final_amount, estimated_total)) FILTER (
                      WHERE booking_status = 'COMPLETED' AND date_trunc('month', event_date) = date_trunc('month', CURRENT_DATE)), 0) AS "earningsThisMonth",
                  COALESCE(SUM(COALESCE(final_amount, estimated_total)) FILTER (WHERE booking_status = 'COMPLETED'), 0) AS "earningsTotal"
                FROM bookings WHERE provider_id = :pid""", Map.of("pid", pid)));
        m.putAll(jdbc.queryForMap("""
                SELECT ROUND(AVG(overall_rating)::numeric, 1) AS "averageRating", COUNT(*) AS "reviewCount"
                FROM reviews WHERE provider_id = :pid""", Map.of("pid", pid)));
        m.put("servicePerformance", jdbc.queryForList("""
                SELECT s.id, s.title, s.role_type AS "category",
                       COUNT(b.id) AS "requests",
                       COUNT(b.id) FILTER (WHERE b.booking_status = 'COMPLETED') AS "completed"
                FROM services s LEFT JOIN bookings b ON b.service_id = s.id
                WHERE s.provider_id = :pid AND s.is_active
                GROUP BY s.id ORDER BY COUNT(b.id) DESC, s.title LIMIT 10""", Map.of("pid", pid)));
        m.put("nextBookings", jdbc.queryForList("""
                SELECT b.id, b.booking_reference AS "reference", b.event_date::text AS "eventDate",
                       to_char(b.event_time, 'HH24:MI') AS "eventTime", b.guest_count AS "guests",
                       b.service_title AS "serviceTitle", b.booking_status AS "status", up.full_name AS "customerName"
                FROM bookings b LEFT JOIN user_profiles up ON up.user_id = b.customer_id
                WHERE b.provider_id = :pid AND b.event_date >= CURRENT_DATE
                  AND b.booking_status IN ('CONFIRMED', 'IN_PROGRESS', 'PENDING_PAYMENT')
                ORDER BY b.event_date, b.event_time NULLS LAST LIMIT 5""", Map.of("pid", pid)));
        m.putAll(jdbc.queryForMap("""
                SELECT onboarding_status AS "onboardingStatus", verification_status AS "verificationStatus",
                       is_accepting_bookings AS "acceptingBookings" FROM provider_profiles WHERE id = :pid""", Map.of("pid", pid)));
        return m;
    }

    private static Map<String, Object> item(String key, String label, boolean done) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", key);
        m.put("label", label);
        m.put("done", done);
        return m;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
