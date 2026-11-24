package com.marketplace.marketplace;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** One marketplace result. Every value comes from stored provider data. */
public record ProviderCard(
        UUID id,
        String name,
        String businessName,
        String avatarUrl,
        String coverImageUrl,
        String city,
        String locality,
        int experienceYears,
        boolean verified,
        List<String> categories,
        List<String> cuisines,
        String matchedCategory,
        BigDecimal startingPrice,      // null = quoted on request
        String pricingModel,
        Double averageRating,          // null = no reviews yet
        int reviewCount,
        int completedBookings,
        Double distanceKm) {           // null = no location to compare
}
