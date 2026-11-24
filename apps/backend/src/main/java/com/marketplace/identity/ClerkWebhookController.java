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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

/**
 * Receives Clerk user lifecycle events (delivered by Svix). Every request must
 * carry a valid Svix signature made with CLERK_WEBHOOK_SECRET and a timestamp
 * within five minutes; otherwise it is rejected.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class ClerkWebhookController {

    private static final long TOLERANCE_SECONDS = 300;

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${clerk.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<String> handle(
            @RequestBody String payload,
            @RequestHeader(value = "svix-id", required = false) String svixId,
            @RequestHeader(value = "svix-timestamp", required = false) String svixTimestamp,
            @RequestHeader(value = "svix-signature", required = false) String svixSignature) throws Exception {

        if (webhookSecret.isBlank()) {
            log.error("Clerk webhook received but CLERK_WEBHOOK_SECRET is not configured");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("not configured");
        }
        if (!isValidSignature(payload, svixId, svixTimestamp, svixSignature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid signature");
        }

        JsonNode root = objectMapper.readTree(payload);
        JsonNode data = root.path("data");
        String clerkId = data.path("id").asText("");
        switch (root.path("type").asText()) {
            case "user.updated" -> userRepository.findByClerkId(clerkId).ifPresent(user -> applyUpdate(user, data));
            case "user.deleted" -> userRepository.findByClerkId(clerkId).ifPresent(user -> {
                user.setAccountStatus("DELETED");
                user.setDeletedAt(Instant.now());
                userRepository.save(user);
                log.info("Deactivated user {} after Clerk deletion", user.getId());
            });
            default -> log.debug("Ignoring Clerk event {}", root.path("type").asText());
        }
        return ResponseEntity.ok("{\"received\":true}");
    }

    private void applyUpdate(User user, JsonNode data) {
        String email = primaryVerified(data, "email_addresses", "email_address", "primary_email_address_id");
        String phone = primaryVerified(data, "phone_numbers", "phone_number", "primary_phone_number_id");
        if (email != null && !email.equalsIgnoreCase(user.getEmail()) && !userRepository.existsByEmail(email.toLowerCase())) {
            user.setEmail(email.toLowerCase());
        }
        if (phone != null) {
            String normalized = AuthService.normalizePhone(phone);
            if (!normalized.equals(user.getPhone()) && !userRepository.existsByPhone(normalized)) {
                user.setPhone(normalized);
            }
        }
        userRepository.save(user);
    }

    private static String primaryVerified(JsonNode data, String arrayField, String valueField, String primaryField) {
        String primaryId = data.path(primaryField).asText(null);
        for (JsonNode n : data.path(arrayField)) {
            if (n.path("id").asText().equals(primaryId)
                    && "verified".equals(n.path("verification").path("status").asText())) {
                return n.path(valueField).asText(null);
            }
        }
        return null;
    }

    boolean isValidSignature(String payload, String id, String timestamp, String signatureHeader) {
        if (id == null || timestamp == null || signatureHeader == null) return false;
        try {
            long ts = Long.parseLong(timestamp);
            if (Math.abs(Instant.now().getEpochSecond() - ts) > TOLERANCE_SECONDS) return false;

            String secret = webhookSecret.startsWith("whsec_") ? webhookSecret.substring(6) : webhookSecret;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(Base64.getDecoder().decode(secret), "HmacSHA256"));
            byte[] expected = mac.doFinal((id + "." + timestamp + "." + payload).getBytes(StandardCharsets.UTF_8));

            for (String part : signatureHeader.split(" ")) {
                String[] versioned = part.split(",", 2);
                if (versioned.length == 2 && "v1".equals(versioned[0])
                        && MessageDigest.isEqual(expected, Base64.getDecoder().decode(versioned[1]))) {
                    return true;
                }
            }
        } catch (Exception e) {
            log.warn("Webhook signature check failed: {}", e.getMessage());
        }
        return false;
    }
}
