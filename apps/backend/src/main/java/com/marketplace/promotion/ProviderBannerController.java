package com.marketplace.promotion;

import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Provider's own promotional banners. ROLE_PROVIDER via /providers/me/** in SecurityConfig; ownership checked in the service. */
@RestController
@RequestMapping("/api/v1/providers/me/banners")
@RequiredArgsConstructor
@Tag(name = "Provider promotions")
public class ProviderBannerController {

    private final BannerService banners;

    public record BannerBody(
            @NotBlank(message = "Add a title") @Size(max = 100) String title,
            @Size(max = 300) String description,
            @Size(max = 80) String offerText,
            @Size(max = 64) String category,
            @Size(max = 40) String ctaText,
            UUID serviceId,
            @NotNull(message = "Upload a banner image") UUID desktopAssetId,
            UUID mobileAssetId,
            OffsetDateTime startAt,
            OffsetDateTime endAt) {
        BannerService.ProviderInput toInput() {
            return new BannerService.ProviderInput(title, description, offerText, category, ctaText, serviceId,
                    desktopAssetId, mobileAssetId, startAt, endAt);
        }
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(banners.mine(u.getUserId()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                   @Valid @RequestBody BannerBody b) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(banners.createProvider(u, b.toInput()), "Draft saved"));
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @Valid @RequestBody BannerBody b) {
        return ApiResponse.ok(banners.updateProvider(u, id, b.toInput()), "Banner saved");
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<Map<String, Object>> submit(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(banners.submit(u.getUserId(), id), "Sent for approval");
    }

    @PostMapping("/{id}/pause")
    public ApiResponse<Map<String, Object>> pause(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(banners.providerPause(u.getUserId(), id, true), "Banner paused");
    }

    @PostMapping("/{id}/resume")
    public ApiResponse<Map<String, Object>> resume(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(banners.providerPause(u.getUserId(), id, false), "Banner live again");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        banners.providerDelete(u.getUserId(), id);
        return ApiResponse.ok(null, "Banner removed");
    }
}
