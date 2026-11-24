package com.marketplace.customer;

import com.marketplace.common.ApiException;
import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.provider.ProviderRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Customer's own favourites, addresses and profile. Requires ROLE_CUSTOMER. */
@RestController
@RequestMapping("/api/v1/customer")
@RequiredArgsConstructor
@Tag(name = "Customer")
public class CustomerController {

    private final NamedParameterJdbcTemplate jdbc;
    private final ProviderRepository providers;

    // ---------------------------------------------------------------- favourites

    @GetMapping("/favourites")
    public ApiResponse<List<Map<String, Object>>> favourites(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(jdbc.queryForList("""
                SELECT p.id, p.professional_name AS "name", p.business_name AS "businessName", p.avatar_url AS "avatarUrl",
                       p.city, p.locality, (p.verification_status = 'VERIFIED') AS "verified",
                       (p.onboarding_status = 'PUBLISHED' AND p.verification_status IN ('PENDING','VERIFIED')) AS "available",
                       (SELECT ROUND(AVG(overall_rating)::numeric, 1) FROM reviews r WHERE r.provider_id = p.id) AS "averageRating",
                       (SELECT COUNT(*) FROM reviews r WHERE r.provider_id = p.id) AS "reviewCount",
                       (SELECT pr.role_type FROM provider_roles pr WHERE pr.provider_id = p.id AND pr.is_active
                        ORDER BY pr.is_primary DESC LIMIT 1) AS "primaryCategory",
                       f.saved_at::text AS "savedAt"
                FROM customer_favourites f JOIN provider_profiles p ON p.id = f.provider_id
                WHERE f.user_id = :uid ORDER BY f.saved_at DESC""", Map.of("uid", u.getUserId())));
    }

    @GetMapping("/favourites/ids")
    public ApiResponse<List<UUID>> favouriteIds(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(jdbc.queryForList("SELECT provider_id FROM customer_favourites WHERE user_id = :uid",
                Map.of("uid", u.getUserId()), UUID.class));
    }

    @PutMapping("/favourites/{providerId}")
    @Transactional
    public ApiResponse<Void> addFavourite(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID providerId) {
        if (!providers.isPubliclyListed(providerId)) throw ApiException.notFound("Provider");
        jdbc.update("""
                INSERT INTO customer_favourites (user_id, provider_id) VALUES (:uid, :pid)
                ON CONFLICT (user_id, provider_id) DO NOTHING""", Map.of("uid", u.getUserId(), "pid", providerId));
        return ApiResponse.ok(null, "Saved to favourites");
    }

    @DeleteMapping("/favourites/{providerId}")
    @Transactional
    public ApiResponse<Void> removeFavourite(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID providerId) {
        jdbc.update("DELETE FROM customer_favourites WHERE user_id = :uid AND provider_id = :pid",
                Map.of("uid", u.getUserId(), "pid", providerId));
        return ApiResponse.ok(null, "Removed from favourites");
    }

    // ---------------------------------------------------------------- addresses

    public record AddressRequest(
            @NotBlank @Pattern(regexp = "HOME|EVENT_VENUE|OTHER") String addressType,
            @NotBlank(message = "Address line is required") @Size(max = 255) String addressLine1,
            @Size(max = 255) String addressLine2,
            @Size(max = 150) String landmark,
            @NotBlank(message = "City is required") @Size(max = 100) String city,
            @NotBlank(message = "State is required") @Size(max = 100) String state,
            @NotBlank(message = "PIN code is required") @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Enter a 6-digit PIN code") String postalCode,
            @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
            @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude,
            Boolean isDefault) {
    }

    @GetMapping("/addresses")
    public ApiResponse<List<Map<String, Object>>> addresses(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(listAddresses(u.getUserId()));
    }

