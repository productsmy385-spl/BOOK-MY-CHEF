package com.marketplace.promotion;

import com.marketplace.common.ApiResponse;
import com.marketplace.marketplace.ProviderCard;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/** Public, unauthenticated discovery and banner endpoints. Only live, approved content is returned. */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Public discovery & banners")
public class PublicPromotionController {

    private final BannerService banners;
    private final DiscoveryService discovery;

    @GetMapping("/banners")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> platformBanners(@RequestParam String placement,
                                                                                @RequestParam(required = false) String category) {
        // Short cache so schedule changes and unpublishing take effect within a minute.
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(ApiResponse.ok(banners.publicPlatform(placement, category)));
    }

    @GetMapping("/providers/promotions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> promotions(@RequestParam(required = false) UUID providerId,
                                                                           @RequestParam(required = false) String category,
                                                                           @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(ApiResponse.ok(banners.publicProvider(providerId, category, limit)));
    }

    @GetMapping("/providers/featured")
    public ApiResponse<List<ProviderCard>> featured(@RequestParam(defaultValue = "HOME_FEATURED") String placement,
                                                    @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(discovery.featured(placement, limit));
    }

    @GetMapping("/providers/top-rated")
    public ApiResponse<Map<String, Object>> topRated(@RequestParam(required = false) String category,
                                                     @RequestParam(required = false) String city,
                                                     @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(discovery.topRated(category, city, limit));
    }

    @GetMapping("/providers/nearby")
    public ApiResponse<List<ProviderCard>> nearby(@RequestParam double lat, @RequestParam double lng,
                                                  @RequestParam(required = false) Integer radiusKm,
                                                  @RequestParam(required = false) String category,
                                                  @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(discovery.nearby(lat, lng, radiusKm, category, limit));
    }

    public record EventRequest(@NotBlank @Pattern(regexp = "PLATFORM|PROVIDER") String kind,
                               @Size(max = 32) String placement,
                               @Size(max = 64) String visitorId) {
    }

    @PostMapping("/banners/{id}/impression")
    public ApiResponse<Map<String, Boolean>> impression(@PathVariable UUID id, @Valid @RequestBody EventRequest r, HttpServletRequest req) {
        return ApiResponse.ok(Map.of("counted", banners.recordEvent(r.kind(), id, "IMPRESSION", r.placement(), r.visitorId(), ip(req), ua(req))));
    }

    @PostMapping("/banners/{id}/click")
    public ApiResponse<Map<String, Boolean>> click(@PathVariable UUID id, @Valid @RequestBody EventRequest r, HttpServletRequest req) {
        return ApiResponse.ok(Map.of("counted", banners.recordEvent(r.kind(), id, "CLICK", r.placement(), r.visitorId(), ip(req), ua(req))));
    }

    private static String ip(HttpServletRequest req) {
        String f = req.getHeader("X-Forwarded-For");
        return f != null && !f.isBlank() ? f.split(",")[0].trim() : req.getRemoteAddr();
    }

    private static String ua(HttpServletRequest req) {
        String ua = req.getHeader("User-Agent");
        return ua == null ? "" : ua.substring(0, Math.min(ua.length(), 200));
    }
}
