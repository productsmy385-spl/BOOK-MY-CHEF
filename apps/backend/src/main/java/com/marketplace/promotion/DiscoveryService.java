package com.marketplace.promotion;

import com.marketplace.catalog.ServiceCatalog;
import com.marketplace.common.ApiException;
import com.marketplace.common.SettingsService;
import com.marketplace.marketplace.ProviderCard;
import com.marketplace.marketplace.SearchCriteria;
import com.marketplace.marketplace.SearchService;
import com.marketplace.provider.ProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

/**
 * Homepage discovery lists built on {@link SearchService}, so the same
 * "publicly listed" rules and real ratings apply everywhere.
 */
@Service
@RequiredArgsConstructor
public class DiscoveryService {

    public static final List<String> CHEF_CATEGORIES = List.of("HOME_CHEF", "PRO_CHEF", "PERSONAL_CHEF");
    public static final Set<String> FEATURED_PLACEMENTS = Set.of("HOME_FEATURED", "EXPLORE_FEATURED");

    private final SearchService search;
    private final SettingsService settings;
    private final ProviderRepository providers;
    private final NamedParameterJdbcTemplate jdbc;

    private static SearchCriteria criteria(List<String> categories, String city, Double lat, Double lng, Integer radius,
                                           String sort, int size, List<UUID> ids, Integer minReviews) {
        return new SearchCriteria(null, categories, null, null, null, null, null, city, null, lat, lng, radius,
                null, null, null, null, null, null, null, sort, 0, size, ids, minReviews);
    }

    private static List<String> categories(String category) {
        if (category == null || category.isBlank()) return CHEF_CATEGORIES;
        if (!ServiceCatalog.isCategory(category)) throw ApiException.invalid("Unknown service category.");
        return List.of(category);
    }

    /** Admin-featured providers that are currently in their window and publicly listed, in priority order. */
    @Transactional(readOnly = true)
    public List<ProviderCard> featured(String placement, int limit) {
        if (!FEATURED_PLACEMENTS.contains(placement)) throw ApiException.invalid("Unknown placement.");
        List<UUID> ids = jdbc.queryForList("""
                SELECT provider_id FROM provider_featured_placements
                WHERE placement = :pl AND (start_at IS NULL OR start_at <= now()) AND (end_at IS NULL OR end_at > now())
                ORDER BY priority DESC, created_at LIMIT :lim""",
                Map.of("pl", placement, "lim", Math.min(Math.max(limit, 1), 24)), UUID.class);
        if (ids.isEmpty()) return List.of();
        List<ProviderCard> cards = new ArrayList<>(search.search(criteria(null, null, null, null, null, "recommended", 50, ids, null)).items());
        cards.sort(Comparator.comparingInt(c -> ids.indexOf(c.id())));
        return cards;
    }

    /** Highest-rated providers with at least the configured number of genuine reviews. */
    @Transactional(readOnly = true)
    public Map<String, Object> topRated(String category, String city, int limit) {
        int min = settings.getInt("marketplace.top_rated_min_reviews", 3);
        List<ProviderCard> items = search.search(criteria(categories(category), blank(city), null, null, null, "rating",
                Math.min(Math.max(limit, 1), 24), null, min)).items();
        return Map.of("minReviews", min, "items", items);
    }

    /** Providers whose own service radius and the customer's radius both cover the distance. */
    @Transactional(readOnly = true)
    public List<ProviderCard> nearby(double lat, double lng, Integer radiusKm, String category, int limit) {
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) throw ApiException.invalid("Location is invalid.");
        int radius = radiusKm == null ? 15 : Math.min(Math.max(radiusKm, 1), 100);
        return search.search(criteria(categories(category), null, lat, lng, radius, "distance",
                Math.min(Math.max(limit, 1), 24), null, null)).items();
    }

    // ---- admin: featured placements

    @Transactional(readOnly = true)
    public List<Map<String, Object>> featuredAdminList() {
        return jdbc.queryForList("""
                SELECT f.id, f.provider_id AS "providerId", pp.professional_name AS "name", pp.business_name AS "businessName",
                       pp.city, f.placement, f.priority, f.start_at::text AS "startAt", f.end_at::text AS "endAt",
                       ((f.start_at IS NULL OR f.start_at <= now()) AND (f.end_at IS NULL OR f.end_at > now())) AS "active",
                       (pp.onboarding_status = 'PUBLISHED') AS "published", pp.verification_status AS "verificationStatus"
                FROM provider_featured_placements f JOIN provider_profiles pp ON pp.id = f.provider_id
                ORDER BY f.placement, f.priority DESC, f.created_at""", Map.of());
    }

    @Transactional
    public void feature(UUID adminId, UUID providerId, String placement, Integer priority, OffsetDateTime startAt, OffsetDateTime endAt) {
        if (!FEATURED_PLACEMENTS.contains(placement)) throw ApiException.invalid("Unknown placement.");
        if (!providers.isPubliclyListed(providerId)) throw ApiException.invalid("Only published providers can be featured.");
        if (startAt != null && endAt != null && !endAt.isAfter(startAt)) throw ApiException.invalid("End date must be after the start date.");
        jdbc.update("""
                INSERT INTO provider_featured_placements (provider_id, placement, priority, start_at, end_at, created_by)
                VALUES (:p, :pl, :prio, :s, :e, :by)
                ON CONFLICT (provider_id, placement) DO UPDATE SET priority = EXCLUDED.priority,
                    start_at = EXCLUDED.start_at, end_at = EXCLUDED.end_at""",
                new MapSqlParameterSource().addValue("p", providerId).addValue("pl", placement)
                        .addValue("prio", priority == null ? 0 : priority).addValue("s", startAt).addValue("e", endAt).addValue("by", adminId));
    }

    @Transactional
    public void unfeature(UUID providerId, String placement) {
        if (jdbc.update("DELETE FROM provider_featured_placements WHERE provider_id = :p AND placement = :pl",
                Map.of("p", providerId, "pl", placement)) == 0) throw ApiException.notFound("Featured placement");
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
