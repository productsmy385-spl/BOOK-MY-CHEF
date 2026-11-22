package com.marketplace.reviews.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitReviewRequest {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    @NotNull(message = "Overall rating is required")
    private BigDecimal overallRating;

    private BigDecimal foodTasteRating;
    private BigDecimal hygieneRating;
    private BigDecimal punctualityRating;
    private BigDecimal hospitalityRating;
    private String reviewText;
    private List<String> imageUrls;
}
