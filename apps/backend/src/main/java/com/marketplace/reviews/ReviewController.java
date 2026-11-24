package com.marketplace.reviews;

import com.marketplace.common.ApiException;
import com.marketplace.common.ApiResponse;
import com.marketplace.common.PageResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.notification.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Reviews can only be written by the customer of a COMPLETED booking, once per booking. */
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews")
public class ReviewController {

    private final NamedParameterJdbcTemplate jdbc;
    private final NotificationService notifications;

    public record SubmitReview(
            @NotNull UUID bookingId,
            @NotNull @DecimalMin("1.0") @DecimalMax("5.0") BigDecimal overallRating,
            @DecimalMin("1.0") @DecimalMax("5.0") BigDecimal qualityRating,
            @DecimalMin("1.0") @DecimalMax("5.0") BigDecimal punctualityRating,
            @DecimalMin("1.0") @DecimalMax("5.0") BigDecimal hospitalityRating,
            @Size(max = 2000, message = "Review is too long") String text) {
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<Void>> submit(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                    @Valid @RequestBody SubmitReview r) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT b.provider_id, b.booking_status, b.booking_reference, p.user_id AS provider_user
                FROM bookings b JOIN provider_profiles p ON p.id = b.provider_id
                WHERE b.id = :id AND b.customer_id = :cid""", Map.of("id", r.bookingId(), "cid", u.getUserId()));
        if (rows.isEmpty()) throw ApiException.notFound("Booking");
        Map<String, Object> b = rows.get(0);
        if (!"COMPLETED".equals(b.get("booking_status"))) {
            throw ApiException.conflict("You can review a booking after it is completed.");
        }
        int inserted = jdbc.update("""
                INSERT INTO reviews (booking_id, customer_id, provider_id, overall_rating, food_taste_rating,
                    punctuality_rating, hospitality_rating, review_text, is_verified_booking)
                VALUES (:bid, :cid, :pid, :overall, :quality, :punct, :hosp, :text, TRUE)
                ON CONFLICT (booking_id) DO NOTHING""",
                new MapSqlParameterSource().addValue("bid", r.bookingId()).addValue("cid", u.getUserId())
                        .addValue("pid", b.get("provider_id")).addValue("overall", r.overallRating())
                        .addValue("quality", r.qualityRating()).addValue("punct", r.punctualityRating())
                        .addValue("hosp", r.hospitalityRating())
                        .addValue("text", r.text() == null || r.text().isBlank() ? null : r.text().trim()));
        if (inserted == 0) throw ApiException.conflict("You have already reviewed this booking.");
        notifications.notify((UUID) b.get("provider_user"), "REVIEW_RECEIVED", "New review",
                "You received a " + r.overallRating().stripTrailingZeros().toPlainString() + "★ review for " + b.get("booking_reference") + ".",
                "/provider/profile");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null, "Thank you for your review"));
    }

    @GetMapping("/provider/{providerId}")
    public ApiResponse<PageResponse<Map<String, Object>>> forProvider(@PathVariable UUID providerId,
                                                                      @RequestParam(defaultValue = "0") int page,
                                                                      @RequestParam(defaultValue = "10") int size) {
        int s = Math.min(Math.max(size, 1), 50);
        int p = Math.max(page, 0);
        List<Map<String, Object>> items = jdbc.queryForList("""
                SELECT r.id, r.overall_rating AS "rating", r.review_text AS "text", r.created_at::text AS "createdAt",
                       split_part(COALESCE(up.full_name, 'Customer'), ' ', 1) AS "customerFirstName",
                       b.service_title AS "serviceTitle"
                FROM reviews r
                JOIN bookings b ON b.id = r.booking_id
                LEFT JOIN user_profiles up ON up.user_id = r.customer_id
                WHERE r.provider_id = :pid ORDER BY r.created_at DESC LIMIT :lim OFFSET :off""",
                Map.of("pid", providerId, "lim", s, "off", p * s));
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM reviews WHERE provider_id = :pid", Map.of("pid", providerId), Long.class);
        return ApiResponse.ok(new PageResponse<>(items, p, s, total == null ? 0 : total));
    }
}
