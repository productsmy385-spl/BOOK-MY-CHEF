package com.marketplace.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** The signed-in account as the frontend needs it for routing and display. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private UUID id;
    private String userType;        // CUSTOMER | PROVIDER | ADMIN
    private String accountStatus;
    private String fullName;
    private String email;
    private String phone;
    private String city;
    private String avatarUrl;
    private UUID providerProfileId;
    private String providerOnboardingStatus;   // DRAFT | PUBLISHED | UNPUBLISHED
    private String providerVerificationStatus; // PENDING | VERIFIED | REJECTED | SUSPENDED
    private String adminRole;
}
