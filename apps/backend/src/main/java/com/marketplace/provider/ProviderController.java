package com.marketplace.provider;

import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.provider.dto.ProviderCardDto;
import com.marketplace.provider.dto.ProviderDetailDto;
import com.marketplace.provider.dto.ProviderSetupRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Service Providers", description = "Provider profile management, portfolio, and service setup")
public class ProviderController {

    private final ProviderService providerService;

    @PostMapping("/profile")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN') or isAuthenticated()")
    @Operation(summary = "Create or update provider professional profile and services")
    public ResponseEntity<ApiResponse<ProviderDetailDto>> setupProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) UUID userId,
            @Valid @RequestBody ProviderSetupRequest request) {

        UUID effectiveUserId = principal != null ? principal.getUserId() : userId;
        if (effectiveUserId == null) {
            throw new IllegalArgumentException("User ID could not be identified from authentication session.");
        }

        ProviderDetailDto detail = providerService.setupProviderProfile(effectiveUserId, request);
        return ResponseEntity.ok(ApiResponse.ok(detail, "Provider profile updated successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full provider profile, portfolio, certifications, and reviews")
    public ResponseEntity<ApiResponse<ProviderDetailDto>> getProviderById(@PathVariable UUID id) {
        ProviderDetailDto detail = providerService.getProviderById(id);
        return ResponseEntity.ok(ApiResponse.ok(detail, "Provider profile retrieved successfully"));
    }

    @GetMapping("/{id}/services")
    @Operation(summary = "Get packages and services offered by provider")
    public ResponseEntity<ApiResponse<java.util.List<ServicePackage>>> getProviderPackages(@PathVariable UUID id) {
        java.util.List<ServicePackage> packages = providerService.getProviderPackages(id);
        return ResponseEntity.ok(ApiResponse.ok(packages, "Provider services and packages retrieved successfully"));
    }
}
