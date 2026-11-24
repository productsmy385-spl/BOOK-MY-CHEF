package com.marketplace.booking;

import com.marketplace.common.ApiException;
import com.marketplace.common.ApiResponse;
import com.marketplace.common.PageResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Booking endpoints. The caller's identity and role come from the verified
 * token; ownership of each booking is checked in {@link BookingService}.
 */
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings")
public class BookingController {

    private final BookingService bookings;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                   @Valid @RequestBody BookingRequests.Create body) {
        if (!"CUSTOMER".equals(u.getUserType())) {
            throw ApiException.forbidden();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(bookings.create(u.getUserId(), body), "Booking request sent"));
    }

    @GetMapping
    public ApiResponse<PageResponse<Map<String, Object>>> mine(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                               @RequestParam(defaultValue = "all") String scope,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
        if ("ADMIN".equals(u.getUserType())) throw ApiException.forbidden();
        return ApiResponse.ok(bookings.listMine(u, scope, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(bookings.get(id, u.getUserId(), u.getUserType()));
    }

    // ---- provider
    @PostMapping("/{id}/accept")
    public ApiResponse<Map<String, Object>> accept(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @Valid @RequestBody(required = false) BookingRequests.Reason body) {
        return ApiResponse.ok(bookings.accept(u, id, body == null ? null : body.reason()), "Booking accepted");
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<Map<String, Object>> reject(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @Valid @RequestBody(required = false) BookingRequests.Reason body) {
        return ApiResponse.ok(bookings.reject(u, id, body == null ? null : body.reason()), "Request declined");
    }

    @PostMapping("/{id}/clarify")
    public ApiResponse<Map<String, Object>> clarify(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                    @Valid @RequestBody BookingRequests.Message body) {
        return ApiResponse.ok(bookings.askClarification(u, id, body.message()), "Question sent to the customer");
    }

    @PostMapping("/{id}/quotation")
    public ApiResponse<Map<String, Object>> quote(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                  @Valid @RequestBody BookingRequests.Quote body) {
        return ApiResponse.ok(bookings.quote(u, id, body), "Quotation sent");
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<Map<String, Object>> complete(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(bookings.complete(u, id), "Marked as completed");
    }

    // ---- customer
    @PostMapping("/{id}/quotation/accept")
    public ApiResponse<Map<String, Object>> acceptQuote(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(bookings.acceptQuote(u, id), "Quotation accepted");
    }

    @PostMapping("/{id}/quotation/decline")
    public ApiResponse<Map<String, Object>> declineQuote(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                         @Valid @RequestBody(required = false) BookingRequests.Reason body) {
        return ApiResponse.ok(bookings.declineQuote(u, id, body == null ? null : body.reason()), "Quotation declined");
    }

    // ---- either side
    @PostMapping("/{id}/cancel")
    public ApiResponse<Map<String, Object>> cancel(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @Valid @RequestBody(required = false) BookingRequests.Reason body) {
        return ApiResponse.ok(bookings.cancel(u, id, body == null ? null : body.reason()), "Booking cancelled");
    }
}
