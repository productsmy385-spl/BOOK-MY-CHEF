package com.marketplace.promotion;

import com.marketplace.admin.AdminSupport;
import com.marketplace.common.ApiResponse;
import com.marketplace.common.PageResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Campaigns, provider-banner review, featured providers, banner analytics and AI images. ROLE_ADMIN + admin role checks. */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Administration — promotions")
public class PromotionAdminController {

    private final AdminSupport support;
    private final BannerService banners;
    private final DiscoveryService discovery;
    private final AiImageService ai;
    private final com.marketplace.media.MediaService media;

    // ------------------------------------------------------------------ campaigns

    public record CampaignBody(
            @NotBlank(message = "Add a headline") @Size(max = 120) String title,
            @Size(max = 240) String subtitle,
            @Size(max = 40) String ctaText,
            @NotBlank @Pattern(regexp = "NONE|EXPLORE|CATEGORY|PROVIDER|PATH") String destinationType,
            @Size(max = 255) String destinationRef,
            @NotNull(message = "Choose a desktop image") UUID desktopAssetId,
            UUID mobileAssetId,
            @NotEmpty(message = "Choose where the banner appears") List<@NotBlank String> placements,
            @Size(max = 64) String category,
            @Min(-100) @Max(100) Integer priority,
            @Min(3) @Max(30) Integer rotationSeconds,
            OffsetDateTime startAt,
            OffsetDateTime endAt) {
        BannerService.PlatformInput toInput() {
            return new BannerService.PlatformInput(title, subtitle, ctaText, destinationType, destinationRef, desktopAssetId,
                    mobileAssetId, placements, category, priority, rotationSeconds, startAt, endAt);
        }
    }

    @GetMapping("/banners")
    public ApiResponse<PageResponse<Map<String, Object>>> campaigns(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                    @RequestParam(required = false) String status,
                                                                    @RequestParam(defaultValue = "0") int page) {
        support.require(u, AdminSupport.ANY);
        return ApiResponse.ok(banners.adminList(status, page, 20));
    }

