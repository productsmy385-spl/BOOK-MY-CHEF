package com.marketplace.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Sent once after a successful Clerk sign-up/sign-in. The Clerk user id is taken
 * from the verified session token, never from this body. Contact fields here are
 * only used when the Clerk Backend API is not configured.
 */
@Getter
@Setter
@NoArgsConstructor
public class AuthSyncRequest {

    @NotBlank(message = "Account type is required")
    @Pattern(regexp = "CUSTOMER|PROVIDER|ADMIN", message = "Account type must be CUSTOMER, PROVIDER or ADMIN")
    private String intendedRole;

    @Size(max = 150, message = "Name is too long")
    private String fullName;

    @Pattern(regexp = "^\\+?[0-9 ]{10,16}$", message = "Enter a valid mobile number")
    private String phone;

    @Email(message = "Enter a valid email address")
    private String email;

    @Size(max = 100)
    private String city;

    @Size(max = 150)
    private String businessName;

    /** Provider service roles chosen at registration (e.g. HOME_CHEF, CATERER). */
    private List<String> roles;
}
