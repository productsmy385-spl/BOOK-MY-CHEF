package com.marketplace.event;

import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Customer event planner. Requires ROLE_CUSTOMER (SecurityConfig: /api/v1/customer/**). Writes return the fresh event. */
@RestController
@RequestMapping("/api/v1/customer/events")
@RequiredArgsConstructor
@Tag(name = "Event planner")
public class EventController {

    private final EventService events;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(events.list(u.getUserId()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                   @Valid @RequestBody EventRequests.Upsert body) {
        UUID id = events.create(u.getUserId(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(events.get(u.getUserId(), id), "Event created"));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(events.get(u.getUserId(), id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @Valid @RequestBody EventRequests.Upsert body) {
        events.update(u.getUserId(), id, body);
        return ApiResponse.ok(events.get(u.getUserId(), id), "Event saved");
    }

    @PostMapping("/{id}/status")
    public ApiResponse<Map<String, Object>> status(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @Valid @RequestBody EventRequests.Status body) {
        events.setStatus(u.getUserId(), id, body.status());
        return ApiResponse.ok(events.get(u.getUserId(), id), "Event updated");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        events.delete(u.getUserId(), id);
        return ApiResponse.ok(null, "Event deleted");
    }

    @PostMapping("/{id}/needs")
    public ApiResponse<Map<String, Object>> addNeed(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                    @Valid @RequestBody EventRequests.Need body) {
        events.addNeed(u.getUserId(), id, body);
        return ApiResponse.ok(events.get(u.getUserId(), id), "Added to checklist");
    }

    @PutMapping("/{id}/needs/{needId}")
    public ApiResponse<Map<String, Object>> updateNeed(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                       @PathVariable UUID needId, @Valid @RequestBody EventRequests.Need body) {
        events.updateNeed(u.getUserId(), id, needId, body);
        return ApiResponse.ok(events.get(u.getUserId(), id), "Saved");
    }

    @DeleteMapping("/{id}/needs/{needId}")
    public ApiResponse<Map<String, Object>> removeNeed(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                       @PathVariable UUID needId) {
        events.removeNeed(u.getUserId(), id, needId);
        return ApiResponse.ok(events.get(u.getUserId(), id), "Removed from checklist");
    }

    @PutMapping("/{id}/bookings/{bookingId}")
    public ApiResponse<Map<String, Object>> attach(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @PathVariable UUID bookingId) {
        events.linkBooking(u.getUserId(), id, bookingId, true);
        return ApiResponse.ok(events.get(u.getUserId(), id), "Booking added to event");
    }

    @DeleteMapping("/{id}/bookings/{bookingId}")
    public ApiResponse<Map<String, Object>> detach(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @PathVariable UUID bookingId) {
        events.linkBooking(u.getUserId(), id, bookingId, false);
        return ApiResponse.ok(events.get(u.getUserId(), id), "Booking removed from event");
    }
}
