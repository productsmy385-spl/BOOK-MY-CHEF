package com.marketplace.provider;

import com.marketplace.common.ApiResponse;
import com.marketplace.provider.dto.ProviderCardDto;
import com.marketplace.provider.dto.ProviderDetailDto;
import com.marketplace.provider.dto.ProviderSetupRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Service Providers", description = "Provider profile management, portfolio, and service setup")
public class ProviderController {

    private final ProviderService providerService;

    @PostMapping("/profile")
    @Operation(summary = "Create or update provider professional profile and services")
    public ResponseEntity<ApiResponse<ProviderDetailDto>> setupProfile(
            @RequestParam UUID userId,
            @Valid @RequestBody ProviderSetupRequest request) {

        ProviderDetailDto detail = providerService.setupProviderProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(detail, "Provider profile updated successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full provider profile, portfolio, certifications, and reviews")
    public ResponseEntity<ApiResponse<ProviderDetailDto>> getProviderById(@PathVariable UUID id) {
        ProviderDetailDto detail = providerService.getProviderById(id);
        return ResponseEntity.ok(ApiResponse.ok(detail, "Provider profile retrieved successfully"));
    }
}
