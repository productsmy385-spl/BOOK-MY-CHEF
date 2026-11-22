package com.marketplace.identity;

import com.marketplace.common.ApiResponse;
import com.marketplace.identity.dto.AuthSyncRequest;
import com.marketplace.identity.dto.AuthSyncResponse;
import com.marketplace.identity.dto.UserProfileDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Identity", description = "Clerk identity synchronization, OTP validation, and current user profile")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/sync")
    @Operation(summary = "Sync Clerk identity with PostgreSQL internal user records")
    public ResponseEntity<ApiResponse<AuthSyncResponse>> syncUser(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestHeader(value = "X-Mock-User-Id", required = false) String mockUserId,
            @Valid @RequestBody AuthSyncRequest request) {

        String clerkId = (request.getClerkId() != null && !request.getClerkId().isBlank())
                ? request.getClerkId()
                : (principal != null ? principal.getClerkId() : (mockUserId != null ? mockUserId : "user_guest_" + request.getPhone().replaceAll("[^0-9]", "")));

        AuthSyncResponse response = authService.syncUser(clerkId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "User identity synchronized successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile, roles and permissions")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestHeader(value = "X-Mock-User-Id", required = false) String mockUserId) {

        String clerkId = principal != null ? principal.getClerkId() : (mockUserId != null ? mockUserId : "user_mock_chef_raghavendra");
        UserProfileDto profile = authService.getCurrentUser(clerkId);
        return ResponseEntity.ok(ApiResponse.ok(profile, "Profile retrieved successfully"));
    }
}
