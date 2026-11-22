package com.marketplace.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class ClerkWebhookController {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper;

    @Value("${clerk.webhook.secret:whsec_default_secret}")
    private String webhookSecret;

    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<String> handleClerkWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "svix-id", required = false) String svixId,
            @RequestHeader(value = "svix-timestamp", required = false) String svixTimestamp,
            @RequestHeader(value = "svix-signature", required = false) String svixSignature) {

        log.info("Received Clerk Webhook event, svix-id: {}", svixId);

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String eventType = root.path("type").asText();
            JsonNode data = root.path("data");

            log.info("Processing Clerk webhook event type: {}", eventType);

            switch (eventType) {
                case "user.created":
                case "user.updated":
                    processUserSync(data);
                    break;

                case "user.deleted":
                    String deletedClerkId = data.path("id").asText();
                    Optional<User> userOpt = userRepository.findByClerkId(deletedClerkId);
                    userOpt.ifPresent(u -> {
                        u.setAccountStatus("DELETED");
                        u.setDeletedAt(Instant.now());
                        userRepository.save(u);
                        log.info("Marked user {} as DELETED in PostgreSQL", deletedClerkId);
                    });
                    break;

                default:
                    log.debug("Unhandled Clerk webhook event type: {}", eventType);
                    break;
            }

            return ResponseEntity.ok("{\"status\":\"success\"}");
        } catch (Exception ex) {
            log.error("Failed to process Clerk webhook payload", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"status\":\"error\",\"message\":\"" + ex.getMessage() + "\"}");
        }
    }

    private void processUserSync(JsonNode data) {
        String clerkId = data.path("id").asText();
        if (clerkId == null || clerkId.isEmpty()) return;

        // Extract primary phone number
        String phone = "";
        JsonNode phoneNumbers = data.path("phone_numbers");
        if (phoneNumbers.isArray() && phoneNumbers.size() > 0) {
            phone = phoneNumbers.get(0).path("phone_number").asText();
        }

        // Extract primary email
        String email = "";
        JsonNode emailAddresses = data.path("email_addresses");
        if (emailAddresses.isArray() && emailAddresses.size() > 0) {
            email = emailAddresses.get(0).path("email_address").asText();
        }

        // Extract user full name
        String firstName = data.path("first_name").asText("");
        String lastName = data.path("last_name").asText("");
        String fullName = (firstName + " " + lastName).trim();
        if (fullName.isEmpty()) fullName = "User";

        final String finalPhone = phone;
        final String finalEmail = email;
        final String finalFullName = fullName;

        User user = userRepository.findByClerkId(clerkId)
                .map(existing -> {
                    if (!finalPhone.isEmpty()) existing.setPhone(finalPhone);
                    if (!finalEmail.isEmpty()) existing.setEmail(finalEmail);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    String role = "CUSTOMER"; // Default role for webhook sync
                    return userRepository.save(User.builder()
                            .clerkId(clerkId)
                            .phone(finalPhone.isEmpty() ? "+910000000000" : finalPhone)
                            .email(finalEmail.isEmpty() ? null : finalEmail)
                            .userType(role)
                            .accountStatus("ACTIVE")
                            .build());
                });

        // Ensure user profile exists
        userProfileRepository.findByUserId(user.getId()).orElseGet(() ->
                userProfileRepository.save(UserProfile.builder()
                        .user(user)
                        .fullName(finalFullName)
                        .preferredLanguage("en")
                        .build())
        );

        log.info("Synchronized Clerk user {} with PostgreSQL user ID {}", clerkId, user.getId());
    }
}
