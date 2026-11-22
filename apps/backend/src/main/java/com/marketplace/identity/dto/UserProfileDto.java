package com.marketplace.identity.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private UUID id;
    private String clerkId;
    private String phone;
    private String email;
    private String userType;
    private String accountStatus;
    private String fullName;
    private String avatarUrl;
    private List<String> roles;
    private UUID providerProfileId;
}
