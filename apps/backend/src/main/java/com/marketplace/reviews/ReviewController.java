package com.marketplace.reviews;

import com.marketplace.booking.Booking;
import com.marketplace.booking.BookingRepository;
import com.marketplace.common.ApiResponse;
import com.marketplace.reviews.dto.ReviewResponseDto;
import com.marketplace.reviews.dto.SubmitReviewRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews & Ratings", description = "Verified host reviews, ratings across taste, hygiene, punctuality, and hospitality")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    @PostMapping
    @Transactional
    @Operation(summary = "Submit a verified review for a completed booking")
    public ResponseEntity<ApiResponse<ReviewResponseDto>> submitReview(@Valid @RequestBody SubmitReviewRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + request.getBookingId()));

        Review review = Review.builder()
                .booking(booking)
                .customer(booking.getCustomer())
                .provider(booking.getProvider())
                .overallRating(request.getOverallRating())
                .foodTasteRating(request.getFoodTasteRating())
                .hygieneRating(request.getHygieneRating())
                .punctualityRating(request.getPunctualityRating())
                .hospitalityRating(request.getHospitalityRating())
                .reviewText(request.getReviewText())
                .isVerifiedBooking(true)
                .build();

        Review saved = reviewRepository.save(review);
        return ResponseEntity.ok(ApiResponse.ok(mapToDto(saved), "Review submitted successfully"));
    }

    @GetMapping("/provider/{providerId}")
    @Operation(summary = "Get all customer reviews for a service provider")
    public ResponseEntity<ApiResponse<List<ReviewResponseDto>>> getReviewsByProvider(@PathVariable UUID providerId) {
        List<ReviewResponseDto> reviews = reviewRepository.findByProviderId(providerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(reviews, "Provider reviews retrieved"));
    }

    private ReviewResponseDto mapToDto(Review r) {
        return ReviewResponseDto.builder()
                .id(r.getId())
                .bookingId(r.getBooking() != null ? r.getBooking().getId() : null)
                .customerId(r.getCustomer() != null ? r.getCustomer().getId() : null)
                .providerId(r.getProvider() != null ? r.getProvider().getId() : null)
                .overallRating(r.getOverallRating())
                .foodTasteRating(r.getFoodTasteRating())
                .hygieneRating(r.getHygieneRating())
                .punctualityRating(r.getPunctualityRating())
                .hospitalityRating(r.getHospitalityRating())
                .reviewText(r.getReviewText())
                .isVerifiedBooking(r.getIsVerifiedBooking())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
