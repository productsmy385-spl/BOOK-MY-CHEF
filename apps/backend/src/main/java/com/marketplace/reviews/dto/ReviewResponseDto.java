package com.marketplace.reviews.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponseDto {
    private UUID id;
    private UUID bookingId;
    private UUID customerId;
    private UUID providerId;
    private BigDecimal overallRating;
    private BigDecimal foodTasteRating;
    private BigDecimal hygieneRating;
    private BigDecimal punctualityRating;
    private BigDecimal hospitalityRating;
    private String reviewText;
    private Boolean isVerifiedBooking;
    private Instant createdAt;
}
