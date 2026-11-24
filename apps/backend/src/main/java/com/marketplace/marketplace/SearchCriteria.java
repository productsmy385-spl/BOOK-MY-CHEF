package com.marketplace.marketplace;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/** Marketplace search filters. Every field is optional. */
public record SearchCriteria(
        String q,
        List<String> categories,
        List<String> cuisines,
        List<String> deliveryModes,
        String pricingModel,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String city,
        String area,
        Double lat,
        Double lng,
        Integer radiusKm,
        LocalDate date,
        LocalTime time,
        Integer guests,
        Boolean verifiedOnly,
        Double minRating,
        Integer minExperience,
        Integer minCompletedBookings,
        String sort,
        int page,
        int size,
        List<UUID> ids,          // restrict to these providers (featured lists)
        Integer minReviews) {    // genuine-review threshold (top-rated lists)

    /** Criteria with only paging and sort set; use the with* helpers for discovery lists. */
    public static SearchCriteria of(String sort, int size) {
        return new SearchCriteria(null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, sort, 0, size, null, null);
    }
}
