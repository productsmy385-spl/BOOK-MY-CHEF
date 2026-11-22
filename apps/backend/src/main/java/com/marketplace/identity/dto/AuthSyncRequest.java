package com.marketplace.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthSyncRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String email;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Intended role is required")
    private String intendedRole; // CUSTOMER, PROVIDER

    private String clerkId;

    private String businessName;

    private java.util.List<String> roles;
}
