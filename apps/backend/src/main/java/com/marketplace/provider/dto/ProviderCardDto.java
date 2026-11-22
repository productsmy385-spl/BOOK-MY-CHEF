package com.marketplace.provider.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderCardDto {
    private UUID id;
    private String professionalName;
    private String businessName;
    private String bio;
    private Integer experienceYears;
    private String avatarUrl;
    private String coverImageUrl;
    private String primaryRole;
    private Double averageRating;
    private Integer totalReviews;
    private List<String> cuisines;
    private BigDecimal startingPrice;
    private String pricingModel;
    private Double distanceKm;
    private String verificationStatus;
    private Boolean isAcceptingBookings;
}
