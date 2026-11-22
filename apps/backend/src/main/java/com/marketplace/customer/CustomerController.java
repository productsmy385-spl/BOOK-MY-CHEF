package com.marketplace.customer;

import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.identity.User;
import com.marketplace.identity.UserProfile;
import com.marketplace.identity.UserProfileRepository;
import com.marketplace.identity.UserRepository;
import com.marketplace.provider.ProviderProfile;
import com.marketplace.provider.ProviderProfileRepository;
import com.marketplace.provider.ProviderService;
import com.marketplace.provider.dto.ProviderCardDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/customer")
@RequiredArgsConstructor
@Tag(name = "Customer Experience", description = "Customer saved favourites, addresses, and host profile settings")
public class CustomerController {

    private final CustomerFavouriteRepository favouriteRepository;
    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderService providerService;

    // Default test customer Ananya Rao UUID
    private static final UUID DEFAULT_CUSTOMER_ID = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890");

    private UUID resolveUserId(AuthenticatedUserPrincipal principal, UUID explicitUserId) {
        if (principal != null && principal.getUserId() != null) {
            return principal.getUserId();
        }
        return explicitUserId != null ? explicitUserId : DEFAULT_CUSTOMER_ID;
    }

    // ------------------------------------------------------------------------
    // Favourites Management
    // ------------------------------------------------------------------------

    @GetMapping("/favourites")
    @Operation(summary = "Get list of saved favourite providers for customer")
    public ResponseEntity<ApiResponse<List<ProviderCardDto>>> getFavourites(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) UUID customerId) {

        UUID userId = resolveUserId(principal, customerId);
        List<CustomerFavourite> favs = favouriteRepository.findByUserId(userId);

        List<ProviderCardDto> list = favs.stream()
                .map(f -> providerService.getProviderCardById(f.getProvider().getId()))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(list, "Customer favourites retrieved"));
    }

    @PostMapping("/favourites/{providerId}")
    @Transactional
    @Operation(summary = "Add a provider to customer favourites")
    public ResponseEntity<ApiResponse<String>> addFavourite(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID providerId,
            @RequestParam(required = false) UUID customerId) {

        UUID userId = resolveUserId(principal, customerId);

        if (!favouriteRepository.existsByUserIdAndProviderId(userId, providerId)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
            ProviderProfile provider = providerProfileRepository.findById(providerId)
                    .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + providerId));

            CustomerFavourite fav = CustomerFavourite.builder()
                    .user(user)
                    .provider(provider)
                    .build();
            favouriteRepository.save(fav);
        }

        return ResponseEntity.ok(ApiResponse.ok("Added", "Provider added to favourites"));
    }

    @DeleteMapping("/favourites/{providerId}")
    @Transactional
    @Operation(summary = "Remove a provider from customer favourites")
    public ResponseEntity<ApiResponse<String>> removeFavourite(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID providerId,
            @RequestParam(required = false) UUID customerId) {

        UUID userId = resolveUserId(principal, customerId);
        favouriteRepository.deleteByUserIdAndProviderId(userId, providerId);
        return ResponseEntity.ok(ApiResponse.ok("Removed", "Provider removed from favourites"));
    }

    // ------------------------------------------------------------------------
    // Saved Addresses
    // ------------------------------------------------------------------------

    @GetMapping("/addresses")
    @Operation(summary = "Get saved home and event venue addresses")
    public ResponseEntity<ApiResponse<List<UserAddress>>> getAddresses(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) UUID customerId) {

        UUID userId = resolveUserId(principal, customerId);
        List<UserAddress> addresses = addressRepository.findByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok(addresses, "Addresses retrieved"));
    }

    @PostMapping("/addresses")
    @Transactional
    @Operation(summary = "Save a new delivery or event address")
    public ResponseEntity<ApiResponse<UserAddress>> saveAddress(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) UUID customerId,
            @RequestBody UserAddress request) {

        UUID userId = resolveUserId(principal, customerId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        request.setUser(user);
        if (request.getId() == null) {
            request.setId(UUID.randomUUID());
        }
        UserAddress saved = addressRepository.save(request);
        return ResponseEntity.ok(ApiResponse.ok(saved, "Address saved successfully"));
    }

    @DeleteMapping("/addresses/{id}")
    @Transactional
    @Operation(summary = "Delete a saved address")
    public ResponseEntity<ApiResponse<String>> deleteAddress(@PathVariable UUID id) {
        addressRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Deleted", "Address removed"));
    }

    // ------------------------------------------------------------------------
    // Customer Profile Update
    // ------------------------------------------------------------------------

    @PutMapping("/profile")
    @Transactional
    @Operation(summary = "Update host profile information")
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) UUID customerId,
            @RequestBody ProfileUpdateRequest request) {

        UUID userId = resolveUserId(principal, customerId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder().user(user).build());

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            profile.setFullName(request.getFullName());
        }
        if (request.getPreferredLanguage() != null) {
            profile.setPreferredLanguage(request.getPreferredLanguage());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone());
            userRepository.save(user);
        }

        UserProfile saved = userProfileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.ok(saved, "Profile updated successfully"));
    }

    @Data
    public static class ProfileUpdateRequest {
        private String fullName;
        private String phone;
        private String preferredLanguage;
    }
}
