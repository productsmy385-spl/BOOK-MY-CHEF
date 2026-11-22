package com.marketplace.provider.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderDetailDto {
    private UUID id;
    private UUID userId;
    private String professionalName;
    private String businessName;
    private String bio;
    private Integer experienceYears;
    private String avatarUrl;
    private String coverImageUrl;
    private String verificationStatus;
    private Boolean isAcceptingBookings;
    private BigDecimal minBookingAmount;
    private Integer maxTravelDistanceKm;
    private BigDecimal baseLatitude;
    private BigDecimal baseLongitude;
    private String fssaiLicenseNumber;
    private LocalDate fssaiExpiryDate;
    private Double averageRating;
    private Integer totalReviews;
    private List<String> roles;
    private List<String> cuisines;
    private List<String> serviceDeliveryModes;
    private List<String> portfolioImages;
    private List<String> portfolioVideos;
}
