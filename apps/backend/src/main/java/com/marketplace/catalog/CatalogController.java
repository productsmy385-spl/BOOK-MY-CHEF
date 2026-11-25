package com.marketplace.catalog;

import com.marketplace.menu.MenuCatalog;

import com.marketplace.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/catalog")
@RequiredArgsConstructor
@Tag(name = "Catalog", description = "Service categories, cuisines, pricing models and delivery modes")
public class CatalogController {

    private final NamedParameterJdbcTemplate jdbc;

    @GetMapping
    @Operation(summary = "Everything the client needs to render filters and provider forms")
    public ResponseEntity<ApiResponse<Map<String, Object>>> catalog() {
        List<Map<String, Object>> cuisines = jdbc.queryForList(
                "SELECT code, name AS label FROM cuisine_categories ORDER BY name", Map.of());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("groups", ServiceCatalog.GROUPS);
        body.put("categories", ServiceCatalog.CATEGORIES);
        body.put("cuisines", cuisines);
        body.put("pricingModels", toOptions(ServiceCatalog.PRICING_LABELS));
        body.put("deliveryModes", toOptions(ServiceCatalog.DELIVERY_MODE_LABELS));
        body.put("eventTypes", com.marketplace.event.EventCatalog.TYPES);
        body.put("menu", Map.of(
                "courses", toOptions(MenuCatalog.COURSES),
                "diets", toOptions(MenuCatalog.DIETS),
                "spiceLevels", toOptions(MenuCatalog.SPICE_LEVELS),
                "allergens", toOptions(MenuCatalog.ALLERGENS),
                "mealTypes", toOptions(MenuCatalog.MEAL_TYPES)));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(10, TimeUnit.MINUTES).cachePublic())
                .body(ApiResponse.ok(body));
    }

    private static List<ServiceCatalog.Option> toOptions(Map<String, String> labels) {
        return labels.entrySet().stream().map(e -> new ServiceCatalog.Option(e.getKey(), e.getValue())).toList();
    }
}
