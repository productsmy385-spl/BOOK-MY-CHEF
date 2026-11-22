package com.marketplace.provider;

import com.marketplace.common.ApiResponse;
import com.marketplace.provider.dto.ProviderCardDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Discovery & Search", description = "Customer search, location filtering, and category exploration")
public class ProviderSearchController {

    private final ProviderService providerService;

    @GetMapping("/providers")
    @Operation(summary = "Search and filter service providers by keywords, cuisines, location radius, and dates")
    public ResponseEntity<ApiResponse<List<ProviderCardDto>>> searchProviders(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) BigDecimal latitude,
            @RequestParam(required = false) BigDecimal longitude,
            @RequestParam(required = false, defaultValue = "25") Integer radiusKm) {

        List<ProviderCardDto> results = providerService.searchProviders(query, category, cuisine, latitude, longitude, radiusKm);
        return ResponseEntity.ok(ApiResponse.ok(results, "Found " + results.size() + " providers"));
    }
}
