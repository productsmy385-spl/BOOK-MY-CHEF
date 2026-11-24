package com.marketplace.provider;

import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Provider's own business settings. Requires ROLE_PROVIDER (see SecurityConfig). */
@RestController
@RequestMapping("/api/v1/providers/me")
@RequiredArgsConstructor
@Tag(name = "Provider self-management")
public class ProviderSelfController {

    private final ProviderSelfService service;

    @GetMapping
    public ApiResponse<Map<String, Object>> me(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(service.me(u.getUserId()));
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(service.dashboard(u.getUserId()));
    }

    @PutMapping("/profile")
    public ApiResponse<Map<String, Object>> profile(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                    @Valid @RequestBody ProviderRequests.ProfileUpdate body) {
        service.updateProfile(u.getUserId(), body);
        return ApiResponse.ok(service.me(u.getUserId()), "Profile saved");
    }

    @PutMapping("/categories")
    public ApiResponse<Map<String, Object>> categories(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                       @Valid @RequestBody ProviderRequests.Categories body) {
        service.setCategories(u.getUserId(), body.categories());
        return ApiResponse.ok(service.me(u.getUserId()), "Services updated");
    }

    @PutMapping("/cuisines")
    public ApiResponse<Map<String, Object>> cuisines(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                     @Valid @RequestBody ProviderRequests.Cuisines body) {
        service.setCuisines(u.getUserId(), body);
        return ApiResponse.ok(service.me(u.getUserId()), "Cuisines saved");
    }

    @PostMapping("/services")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createService(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                          @Valid @RequestBody ProviderRequests.ServiceUpsert body) {
        service.createService(u.getUserId(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.me(u.getUserId()), "Service added"));
    }

    @PutMapping("/services/{id}")
    public ApiResponse<Map<String, Object>> updateService(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                          @Valid @RequestBody ProviderRequests.ServiceUpsert body) {
        service.updateService(u.getUserId(), id, body);
        return ApiResponse.ok(service.me(u.getUserId()), "Service saved");
    }

    @DeleteMapping("/services/{id}")
    public ApiResponse<Map<String, Object>> deleteService(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        service.deleteService(u.getUserId(), id);
        return ApiResponse.ok(service.me(u.getUserId()), "Service removed");
    }

    @PutMapping("/availability")
    public ApiResponse<Map<String, Object>> availability(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                         @Valid @RequestBody ProviderRequests.Availability body) {
        service.setAvailability(u.getUserId(), body);
        return ApiResponse.ok(service.me(u.getUserId()), "Availability saved");
    }

    @PostMapping("/blocked-dates")
    public ApiResponse<Map<String, Object>> block(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                  @Valid @RequestBody ProviderRequests.BlockedDate body) {
        service.blockDate(u.getUserId(), body);
        return ApiResponse.ok(service.me(u.getUserId()), "Date blocked");
    }

    @DeleteMapping("/blocked-dates/{date}")
    public ApiResponse<Map<String, Object>> unblock(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                    @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        service.unblockDate(u.getUserId(), date);
        return ApiResponse.ok(service.me(u.getUserId()), "Date unblocked");
    }

    @PostMapping("/portfolio")
    public ApiResponse<Map<String, Object>> addPortfolio(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                         @Valid @RequestBody ProviderRequests.PortfolioItem body) {
        service.addPortfolio(u.getUserId(), body);
        return ApiResponse.ok(service.me(u.getUserId()), "Added to portfolio");
    }

    @DeleteMapping("/portfolio/{id}")
    public ApiResponse<Map<String, Object>> deletePortfolio(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        service.deletePortfolio(u.getUserId(), id);
        return ApiResponse.ok(service.me(u.getUserId()), "Removed from portfolio");
    }

    @PostMapping("/documents")
    public ApiResponse<Map<String, Object>> addDocument(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                        @Valid @RequestBody ProviderRequests.Document body) {
        service.addDocument(u.getUserId(), body);
        return ApiResponse.ok(service.me(u.getUserId()), "Document submitted for review");
    }

    @PostMapping("/publish")
    public ApiResponse<Map<String, Object>> publish(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(service.publish(u.getUserId()), "Your profile is live");
    }

    @PostMapping("/unpublish")
    public ApiResponse<Map<String, Object>> unpublish(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        service.unpublish(u.getUserId());
        return ApiResponse.ok(service.me(u.getUserId()), "Your profile is hidden from customers");
    }
}