    @PostMapping("/addresses")
    @Transactional
    public ApiResponse<List<Map<String, Object>>> addAddress(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                             @Valid @RequestBody AddressRequest r) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM user_addresses WHERE user_id = :uid",
                Map.of("uid", u.getUserId()), Integer.class);
        if (count != null && count >= 10) throw ApiException.invalid("You can save up to 10 addresses.");
        boolean makeDefault = Boolean.TRUE.equals(r.isDefault()) || count == null || count == 0;
        if (makeDefault) clearDefault(u.getUserId());
        jdbc.update("""
                INSERT INTO user_addresses (user_id, address_type, address_line1, address_line2, landmark, city, state,
                    postal_code, latitude, longitude, is_default)
                VALUES (:uid, :type, :l1, :l2, :lm, :city, :state, :pin, :lat, :lng, :def)""",
                addressParams(r).addValue("uid", u.getUserId()).addValue("def", makeDefault));
        return ApiResponse.ok(listAddresses(u.getUserId()), "Address saved");
    }

    @PutMapping("/addresses/{id}")
    @Transactional
    public ApiResponse<List<Map<String, Object>>> updateAddress(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                @PathVariable UUID id, @Valid @RequestBody AddressRequest r) {
        if (Boolean.TRUE.equals(r.isDefault())) clearDefault(u.getUserId());
        int n = jdbc.update("""
                UPDATE user_addresses SET address_type = :type, address_line1 = :l1, address_line2 = :l2, landmark = :lm,
                    city = :city, state = :state, postal_code = :pin, latitude = :lat, longitude = :lng,
                    is_default = CASE WHEN :def THEN TRUE ELSE is_default END
                WHERE id = :id AND user_id = :uid""",
                addressParams(r).addValue("uid", u.getUserId()).addValue("id", id).addValue("def", Boolean.TRUE.equals(r.isDefault())));
        if (n == 0) throw ApiException.notFound("Address");
        return ApiResponse.ok(listAddresses(u.getUserId()), "Address updated");
    }

    @DeleteMapping("/addresses/{id}")
    @Transactional
    public ApiResponse<List<Map<String, Object>>> deleteAddress(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        if (jdbc.update("DELETE FROM user_addresses WHERE id = :id AND user_id = :uid", Map.of("id", id, "uid", u.getUserId())) == 0) {
            throw ApiException.notFound("Address");
        }
        return ApiResponse.ok(listAddresses(u.getUserId()), "Address removed");
    }

    private List<Map<String, Object>> listAddresses(UUID userId) {
        return jdbc.queryForList("""
                SELECT id, address_type AS "addressType", address_line1 AS "addressLine1", address_line2 AS "addressLine2",
                       landmark, city, state, postal_code AS "postalCode", latitude, longitude, is_default AS "isDefault"
                FROM user_addresses WHERE user_id = :uid ORDER BY is_default DESC, created_at DESC""", Map.of("uid", userId));
    }

    private void clearDefault(UUID userId) {
        jdbc.update("UPDATE user_addresses SET is_default = FALSE WHERE user_id = :uid", Map.of("uid", userId));
    }

    private static MapSqlParameterSource addressParams(AddressRequest r) {
        return new MapSqlParameterSource()
                .addValue("type", r.addressType()).addValue("l1", r.addressLine1().trim())
                .addValue("l2", r.addressLine2()).addValue("lm", r.landmark())
                .addValue("city", r.city().trim()).addValue("state", r.state().trim())
                .addValue("pin", r.postalCode()).addValue("lat", r.latitude()).addValue("lng", r.longitude());
    }

    // ---------------------------------------------------------------- profile

    public record ProfileRequest(
            @NotBlank(message = "Name is required") @Size(max = 150) String fullName,
            @Size(max = 100) String city,
            @Size(max = 1024) @Pattern(regexp = "^$|^https://.+", message = "Photo must be an https link") String avatarUrl) {
    }

    @PutMapping("/profile")
    @Transactional
    public ApiResponse<Void> updateProfile(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @Valid @RequestBody ProfileRequest r) {
        jdbc.update("""
                UPDATE user_profiles SET full_name = :name, city = :city, avatar_url = :avatar, updated_at = now()
                WHERE user_id = :uid""",
                new MapSqlParameterSource().addValue("uid", u.getUserId()).addValue("name", r.fullName().trim())
                        .addValue("city", r.city() == null || r.city().isBlank() ? null : r.city().trim())
                        .addValue("avatar", r.avatarUrl() == null || r.avatarUrl().isBlank() ? null : r.avatarUrl()));
        return ApiResponse.ok(null, "Profile saved");
    }
}
