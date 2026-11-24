package com.marketplace.marketplace;

import com.marketplace.catalog.ServiceCatalog;
import com.marketplace.common.ApiException;
import com.marketplace.common.ApiResponse;
import com.marketplace.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Marketplace search")
public class SearchController {

    private static final Set<String> SORTS = Set.of("recommended", "price_asc", "price_desc", "rating", "experience", "distance");

    private final SearchService searchService;

    @GetMapping("/providers")
    @Operation(summary = "Search published providers. List parameters accept comma-separated values.")
    public ResponseEntity<ApiResponse<PageResponse<ProviderCard>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) List<String> cuisine,
            @RequestParam(required = false) List<String> mode,
            @RequestParam(required = false) String pricingModel,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Integer radiusKm,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time,
            @RequestParam(required = false) Integer guests,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) Integer minCompleted,
            @RequestParam(required = false, defaultValue = "recommended") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size) {

        if (category != null && category.stream().anyMatch(cat -> !ServiceCatalog.isCategory(cat))) {
            throw ApiException.invalid("Unknown service category.");
        }
        if (mode != null && mode.stream().anyMatch(m -> !ServiceCatalog.DELIVERY_MODE_LABELS.containsKey(m))) {
            throw ApiException.invalid("Unknown service mode.");
        }
        if (pricingModel != null && !ServiceCatalog.PRICING_LABELS.containsKey(pricingModel)) {
            throw ApiException.invalid("Unknown pricing model.");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw ApiException.invalid("Minimum budget cannot be more than the maximum.");
        }
        if ((lat == null) != (lng == null) || (lat != null && (Math.abs(lat) > 90 || Math.abs(lng) > 180))) {
            throw ApiException.invalid("Location is incomplete or invalid.");
        }
        if (radiusKm != null && (radiusKm < 1 || radiusKm > 200)) {
            throw ApiException.invalid("Radius must be between 1 and 200 km.");
        }
        if (date != null && date.isBefore(LocalDate.now())) {
            throw ApiException.invalid("Choose today or a future date.");
        }
        if (guests != null && guests < 1) {
            throw ApiException.invalid("Guest count must be at least 1.");
        }

        SearchCriteria criteria = new SearchCriteria(q, category, cuisine, mode, pricingModel, minPrice, maxPrice,
                city, area, lat, lng, radiusKm, date, time, guests, verified, minRating, minExperience, minCompleted,
                SORTS.contains(sort) ? sort : "recommended", page, size);
        return ResponseEntity.ok(ApiResponse.ok(searchService.search(criteria)));
    }
}
