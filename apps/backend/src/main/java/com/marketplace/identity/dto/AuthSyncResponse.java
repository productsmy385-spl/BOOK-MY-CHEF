package com.marketplace.identity.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthSyncResponse {
    private UUID userId;
    private String clerkId;
    private List<String> roles;
    private boolean profileCompleted;
    private UUID providerProfileId;
    private String fullName;
    private String phone;
    private String email;
}
