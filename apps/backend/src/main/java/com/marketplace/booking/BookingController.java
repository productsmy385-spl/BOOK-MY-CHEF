package com.marketplace.booking;

import com.marketplace.common.ApiResponse;
import com.marketplace.booking.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    @Operation(summary = "Create initial booking or quotation request")
    public ResponseEntity<ApiResponse<BookingResponseDto>> createBooking(
            @RequestParam(required = false) UUID customerId,
            @Valid @RequestBody CreateBookingRequest request) {

        UUID effectiveCustomerId = customerId != null ? customerId : UUID.fromString("3fa85f64-5717-4562-b3fc-2c963f66afa6");
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
    @Operation(summary = "Get user bookings (either customer or provider)")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getMyBookings(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID providerId) {

        List<BookingResponseDto> list;
        if (providerId != null) {
            list = bookingService.getProviderBookings(providerId);
        } else {
            UUID effectiveCustId = customerId != null ? customerId : UUID.fromString("3fa85f64-5717-4562-b3fc-2c963f66afa6");
            list = bookingService.getCustomerBookings(effectiveCustId);
        }
        return ResponseEntity.ok(ApiResponse.ok(list, "Bookings retrieved"));
    }

    @PostMapping("/{id}/respond")
    @Operation(summary = "Provider accept or reject booking request")
    public ResponseEntity<ApiResponse<BookingResponseDto>> respondToBooking(
            @PathVariable UUID id,
            @RequestParam UUID providerId,
            @Valid @RequestBody ProviderRespondRequest request) {

        BookingResponseDto response = bookingService.respondToBooking(providerId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Provider responded successfully"));
    }

    @PostMapping("/{id}/quotation")
    @Operation(summary = "Provider submit custom itemized quotation")
    public ResponseEntity<ApiResponse<BookingResponseDto>> submitQuotation(
            @PathVariable UUID id,
            @RequestParam UUID providerId,
            @Valid @RequestBody QuotationRequest request) {

        BookingResponseDto response = bookingService.submitQuotation(providerId, id, request);
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
