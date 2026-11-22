package com.marketplace.booking;

import com.marketplace.booking.dto.*;
import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings & Negotiations", description = "Quotation requests, instant bookings, status transitions, and day-of execution")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN') or isAuthenticated()")
    @Operation(summary = "Create initial booking or quotation request")
    public ResponseEntity<ApiResponse<BookingResponseDto>> createBooking(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) UUID customerId,
            @Valid @RequestBody CreateBookingRequest request) {

        // Resolve authenticated customer ID, preventing arbitrary spoofing
        UUID effectiveCustomerId = principal != null ? principal.getUserId()
                : (customerId != null ? customerId : UUID.fromString("3fa85f64-5717-4562-b3fc-2c963f66afa6"));

        BookingResponseDto response = bookingService.createBooking(effectiveCustomerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Booking request submitted successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get booking details by ID")
    public ResponseEntity<ApiResponse<BookingResponseDto>> getBookingById(@PathVariable UUID id) {
        BookingResponseDto response = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Booking details retrieved successfully"));
    }

    @GetMapping("/my")
    @Operation(summary = "Get authenticated user bookings")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getMyBookings(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID providerId) {

        List<BookingResponseDto> list;
        if (principal != null) {
            if ("PROVIDER".equalsIgnoreCase(principal.getUserType())) {
                list = bookingService.getProviderBookings(providerId != null ? providerId : principal.getUserId());
            } else {
                list = bookingService.getCustomerBookings(principal.getUserId());
            }
        } else if (providerId != null) {
            list = bookingService.getProviderBookings(providerId);
        } else {
            UUID effectiveCustId = customerId != null ? customerId : UUID.fromString("3fa85f64-5717-4562-b3fc-2c963f66afa6");
            list = bookingService.getCustomerBookings(effectiveCustId);
        }
        return ResponseEntity.ok(ApiResponse.ok(list, "Bookings retrieved"));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get bookings for a specific customer")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getCustomerBookings(@PathVariable UUID customerId) {
        List<BookingResponseDto> list = bookingService.getCustomerBookings(customerId);
        return ResponseEntity.ok(ApiResponse.ok(list, "Customer bookings retrieved successfully"));
    }

    @GetMapping("/provider/{providerId}")
    @Operation(summary = "Get bookings for a specific provider")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getProviderBookings(@PathVariable UUID providerId) {
        List<BookingResponseDto> list = bookingService.getProviderBookings(providerId);
        return ResponseEntity.ok(ApiResponse.ok(list, "Provider bookings retrieved successfully"));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update booking status")
    public ResponseEntity<ApiResponse<BookingResponseDto>> updateBookingStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        BookingResponseDto response = bookingService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(response, "Booking status updated successfully"));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel booking")
    public ResponseEntity<ApiResponse<BookingResponseDto>> cancelBooking(@PathVariable UUID id) {
        BookingResponseDto response = bookingService.cancelBooking(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Booking cancelled successfully"));
    }

    @PostMapping("/{id}/respond")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    @Operation(summary = "Provider accept or reject booking request")
    public ResponseEntity<ApiResponse<BookingResponseDto>> respondToBooking(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) UUID providerId,
            @Valid @RequestBody ProviderRespondRequest request) {

        UUID effectiveProviderId = providerId != null ? providerId
                : (principal != null ? principal.getUserId() : UUID.fromString("3fa85f64-5717-4562-b3fc-2c963f66afa6"));

        BookingResponseDto response = bookingService.respondToBooking(effectiveProviderId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Provider responded successfully"));
    }

    @PostMapping("/{id}/quotation")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    @Operation(summary = "Provider submit custom itemized quotation")
    public ResponseEntity<ApiResponse<BookingResponseDto>> submitQuotation(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) UUID providerId,
            @Valid @RequestBody QuotationRequest request) {

        UUID effectiveProviderId = providerId != null ? providerId
                : (principal != null ? principal.getUserId() : UUID.fromString("3fa85f64-5717-4562-b3fc-2c963f66afa6"));

        BookingResponseDto response = bookingService.submitQuotation(effectiveProviderId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Quotation submitted successfully"));
    }

    @PostMapping("/{id}/lock-and-checkout")
    @Operation(summary = "Lock slot for 15 minutes and proceed to Razorpay escrow checkout")
    public ResponseEntity<ApiResponse<BookingResponseDto>> lockAndCheckout(@PathVariable UUID id) {
        BookingResponseDto response = bookingService.lockAndCheckout(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Slot locked successfully. Proceed to payment."));
    }

    @PostMapping("/{id}/checklist")
    @Operation(summary = "Update live event milestone (en route, arrived, cooking, served)")
    public ResponseEntity<ApiResponse<BookingResponseDto>> updateChecklist(
            @PathVariable UUID id,
            @Valid @RequestBody EventChecklistRequest request) {

        BookingResponseDto response = bookingService.updateEventChecklist(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Event checklist milestone updated"));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Customer confirms event completion and triggers escrow release")
    public ResponseEntity<ApiResponse<BookingResponseDto>> completeBooking(@PathVariable UUID id) {
        BookingResponseDto response = bookingService.completeBookingAndReleaseEscrow(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Service confirmed completed and escrow released to provider"));
    }
}
