package com.marketplace.provider;

import com.marketplace.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Read models for provider profiles (JSON-ready maps built from SQL). */
@Repository
@RequiredArgsConstructor
public class ProviderRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public Optional<UUID> findIdByUserId(UUID userId) {
        List<UUID> ids = jdbc.queryForList(
                "SELECT id FROM provider_profiles WHERE user_id = :uid", Map.of("uid", userId), UUID.class);
        return ids.isEmpty() ? Optional.empty() : Optional.of(ids.get(0));
    }

    public UUID requireIdByUserId(UUID userId) {
        return findIdByUserId(userId).orElseThrow(() -> ApiException.notFound("Provider profile"));
    }

    /** True when customers may see and book this provider. */
    public boolean isPubliclyListed(UUID providerId) {
        Boolean listed = jdbc.queryForObject("""
                SELECT EXISTS (SELECT 1 FROM provider_profiles p JOIN users u ON u.id = p.user_id
                               WHERE p.id = :id AND p.onboarding_status = 'PUBLISHED'
                                 AND p.verification_status IN ('PENDING', 'VERIFIED')
                                 AND u.account_status = 'ACTIVE')""", Map.of("id", providerId), Boolean.class);
        return Boolean.TRUE.equals(listed);
    }

    /**
     * @param ownerView true for the provider themself (includes drafts, inactive services,
     *                  documents, exact location); false for the public profile.
     */
    public Map<String, Object> detail(UUID providerId, boolean ownerView) {
        Map<String, Object> m = new LinkedHashMap<>(jdbc.queryForMap("""
                SELECT p.id, p.professional_name AS "name", p.business_name AS "businessName", p.bio,
                       p.experience_years AS "experienceYears", p.avatar_url AS "avatarUrl",
                       p.cover_image_url AS "coverImageUrl", p.city, p.locality,
                       p.custom_cuisines AS "customCuisines",
                       p.verification_status AS "verificationStatus", p.onboarding_status AS "onboardingStatus",
                       p.is_accepting_bookings AS "acceptingBookings",
                       p.max_travel_distance_km AS "maxTravelDistanceKm",
                       (p.fssai_license_number IS NOT NULL) AS "hasFoodLicense",
                       p.published_at::text AS "publishedAt",
                       (SELECT ROUND(AVG(overall_rating)::numeric, 1) FROM reviews r WHERE r.provider_id = p.id) AS "averageRating",
                       (SELECT COUNT(*) FROM reviews r WHERE r.provider_id = p.id) AS "reviewCount",
                       (SELECT COUNT(*) FROM bookings b WHERE b.provider_id = p.id AND b.booking_status = 'COMPLETED') AS "completedBookings"
                FROM provider_profiles p WHERE p.id = :id""", Map.of("id", providerId)));

        Map<String, Object> id = Map.of("id", providerId);
        m.put("categories", jdbc.queryForList("""
                SELECT role_type FROM provider_roles WHERE provider_id = :id AND is_active
                ORDER BY is_primary DESC, role_type""", id, String.class));
        m.put("cuisines", jdbc.queryForList("""
                SELECT cc.code, cc.name AS label FROM provider_cuisines pc
                JOIN cuisine_categories cc ON cc.id = pc.cuisine_id
                WHERE pc.provider_id = :id ORDER BY pc.is_signature DESC, cc.name""", id));
        m.put("services", jdbc.queryForList("""
                SELECT s.id, s.role_type AS "category", s.title, s.description,
                       s.service_delivery_mode AS "deliveryMode", spm.code AS "pricingModel", sp.amount AS "price",
                       s.min_guests AS "minGuests", s.max_guests AS "maxGuests", s.is_active AS "active"
                FROM services s
                LEFT JOIN service_prices sp ON sp.service_id = s.id
                LEFT JOIN service_pricing_models spm ON spm.id = sp.pricing_model_id
                WHERE s.provider_id = :id AND s.role_type IS NOT NULL %s
                ORDER BY s.is_active DESC, s.created_at""".formatted(ownerView ? "" : "AND s.is_active"), id));
        m.put("weeklyAvailability", jdbc.queryForList("""
                SELECT day_of_week AS "dayOfWeek", to_char(start_time, 'HH24:MI') AS "startTime",
                       to_char(end_time, 'HH24:MI') AS "endTime", is_active AS "active"
                FROM provider_availability WHERE provider_id = :id ORDER BY day_of_week""", id));
        m.put("blockedDates", jdbc.queryForList("""
                SELECT blocked_date::text AS "date", %s FROM provider_blocked_dates
                WHERE provider_id = :id AND blocked_date >= CURRENT_DATE ORDER BY blocked_date"""
                .formatted(ownerView ? "reason" : "NULL AS reason"), id));
        List<Map<String, Object>> limits = jdbc.queryForList("""
                SELECT advance_notice_hours AS "advanceNoticeHours", max_daily_bookings AS "maxDailyBookings",
                       max_advance_days AS "maxAdvanceDays" FROM provider_booking_limits WHERE provider_id = :id""", id);
        m.put("bookingRules", limits.isEmpty()
                ? Map.of("advanceNoticeHours", 0, "maxDailyBookings", 1, "maxAdvanceDays", 365)
                : limits.get(0));
        m.put("portfolio", jdbc.queryForList("""
                SELECT id, media_type AS "mediaType", media_url AS "url", title
                FROM provider_portfolio WHERE provider_id = :id ORDER BY sort_order, created_at""", id));

        if (ownerView) {
            m.putAll(jdbc.queryForMap("""
                    SELECT base_latitude AS "baseLatitude", base_longitude AS "baseLongitude",
                           fssai_license_number AS "fssaiLicenseNumber"
                    FROM provider_profiles WHERE id = :id""", id));
            m.put("documents", jdbc.queryForList("""
                    SELECT id, document_type AS "documentType", file_name AS "fileName", document_url AS "url",
                           verification_status AS "status", uploaded_at::text AS "uploadedAt"
                    FROM provider_documents WHERE provider_id = :id ORDER BY uploaded_at DESC""", id));
        }
        return m;
    }
}