    @PostMapping("/banners")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                   @Valid @RequestBody CampaignBody b, HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        Map<String, Object> out = banners.createPlatform(u, b.toInput());
        support.audit(u, "CAMPAIGN_CREATED", "PLATFORM_BANNER", (UUID) out.get("id"), null, Map.of("title", b.title()), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(out, "Campaign saved as draft"));
    }

    @PutMapping("/banners/{id}")
    public ApiResponse<Map<String, Object>> update(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @Valid @RequestBody CampaignBody b, HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        Map<String, Object> out = banners.updatePlatform(u, id, b.toInput());
        support.audit(u, "CAMPAIGN_UPDATED", "PLATFORM_BANNER", id, null, Map.of("title", b.title()), req);
        return ApiResponse.ok(out, "Campaign saved");
    }

    @PostMapping("/banners/{id}/{action}")
    public ApiResponse<Map<String, Object>> action(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @PathVariable String action, HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        Map<String, Object> out = switch (action) {
            case "publish" -> banners.setPlatformStatus(id, "PUBLISHED");
            case "unpublish" -> banners.setPlatformStatus(id, "DRAFT");
            case "archive" -> banners.setPlatformStatus(id, "ARCHIVED");
            case "duplicate" -> banners.duplicatePlatform(u, id);
            default -> throw com.marketplace.common.ApiException.notFound("Action");
        };
        support.audit(u, "CAMPAIGN_" + action.toUpperCase(), "PLATFORM_BANNER", id, null, Map.of("status", String.valueOf(out.get("status"))), req);
        return ApiResponse.ok(out, "Campaign updated");
    }

    public record PriorityBody(@NotNull @Min(-100) @Max(100) Integer priority) {
    }

    @PutMapping("/banners/{id}/priority")
    public ApiResponse<Map<String, Object>> priority(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                     @Valid @RequestBody PriorityBody b, HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        Map<String, Object> out = banners.setPriority(id, b.priority());
        support.audit(u, "CAMPAIGN_REORDERED", "PLATFORM_BANNER", id, null, Map.of("priority", b.priority()), req);
        return ApiResponse.ok(out, "Order updated");
    }

    @PostMapping("/media/{id}/copy-to-imagekit")
    public ApiResponse<Map<String, Object>> copyToImageKit(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                           HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        Map<String, Object> out = media.copyBundledToImageKit(id);
        support.audit(u, "MEDIA_COPIED_TO_IMAGEKIT", "MEDIA_ASSET", id, null, Map.of("url", String.valueOf(out.get("url"))), req);
        return ApiResponse.ok(out, "Image copied to ImageKit");
    }

    @DeleteMapping("/banners/{id}")
    public ApiResponse<Void> deleteDraft(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id, HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        banners.deletePlatformDraft(id);
        support.audit(u, "CAMPAIGN_DELETED", "PLATFORM_BANNER", id, null, null, req);
        return ApiResponse.ok(null, "Campaign deleted");
    }

    // ------------------------------------------------------------------ provider promotions

    @GetMapping("/provider-promotions")
    public ApiResponse<PageResponse<Map<String, Object>>> queue(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                @RequestParam(required = false) String status,
                                                                @RequestParam(defaultValue = "0") int page) {
        support.require(u, AdminSupport.ANY);
        return ApiResponse.ok(banners.reviewQueue(status, page, 20));
    }

    public record Decision(@Size(max = 1000) String note) {
    }

    @PostMapping("/provider-banners/{id}/{decision}")
    public ApiResponse<Map<String, Object>> review(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @PathVariable String decision, @Valid @RequestBody(required = false) Decision body,
                                                   HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        String d = switch (decision) {
            case "approve" -> "APPROVE";
            case "reject" -> "REJECT";
            case "request-changes" -> "REQUEST_CHANGES";
            case "pause" -> "PAUSE";
            case "archive" -> "ARCHIVE";
            default -> throw com.marketplace.common.ApiException.notFound("Action");
        };
        String note = body == null ? null : body.note();
        Map<String, Object> out = banners.review(u, id, d, note);
        support.audit(u, "PROVIDER_BANNER_" + d, "PROVIDER_BANNER", id, null,
                note == null ? Map.of("status", String.valueOf(out.get("status"))) : Map.of("status", String.valueOf(out.get("status")), "note", note), req);
        return ApiResponse.ok(out, "Decision recorded");
    }

    // ------------------------------------------------------------------ featured providers

    @GetMapping("/featured-providers")
    public ApiResponse<List<Map<String, Object>>> featured(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        support.require(u, AdminSupport.ANY);
        return ApiResponse.ok(discovery.featuredAdminList());
    }

    public record FeatureBody(@Pattern(regexp = "HOME_FEATURED|EXPLORE_FEATURED") String placement,
                              @Min(-100) @Max(100) Integer priority, OffsetDateTime startAt, OffsetDateTime endAt) {
    }

    @PostMapping("/providers/{id}/feature")
    public ApiResponse<List<Map<String, Object>>> feature(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                          @Valid @RequestBody FeatureBody b, HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        String placement = b.placement() == null ? "HOME_FEATURED" : b.placement();
        discovery.feature(u.getUserId(), id, placement, b.priority(), b.startAt(), b.endAt());
        support.audit(u, "PROVIDER_FEATURED", "PROVIDER_PROFILE", id, null, Map.of("placement", placement), req);
        return ApiResponse.ok(discovery.featuredAdminList(), "Provider featured");
    }

    @DeleteMapping("/providers/{id}/feature")
    public ApiResponse<List<Map<String, Object>>> unfeature(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                            @RequestParam(defaultValue = "HOME_FEATURED") String placement, HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        discovery.unfeature(id, placement);
        support.audit(u, "PROVIDER_UNFEATURED", "PROVIDER_PROFILE", id, null, Map.of("placement", placement), req);
        return ApiResponse.ok(discovery.featuredAdminList(), "Removed from featured");
    }

    // ------------------------------------------------------------------ analytics & AI

    @GetMapping("/banner-analytics")
    public ApiResponse<Map<String, Object>> analytics(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                      @RequestParam(defaultValue = "30") int days) {
        support.require(u, AdminSupport.ANY);
        return ApiResponse.ok(banners.analytics(days));
    }

    @GetMapping("/ai-images/config")
    public ApiResponse<Map<String, Object>> aiConfig(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        support.require(u, AdminSupport.ANY);
        return ApiResponse.ok(ai.config());
    }

    public record GenerateBody(@Size(max = 800) String prompt, @Size(max = 40) String preset,
                               @NotBlank @Pattern(regexp = "DESKTOP|MOBILE") String format) {
    }

    @PostMapping("/ai-images")
    public ApiResponse<Map<String, Object>> generate(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                     @Valid @RequestBody GenerateBody b, HttpServletRequest req) {
        support.require(u, AdminSupport.OPS);
        Map<String, Object> asset = ai.generate(u, b.prompt(), b.preset(), b.format());
        support.audit(u, "AI_IMAGE_GENERATED", "MEDIA_ASSET", (UUID) asset.get("id"), null, Map.of("format", b.format()), req);
        return ApiResponse.ok(asset, "Image generated and saved");
    }
}
