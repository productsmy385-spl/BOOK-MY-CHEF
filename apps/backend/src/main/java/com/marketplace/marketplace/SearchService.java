package com.marketplace.marketplace;

import com.marketplace.booking.BookingStatus;
import com.marketplace.common.PageResponse;
import com.marketplace.common.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Database-driven marketplace search. All filtering, sorting and pagination run
 * in PostgreSQL with bound parameters; only the requested page is returned.
 *
 * A provider is listed when it is PUBLISHED, accepting bookings, owned by an
 * ACTIVE account, not rejected/suspended, and has at least one active, priced
 * service that satisfies every service-level filter. The price shown is the
 * lowest price among those matching services.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final String DISTANCE_EXPR = """
            CASE WHEN CAST(:lat AS double precision) IS NULL OR p.base_latitude IS NULL THEN NULL
            ELSE 6371 * acos(LEAST(1.0,
                cos(radians(CAST(:lat AS double precision))) * cos(radians(p.base_latitude::double precision))
                * cos(radians(p.base_longitude::double precision) - radians(CAST(:lng AS double precision)))
                + sin(radians(CAST(:lat AS double precision))) * sin(radians(p.base_latitude::double precision)))) END""";

    private final NamedParameterJdbcTemplate jdbc;
    private final SettingsService settings;

    public PageResponse<ProviderCard> search(SearchCriteria c) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("lat", c.lat())
                .addValue("lng", c.lng());

        // ---- service-level filters -------------------------------------------------
        List<String> svc = new ArrayList<>();
        if (notEmpty(c.categories())) {
            svc.add("s.role_type IN (:categories)");
            params.addValue("categories", c.categories());
        }
        if (notEmpty(c.deliveryModes())) {
            svc.add("s.service_delivery_mode IN (:modes)");
            params.addValue("modes", c.deliveryModes());
        }
        if (c.pricingModel() != null) {
            svc.add("spm.code = :pricingModel");
            params.addValue("pricingModel", c.pricingModel());
        }
        if (c.minPrice() != null) {
            svc.add("sp.amount >= :minPrice");
            params.addValue("minPrice", c.minPrice());
        }
        if (c.maxPrice() != null) {
            svc.add("sp.amount <= :maxPrice");
            params.addValue("maxPrice", c.maxPrice());
        }
        if (c.guests() != null) {
            svc.add("(s.min_guests IS NULL OR s.min_guests <= :guests) AND (s.max_guests IS NULL OR s.max_guests >= :guests)");
            params.addValue("guests", c.guests());
        }

        // ---- provider-level filters ------------------------------------------------
        List<String> where = new ArrayList<>(List.of(
                "p.onboarding_status = 'PUBLISHED'",
                "p.is_accepting_bookings",
                "p.verification_status IN ('PENDING', 'VERIFIED')"));
        boolean verifiedOnly = Boolean.TRUE.equals(c.verifiedOnly())
                || settings.getBoolean(SettingsService.REQUIRE_VERIFICATION_TO_LIST, false);
        if (verifiedOnly) where.add("p.verification_status = 'VERIFIED'");

        if (c.q() != null && !c.q().isBlank()) {
            where.add("""
                    (p.professional_name ILIKE :q OR p.business_name ILIKE :q OR p.bio ILIKE :q
                     OR p.custom_cuisines ILIKE :q OR p.locality ILIKE :q
                     OR EXISTS (SELECT 1 FROM provider_cuisines pc JOIN cuisine_categories cc ON cc.id = pc.cuisine_id
                                WHERE pc.provider_id = p.id AND cc.name ILIKE :q)
                     OR EXISTS (SELECT 1 FROM services s2 WHERE s2.provider_id = p.id AND s2.is_active
                                AND (s2.title ILIKE :q OR s2.description ILIKE :q)))""");
            params.addValue("q", "%" + escapeLike(c.q().trim()) + "%");
        }
        if (notEmpty(c.cuisines())) {
            where.add("""
                    EXISTS (SELECT 1 FROM provider_cuisines pc JOIN cuisine_categories cc ON cc.id = pc.cuisine_id
                            WHERE pc.provider_id = p.id AND cc.code IN (:cuisines))""");
            params.addValue("cuisines", c.cuisines());
        }
        if (c.city() != null && !c.city().isBlank()) {
            where.add("lower(p.city) = lower(:city)");
            params.addValue("city", c.city().trim());
        }
        if (c.area() != null && !c.area().isBlank()) {
            where.add("p.locality ILIKE :area");
            params.addValue("area", "%" + escapeLike(c.area().trim()) + "%");
        }
        if (c.lat() != null && c.lng() != null) {
            // Customer's search radius AND the provider's own travel radius must both cover the distance.
            where.add("d.distance_km IS NOT NULL AND d.distance_km <= LEAST(:radius, p.max_travel_distance_km)");
            params.addValue("radius", c.radiusKm() != null ? c.radiusKm() : 25);
        }
        if (c.minRating() != null && c.minRating() > 0) {
            where.add("r.avg_rating >= :minRating");
            params.addValue("minRating", c.minRating());
        }
        if (c.minExperience() != null && c.minExperience() > 0) {
            where.add("p.experience_years >= :minExperience");
            params.addValue("minExperience", c.minExperience());
        }
        if (c.minCompletedBookings() != null && c.minCompletedBookings() > 0) {
            where.add("COALESCE(cb.completed_count, 0) >= :minCompleted");
            params.addValue("minCompleted", c.minCompletedBookings());
        }
        if (c.date() != null) {
            params.addValue("date", c.date()).addValue("time", c.time());
            where.add("NOT EXISTS (SELECT 1 FROM provider_blocked_dates bd WHERE bd.provider_id = p.id AND bd.blocked_date = :date)");
            // Weekly schedule: if the provider defined one, the day (and time, if given) must be inside it.
            where.add("""
                    (NOT EXISTS (SELECT 1 FROM provider_availability pa WHERE pa.provider_id = p.id)
                     OR EXISTS (SELECT 1 FROM provider_availability pa
                                WHERE pa.provider_id = p.id AND pa.is_active
                                  AND pa.day_of_week = EXTRACT(ISODOW FROM CAST(:date AS date))
                                  AND (CAST(:time AS time) IS NULL
                                       OR CAST(:time AS time) BETWEEN pa.start_time AND pa.end_time)))""");
            where.add("""
                    (SELECT COUNT(*) FROM bookings bk WHERE bk.provider_id = p.id AND bk.event_date = :date
                       AND bk.booking_status IN (%s)) < COALESCE(lim.max_daily_bookings, 1)"""
                    .formatted(BookingStatus.sqlList(BookingStatus.OCCUPYING)));
            where.add("""
                    (CAST(:date AS date) + COALESCE(CAST(:time AS time), TIME '23:59'))
                      >= LOCALTIMESTAMP + make_interval(hours => COALESCE(lim.advance_notice_hours, 0))""");
            where.add("(lim.max_advance_days IS NULL OR CAST(:date AS date) <= CURRENT_DATE + lim.max_advance_days)");
        }

        String orderBy = switch (c.sort() == null ? "recommended" : c.sort()) {
            case "price_asc" -> "b.starting_price ASC NULLS LAST, p.id";
            case "price_desc" -> "b.starting_price DESC NULLS LAST, p.id";
            case "rating" -> "r.avg_rating DESC NULLS LAST, r.review_count DESC NULLS LAST, p.id";
            case "experience" -> "p.experience_years DESC, p.id";
            case "distance" -> "d.distance_km ASC NULLS LAST, p.id";
            default -> "(p.verification_status = 'VERIFIED') DESC, r.avg_rating DESC NULLS LAST, "
                    + "r.review_count DESC NULLS LAST, cb.completed_count DESC NULLS LAST, p.published_at DESC, p.id";
        };

        int size = Math.min(Math.max(c.size(), 1), 50);
        int page = Math.max(c.page(), 0);
        params.addValue("limit", size).addValue("offset", page * size);

        String sql = """
                WITH matched AS (
                    SELECT s.provider_id, s.role_type, spm.code AS pricing_model, sp.amount
                    FROM services s
                    JOIN service_prices sp ON sp.service_id = s.id
                    JOIN service_pricing_models spm ON spm.id = sp.pricing_model_id
                    WHERE s.is_active AND s.role_type IS NOT NULL %s
                ),
                best AS (
                    SELECT DISTINCT ON (provider_id) provider_id, amount AS starting_price, pricing_model, role_type
                    FROM matched ORDER BY provider_id, amount ASC NULLS LAST
                )
                SELECT p.id, p.professional_name, p.business_name, p.avatar_url, p.cover_image_url,
                       p.city, p.locality, p.experience_years, p.verification_status,
                       b.starting_price, b.pricing_model, b.role_type AS matched_category,
                       r.avg_rating, COALESCE(r.review_count, 0) AS review_count,
                       COALESCE(cb.completed_count, 0) AS completed_count, d.distance_km,
                       ARRAY(SELECT pr.role_type FROM provider_roles pr WHERE pr.provider_id = p.id AND pr.is_active
                             ORDER BY pr.is_primary DESC, pr.role_type) AS categories,
                       ARRAY(SELECT cc.name FROM provider_cuisines pc JOIN cuisine_categories cc ON cc.id = pc.cuisine_id
                             WHERE pc.provider_id = p.id ORDER BY pc.is_signature DESC, cc.name) AS cuisines,
                       COUNT(*) OVER () AS total_count
                FROM provider_profiles p
                JOIN users u ON u.id = p.user_id AND u.account_status = 'ACTIVE'
                JOIN best b ON b.provider_id = p.id
                LEFT JOIN provider_booking_limits lim ON lim.provider_id = p.id
                LEFT JOIN (SELECT provider_id, AVG(overall_rating)::double precision AS avg_rating, COUNT(*) AS review_count
                           FROM reviews GROUP BY provider_id) r ON r.provider_id = p.id
                LEFT JOIN (SELECT provider_id, COUNT(*) AS completed_count FROM bookings
                           WHERE booking_status = 'COMPLETED' GROUP BY provider_id) cb ON cb.provider_id = p.id
                LEFT JOIN LATERAL (SELECT %s AS distance_km) d ON TRUE
                WHERE %s
                ORDER BY %s
                LIMIT :limit OFFSET :offset
                """.formatted(
                svc.isEmpty() ? "" : "AND " + String.join(" AND ", svc),
                DISTANCE_EXPR,
                String.join("\n  AND ", where),
                orderBy);

        long[] total = {0};
        List<ProviderCard> items = jdbc.query(sql, params, (rs, i) -> {
            total[0] = rs.getLong("total_count");
            return mapCard(rs);
        });
        return new PageResponse<>(items, page, size, total[0]);
    }

    private ProviderCard mapCard(ResultSet rs) throws SQLException {
        double rating = rs.getDouble("avg_rating");
        boolean noRating = rs.wasNull();
        double distance = rs.getDouble("distance_km");
        boolean noDistance = rs.wasNull();
        BigDecimal price = rs.getBigDecimal("starting_price");
        return new ProviderCard(
                rs.getObject("id", java.util.UUID.class),
                rs.getString("professional_name"),
                rs.getString("business_name"),
                rs.getString("avatar_url"),
                rs.getString("cover_image_url"),
                rs.getString("city"),
                rs.getString("locality"),
                rs.getInt("experience_years"),
                "VERIFIED".equals(rs.getString("verification_status")),
                strings(rs.getArray("categories")),
                strings(rs.getArray("cuisines")),
                rs.getString("matched_category"),
                price,
                price == null ? "CUSTOM_QUOTE" : rs.getString("pricing_model"),
                noRating ? null : Math.round(rating * 10) / 10.0,
                rs.getInt("review_count"),
                rs.getInt("completed_count"),
                noDistance ? null : Math.round(distance * 10) / 10.0);
    }

    static List<String> strings(Array array) throws SQLException {
        if (array == null) return List.of();
        return Arrays.asList((String[]) array.getArray());
    }

    private static boolean notEmpty(List<String> list) {
        return list != null && !list.isEmpty();
    }

    static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
