package com.marketplace.identity;

import com.marketplace.common.ApiResponse;
import com.marketplace.identity.dto.AuthSyncRequest;
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
@Tag(name = "Authentication", description = "Link a verified Clerk session to the application account")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/sync")
    @Operation(summary = "Create or load the account for the signed-in Clerk user")
    public ResponseEntity<ApiResponse<UserProfileDto>> sync(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody AuthSyncRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.sync(principal.getClerkId(), request), "Signed in"));
    }

    @GetMapping("/me")
    @Operation(summary = "The signed-in account")
    public ResponseEntity<ApiResponse<UserProfileDto>> me(@AuthenticationPrincipal AuthenticatedUserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getCurrentUser(principal.getClerkId())));
    }
}
