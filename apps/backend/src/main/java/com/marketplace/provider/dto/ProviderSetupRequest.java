package com.marketplace.provider.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderSetupRequest {

    @NotBlank(message = "Professional name is required")
    private String professionalName;

    private String businessName;
    private String bio;
    private Integer experienceYears;
    private String avatarUrl;
    private String coverImageUrl;
    private String primaryRole;
    private List<String> cuisines;
    private BigDecimal minBookingAmount;
    private Integer maxTravelDistanceKm;
    private BigDecimal baseLatitude;
    private BigDecimal baseLongitude;
    private String fssaiLicenseNumber;
    private List<String> serviceDeliveryModes;
}
